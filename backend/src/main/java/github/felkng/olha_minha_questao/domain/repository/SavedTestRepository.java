package github.felkng.olha_minha_questao.domain.repository;

import github.felkng.olha_minha_questao.domain.entity.SavedTest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SavedTestRepository extends JpaRepository<SavedTest, Long> {
    List<SavedTest> findByFolderId(Long folderId);
    Optional<SavedTest> findByFolderIdAndTestId(Long folderId, Long testId);
    boolean existsByFolderIdAndTestId(Long folderId, Long testId);
    void deleteByFolderIdAndTestId(Long folderId, Long testId);

    @Query("SELECT st.folder.id FROM SavedTest st WHERE st.test.id = :testId")
    List<Long> findFolderIdsByTestId(@Param("testId") Long testId);

    long countByFolderId(Long folderId);
}
