package github.felkng.olha_minha_questao.dto.question;

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
public class QuestionSessionRequestDTO {
    private Long folderId;
    private Long originId;
    private Long areaId;
    private Long subjectId;
    private String title;
    private Integer totalQuestions;
    private Integer timeSpentSeconds;
    private Boolean completed;
    private List<Long> questionIds;
    private List<QuestionSessionItemDTO> items;
}
