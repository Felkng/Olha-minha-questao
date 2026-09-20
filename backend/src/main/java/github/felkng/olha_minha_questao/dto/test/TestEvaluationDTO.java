package github.felkng.olha_minha_questao.dto.test;

import github.felkng.olha_minha_questao.dto.question.QuestionResponseDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestEvaluationDTO {
    private Long id;
    private String name;
    private Integer year;
    private Long originId;
    private String originName;
    private Long areaId;
    private String areaName;
    private Integer questionCount;
    private List<QuestionResponseDTO> questions;
}
