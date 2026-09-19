package github.felkng.olha_minha_questao.dto.test;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestSubmissionRequestDTO {
    private Integer timeSpentSeconds;
    private String sessionId;
    private List<QuestionAnswerDTO> answers;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuestionAnswerDTO {
        private Long questionId;
        private Long selectedAlternativeId;
        private Integer timeSpentSeconds;
    }
}
