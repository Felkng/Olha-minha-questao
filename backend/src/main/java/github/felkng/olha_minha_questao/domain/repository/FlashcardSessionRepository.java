package github.felkng.olha_minha_questao.domain.repository;

import github.felkng.olha_minha_questao.domain.entity.FlashcardSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FlashcardSessionRepository extends JpaRepository<FlashcardSession, Long> {
    List<FlashcardSession> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<FlashcardSession> findByFolderIdOrderByCreatedAtDesc(Long folderId);
}
