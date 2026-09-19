package github.felkng.olha_minha_questao.dto.question;

import github.felkng.olha_minha_questao.domain.entity.DifficultyLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionAttemptResponseDTO {
    private Boolean isCorrect;
    private Long correctAlternativeId;
    private Double accuracyPercentage;
    private DifficultyLevel difficultyLevel;
    private Long totalAttempts;
}
