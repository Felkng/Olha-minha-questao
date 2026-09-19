package github.felkng.olha_minha_questao.dto.alternative;

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
public class AlternativeResponseDTO {
    private Long id;
    private String identifier;
    private String text;
    private Boolean isCorrect;
}
