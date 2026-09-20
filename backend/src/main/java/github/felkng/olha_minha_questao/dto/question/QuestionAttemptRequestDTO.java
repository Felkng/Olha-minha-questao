package github.felkng.olha_minha_questao.dto.question;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionAttemptRequestDTO {
    private Long selectedAlternativeId;
    private Boolean isFirstAttempt;
    private Integer timeSpentSeconds;
    private String sessionId;
    private Long userId;
}
