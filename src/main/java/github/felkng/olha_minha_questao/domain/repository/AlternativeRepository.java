package github.felkng.olha_minha_questao.domain.repository;

import github.felkng.olha_minha_questao.domain.entity.Alternative;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlternativeRepository extends JpaRepository<Alternative, Long> {
    List<Alternative> findByQuestionIdOrderByIdentifierAsc(Long questionId);
}
