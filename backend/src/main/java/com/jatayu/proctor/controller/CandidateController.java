package com.jatayu.proctor.controller;

import com.jatayu.proctor.dto.CandidateRegistration;
import com.jatayu.proctor.model.Candidate;
import com.jatayu.proctor.service.CandidateService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/candidates")
public class CandidateController {

    private final CandidateService candidateService;

    public CandidateController(CandidateService candidateService) {
        this.candidateService = candidateService;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody CandidateRegistration request) {
        Candidate candidate = candidateService.register(request);
        return ResponseEntity.ok(Map.of(
                "id", candidate.getId(),
                "name", candidate.getName(),
                "email", candidate.getEmail(),
                "sessionToken", candidate.getSessionToken()
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getCandidate(@PathVariable Long id) {
        Candidate candidate = candidateService.getById(id);
        return ResponseEntity.ok(Map.of(
                "id", candidate.getId(),
                "name", candidate.getName(),
                "email", candidate.getEmail(),
                "sessionToken", candidate.getSessionToken()
        ));
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllCandidates() {
        List<Map<String, Object>> result = candidateService.getAll().stream()
                .map(c -> Map.<String, Object>of(
                        "id", c.getId(),
                        "name", c.getName(),
                        "email", c.getEmail()
                ))
                .toList();
        return ResponseEntity.ok(result);
    }
}
