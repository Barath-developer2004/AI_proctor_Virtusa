package com.jatayu.proctor.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "telemetry_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TelemetryEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    /** Event type: TAB_SWITCH, FOCUS_LOST, PASTE_DETECTED, GHOST_TYPING */
    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private TelemetryEventType eventType;

    /** Severity: LOW, MEDIUM, HIGH, CRITICAL */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Severity severity = Severity.LOW;

    /** JSON payload: keystroke cadence arrays, paste content length, etc. */
    @Lob
    @Column(columnDefinition = "TEXT")
    private String payload;

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;

    @PrePersist
    protected void onCreate() {
        this.recordedAt = LocalDateTime.now();
    }
}
