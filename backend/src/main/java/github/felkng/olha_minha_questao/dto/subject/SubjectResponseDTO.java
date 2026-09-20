package github.felkng.olha_minha_questao.dto.subject;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubjectResponseDTO {
    private Long id;
    private String name;
    private String description;
    private Long areaId;
    private String areaName;
    private Instant createdAt;
    private Instant updatedAt;
}
