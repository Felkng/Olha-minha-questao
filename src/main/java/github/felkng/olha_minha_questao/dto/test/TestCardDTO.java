package github.felkng.olha_minha_questao.dto.test;

import github.felkng.olha_minha_questao.domain.entity.DifficultyLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestCardDTO {
    private Long id;
    private String name;
    private Integer year;
    private Long originId;
    private String originName;
    private Long areaId;
    private String areaName;
    private Integer questionCount;
    private DifficultyLevel difficultyLevel;
    private Double averageScore;
    private Long totalAttempts;
}
