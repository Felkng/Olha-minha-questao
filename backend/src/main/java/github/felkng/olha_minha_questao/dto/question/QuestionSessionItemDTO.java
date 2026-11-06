package github.felkng.olha_minha_questao.dto.question;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionSessionItemDTO {
    private Long id;
    private Long questionId;
    private String questionIdentifier;
    private String questionEnunciado;
    private Long selectedAlternativeId;
    private String selectedAlternativeIdentifier;
    private String correctAlternativeIdentifier;
    private String areaName;
    private String subjectName;
    private String status;
}
