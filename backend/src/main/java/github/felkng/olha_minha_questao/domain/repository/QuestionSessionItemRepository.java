package github.felkng.olha_minha_questao.domain.repository;

import github.felkng.olha_minha_questao.domain.entity.QuestionSessionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionSessionItemRepository extends JpaRepository<QuestionSessionItem, Long> {
    List<QuestionSessionItem> findBySessionIdOrderByIdAsc(Long sessionId);
}
