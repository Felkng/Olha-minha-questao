package github.felkng.olha_minha_questao.dto.question;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionAttemptHistoryDTO {
    private Long id;
    private Long questionId;
    private String questionEnunciado;
    private String questionIdentifier;
    private Integer year;
    private Long originId;
    private String originName;
    private Long subjectId;
    private String subjectName;
    private Long areaId;
    private String areaName;

    private Long selectedAlternativeId;
    private String selectedAlternativeLetter;
    private String selectedAlternativeText;

    private Long correctAlternativeId;
    private String correctAlternativeLetter;
    private String correctAlternativeText;

    private Boolean isCorrect;
    private Boolean isFirstAttempt;
    private Integer timeSpentSeconds;
    private String sessionId;
    private Instant createdAt;
}
