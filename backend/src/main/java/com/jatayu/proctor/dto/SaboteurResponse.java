package com.jatayu.proctor.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class SaboteurResponse {
    private Long assessmentId;
    private String mutatedCode;
    private int debugTimeLimitSeconds;
}
