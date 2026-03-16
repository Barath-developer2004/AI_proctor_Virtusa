package com.jatayu.proctor.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TelemetryPayload {

    private Long candidateId;
    private String sessionToken;
    private String eventType; // TAB_SWITCH, FOCUS_LOST, PASTE_DETECTED, GHOST_TYPING
    private String severity; // LOW, MEDIUM, HIGH, CRITICAL
    private long timestamp;

    /** For GHOST_TYPING: array of inter-keystroke delays in milliseconds */
    private List<Double> cadenceArray;

    /** For PASTE_DETECTED: length of pasted content */
    private Integer pasteLength;

    /** Raw detail message */
    private String message;
}
