package github.felkng.olha_minha_questao.dto.statistics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformSummaryDTO {
    private long totalQuestions;
    private long totalTests;
    private long totalFlashcards;
    private long activeUsersLast5Days;
    private long totalAttempts;
    private long totalOrigins;
    private long totalAreas;
}
