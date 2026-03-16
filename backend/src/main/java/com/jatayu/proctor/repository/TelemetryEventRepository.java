package com.jatayu.proctor.repository;

import com.jatayu.proctor.model.TelemetryEvent;
import com.jatayu.proctor.model.TelemetryEventType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TelemetryEventRepository extends JpaRepository<TelemetryEvent, Long> {
    List<TelemetryEvent> findByCandidateIdOrderByRecordedAtDesc(Long candidateId);
    List<TelemetryEvent> findByCandidateIdAndEventType(Long candidateId, TelemetryEventType eventType);
    long countByCandidateId(Long candidateId);
}
