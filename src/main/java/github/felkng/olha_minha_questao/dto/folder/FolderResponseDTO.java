package github.felkng.olha_minha_questao.dto.folder;

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
    private long questionCount;
    private Instant createdAt;
    private Instant updatedAt;
}
