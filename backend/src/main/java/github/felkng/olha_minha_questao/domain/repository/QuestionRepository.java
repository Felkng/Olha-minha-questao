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
    
    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT q FROM Question q LEFT JOIN TestQuestion tq ON tq.question = q WHERE q.test.id = :testId OR tq.test.id = :testId ORDER BY q.id ASC")
    java.util.List<Question> findAllQuestionsByTestId(@org.springframework.data.repository.query.Param("testId") Long testId);

    long countByOriginId(Long originId);
    long countByAreaId(Long areaId);
    long countByTestId(Long testId);
}
