package github.felkng.olha_minha_questao.dto.board;

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
public class QuestionBoardResponseDTO {

    private Long id;
    private Long questionId;
    private Long userId;
    private String storagePath;
    private String fileName;
    private String xmlContent;
    private Instant createdAt;
    private Instant updatedAt;
}
