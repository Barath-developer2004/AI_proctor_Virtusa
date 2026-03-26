package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jatayu-proctor/backend/internal/database"
	"github.com/jatayu-proctor/backend/internal/models"
	"github.com/jatayu-proctor/backend/internal/services"
	"github.com/redis/go-redis/v9"
)

type SessionHandler struct {
	Orchestrator *services.SessionOrchestrator
	Gemini       *services.GeminiService
}

func NewSessionHandler(orch *services.SessionOrchestrator, gemini *services.GeminiService) *SessionHandler {
	return &SessionHandler{Orchestrator: orch, Gemini: gemini}
}

// POST /api/sessions/start
func (h *SessionHandler) Start(c *fiber.Ctx) error {
	fmt.Println("SESSION START: Reached handler")
	var req struct {
		ExamID string `json:"exam_id"`
	}
	if err := c.BodyParser(&req); err != nil {
		fmt.Println("SESSION START error: invalid body")
		return c.Status(400).JSON(fiber.Map{"error": "invalid body"})
	}
	examID, err := uuid.Parse(req.ExamID)
	if err != nil {
		fmt.Println("SESSION START error: invalid exam id")
		return c.Status(400).JSON(fiber.Map{"error": "invalid exam_id"})
	}

	candidateID, _ := uuid.Parse(c.Locals("user_id").(string))
	fmt.Println("SESSION START: candidateID parsed as", candidateID.String())

	session, err := h.Orchestrator.StartSession(c.Context(), examID, candidateID)
	if err != nil {
		fmt.Println("SESSION START error: orchestrator failed:", err)
		return c.Status(500).JSON(fiber.Map{"error": "failed to start session"})
	}

	fmt.Println("SESSION START success: session created", session.ID.String())
	return c.Status(201).JSON(session)
}

// POST /api/sessions/:id/submit-mcqs
func (h *SessionHandler) SubmitMCQs(c *fiber.Ctx) error {
	sessionID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid session id"})
	}

	phase, err := h.Orchestrator.GetPhase(c.Context(), sessionID)
	if err != nil || phase != models.PhaseMcq {
		return c.Status(409).JSON(fiber.Map{"error": "not in MCQ phase"})
	}

	var req struct {
		Answers []int `json:"answers"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid body"})
	}

	// Calculate score
	var examID uuid.UUID
	err = database.Pool.QueryRow(c.Context(), `SELECT exam_id FROM sessions WHERE id = $1`, sessionID).Scan(&examID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to load session"})
	}

	var mcqsBytes []byte
	err = database.Pool.QueryRow(c.Context(), `SELECT mcqs FROM exams WHERE id = $1`, examID).Scan(&mcqsBytes)
	var mcqs []models.MCQ
	if err == nil && len(mcqsBytes) > 0 {
		json.Unmarshal(mcqsBytes, &mcqs)
	} else {
		mcqs = []models.MCQ{}
	}

	correct := 0
	total := len(mcqs)
	for i, ans := range req.Answers {
		if i < total && mcqs[i].Answer == ans {
			correct++
		}
	}

	score := 0.0
	if total > 0 {
		score = (float64(correct) / float64(total)) * 100.0
	} else {
		score = 100.0 // no mcqs = 100% implicitly
	}

	if err := h.Orchestrator.TransitionToCoding(c.Context(), sessionID, req.Answers, score); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "transition failed context"})
	}

	return c.JSON(fiber.Map{"phase": "CODING", "mcq_score": score, "message": "MCQs submitted. Coding phase begins."})
}

// POST /api/sessions/:id/submit-code
func (h *SessionHandler) SubmitCode(c *fiber.Ctx) error {
	sessionID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid session id"})
	}

	var req struct {
		Code     string `json:"code"`
		Language string `json:"language"`
	}
	if err := c.BodyParser(&req); err != nil || req.Code == "" {
		return c.Status(400).JSON(fiber.Map{"error": "code is required"})
	}

	phase, err := h.Orchestrator.GetPhase(c.Context(), sessionID)
	if err != nil || phase != models.PhaseCoding {
		return c.Status(409).JSON(fiber.Map{"error": "not in CODING phase"})
	}

	if err := h.Orchestrator.TransitionToSocratic(c.Context(), sessionID, req.Code, req.Language); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "transition failed"})
	}

	return c.JSON(fiber.Map{"phase": "SOCRATIC", "message": "Code submitted. Socratic assessment begins."})
}

// POST /api/sessions/:id/socratic
func (h *SessionHandler) SocraticChat(c *fiber.Ctx) error {
	sessionID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid session id"})
	}

	phase, _ := h.Orchestrator.GetPhase(c.Context(), sessionID)
	if phase != models.PhaseSocratic {
		return c.Status(409).JSON(fiber.Map{"error": "not in SOCRATIC phase"})
	}

	var req struct {
		Message string `json:"message"`
	}
	if err := c.BodyParser(&req); err != nil || req.Message == "" {
		return c.Status(400).JSON(fiber.Map{"error": "message is required"})
	}

	ctx := c.Context()
	chatKey := "session:" + sessionID.String() + ":chat"

	// Store candidate message
	candidateMsg, _ := json.Marshal(map[string]string{"role": "candidate", "content": req.Message})
	database.RDB.RPush(ctx, chatKey, string(candidateMsg))

	// Get chat history
	history := getChatHistory(ctx, chatKey)

	// Get exam prompt and candidate code
	var examPrompt, code string
	database.Pool.QueryRow(ctx,
		`SELECT e.prompt, s.code FROM sessions s JOIN exams e ON s.exam_id = e.id WHERE s.id = $1`, sessionID,
	).Scan(&examPrompt, &code)

	// Ask Gemini for counter-question
	fmt.Println("DEBUG: Calling Gemini with prompt length:", len(examPrompt), "code length:", len(code), "history length:", len(history))
	response, err := h.Gemini.SocraticQuestion(ctx, examPrompt, code, history)
	if err != nil {
		fmt.Println("SOCRATIC AI ERROR:", err)
		fmt.Println("DEBUG: API Key present:", h.Gemini.APIKey != "")
		return c.Status(500).JSON(fiber.Map{"error": "AI service unavailable: " + err.Error()})
	}

	// Store Gemini response
	geminiMsg, _ := json.Marshal(map[string]string{"role": "gemini", "content": response})
	database.RDB.RPush(ctx, chatKey, string(geminiMsg))

	// Check if we've done enough rounds (5 rounds = 10 messages)
	chatLen, _ := database.RDB.LLen(ctx, chatKey).Result()

	return c.JSON(fiber.Map{
		"response":        response,
		"messages_so_far": chatLen,
		"rounds_left":     max(0, 5-int(chatLen/2)),
	})
}

// POST /api/sessions/:id/end-socratic
func (h *SessionHandler) EndSocratic(c *fiber.Ctx) error {
	sessionID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid session id"})
	}

	phase, _ := h.Orchestrator.GetPhase(c.Context(), sessionID)
	if phase != models.PhaseSocratic {
		return c.Status(409).JSON(fiber.Map{"error": "not in SOCRATIC phase"})
	}

	ctx := c.Context()
	chatKey := "session:" + sessionID.String() + ":chat"

	// Get exam prompt and chat history for scoring
	var examPrompt string
	database.Pool.QueryRow(ctx,
		`SELECT e.prompt FROM sessions s JOIN exams e ON s.exam_id = e.id WHERE s.id = $1`, sessionID,
	).Scan(&examPrompt)

	history := getChatHistory(ctx, chatKey)

	// Ask Gemini to score
	scoreResp, err := h.Gemini.ScoreSocratic(ctx, examPrompt, history)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "scoring failed"})
	}

	// Parse score
	var scoreResult struct {
		Score  float64 `json:"score"`
		Reason string  `json:"reason"`
	}
	cleanJSON := strings.TrimSpace(scoreResp)
	cleanJSON = strings.TrimPrefix(cleanJSON, "```json")
	cleanJSON = strings.TrimPrefix(cleanJSON, "```JSON")
	cleanJSON = strings.TrimPrefix(cleanJSON, "```")
	cleanJSON = strings.TrimSuffix(cleanJSON, "```")
	cleanJSON = strings.TrimSpace(cleanJSON)
	json.Unmarshal([]byte(cleanJSON), &scoreResult)

	// Store in Redis
	database.RDB.Set(ctx, "session:"+sessionID.String()+":socratic_score",
		strconv.FormatFloat(scoreResult.Score, 'f', 2, 64), 0)

	// Transition to Saboteur
	if err := h.Orchestrator.TransitionToSaboteur(ctx, sessionID); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "saboteur transition failed"})
	}

	// Get mutated code
	var mutatedCode string
	database.Pool.QueryRow(ctx,
		`SELECT mutated_code FROM sessions WHERE id = $1`, sessionID,
	).Scan(&mutatedCode)

	return c.JSON(fiber.Map{
		"phase":          "SABOTEUR",
		"socratic_score": scoreResult.Score,
		"socratic_reason": scoreResult.Reason,
		"mutated_code":   mutatedCode,
		"time_limit_sec": 60,
		"message":        "Your code has an error. You have 60 seconds to fix it.",
	})
}

// POST /api/sessions/:id/saboteur-fix
func (h *SessionHandler) SaboteurFix(c *fiber.Ctx) error {
	sessionID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid session id"})
	}

	phase, _ := h.Orchestrator.GetPhase(c.Context(), sessionID)
	if phase != models.PhaseSaboteur {
		return c.Status(409).JSON(fiber.Map{"error": "not in SABOTEUR phase"})
	}

	// Check if 60s timer expired
	ctx := c.Context()
	_, err = database.RDB.Get(ctx, "session:"+sessionID.String()+":saboteur").Result()
	expired := err == redis.Nil

	var req struct {
		Code string `json:"code"`
	}
	c.BodyParser(&req)

	fixCode := req.Code
	if expired {
		fixCode = "" // timed out
	}

	if err := h.Orchestrator.CompleteSession(ctx, sessionID, fixCode); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "completion failed"})
	}

	// Fetch final session data
	var session models.Session
	database.Pool.QueryRow(ctx,
		`SELECT id, exam_id, candidate_id, phase, integrity_score, cadence_verdict, socratic_score, saboteur_passed, tab_violations
		 FROM sessions WHERE id = $1`, sessionID,
	).Scan(&session.ID, &session.ExamID, &session.CandidateID, &session.Phase,
		&session.IntegrityScore, &session.CadenceVerdict, &session.SocraticScore, &session.SaboteurPassed, &session.TabViolations)

	return c.JSON(fiber.Map{
		"phase":           "COMPLETE",
		"timed_out":       expired,
		"integrity_score": session.IntegrityScore,
		"cadence_verdict": session.CadenceVerdict,
		"socratic_score":  session.SocraticScore,
		"saboteur_passed": session.SaboteurPassed,
	})
}

// POST /api/sessions/:id/violation
func (h *SessionHandler) ReportViolation(c *fiber.Ctx) error {
	sessionID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid session id"})
	}
	var req struct {
		Type string `json:"type"`
	}
	_ = c.BodyParser(&req)
	if req.Type == "" {
		req.Type = "unknown"
	}
	h.Orchestrator.RecordViolation(c.Context(), sessionID, req.Type)
	return c.JSON(fiber.Map{"recorded": true})
}

// GET /api/sessions/:id
func (h *SessionHandler) GetSession(c *fiber.Ctx) error {
	sessionID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid session id"})
	}

	var s models.Session
	var code, mutatedCode, debugFixCode, chosenLang *string

	err = database.Pool.QueryRow(c.Context(),
		`SELECT id, exam_id, candidate_id, phase, started_at, finished_at, mcq_answers, mcq_score, chosen_language, code, mutated_code, debug_fix_code,
		 integrity_score, cadence_verdict, socratic_score, saboteur_passed, tab_violations
		 FROM sessions WHERE id = $1`, sessionID,
	).Scan(&s.ID, &s.ExamID, &s.CandidateID, &s.Phase, &s.StartedAt, &s.FinishedAt,
		&s.McqAnswers, &s.McqScore, &chosenLang,
		&code, &mutatedCode, &debugFixCode, &s.IntegrityScore, &s.CadenceVerdict,
		&s.SocraticScore, &s.SaboteurPassed, &s.TabViolations)

	if err != nil {
		fmt.Println("GET SESSION ERROR:", err)
		return c.Status(404).JSON(fiber.Map{"error": "session not found"})
	}

	if s.McqAnswers == nil {
		s.McqAnswers = []int{}
	}
	if chosenLang != nil {
		s.ChosenLanguage = *chosenLang
	}
	if code != nil {
		s.Code = *code
	}
	if mutatedCode != nil {
		s.MutatedCode = *mutatedCode
	}
	if debugFixCode != nil {
		s.DebugFixCode = *debugFixCode
	}

	return c.JSON(s)
}

// DELETE /api/admin/sessions/:id
func (h *SessionHandler) DeleteSession(c *fiber.Ctx) error {
	sessionID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid session id"})
	}

	_, err = database.Pool.Exec(c.Context(), `DELETE FROM sessions WHERE id = $1`, sessionID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "delete failed"})
	}

	return c.SendStatus(204)
}

// ─── Admin: list all sessions ───

func (h *SessionHandler) ListSessions(c *fiber.Ctx) error {
	rows, err := database.Pool.Query(c.Context(),
		`SELECT s.id, s.exam_id, s.candidate_id, s.phase, s.started_at, s.integrity_score,
		        s.cadence_verdict, s.socratic_score, s.saboteur_passed, s.tab_violations, s.mcq_score, u.name, u.email
		 FROM sessions s JOIN users u ON s.candidate_id = u.id ORDER BY s.started_at DESC`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "query failed"})
	}
	defer rows.Close()

	type sessionRow struct {
		models.Session
		CandidateName  string `json:"candidate_name"`
		CandidateEmail string `json:"candidate_email"`
	}

	var results []sessionRow
	for rows.Next() {
		var r sessionRow
		rows.Scan(&r.ID, &r.ExamID, &r.CandidateID, &r.Phase, &r.StartedAt,
			&r.IntegrityScore, &r.CadenceVerdict, &r.SocraticScore, &r.SaboteurPassed,
			&r.TabViolations, &r.McqScore, &r.CandidateName, &r.CandidateEmail)
		results = append(results, r)
	}
	if results == nil {
		results = []sessionRow{}
	}
	return c.JSON(results)
}

// ─── helpers ───

func getChatHistory(ctx context.Context, chatKey string) []map[string]string {
	msgs, _ := database.RDB.LRange(ctx, chatKey, 0, -1).Result()
	var history []map[string]string
	for _, m := range msgs {
		var msg map[string]string
		json.Unmarshal([]byte(m), &msg)
		history = append(history, msg)
	}
	return history
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
