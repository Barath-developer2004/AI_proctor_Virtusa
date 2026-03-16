package com.jatayu.proctor.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jatayu.proctor.dto.TelemetryPayload;
import com.jatayu.proctor.model.*;
import com.jatayu.proctor.repository.CandidateRepository;
import com.jatayu.proctor.repository.TelemetryEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TelemetryService {

    private static final Logger log = LoggerFactory.getLogger(TelemetryService.class);

    private final TelemetryEventRepository telemetryRepo;
    private final CandidateRepository candidateRepo;
    private final ObjectMapper objectMapper;

    public TelemetryService(TelemetryEventRepository telemetryRepo,
            CandidateRepository candidateRepo,
            ObjectMapper objectMapper) {
        this.telemetryRepo = telemetryRepo;
        this.candidateRepo = candidateRepo;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void processTelemetry(TelemetryPayload payload) {
        Candidate candidate = candidateRepo.findById(payload.getCandidateId())
                .orElse(null);

        if (candidate == null) {
            log.warn("Telemetry received for unknown candidate: {}", payload.getCandidateId());
            return;
        }

        TelemetryEventType eventType = TelemetryEventType.valueOf(payload.getEventType());
        Severity severity = determineSeverity(eventType, payload);

        String jsonPayload;
        try {
            jsonPayload = objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            jsonPayload = payload.getMessage();
        }

        TelemetryEvent event = TelemetryEvent.builder()
                .candidate(candidate)
                .eventType(eventType)
                .severity(severity)
                .payload(jsonPayload)
                .build();

        telemetryRepo.save(event);
        log.info("Telemetry saved: candidate={}, type={}, severity={}",
                candidate.getId(), eventType, severity);
    }

    public List<TelemetryEvent> getEventsForCandidate(Long candidateId) {
        return telemetryRepo.findByCandidateIdOrderByRecordedAtDesc(candidateId);
    }

    public long getViolationCount(Long candidateId) {
        return telemetryRepo.countByCandidateId(candidateId);
    }

    private Severity determineSeverity(TelemetryEventType eventType, TelemetryPayload payload) {
        return switch (eventType) {
            case TAB_SWITCH -> Severity.HIGH;
            case FOCUS_LOST -> Severity.MEDIUM;
            case PASTE_DETECTED -> {
                int len = payload.getPasteLength() != null ? payload.getPasteLength() : 0;
                yield len > 200 ? Severity.CRITICAL : Severity.HIGH;
            }
            case GHOST_TYPING -> Severity.CRITICAL;
        };
    }
}
