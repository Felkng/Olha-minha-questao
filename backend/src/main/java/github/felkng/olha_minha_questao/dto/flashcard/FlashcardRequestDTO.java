package github.felkng.olha_minha_questao.dto.flashcard;

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
public class FlashcardRequestDTO {

    @NotBlank(message = "A frente (pergunta/conceito) do flashcard é obrigatória")
    private String front;

    @NotBlank(message = "O verso (resposta/explicação) do flashcard é obrigatório")
    private String back;

    private Long areaId;

    private Long subjectId;

    private Long folderId;

    @Builder.Default
    private Boolean isPublic = true;
}
