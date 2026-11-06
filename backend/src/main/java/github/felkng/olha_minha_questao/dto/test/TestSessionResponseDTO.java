package github.felkng.olha_minha_questao.dto.test;

import github.felkng.olha_minha_questao.dto.user.UserSummaryDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestSessionResponseDTO {
    private Long id;
    private UserSummaryDTO user;
    private Long testId;
    private String testName;
    private String originName;
    private String areaName;
    @Builder.Default
    private List<Long> questionIds = new ArrayList<>();
    private Integer totalQuestions;
    private Integer answeredCount;
    private Integer timerMinutes;
    private Integer timeSpentSeconds;
    private Integer activeQuestionIndex;
    private Boolean completed;
    private Long testAttemptId;
    private Instant createdAt;
    private Instant updatedAt;
    @Builder.Default
    private List<TestSessionItemDTO> items = new ArrayList<>();
}
