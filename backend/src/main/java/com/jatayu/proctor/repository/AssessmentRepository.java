package com.jatayu.proctor.repository;

import com.jatayu.proctor.model.Assessment;
import com.jatayu.proctor.model.AssessmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssessmentRepository extends JpaRepository<Assessment, Long> {
    List<Assessment> findByCandidateId(Long candidateId);
    List<Assessment> findByCandidateIdAndStatus(Long candidateId, AssessmentStatus status);
}
