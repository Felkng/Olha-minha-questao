package github.felkng.olha_minha_questao.domain.repository;

import github.felkng.olha_minha_questao.domain.entity.FlashcardSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface FlashcardSessionRepository extends JpaRepository<FlashcardSession, Long> {
    List<FlashcardSession> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<FlashcardSession> findByFolderIdOrderByCreatedAtDesc(Long folderId);

    @Query("SELECT DATE(fs.createdAt), COUNT(fs), COALESCE(SUM(fs.totalCards), 0) FROM FlashcardSession fs WHERE fs.user.id = :userId GROUP BY DATE(fs.createdAt)")
    List<Object[]> findDailySessionCountsByUserId(@Param("userId") Long userId);

    @Query("SELECT DISTINCT fs.user.id FROM FlashcardSession fs WHERE fs.user IS NOT NULL AND fs.createdAt >= :since")
    List<Long> findDistinctUserIdsSince(@Param("since") Instant since);
}
