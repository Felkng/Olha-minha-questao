package github.felkng.olha_minha_questao.domain.repository;

import github.felkng.olha_minha_questao.domain.entity.TestAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestAttemptRepository extends JpaRepository<TestAttempt, Long> {
    List<TestAttempt> findByTestId(Long testId);
    List<TestAttempt> findByUserId(Long userId);
    List<TestAttempt> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<TestAttempt> findByTestIdAndUserIdOrderByCreatedAtDesc(Long testId, Long userId);
}
