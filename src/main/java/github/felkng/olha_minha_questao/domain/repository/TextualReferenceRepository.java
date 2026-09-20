package github.felkng.olha_minha_questao.domain.repository;

import github.felkng.olha_minha_questao.domain.entity.TextualReference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TextualReferenceRepository extends JpaRepository<TextualReference, Long> {
    List<TextualReference> findByTestIdOrderByIdAsc(Long testId);
}
