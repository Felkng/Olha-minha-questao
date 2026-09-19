package github.felkng.olha_minha_questao.dto.test;

import github.felkng.olha_minha_questao.domain.entity.DifficultyLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestSubmissionResponseDTO {
    private Long testId;
    private Integer totalQuestions;
    private Integer correctAnswers;
    private Double scorePercentage;
    private Integer timeSpentSeconds;
    private DifficultyLevel difficultyLevel;
    private List<QuestionResultDTO> detailedResults;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuestionResultDTO {
        private Long questionId;
        private Long selectedAlternativeId;
        private Long correctAlternativeId;
        private Boolean isCorrect;
        private DifficultyLevel difficultyLevel;
    }
}
