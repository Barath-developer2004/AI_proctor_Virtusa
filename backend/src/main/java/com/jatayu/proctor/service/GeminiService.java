package com.jatayu.proctor.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

/**
 * Calls Google Gemini 1.5 API for:
 * 1. Saboteur Protocol – injects subtle bugs into submitted code
 * 2. Socratic Chat – generates follow-up questions based on candidate answers
 */
@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);

    private final WebClient webClient;

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    public GeminiService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    /**
     * Saboteur Protocol: asks Gemini to inject a subtle logical bug.
     */
    public String mutateCode(String originalCode) {
        String prompt = "Inject one subtle logical bug into this code without causing syntax errors. "
                + "Return only the raw mutated code, no explanations:\n\n" + originalCode;

        return callGemini(prompt);
    }

    /**
     * Socratic Micro-Assessment: generates a follow-up question.
     */
    public String generateFollowUp(String conversationContext, String candidateAnswer) {
        String prompt = "You are a senior technical interviewer conducting a Socratic assessment. "
                + "Based on the conversation so far and the candidate's latest answer, "
                + "generate one hyper-specific follow-up question that probes deeper into their understanding. "
                + "Be concise and direct.\n\n"
                + "Conversation context:\n" + conversationContext + "\n\n"
                + "Candidate's answer:\n" + candidateAnswer;

        return callGemini(prompt);
    }

    private String callGemini(String prompt) {
        String url = apiUrl + "?key=" + apiKey;

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", prompt)
                        ))
                )
        );

        try {
            Map<?, ?> response = webClient.post()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            return extractTextFromGeminiResponse(response);
        } catch (Exception e) {
            log.error("Gemini API call failed: {}", e.getMessage());
            throw new RuntimeException("AI service unavailable", e);
        }
    }

    @SuppressWarnings("unchecked")
    private String extractTextFromGeminiResponse(Map<?, ?> response) {
        if (response == null) {
            throw new RuntimeException("Empty response from Gemini");
        }

        List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
        if (candidates == null || candidates.isEmpty()) {
            throw new RuntimeException("No candidates in Gemini response");
        }

        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");

        return (String) parts.get(0).get("text");
    }
}
