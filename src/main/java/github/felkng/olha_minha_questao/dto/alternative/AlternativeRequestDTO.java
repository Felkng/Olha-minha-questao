package github.felkng.olha_minha_questao.dto.alternative;

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
public class AlternativeRequestDTO {

    @NotBlank(message = "O identificador da alternativa é obrigatório (ex: A, B, C...)")
    @Size(max = 10, message = "O identificador deve ter no máximo 10 caracteres")
    private String identifier;

    @NotBlank(message = "O texto da alternativa é obrigatório")
    private String text;

    @Builder.Default
    private Boolean isCorrect = false;
}
