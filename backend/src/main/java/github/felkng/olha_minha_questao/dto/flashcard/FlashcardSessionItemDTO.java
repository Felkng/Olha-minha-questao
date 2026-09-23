package github.felkng.olha_minha_questao.dto.flashcard;

import jakarta.validation.constraints.NotBlank;
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
public class FlashcardSessionItemDTO {
    private Long id;

    @NotNull(message = "O ID do flashcard é obrigatório")
    private Long flashcardId;

    private String flashcardFront;
    private String flashcardBack;

    @NotBlank(message = "O status da carta na sessão é obrigatório (CORRECT, WRONG, SKIPPED)")
    private String status;
}
