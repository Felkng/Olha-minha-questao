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
    private Long areaId;
    private String areaName;
    private Long subjectId;
    private String subjectName;
    private Integer totalCards;
    private Integer correctCount;
    private Integer wrongCount;
    private Integer skippedCount;
    private Integer timeSpentSeconds;
    private Double accuracyPercentage;
    private Boolean completed;
    private List<Long> cardIds;
    private Instant createdAt;
    private Instant updatedAt;
    @Builder.Default
    private List<FlashcardSessionItemDTO> items = new ArrayList<>();
}
