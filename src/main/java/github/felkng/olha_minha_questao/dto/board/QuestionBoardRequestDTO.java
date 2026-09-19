package github.felkng.olha_minha_questao.dto.board;

import jakarta.validation.constraints.NotBlank;
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
public class QuestionBoardRequestDTO {

    @NotBlank(message = "O conteúdo XML da lousa não pode ser vazio")
    private String xmlContent;
}
