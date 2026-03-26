package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jatayu-proctor/backend/internal/database"
	"github.com/jatayu-proctor/backend/internal/models"
	"github.com/redis/go-redis/v9"
)

type SessionOrchestrator struct {
	Gemini  *GeminiService
	Cadence *CadenceAnalyzer
}

func NewSessionOrchestrator(gemini *GeminiService, cadence *CadenceAnalyzer) *SessionOrchestrator {
	return &SessionOrchestrator{Gemini: gemini, Cadence: cadence}
}

// ─── Session lifecycle ───

func (o *SessionOrchestrator) StartSession(ctx context.Context, examID, candidateID uuid.UUID) (*models.Session, error) {
	var s models.Session
	err := database.Pool.QueryRow(ctx,
		`INSERT INTO sessions (exam_id, candidate_id, phase) VALUES ($1, $2, 'MCQ') RETURNING id, exam_id, candidate_id, phase, started_at`,
		examID, candidateID,
	).Scan(&s.ID, &s.ExamID, &s.CandidateID, &s.Phase, &s.StartedAt)
	if err != nil {
		return nil, err
	}

	// Store session state in Redis
	database.RDB.Set(ctx, redisSessionKey(s.ID), string(models.PhaseMcq), 2*time.Hour)
	return &s, nil
}

func (o *SessionOrchestrator) GetPhase(ctx context.Context, sessionID uuid.UUID) (models.SessionPhase, error) {
	val, err := database.RDB.Get(ctx, redisSessionKey(sessionID)).Result()
	if err == redis.Nil {
		return "", fmt.Errorf("session not found in cache")
	}
	return models.SessionPhase(val), err
}

// ─── Phase transitions ───

func (o *SessionOrchestrator) TransitionToCoding(ctx context.Context, sessionID uuid.UUID, answers []int, score float64) error {
	_, err := database.Pool.Exec(ctx,
		`UPDATE sessions SET phase = 'CODING', mcq_answers = $2, mcq_score = $3 WHERE id = $1`, sessionID, answers, score)
	if err != nil {
		return err
	}
	database.RDB.Set(ctx, redisSessionKey(sessionID), string(models.PhaseCoding), 2*time.Hour)
	return nil
}

func (o *SessionOrchestrator) TransitionToSocratic(ctx context.Context, sessionID uuid.UUID, code string, language string) error {
	_, err := database.Pool.Exec(ctx,
		`UPDATE sessions SET phase = 'SOCRATIC', code = $2, chosen_language = $3 WHERE id = $1`, sessionID, code, language)
	if err != nil {
		return err
	}
	database.RDB.Set(ctx, redisSessionKey(sessionID), string(models.PhaseSocratic), 2*time.Hour)
	return nil
}

func (o *SessionOrchestrator) TransitionToSaboteur(ctx context.Context, sessionID uuid.UUID) error {
	// Get the session's submitted code
	var code, language, prompt string
	err := database.Pool.QueryRow(ctx,
		`SELECT s.code, e.language, e.prompt FROM sessions s JOIN exams e ON s.exam_id = e.id WHERE s.id = $1`, sessionID,
	).Scan(&code, &language, &prompt)
	if err != nil {
		return err
	}

	// Ask Gemini to inject a bug
	mutated, err := o.Gemini.InjectBug(ctx, code, language)
	if err != nil {
		return fmt.Errorf("saboteur injection failed: %w", err)
	}

	_, err = database.Pool.Exec(ctx,
		`UPDATE sessions SET phase = 'SABOTEUR', mutated_code = $2 WHERE id = $1`, sessionID, mutated)
	if err != nil {
		return err
	}

	// Set 60-second countdown in Redis
	database.RDB.Set(ctx, redisSaboteurKey(sessionID), "active", 60*time.Second)
	database.RDB.Set(ctx, redisSessionKey(sessionID), string(models.PhaseSaboteur), 2*time.Hour)
	return nil
}

func (o *SessionOrchestrator) CompleteSession(ctx context.Context, sessionID uuid.UUID, debugCode string) error {
	// Analyze cadence from stored telemetry
	deltas, _ := o.getStoredDeltas(ctx, sessionID)
	verdict := o.Cadence.Analyze(deltas)

	// Get Socratic score from Redis
	socraticScore := o.getSocraticScore(ctx, sessionID)

	// Check saboteur: did they submit in time?
	saboteurPassed := debugCode != ""

	// Compute final integrity score (weighted)
	cadenceWeight := 0.35
	socraticWeight := 0.40
	saboteurWeight := 0.25

	cadenceScore := 0.0
	switch verdict.CadenceClass {
	case models.CadenceOrganic:
		cadenceScore = 100
	case models.CadenceSuspicious:
		cadenceScore = 40
	case models.CadenceSynthetic:
		cadenceScore = 0
	}

	saboteurScore := 0.0
	if saboteurPassed {
		saboteurScore = 100
	}

	finalScore := cadenceWeight*cadenceScore + socraticWeight*socraticScore + saboteurWeight*saboteurScore

	now := time.Now()
	_, err := database.Pool.Exec(ctx,
		`UPDATE sessions SET phase = 'COMPLETE', debug_fix_code = $2, finished_at = $3,
		 integrity_score = $4, cadence_verdict = $5, socratic_score = $6, saboteur_passed = $7
		 WHERE id = $1`,
		sessionID, debugCode, now, finalScore, string(verdict.CadenceClass), socraticScore, saboteurPassed)
	if err != nil {
		return err
	}

	// Persist telemetry summary
	_, _ = database.Pool.Exec(ctx,
		`INSERT INTO telemetry_summaries (session_id, mean_delta, stddev_delta, entropy, cadence_class, total_keys)
		 VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (session_id) DO UPDATE
		 SET mean_delta=$2, stddev_delta=$3, entropy=$4, cadence_class=$5, total_keys=$6`,
		sessionID, verdict.MeanDelta, verdict.StdDevDelta, verdict.Entropy, string(verdict.CadenceClass), len(deltas))

	database.RDB.Set(ctx, redisSessionKey(sessionID), string(models.PhaseComplete), 24*time.Hour)
	return nil
}

// ─── Helpers ───

func (o *SessionOrchestrator) StoreTelemetry(ctx context.Context, sessionID uuid.UUID, events []models.KeystrokeEvent) error {
	data, err := json.Marshal(events)
	if err != nil {
		return err
	}
	return database.RDB.RPush(ctx, redisTelemetryKey(sessionID), string(data)).Err()
}

func (o *SessionOrchestrator) getStoredDeltas(ctx context.Context, sessionID uuid.UUID) ([]float64, error) {
	chunks, err := database.RDB.LRange(ctx, redisTelemetryKey(sessionID), 0, -1).Result()
	if err != nil {
		return nil, err
	}
	var allDeltas []float64
	for _, chunk := range chunks {
		var events []models.KeystrokeEvent
		json.Unmarshal([]byte(chunk), &events)
		for _, e := range events {
			if e.Delta > 0 && e.Delta < 5000 { // filter outliers
				allDeltas = append(allDeltas, e.Delta)
			}
		}
	}
	return allDeltas, nil
}

func (o *SessionOrchestrator) getSocraticScore(ctx context.Context, sessionID uuid.UUID) float64 {
	val, err := database.RDB.Get(ctx, redisSocraticScoreKey(sessionID)).Float64()
	if err != nil {
		return 0
	}
	return val
}

func (o *SessionOrchestrator) TabViolation(ctx context.Context, sessionID uuid.UUID) error {
	_, err := database.Pool.Exec(ctx,
		`UPDATE sessions SET tab_violations = tab_violations + 1 WHERE id = $1`, sessionID)
	return err
}

func redisSessionKey(id uuid.UUID) string      { return "session:" + id.String() + ":phase" }
func redisTelemetryKey(id uuid.UUID) string     { return "session:" + id.String() + ":telemetry" }
func redisSaboteurKey(id uuid.UUID) string      { return "session:" + id.String() + ":saboteur" }
func redisSocraticScoreKey(id uuid.UUID) string { return "session:" + id.String() + ":socratic_score" }

func (o *SessionOrchestrator) RecordViolation(ctx context.Context, sessionID uuid.UUID, violationType string) error {
	// Keep it schema-free: increment counter in Postgres, store details in Redis.
	_ = database.RDB.RPush(ctx, "session:"+sessionID.String()+":violations",
		fmt.Sprintf(`{"type":%q,"ts":%d}`, violationType, time.Now().UnixMilli()),
	).Err()
	return o.TabViolation(ctx, sessionID)
}
