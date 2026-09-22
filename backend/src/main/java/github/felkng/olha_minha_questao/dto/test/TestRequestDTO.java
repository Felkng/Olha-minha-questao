package github.felkng.olha_minha_questao.dto.test;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class TestRequestDTO {

    @NotBlank(message = "O nome da prova é obrigatório")
    @Size(max = 255, message = "O nome da prova deve ter no máximo 255 caracteres")
    private String name;

    @NotNull(message = "O ano da prova é obrigatório")
    @Min(value = 1900, message = "O ano deve ser válido")
    private Integer year;

    private Long originId;

    private Long areaId;

    @Builder.Default
    private Boolean isPublic = true;
}
