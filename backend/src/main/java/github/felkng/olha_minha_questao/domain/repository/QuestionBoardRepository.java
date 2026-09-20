package github.felkng.olha_minha_questao.domain.repository;

import github.felkng.olha_minha_questao.domain.entity.QuestionBoard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface QuestionBoardRepository extends JpaRepository<QuestionBoard, Long> {

    Optional<QuestionBoard> findByQuestionIdAndUserId(Long questionId, Long userId);

    boolean existsByQuestionIdAndUserId(Long questionId, Long userId);

    void deleteByQuestionIdAndUserId(Long questionId, Long userId);
}
