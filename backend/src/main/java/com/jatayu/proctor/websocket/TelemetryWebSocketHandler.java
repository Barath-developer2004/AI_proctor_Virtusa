package com.jatayu.proctor.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jatayu.proctor.dto.TelemetryPayload;
import com.jatayu.proctor.service.TelemetryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.concurrent.ConcurrentHashMap;

@Component
public class TelemetryWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(TelemetryWebSocketHandler.class);

    private final ObjectMapper objectMapper;
    private final TelemetryService telemetryService;

    /** Active sessions tracked by WebSocket session ID */
    private final ConcurrentHashMap<String, WebSocketSession> activeSessions = new ConcurrentHashMap<>();

    public TelemetryWebSocketHandler(ObjectMapper objectMapper, TelemetryService telemetryService) {
        this.objectMapper = objectMapper;
        this.telemetryService = telemetryService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        activeSessions.put(session.getId(), session);
        log.info("Guardian Watchdog connected: sessionId={}", session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        log.debug("Telemetry received: {}", payload);

        TelemetryPayload telemetry = objectMapper.readValue(payload, TelemetryPayload.class);
        telemetryService.processTelemetry(telemetry);

        // Acknowledge receipt
        session.sendMessage(new TextMessage("{\"status\":\"received\"}"));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        activeSessions.remove(session.getId());
        log.info("Guardian Watchdog disconnected: sessionId={}, status={}", session.getId(), status);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.error("WebSocket transport error for session {}: {}", session.getId(), exception.getMessage());
        activeSessions.remove(session.getId());
    }

    public int getActiveConnectionCount() {
        return activeSessions.size();
    }
}
