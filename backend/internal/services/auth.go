package services

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jatayu-proctor/backend/internal/models"
)

type AuthService struct {
	Secret string
}

func NewAuthService(secret string) *AuthService {
	return &AuthService{Secret: secret}
}

func (s *AuthService) GenerateToken(user *models.User) (string, error) {
	claims := jwt.MapClaims{
		"sub":  user.ID.String(),
		"email": user.Email,
		"role": string(user.Role),
		"exp":  time.Now().Add(24 * time.Hour).Unix(),
		"iat":  time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.Secret))
}

func (s *AuthService) ParseToken(tokenStr string) (uuid.UUID, models.Role, error) {
	token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		return []byte(s.Secret), nil
	})
	if err != nil {
		return uuid.Nil, "", err
	}
	claims := token.Claims.(jwt.MapClaims)
	uid, err := uuid.Parse(claims["sub"].(string))
	if err != nil {
		return uuid.Nil, "", err
	}
	role := models.Role(claims["role"].(string))
	return uid, role, nil
}
