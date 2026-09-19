package github.felkng.olha_minha_questao.dto.area;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
public class AreaRequestDTO {

    @NotBlank(message = "O nome da área é obrigatório")
    @Size(max = 100, message = "O nome da área deve ter no máximo 100 caracteres")
    private String name;

    private String description;
}
