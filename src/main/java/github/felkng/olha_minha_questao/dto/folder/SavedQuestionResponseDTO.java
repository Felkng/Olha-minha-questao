package github.felkng.olha_minha_questao.dto.folder;

import github.felkng.olha_minha_questao.dto.question.QuestionResponseDTO;
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
public class SavedQuestionResponseDTO {
    private Long id;
    private Long folderId;
    private String folderName;
    private String folderColor;
    private QuestionResponseDTO question;
    private String notes;
    private Instant createdAt;
}
