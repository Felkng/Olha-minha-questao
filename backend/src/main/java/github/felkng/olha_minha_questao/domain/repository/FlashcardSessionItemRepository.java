package github.felkng.olha_minha_questao.domain.repository;

import github.felkng.olha_minha_questao.domain.entity.FlashcardSessionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FlashcardSessionItemRepository extends JpaRepository<FlashcardSessionItem, Long> {
    List<FlashcardSessionItem> findBySessionIdOrderByIdAsc(Long sessionId);
}
