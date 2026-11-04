package github.felkng.olha_minha_questao.dto.flashcard;

import jakarta.validation.Valid;
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
    private Long areaId;
    private Long subjectId;

    private Integer totalCards;
    private Integer timeSpentSeconds;
    private Boolean completed;
    private List<Long> cardIds;

    @Valid
    @Builder.Default
    private List<FlashcardSessionItemDTO> items = new ArrayList<>();
}
