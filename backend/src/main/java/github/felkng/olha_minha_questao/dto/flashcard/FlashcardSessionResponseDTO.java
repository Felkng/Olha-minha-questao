package github.felkng.olha_minha_questao.dto.flashcard;

import github.felkng.olha_minha_questao.dto.user.UserSummaryDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlashcardSessionResponseDTO {
    private Long id;
    private UserSummaryDTO user;
    private Long folderId;
    private String folderName;
    private Integer totalCards;
    private Integer correctCount;
    private Integer wrongCount;
    private Integer skippedCount;
    private Double accuracyPercentage;
    private Instant createdAt;
    @Builder.Default
    private List<FlashcardSessionItemDTO> items = new ArrayList<>();
}
