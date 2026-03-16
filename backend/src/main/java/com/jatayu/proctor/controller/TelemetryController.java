package com.jatayu.proctor.controller;

import com.jatayu.proctor.model.TelemetryEvent;
import com.jatayu.proctor.service.TelemetryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/telemetry")
public class TelemetryController {

    private final TelemetryService telemetryService;

    public TelemetryController(TelemetryService telemetryService) {
        this.telemetryService = telemetryService;
    }

    @GetMapping("/candidate/{candidateId}")
    public ResponseEntity<List<Map<String, Object>>> getEvents(@PathVariable Long candidateId) {
        List<Map<String, Object>> events = telemetryService.getEventsForCandidate(candidateId).stream()
                .map(e -> Map.<String, Object>of(
                        "id", e.getId(),
                        "eventType", e.getEventType().name(),
                        "severity", e.getSeverity().name(),
                        "recordedAt", e.getRecordedAt().toString()
                ))
                .toList();
        return ResponseEntity.ok(events);
    }

    @GetMapping("/candidate/{candidateId}/count")
    public ResponseEntity<Map<String, Object>> getViolationCount(@PathVariable Long candidateId) {
        long count = telemetryService.getViolationCount(candidateId);
        return ResponseEntity.ok(Map.of("candidateId", candidateId, "violationCount", count));
    }
}
