package main

import (
	"fmt"
	"io"
	"net/http/httptest"
	"github.com/gofiber/fiber/v2"
)

func main() {
	app := fiber.New()
	
	protected := app.Group("/api")
	
	admin := protected.Group("", func(c *fiber.Ctx) error {
		return c.Status(403).SendString("admin")
	})
	admin.Get("/a", func(c *fiber.Ctx) error { return c.SendString("ok_admin") })
	
	protected.Get("/b", func(c *fiber.Ctx) error { return c.SendString("candidate") })

	// Test GET /api/b
	req := httptest.NewRequest("GET", "/api/b", nil)
	resp, _ := app.Test(req)
	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("Status: %d, Body: %s\n", resp.StatusCode, string(body))
}
