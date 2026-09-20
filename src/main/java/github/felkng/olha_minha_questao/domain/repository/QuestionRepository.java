package github.felkng.olha_minha_questao.domain.repository;

import github.felkng.olha_minha_questao.domain.entity.Question;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long>, JpaSpecificationExecutor<Question> {
    Page<Question> findByYear(Integer year, Pageable pageable);
    Page<Question> findByOriginId(Long originId, Pageable pageable);
    Page<Question> findByAreaId(Long areaId, Pageable pageable);
    Page<Question> findByTestId(Long testId, Pageable pageable);
    java.util.List<Question> findByTestId(Long testId);
    java.util.List<Question> findByTestIdOrderByIdAsc(Long testId);
    long countByOriginId(Long originId);
    long countByAreaId(Long areaId);
    long countByTestId(Long testId);
}
