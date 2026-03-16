package com.jatayu.proctor.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ChatResponse {
    private Long assessmentId;
    private String aiReply;
}
