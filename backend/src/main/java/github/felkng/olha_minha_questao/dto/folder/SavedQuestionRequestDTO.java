package github.felkng.olha_minha_questao.dto.folder;

import jakarta.validation.constraints.NotNull;
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
public class SavedQuestionRequestDTO {

    @NotNull(message = "O ID da pasta é obrigatório")
    private Long folderId;

    @NotNull(message = "O ID da questão é obrigatório")
    private Long questionId;

    private String notes;
}
