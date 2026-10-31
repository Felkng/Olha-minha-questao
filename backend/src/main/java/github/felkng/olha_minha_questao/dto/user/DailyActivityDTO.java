package github.felkng.olha_minha_questao.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyActivityDTO {
    private String date; // YYYY-MM-DD
    private long count; // Total activities combined (questions + flashcards)
    @Builder.Default
    private long questionsCount = 0;
    @Builder.Default
    private long flashcardSessionsCount = 0;
    @Builder.Default
    private long flashcardsCount = 0;
}
