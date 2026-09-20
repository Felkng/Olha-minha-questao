package github.felkng.olha_minha_questao.dto.reference;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TextualReferenceResponseDTO {

    private Long id;
    private String title;
    private String subtitle;
    private String content;
    private String author;
    private String reference;
    private String caption;
    private String source;
    private String mediaUrl;
    private Long testId;
    private Instant createdAt;
    private Instant updatedAt;
}
