package github.felkng.olha_minha_questao.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryPerformanceDTO {
    private Long id;
    private String name;
    private long totalQuestions;
    private long correctAnswers;
    private double accuracyPercentage;
}
