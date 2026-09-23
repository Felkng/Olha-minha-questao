package github.felkng.olha_minha_questao.dto.flashcard;

import github.felkng.olha_minha_questao.dto.user.UserSummaryDTO;
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
public class FlashcardResponseDTO {
    private Long id;
    private String front;
    private String back;
    private Long areaId;
    private String areaName;
    private Long subjectId;
    private String subjectName;
    private Long folderId;
    private String folderName;
    private String folderColor;
    private UserSummaryDTO createdByUser;
    private Boolean isPublic;
    private Instant createdAt;
    private Instant updatedAt;
}
