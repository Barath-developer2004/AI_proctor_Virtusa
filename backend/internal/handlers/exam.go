package handlers

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jatayu-proctor/backend/internal/database"
	"github.com/jatayu-proctor/backend/internal/models"
)

type ExamHandler struct{}

func NewExamHandler() *ExamHandler { return &ExamHandler{} }

type createExamReq struct {
	Title       string       `json:"title"`
	Description string       `json:"description"`
	Language    string       `json:"language"`
	Prompt      string       `json:"prompt"`
	Mcqs           []models.MCQ `json:"mcqs"`
	TimeLimit      int          `json:"time_limit_sec"`
	AvailableFrom  *time.Time   `json:"available_from"`
	AvailableUntil *time.Time   `json:"available_until"`
}

func (h *ExamHandler) Create(c *fiber.Ctx) error {
	var req createExamReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid body"})
	}
	if req.Title == "" || req.Prompt == "" {
		return c.Status(400).JSON(fiber.Map{"error": "title and prompt are required"})
	}
	if req.TimeLimit <= 0 {
		req.TimeLimit = 1800
	}
	if req.Language == "" {
		req.Language = "python"
	}
	if req.Mcqs == nil {
		req.Mcqs = []models.MCQ{}
	}

	adminID, _ := c.Locals("user_id").(string)
	uid, _ := uuid.Parse(adminID)

	var exam models.Exam
	err := database.Pool.QueryRow(context.Background(),
		`INSERT INTO exams (title, description, language, prompt, mcqs, time_limit, created_by, available_from, available_until)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		 RETURNING id, title, description, language, prompt, mcqs, time_limit, created_by, created_at, available_from, available_until`,
		req.Title, req.Description, req.Language, req.Prompt, req.Mcqs, req.TimeLimit, uid, req.AvailableFrom, req.AvailableUntil,
	).Scan(&exam.ID, &exam.Title, &exam.Description, &exam.Language, &exam.Prompt, &exam.Mcqs, &exam.TimeLimit, &exam.CreatedBy, &exam.CreatedAt, &exam.AvailableFrom, &exam.AvailableUntil)
	
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to create exam"})
	}

	return c.Status(201).JSON(exam)
}

func (h *ExamHandler) List(c *fiber.Ctx) error {
	rows, err := database.Pool.Query(context.Background(),
		`SELECT id, title, description, language, prompt, mcqs, time_limit, created_by, created_at, available_from, available_until FROM exams ORDER BY created_at DESC`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "query failed"})
	}
	defer rows.Close()

	var exams []models.Exam
	for rows.Next() {
		var e models.Exam
		rows.Scan(&e.ID, &e.Title, &e.Description, &e.Language, &e.Prompt, &e.Mcqs, &e.TimeLimit, &e.CreatedBy, &e.CreatedAt, &e.AvailableFrom, &e.AvailableUntil)
		if e.Mcqs == nil {
			e.Mcqs = []models.MCQ{}
		}
		exams = append(exams, e)
	}
	if exams == nil {
		exams = []models.Exam{}
	}
	return c.JSON(exams)
}

func (h *ExamHandler) Get(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid exam id"})
	}
	var exam models.Exam
	err = database.Pool.QueryRow(context.Background(),
		`SELECT id, title, description, language, prompt, mcqs, time_limit, created_by, created_at, available_from, available_until FROM exams WHERE id = $1`, id,
	).Scan(&exam.ID, &exam.Title, &exam.Description, &exam.Language, &exam.Prompt, &exam.Mcqs, &exam.TimeLimit, &exam.CreatedBy, &exam.CreatedAt, &exam.AvailableFrom, &exam.AvailableUntil)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "exam not found"})
	}
	if exam.Mcqs == nil {
		exam.Mcqs = []models.MCQ{}
	}
	return c.JSON(exam)
}
