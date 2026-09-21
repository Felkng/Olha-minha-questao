package github.felkng.olha_minha_questao.dto.test;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestAttemptSummaryDTO {
    private Long id;
    private Long testId;
    private String testName;
    private Integer testYear;
    private String originName;
    private String areaName;
    private Long userId;
    private Integer totalQuestions;
    private Integer correctAnswers;
    private Double scorePercentage;
    private Integer timeSpentSeconds;
    private String sessionId;
    private Instant createdAt;
}
