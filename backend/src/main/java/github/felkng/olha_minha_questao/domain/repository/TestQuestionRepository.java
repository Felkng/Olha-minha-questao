package github.felkng.olha_minha_questao.domain.repository;

import github.felkng.olha_minha_questao.domain.entity.TestQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TestQuestionRepository extends JpaRepository<TestQuestion, Long> {

    List<TestQuestion> findByTestIdOrderByOrderIndexAscIdAsc(Long testId);

    List<TestQuestion> findByTestId(Long testId);

    Optional<TestQuestion> findByTestIdAndQuestionId(Long testId, Long questionId);

    boolean existsByTestIdAndQuestionId(Long testId, Long questionId);

    void deleteByTestIdAndQuestionId(Long testId, Long questionId);

    long countByTestId(Long testId);

    @Query("SELECT tq.test.id FROM TestQuestion tq WHERE tq.question.id = :questionId")
    List<Long> findTestIdsByQuestionId(@Param("questionId") Long questionId);

    @Query("SELECT tq.question.id FROM TestQuestion tq WHERE tq.test.id = :testId")
    List<Long> findQuestionIdsByTestId(@Param("testId") Long testId);
}
