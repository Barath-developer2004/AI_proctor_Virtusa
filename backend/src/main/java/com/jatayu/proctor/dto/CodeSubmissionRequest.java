package com.jatayu.proctor.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodeSubmissionRequest {

    private Long assessmentId;

    @NotBlank(message = "Code cannot be empty")
    private String code;

    private String language;
}
