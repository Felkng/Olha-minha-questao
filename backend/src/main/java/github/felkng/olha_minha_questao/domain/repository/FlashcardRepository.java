package github.felkng.olha_minha_questao.domain.repository;

import github.felkng.olha_minha_questao.domain.entity.Flashcard;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FlashcardRepository extends JpaRepository<Flashcard, Long>, JpaSpecificationExecutor<Flashcard> {
    List<Flashcard> findByFolderIdOrderByIdAsc(Long folderId);
    List<Flashcard> findByFolderId(Long folderId);
    long countByFolderId(Long folderId);
    long countByAreaId(Long areaId);
    long countBySubjectId(Long subjectId);
    long countByCreatedByUserId(Long userId);
}
