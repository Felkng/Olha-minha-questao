package github.felkng.olha_minha_questao.dto.area;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AreaCardDTO {
    private Long id;
    private String name;
    private String description;
    private Long questionCount;
    private Long testCount;
}
