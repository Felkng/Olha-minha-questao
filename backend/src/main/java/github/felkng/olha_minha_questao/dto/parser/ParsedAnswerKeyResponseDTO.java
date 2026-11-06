package github.felkng.olha_minha_questao.dto.parser;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class ParsedAnswerKeyResponseDTO {

    @Builder.Default
    private List<ParsedAnswerKeyDTO> answers = new ArrayList<>();

    @Builder.Default
    private List<AvailableProvaDTO> availableProvas = new ArrayList<>();

    @Builder.Default
    private Map<String, List<ParsedAnswerKeyDTO>> sectionAnswers = new LinkedHashMap<>();

    private String selectedProva;
}
