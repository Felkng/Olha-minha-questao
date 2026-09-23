package github.felkng.olha_minha_questao.domain.repository;

import github.felkng.olha_minha_questao.domain.entity.QuestionAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface QuestionAttemptRepository extends JpaRepository<QuestionAttempt, Long> {
    List<QuestionAttempt> findByQuestionId(Long questionId);
    boolean existsByQuestionIdAndSessionId(Long questionId, String sessionId);
    boolean existsByQuestionIdAndUserId(Long questionId, Long userId);
    List<QuestionAttempt> findByUserId(Long userId);
    List<QuestionAttempt> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<QuestionAttempt> findByQuestionIdAndUserIdOrderByCreatedAtDesc(Long questionId, Long userId);
    List<QuestionAttempt> findBySessionId(String sessionId);

    @Query("SELECT DATE(qa.createdAt), COUNT(qa) FROM QuestionAttempt qa WHERE qa.user.id = :userId GROUP BY DATE(qa.createdAt)")
    List<Object[]> findDailyAttemptCountsByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(DISTINCT qa.user.id) FROM QuestionAttempt qa WHERE qa.user IS NOT NULL AND qa.createdAt >= :since")
    long countDistinctActiveUsersSince(@Param("since") Instant since);
}
