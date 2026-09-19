package github.felkng.olha_minha_questao.domain.repository;

import github.felkng.olha_minha_questao.domain.entity.SavedQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedQuestionRepository extends JpaRepository<SavedQuestion, Long> {
    List<SavedQuestion> findByFolderId(Long folderId);
    List<SavedQuestion> findByQuestionId(Long questionId);
    Optional<SavedQuestion> findByFolderIdAndQuestionId(Long folderId, Long questionId);
    void deleteByFolderIdAndQuestionId(Long folderId, Long questionId);
    boolean existsByFolderIdAndQuestionId(Long folderId, Long questionId);
    long countByFolderId(Long folderId);
}
