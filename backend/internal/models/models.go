package models

import (
	"time"

	"github.com/google/uuid"
)

// ─── User / Auth ───

type Role string

const (
	RoleAdmin     Role = "admin"
	RoleCandidate Role = "candidate"
)

type User struct {
	ID           uuid.UUID `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Name         string    `json:"name"`
	Role         Role      `json:"role"`
	CreatedAt    time.Time `json:"created_at"`
}

type MCQ struct {
	Question string   `json:"question"`
	Options  []string `json:"options"`
	Answer   int      `json:"answer"` // Index of correct option
}

// ─── Exam ───

type Exam struct {
	ID          uuid.UUID `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Language    string    `json:"language"` // Default language
	Prompt      string    `json:"prompt"`
	Mcqs        []MCQ     `json:"mcqs"`
	TimeLimit      int        `json:"time_limit_sec"`
	CreatedBy      uuid.UUID  `json:"created_by"`
	CreatedAt      time.Time  `json:"created_at"`
	AvailableFrom  *time.Time `json:"available_from"`
	AvailableUntil *time.Time `json:"available_until"`
}

// ─── Session ───

type SessionPhase string

const (
	PhaseMcq       SessionPhase = "MCQ"
	PhaseCoding    SessionPhase = "CODING"
	PhaseSocratic  SessionPhase = "SOCRATIC"
	PhaseSaboteur  SessionPhase = "SABOTEUR"
	PhaseComplete  SessionPhase = "COMPLETE"
	PhaseAborted   SessionPhase = "ABORTED"
)

type Session struct {
	ID              uuid.UUID    `json:"id"`
	ExamID          uuid.UUID    `json:"exam_id"`
	CandidateID     uuid.UUID    `json:"candidate_id"`
	Phase           SessionPhase `json:"phase"`
	StartedAt       time.Time    `json:"started_at"`
	FinishedAt      *time.Time   `json:"finished_at,omitempty"`
	McqAnswers      []int        `json:"mcq_answers"`
	McqScore        float64      `json:"mcq_score"`
	ChosenLanguage  string       `json:"chosen_language"`
	Code            string       `json:"code,omitempty"`
	MutatedCode     string       `json:"mutated_code,omitempty"`
	DebugFixCode    string       `json:"debug_fix_code,omitempty"`
	IntegrityScore  float64      `json:"integrity_score"`
	CadenceVerdict  string       `json:"cadence_verdict"`
	SocraticScore   float64      `json:"socratic_score"`
	SaboteurPassed  bool         `json:"saboteur_passed"`
	TabViolations   int          `json:"tab_violations"`
}

// ─── Telemetry ───

type KeystrokeEvent struct {
	SessionID uuid.UUID `json:"session_id"`
	Key       string    `json:"key"`
	EventType string    `json:"event_type"` // keydown | keyup
	Timestamp float64   `json:"timestamp"`  // performance.now() ms
	Delta     float64   `json:"delta"`      // ms since last key
}

// ─── Socratic Chat ───

type ChatMessage struct {
	Role    string `json:"role"` // candidate | gemini
	Content string `json:"content"`
	SentAt  int64  `json:"sent_at"`
}

// ─── Verdicts ───

type CadenceClass string

const (
	CadenceOrganic    CadenceClass = "ORGANIC"
	CadenceSynthetic  CadenceClass = "SYNTHETIC"
	CadenceSuspicious CadenceClass = "SUSPICIOUS"
)

type Verdict struct {
	SessionID       uuid.UUID    `json:"session_id"`
	CadenceClass    CadenceClass `json:"cadence_class"`
	MeanDelta       float64      `json:"mean_delta"`
	StdDevDelta     float64      `json:"stddev_delta"`
	Entropy         float64      `json:"entropy"`
	SocraticScore   float64      `json:"socratic_score"`
	SaboteurPassed  bool         `json:"saboteur_passed"`
	TabViolations   int          `json:"tab_violations"`
	FinalScore      float64      `json:"final_score"`
}
