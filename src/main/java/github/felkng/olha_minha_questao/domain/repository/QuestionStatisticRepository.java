package github.felkng.olha_minha_questao.domain.repository;

import github.felkng.olha_minha_questao.domain.entity.DifficultyLevel;
import github.felkng.olha_minha_questao.domain.entity.QuestionStatistic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionStatisticRepository extends JpaRepository<QuestionStatistic, Long> {
    List<QuestionStatistic> findByDifficultyLevel(DifficultyLevel difficultyLevel);
}
