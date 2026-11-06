package github.felkng.olha_minha_questao.dto.parser;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
public class DuplicateQuestionGroupDTO {
    private String identifier;
    private Integer count;
    @Builder.Default
    private List<String> sections = new ArrayList<>();
}
