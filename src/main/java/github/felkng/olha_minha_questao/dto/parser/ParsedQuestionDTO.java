package github.felkng.olha_minha_questao.dto.parser;

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
public class ParsedQuestionDTO {
    private String identifier;
    private String enunciado;
    @Builder.Default
    private List<ParsedAlternativeDTO> alternatives = new ArrayList<>();
}
