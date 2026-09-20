package github.felkng.olha_minha_questao.dto.question;

import github.felkng.olha_minha_questao.dto.alternative.AlternativeRequestDTO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionRequestDTO {

    @NotBlank(message = "O enunciado da questão é obrigatório")
    private String enunciado;

    @Size(max = 50, message = "O identificador deve ter no máximo 50 caracteres")
    private String identifier;

    @NotNull(message = "O ano da questão é obrigatório")
    @Min(value = 1900, message = "O ano deve ser válido")
    private Integer year;

    private Long originId;

    private Long areaId;

    private Long subjectId;

    private Long testId;

    private Long textualReferenceId;

    private Integer textualReferenceIndex;

    private Long correctAlternativeId;

    @Valid
    @Size(min = 2, message = "A questão deve conter no mínimo 2 alternativas")
    @Builder.Default
    private List<AlternativeRequestDTO> alternatives = new ArrayList<>();
}
