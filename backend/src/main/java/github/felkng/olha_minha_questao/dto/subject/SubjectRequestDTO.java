package github.felkng.olha_minha_questao.dto.subject;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubjectRequestDTO {

    @NotBlank(message = "O nome da matéria é obrigatório")
    @Size(max = 100, message = "O nome da matéria deve ter no máximo 100 caracteres")
    private String name;

    private String description;

    @NotNull(message = "O ID da área é obrigatório")
    private Long areaId;
}
