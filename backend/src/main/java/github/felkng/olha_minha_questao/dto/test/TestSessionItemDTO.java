package github.felkng.olha_minha_questao.dto.test;

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
public class TestSessionItemDTO {
    private Long id;
    private Long questionId;
    private Long selectedAlternativeId;
    private Integer timeSpentSeconds;
}
