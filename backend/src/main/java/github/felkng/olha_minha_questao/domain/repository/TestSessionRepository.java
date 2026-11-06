package github.felkng.olha_minha_questao.domain.repository;

import github.felkng.olha_minha_questao.domain.entity.TestSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TestSessionRepository extends JpaRepository<TestSession, Long> {
    Optional<TestSession> findFirstByUserIdAndTestIdAndCompletedFalseOrderByUpdatedAtDesc(Long userId, Long testId);
    List<TestSession> findByUserIdAndTestIdAndCompletedFalse(Long userId, Long testId);
    List<TestSession> findByUserIdOrderByUpdatedAtDesc(Long userId);
}
