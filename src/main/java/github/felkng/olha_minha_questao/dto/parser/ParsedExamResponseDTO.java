package github.felkng.olha_minha_questao.dto.parser;

import github.felkng.olha_minha_questao.dto.reference.TextualReferenceResponseDTO;
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
public class ParsedExamResponseDTO {

    @Builder.Default
    private List<ParsedQuestionDTO> questions = new ArrayList<>();

    @Builder.Default
    private List<ParsedTextualReferenceDTO> textualReferences = new ArrayList<>();

    private String detectedTitle;
}
