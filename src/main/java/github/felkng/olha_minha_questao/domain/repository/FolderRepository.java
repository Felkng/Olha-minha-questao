package github.felkng.olha_minha_questao.domain.repository;

import github.felkng.olha_minha_questao.domain.entity.Folder;
import github.felkng.olha_minha_questao.domain.entity.FolderType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FolderRepository extends JpaRepository<Folder, Long> {
    List<Folder> findAllByOrderByNameAsc();
    List<Folder> findByFolderTypeOrderByNameAsc(FolderType folderType);
}
