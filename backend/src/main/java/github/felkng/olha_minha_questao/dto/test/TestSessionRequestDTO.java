package github.felkng.olha_minha_questao.dto.test;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestSessionRequestDTO {
    private List<Long> questionIds;
    private Integer timerMinutes;
    private Integer timeSpentSeconds;
    private Integer activeQuestionIndex;
    private Boolean completed;
    private List<TestSessionItemDTO> items;
}
