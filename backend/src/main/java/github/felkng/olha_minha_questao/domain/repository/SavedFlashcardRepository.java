package github.felkng.olha_minha_questao.domain.repository;

import github.felkng.olha_minha_questao.domain.entity.SavedFlashcard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SavedFlashcardRepository extends JpaRepository<SavedFlashcard, Long> {

    List<SavedFlashcard> findByFolderId(Long folderId);

    Optional<SavedFlashcard> findByFolderIdAndFlashcardId(Long folderId, Long flashcardId);

    boolean existsByFolderIdAndFlashcardId(Long folderId, Long flashcardId);

    void deleteByFolderIdAndFlashcardId(Long folderId, Long flashcardId);

    long countByFolderId(Long folderId);

    @Query("SELECT sf.folder.id FROM SavedFlashcard sf WHERE sf.flashcard.id = :flashcardId")
    List<Long> findFolderIdsByFlashcardId(@Param("flashcardId") Long flashcardId);
}
