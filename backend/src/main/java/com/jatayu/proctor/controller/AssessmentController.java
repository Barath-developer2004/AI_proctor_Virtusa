package com.jatayu.proctor.controller;

import com.jatayu.proctor.dto.CodeSubmissionRequest;
import com.jatayu.proctor.dto.SaboteurResponse;
import com.jatayu.proctor.model.Assessment;
import com.jatayu.proctor.service.AssessmentService;
import com.jatayu.proctor.service.GeminiService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assessments")
public class AssessmentController {

    private final AssessmentService assessmentService;
    private final GeminiService geminiService;

    public AssessmentController(AssessmentService assessmentService, GeminiService geminiService) {
        this.assessmentService = assessmentService;
        this.geminiService = geminiService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
        Long candidateId = ((Number) body.get("candidateId")).longValue();
        String title = (String) body.get("title");
        String problemStatement = (String) body.get("problemStatement");

        Assessment assessment = assessmentService.createAssessment(candidateId, title, problemStatement);
        return ResponseEntity.ok(Map.of(
                "id", assessment.getId(),
                "title", assessment.getTitle(),
                "status", assessment.getStatus().name()
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getAssessment(@PathVariable Long id) {
        Assessment a = assessmentService.getById(id);
        return ResponseEntity.ok(Map.of(
                "id", a.getId(),
                "title", a.getTitle(),
                "problemStatement", a.getProblemStatement() != null ? a.getProblemStatement() : "",
                "status", a.getStatus().name(),
                "submittedCode", a.getSubmittedCode() != null ? a.getSubmittedCode() : "",
                "saboteurMutatedCode", a.getSaboteurMutatedCode() != null ? a.getSaboteurMutatedCode() : ""
        ));
    }

    @GetMapping("/candidate/{candidateId}")
    public ResponseEntity<List<Map<String, Object>>> getForCandidate(@PathVariable Long candidateId) {
        List<Map<String, Object>> result = assessmentService.getForCandidate(candidateId).stream()
                .map(a -> Map.<String, Object>of(
                        "id", a.getId(),
                        "title", a.getTitle(),
                        "status", a.getStatus().name()
                ))
                .toList();
        return ResponseEntity.ok(result);
    }

    /**
     * Saboteur Protocol endpoint:
     * 1. Saves the submitted code
     * 2. Calls Gemini to inject a subtle bug
     * 3. Returns the mutated code + 60s debug deadline
     */
    @PostMapping("/submit-code")
    public ResponseEntity<SaboteurResponse> submitCode(@Valid @RequestBody CodeSubmissionRequest request) {
        // Save original submission
        assessmentService.submitCode(request.getAssessmentId(), request.getCode());

        // Call Gemini – Saboteur Protocol
        String mutatedCode = geminiService.mutateCode(request.getCode());

        // Activate saboteur phase
        assessmentService.activateSaboteur(request.getAssessmentId(), mutatedCode);

        SaboteurResponse response = SaboteurResponse.builder()
                .assessmentId(request.getAssessmentId())
                .mutatedCode(mutatedCode)
                .debugTimeLimitSeconds(60)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Submit debugged code after the Saboteur phase.
     */
    @PostMapping("/{id}/submit-debug")
    public ResponseEntity<Map<String, Object>> submitDebugged(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String debuggedCode = body.get("code");
        Assessment assessment = assessmentService.submitDebuggedCode(id, debuggedCode);
        return ResponseEntity.ok(Map.of(
                "id", assessment.getId(),
                "status", assessment.getStatus().name(),
                "message", "Debug submission recorded"
        ));
    }
}
