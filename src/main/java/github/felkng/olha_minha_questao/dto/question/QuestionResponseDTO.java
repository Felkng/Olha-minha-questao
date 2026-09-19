package github.felkng.olha_minha_questao.dto.question;

import github.felkng.olha_minha_questao.dto.alternative.AlternativeResponseDTO;
import github.felkng.olha_minha_questao.dto.area.AreaResponseDTO;
import github.felkng.olha_minha_questao.dto.origin.OriginResponseDTO;
import github.felkng.olha_minha_questao.dto.test.TestResponseDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionResponseDTO {
    private Long id;
    private String enunciado;
    private String identifier;
    private Integer year;
    private OriginResponseDTO origin;
    private AreaResponseDTO area;
    private TestResponseDTO test;
    @Builder.Default
    private List<AlternativeResponseDTO> alternatives = new ArrayList<>();
    private Long correctAlternativeId;
    private String correctAlternativeIdentifier;
    private Instant createdAt;
    private Instant updatedAt;
}
