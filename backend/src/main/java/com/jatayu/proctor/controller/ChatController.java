package com.jatayu.proctor.controller;

import com.jatayu.proctor.dto.ChatRequest;
import com.jatayu.proctor.dto.ChatResponse;
import com.jatayu.proctor.model.ChatMessage;
import com.jatayu.proctor.service.ChatService;
import com.jatayu.proctor.service.GeminiService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;
    private final GeminiService geminiService;

    public ChatController(ChatService chatService, GeminiService geminiService) {
        this.chatService = chatService;
        this.geminiService = geminiService;
    }

    /**
     * Socratic Micro-Assessment:
     * 1. Save candidate's message
     * 2. Build conversation context
     * 3. Call Gemini for a follow-up question
     * 4. Save and return AI response
     */
    @PostMapping("/message")
    public ResponseEntity<ChatResponse> sendMessage(@Valid @RequestBody ChatRequest request) {
        // Save candidate message
        chatService.saveCandidateMessage(request.getAssessmentId(), request.getMessage());

        // Build conversation context from history
        List<ChatMessage> history = chatService.getChatHistory(request.getAssessmentId());
        String context = history.stream()
                .map(m -> m.getRole().name() + ": " + m.getContent())
                .collect(Collectors.joining("\n"));

        // Call Gemini for Socratic follow-up
        String aiReply = geminiService.generateFollowUp(context, request.getMessage());

        // Save AI response
        chatService.saveAiMessage(request.getAssessmentId(), aiReply);

        return ResponseEntity.ok(ChatResponse.builder()
                .assessmentId(request.getAssessmentId())
                .aiReply(aiReply)
                .build());
    }

    @GetMapping("/history/{assessmentId}")
    public ResponseEntity<List<Map<String, Object>>> getChatHistory(@PathVariable Long assessmentId) {
        List<Map<String, Object>> history = chatService.getChatHistory(assessmentId).stream()
                .map(m -> Map.<String, Object>of(
                        "role", m.getRole().name(),
                        "content", m.getContent(),
                        "sentAt", m.getSentAt().toString()
                ))
                .toList();
        return ResponseEntity.ok(history);
    }
}
