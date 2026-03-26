package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type GeminiService struct {
	APIKey     string
	HTTPClient *http.Client
	ModelURL   string
}

func NewGeminiService(apiKey string) *GeminiService {
	return &GeminiService{
		APIKey:     apiKey,
		HTTPClient: &http.Client{Timeout: 30 * time.Second},
		ModelURL:   "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
	}
}

// ─── Request / Response types ───

type geminiRequest struct {
	Contents         []geminiContent        `json:"contents"`
	GenerationConfig map[string]interface{} `json:"generationConfig,omitempty"`
}

type geminiContent struct {
	Role  string       `json:"role"`
	Parts []geminiPart `json:"parts"`
}

type geminiPart struct {
	Text string `json:"text"`
}

type geminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

// ─── Public Methods ───

// SocraticQuestion generates a counter-question based on the candidate's response.
func (g *GeminiService) SocraticQuestion(ctx context.Context, examPrompt, candidateCode string, chatHistory []map[string]string) (string, error) {
	systemPrompt := fmt.Sprintf(`You are a strict technical interviewer. The candidate is solving this problem:
---
%s
---
Their current code:
---
%s
---
Based on the conversation so far, ask ONE pointed follow-up question that tests whether they truly understand their code. 
Do NOT give hints. Do NOT be friendly. Be concise (1-2 sentences max). 
If the candidate's answer is wrong or vague, challenge them.`, examPrompt, candidateCode)

	var contents []geminiContent
	for i, msg := range chatHistory {
		role := "user"
		if msg["role"] == "gemini" {
			role = "model"
		}
		text := msg["content"]
		
		if i == 0 && role == "user" {
			text = systemPrompt + "\n\nCandidate's message:\n" + text
		}
		
		if len(contents) > 0 && contents[len(contents)-1].Role == role {
			// Append to the last message of the same role
			contents[len(contents)-1].Parts[0].Text += "\n\n" + text
		} else {
			// Add new message block
			contents = append(contents, geminiContent{
				Role:  role,
				Parts: []geminiPart{{Text: text}},
			})
		}
	}

	return g.call(ctx, contents)
}

// ScoreSocratic evaluates the entire Socratic chat and returns a 0-100 score.
func (g *GeminiService) ScoreSocratic(ctx context.Context, examPrompt string, chatHistory []map[string]string) (string, error) {
	historyJSON, _ := json.Marshal(chatHistory)
	prompt := fmt.Sprintf(`You are evaluating a candidate's technical understanding. 
Problem: %s
Chat transcript: %s

Rate the candidate's understanding from 0 to 100. Return ONLY a JSON object: {"score": <int>, "reason": "<one sentence>"}`, examPrompt, string(historyJSON))

	contents := []geminiContent{
		{Role: "user", Parts: []geminiPart{{Text: prompt}}},
	}
	return g.call(ctx, contents)
}

// InjectBug takes working code and returns a version with exactly one subtle logical bug.
func (g *GeminiService) InjectBug(ctx context.Context, code, language string) (string, error) {
	prompt := fmt.Sprintf(`You are a code saboteur. Take this working %s code and inject EXACTLY ONE subtle logical bug.
Rules:
- The bug must cause a WRONG OUTPUT, not a syntax error.
- Do NOT add comments about the bug.
- Return ONLY the modified code, nothing else.

Code:
%s`, language, code)

	contents := []geminiContent{
		{Role: "user", Parts: []geminiPart{{Text: prompt}}},
	}
	return g.call(ctx, contents)
}

// ─── Private ───

func (g *GeminiService) call(ctx context.Context, contents []geminiContent) (string, error) {
	reqBody := geminiRequest{
		Contents: contents,
		GenerationConfig: map[string]interface{}{
			"temperature":     0.7,
			"maxOutputTokens": 2048,
		},
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("marshal request: %w", err)
	}

	url := fmt.Sprintf("%s?key=%s", g.ModelURL, g.APIKey)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(jsonData))
	if err != nil {
		return "", fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := g.HTTPClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("gemini API call: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("gemini API error %d: %s", resp.StatusCode, string(body))
	}

	var gemResp geminiResponse
	if err := json.Unmarshal(body, &gemResp); err != nil {
		return "", fmt.Errorf("unmarshal response: %w", err)
	}

	if len(gemResp.Candidates) == 0 || len(gemResp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("empty response from Gemini")
	}

	return gemResp.Candidates[0].Content.Parts[0].Text, nil
}
