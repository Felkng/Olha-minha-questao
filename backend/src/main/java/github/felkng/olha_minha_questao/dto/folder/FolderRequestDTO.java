package github.felkng.olha_minha_questao.dto.folder;

import github.felkng.olha_minha_questao.domain.entity.FolderType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
public class FolderRequestDTO {

    @NotBlank(message = "O nome da pasta é obrigatório")
    @Size(max = 150, message = "O nome da pasta não pode exceder 150 caracteres")
    private String name;

    private String description;

    @Builder.Default
    private String color = "#d9b763";

    @Builder.Default
    private FolderType folderType = FolderType.QUESTION;
}
