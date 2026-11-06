package github.felkng.olha_minha_questao.domain.repository;

import github.felkng.olha_minha_questao.domain.entity.QuestionSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionSessionRepository extends JpaRepository<QuestionSession, Long> {
    List<QuestionSession> findByUserIdOrderByUpdatedAtDesc(Long userId);
    List<QuestionSession> findByUserIdOrderByCreatedAtDesc(Long userId);
}
