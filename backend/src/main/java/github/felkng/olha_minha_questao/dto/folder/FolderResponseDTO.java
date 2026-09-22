package github.felkng.olha_minha_questao.dto.folder;

import github.felkng.olha_minha_questao.domain.entity.FolderType;
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
public class FolderResponseDTO {
    private Long id;
    private String name;
    private String description;
    private String color;
    private FolderType folderType;
    private Boolean isPublic;
    private long questionCount;
    private long testCount;
    private long flashcardCount;
    private UserSummaryDTO createdByUser;
    private Instant createdAt;
    private Instant updatedAt;
}
