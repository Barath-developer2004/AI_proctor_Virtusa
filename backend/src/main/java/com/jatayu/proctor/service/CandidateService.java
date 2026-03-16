package com.jatayu.proctor.service;

import com.jatayu.proctor.dto.CandidateRegistration;
import com.jatayu.proctor.model.Candidate;
import com.jatayu.proctor.repository.CandidateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class CandidateService {

    private final CandidateRepository candidateRepo;

    public CandidateService(CandidateRepository candidateRepo) {
        this.candidateRepo = candidateRepo;
    }

    @Transactional
    public Candidate register(CandidateRegistration registration) {
        // Check if email already exists
        if (candidateRepo.findByEmail(registration.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Candidate with this email already exists");
        }

        Candidate candidate = Candidate.builder()
                .name(registration.getName())
                .email(registration.getEmail())
                .sessionToken(UUID.randomUUID().toString())
                .build();

        return candidateRepo.save(candidate);
    }

    public Candidate getById(Long id) {
        return candidateRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Candidate not found: " + id));
    }

    public Candidate getBySessionToken(String token) {
        return candidateRepo.findBySessionToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid session token"));
    }

    public List<Candidate> getAll() {
        return candidateRepo.findAll();
    }
}
