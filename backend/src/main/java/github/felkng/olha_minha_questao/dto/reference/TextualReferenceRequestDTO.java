package github.felkng.olha_minha_questao.dto.reference;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
public class TextualReferenceRequestDTO {

    private Long id;

    @Size(max = 255, message = "O título deve ter no máximo 255 caracteres")
    private String title;

    @Size(max = 500, message = "O subtítulo deve ter no máximo 500 caracteres")
    private String subtitle;

    private String content;

    @Size(max = 255, message = "O autor deve ter no máximo 255 caracteres")
    private String author;

    @Size(max = 1000, message = "A referência deve ter no máximo 1000 caracteres")
    private String reference;

    @Size(max = 1000, message = "A legenda deve ter no máximo 1000 caracteres")
    private String caption;

    @Size(max = 500, message = "A fonte deve ter no máximo 500 caracteres")
    private String source;

    @Size(max = 1000, message = "A URL de mídia deve ter no máximo 1000 caracteres")
    private String mediaUrl;

    private Long testId;

    private String clientKey;
}
