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
    private long count;
}
