package com.jatayu.proctor.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ChatRequest {

    private Long assessmentId;

    @NotBlank(message = "Message cannot be empty")
    private String message;
}
