package github.felkng.olha_minha_questao.dto.flashcard;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlashcardSessionRequestDTO {
    private Long folderId;

    @Valid
    @NotEmpty(message = "A sessão deve conter ao menos um item praticado")
    @Builder.Default
    private List<FlashcardSessionItemDTO> items = new ArrayList<>();
}
