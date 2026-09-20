package github.felkng.olha_minha_questao.dto.parser;

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
public class ParsedTextualReferenceDTO {
    private String id;
    private String title;
    private String content;
    private String author;
    private String source;
    private String mediaUrl;
}
