package com.jatayu.proctor.service;

import com.jatayu.proctor.model.Assessment;
import com.jatayu.proctor.model.ChatMessage;
import com.jatayu.proctor.model.ChatRole;
import com.jatayu.proctor.repository.AssessmentRepository;
import com.jatayu.proctor.repository.ChatMessageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ChatService {

    private final ChatMessageRepository chatRepo;
    private final AssessmentRepository assessmentRepo;

    public ChatService(ChatMessageRepository chatRepo, AssessmentRepository assessmentRepo) {
        this.chatRepo = chatRepo;
        this.assessmentRepo = assessmentRepo;
    }

    @Transactional
    public ChatMessage saveCandidateMessage(Long assessmentId, String content) {
        Assessment assessment = assessmentRepo.findById(assessmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assessment not found: " + assessmentId));

        ChatMessage msg = ChatMessage.builder()
                .assessment(assessment)
                .role(ChatRole.CANDIDATE)
                .content(content)
                .build();

        return chatRepo.save(msg);
    }

    @Transactional
    public ChatMessage saveAiMessage(Long assessmentId, String content) {
        Assessment assessment = assessmentRepo.findById(assessmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assessment not found: " + assessmentId));

        ChatMessage msg = ChatMessage.builder()
                .assessment(assessment)
                .role(ChatRole.AI)
                .content(content)
                .build();

        return chatRepo.save(msg);
    }

    public List<ChatMessage> getChatHistory(Long assessmentId) {
        return chatRepo.findByAssessmentIdOrderBySentAtAsc(assessmentId);
    }
}
