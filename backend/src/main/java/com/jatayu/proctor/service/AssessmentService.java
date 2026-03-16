package com.jatayu.proctor.service;

import com.jatayu.proctor.model.*;
import com.jatayu.proctor.repository.AssessmentRepository;
import com.jatayu.proctor.repository.CandidateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AssessmentService {

    private final AssessmentRepository assessmentRepo;
    private final CandidateRepository candidateRepo;

    public AssessmentService(AssessmentRepository assessmentRepo,
                             CandidateRepository candidateRepo) {
        this.assessmentRepo = assessmentRepo;
        this.candidateRepo = candidateRepo;
    }

    @Transactional
    public Assessment createAssessment(Long candidateId, String title, String problemStatement) {
        Candidate candidate = candidateRepo.findById(candidateId)
                .orElseThrow(() -> new IllegalArgumentException("Candidate not found: " + candidateId));

        Assessment assessment = Assessment.builder()
                .candidate(candidate)
                .title(title)
                .problemStatement(problemStatement)
                .status(AssessmentStatus.IN_PROGRESS)
                .build();

        return assessmentRepo.save(assessment);
    }

    public Assessment getById(Long id) {
        return assessmentRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Assessment not found: " + id));
    }

    public List<Assessment> getForCandidate(Long candidateId) {
        return assessmentRepo.findByCandidateId(candidateId);
    }

    @Transactional
    public Assessment submitCode(Long assessmentId, String code) {
        Assessment assessment = getById(assessmentId);
        assessment.setSubmittedCode(code);
        assessment.setSubmittedAt(LocalDateTime.now());
        assessment.setStatus(AssessmentStatus.SUBMITTED);
        return assessmentRepo.save(assessment);
    }

    @Transactional
    public Assessment activateSaboteur(Long assessmentId, String mutatedCode) {
        Assessment assessment = getById(assessmentId);
        assessment.setSaboteurMutatedCode(mutatedCode);
        assessment.setStatus(AssessmentStatus.SABOTEUR_ACTIVE);
        assessment.setDebugDeadline(LocalDateTime.now().plusSeconds(60));
        return assessmentRepo.save(assessment);
    }

    @Transactional
    public Assessment submitDebuggedCode(Long assessmentId, String debuggedCode) {
        Assessment assessment = getById(assessmentId);
        assessment.setDebuggedCode(debuggedCode);
        assessment.setStatus(AssessmentStatus.COMPLETED);
        return assessmentRepo.save(assessment);
    }
}
