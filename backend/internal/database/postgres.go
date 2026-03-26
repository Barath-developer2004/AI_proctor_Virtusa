package database

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

var Pool *pgxpool.Pool

func Connect(databaseURL string) error {
	var err error
	Pool, err = pgxpool.New(context.Background(), databaseURL)
	if err != nil {
		return fmt.Errorf("unable to connect to database: %w", err)
	}
	return Pool.Ping(context.Background())
}

func Close() {
	if Pool != nil {
		Pool.Close()
	}
}

func Migrate() error {
	schema := `
	CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

	CREATE TABLE IF NOT EXISTS users (
		id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		email      TEXT UNIQUE NOT NULL,
		password_hash TEXT NOT NULL,
		name       TEXT NOT NULL,
		role       TEXT NOT NULL DEFAULT 'candidate',
		created_at TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS exams (
		id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		title       TEXT NOT NULL,
		description TEXT,
		language    TEXT NOT NULL DEFAULT 'python',
		prompt      TEXT NOT NULL,
		time_limit  INT NOT NULL DEFAULT 1800,
		created_by  UUID REFERENCES users(id),
		created_at  TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS sessions (
		id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		exam_id         UUID REFERENCES exams(id) NOT NULL,
		candidate_id    UUID REFERENCES users(id) NOT NULL,
		phase           TEXT NOT NULL DEFAULT 'CODING',
		started_at      TIMESTAMPTZ DEFAULT NOW(),
		finished_at     TIMESTAMPTZ,
		code            TEXT,
		mutated_code    TEXT,
		debug_fix_code  TEXT,
		integrity_score DOUBLE PRECISION DEFAULT 0,
		cadence_verdict TEXT DEFAULT 'PENDING',
		socratic_score  DOUBLE PRECISION DEFAULT 0,
		saboteur_passed BOOLEAN DEFAULT FALSE,
		tab_violations  INT DEFAULT 0
	);

	CREATE TABLE IF NOT EXISTS telemetry_summaries (
		session_id    UUID PRIMARY KEY REFERENCES sessions(id),
		mean_delta    DOUBLE PRECISION,
		stddev_delta  DOUBLE PRECISION,
		entropy       DOUBLE PRECISION,
		cadence_class TEXT,
		total_keys    INT,
		analyzed_at   TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_sessions_candidate ON sessions(candidate_id);
	CREATE INDEX IF NOT EXISTS idx_sessions_exam ON sessions(exam_id);
	`
	_, err := Pool.Exec(context.Background(), schema)
	if err != nil {
		return err
	}

	// Safe migrations for new MCQ feature columns
	alterStmts := `
	ALTER TABLE exams ADD COLUMN IF NOT EXISTS mcqs JSONB DEFAULT '[]'::jsonb;
	ALTER TABLE exams ADD COLUMN IF NOT EXISTS available_from TIMESTAMPTZ;
	ALTER TABLE exams ADD COLUMN IF NOT EXISTS available_until TIMESTAMPTZ;
	
	ALTER TABLE sessions ADD COLUMN IF NOT EXISTS mcq_answers JSONB DEFAULT '[]'::jsonb;
	ALTER TABLE sessions ADD COLUMN IF NOT EXISTS mcq_score DOUBLE PRECISION DEFAULT 0;
	ALTER TABLE sessions ADD COLUMN IF NOT EXISTS chosen_language TEXT DEFAULT '';
	
	ALTER TABLE sessions ALTER COLUMN phase SET DEFAULT 'MCQ';
	`
	_, _ = Pool.Exec(context.Background(), alterStmts) // Ignore errors if they already exist

	return nil
}
