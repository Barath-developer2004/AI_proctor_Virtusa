package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"github.com/jatayu-proctor/backend/internal/config"
	"github.com/jatayu-proctor/backend/internal/database"
	"github.com/jatayu-proctor/backend/internal/handlers"
	"github.com/jatayu-proctor/backend/internal/middleware"
	"github.com/jatayu-proctor/backend/internal/services"
	ws "github.com/jatayu-proctor/backend/internal/websocket"
)

func main() {
	cfg := config.Load()

	// ─── Database connections ───
	if err := database.Connect(cfg.DatabaseURL); err != nil {
		log.Fatalf("PostgreSQL: %v", err)
	}
	defer database.Close()

	if err := database.Migrate(); err != nil {
		log.Fatalf("Migration: %v", err)
	}

	if err := database.ConnectRedis(cfg.RedisURL); err != nil {
		log.Fatalf("Redis: %v", err)
	}
	defer database.CloseRedis()

	// ─── Services ───
	authService := services.NewAuthService(cfg.JWTSecret)
	geminiService := services.NewGeminiService(cfg.GeminiKey)
	cadenceAnalyzer := services.NewCadenceAnalyzer()
	orchestrator := services.NewSessionOrchestrator(geminiService, cadenceAnalyzer)

	// ─── Handlers ───
	authHandler := handlers.NewAuthHandler(authService)
	examHandler := handlers.NewExamHandler()
	sessionHandler := handlers.NewSessionHandler(orchestrator, geminiService)
	telemetryHub := ws.NewTelemetryHub(orchestrator, cfg.JWTSecret)

	// ─── Fiber app ───
	app := fiber.New(fiber.Config{
		AppName: "Jatayu Proctor API",
	})

	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:3000, http://localhost:3001",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	// ─── Public routes ───
	api := app.Group("/api")
	api.Post("/auth/register", authHandler.Register)
	api.Post("/auth/login", authHandler.Login)

	// Auth middleware
	authMid := middleware.AuthRequired(cfg.JWTSecret)
	adminMid := middleware.AdminOnly()

	// ─── Protected routes (Candidates & Admins) ───
	api.Get("/auth/me", authMid, authHandler.Me)

	// Exams
	api.Get("/exams", authMid, examHandler.List)
	api.Get("/exams/:id", authMid, examHandler.Get)

	// Sessions (candidate)
	api.Post("/sessions/start", authMid, sessionHandler.Start)
	api.Post("/sessions/:id/submit-mcqs", authMid, sessionHandler.SubmitMCQs)
	api.Get("/sessions/:id", authMid, sessionHandler.GetSession)
	api.Post("/sessions/:id/submit-code", authMid, sessionHandler.SubmitCode)
	api.Post("/sessions/:id/socratic", authMid, sessionHandler.SocraticChat)
	api.Post("/sessions/:id/end-socratic", authMid, sessionHandler.EndSocratic)
	api.Post("/sessions/:id/saboteur-fix", authMid, sessionHandler.SaboteurFix)
	api.Post("/sessions/:id/violation", authMid, sessionHandler.ReportViolation)

	// Admin-only routes
	api.Post("/exams", authMid, adminMid, examHandler.Create)
	api.Get("/admin/sessions", authMid, adminMid, sessionHandler.ListSessions)
	api.Delete("/admin/sessions/:id", authMid, adminMid, sessionHandler.DeleteSession)

	// ─── WebSocket ───
	app.Use("/ws", telemetryHub.UpgradeCheck())
	app.Get("/ws/telemetry", telemetryHub.HandleConnection())

	// ─── Health ───
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "service": "jatayu-proctor"})
	})

	log.Printf("🚀 Jatayu Proctor API starting on :%s", cfg.Port)
	log.Fatal(app.Listen(":" + cfg.Port))
}
