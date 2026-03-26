package websocket

import (
	"context"
	"encoding/json"
	"log"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jatayu-proctor/backend/internal/models"
	"github.com/jatayu-proctor/backend/internal/services"
)

type TelemetryHub struct {
	Orchestrator *services.SessionOrchestrator
	JWTSecret    string
}

func NewTelemetryHub(orch *services.SessionOrchestrator, secret string) *TelemetryHub {
	return &TelemetryHub{Orchestrator: orch, JWTSecret: secret}
}

// Upgrade middleware — validates token before WebSocket upgrade
func (h *TelemetryHub) UpgradeCheck() fiber.Handler {
	return func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			tokenStr := c.Query("token")
			if tokenStr == "" {
				return c.Status(401).JSON(fiber.Map{"error": "token required"})
			}
			token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
				return []byte(h.JWTSecret), nil
			})
			if err != nil || !token.Valid {
				return c.Status(401).JSON(fiber.Map{"error": "invalid token"})
			}
			claims := token.Claims.(jwt.MapClaims)
			c.Locals("user_id", claims["sub"])
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	}
}

// HandleConnection processes incoming keystroke telemetry over WebSocket.
func (h *TelemetryHub) HandleConnection() fiber.Handler {
	return websocket.New(func(c *websocket.Conn) {
		defer c.Close()

		// Read session_id from the first message
		_, msg, err := c.ReadMessage()
		if err != nil {
			return
		}
		var init struct {
			SessionID string `json:"session_id"`
		}
		if err := json.Unmarshal(msg, &init); err != nil {
			c.WriteJSON(fiber.Map{"error": "send {session_id} first"})
			return
		}
		sessionID, err := uuid.Parse(init.SessionID)
		if err != nil {
			c.WriteJSON(fiber.Map{"error": "invalid session_id"})
			return
		}

		c.WriteJSON(fiber.Map{"status": "connected", "session_id": sessionID})
		log.Printf("[WS] Telemetry stream started for session %s", sessionID)

		// Buffer and flush batches of events
		var buffer []models.KeystrokeEvent
		const batchSize = 20

		for {
			_, msg, err := c.ReadMessage()
			if err != nil {
				break
			}

			// Accept single event or batch
			var events []models.KeystrokeEvent
			if err := json.Unmarshal(msg, &events); err != nil {
				var single models.KeystrokeEvent
				if err := json.Unmarshal(msg, &single); err != nil {
					continue
				}
				single.SessionID = sessionID
				events = []models.KeystrokeEvent{single}
			}
			for i := range events {
				events[i].SessionID = sessionID
			}

			buffer = append(buffer, events...)

			if len(buffer) >= batchSize {
				h.Orchestrator.StoreTelemetry(context.Background(), sessionID, buffer)
				buffer = buffer[:0]
			}
		}

		// Flush remaining
		if len(buffer) > 0 {
			h.Orchestrator.StoreTelemetry(context.Background(), sessionID, buffer)
		}
		log.Printf("[WS] Telemetry stream ended for session %s", sessionID)
	})
}
