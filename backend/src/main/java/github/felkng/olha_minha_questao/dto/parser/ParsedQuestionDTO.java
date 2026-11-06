package github.felkng.olha_minha_questao.dto.parser;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
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
@JsonIgnoreProperties(ignoreUnknown = true)
public class ParsedQuestionDTO {
    private String identifier;
    private String enunciado;
    private String section;
    private Integer textualReferenceIndex;
    @JsonProperty("isDuplicate")
    private Boolean isDuplicate;
    @Builder.Default
    private List<ParsedAlternativeDTO> alternatives = new ArrayList<>();
    @Builder.Default
    private List<String> images = new ArrayList<>();
}
