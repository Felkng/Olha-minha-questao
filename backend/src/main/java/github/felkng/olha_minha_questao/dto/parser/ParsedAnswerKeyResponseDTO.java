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
public class ParsedAnswerKeyResponseDTO {

    @Builder.Default
    private List<ParsedAnswerKeyDTO> answers = new ArrayList<>();

    @Builder.Default
    private List<AvailableProvaDTO> availableProvas = new ArrayList<>();

    private String selectedProva;
}
