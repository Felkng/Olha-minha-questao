package github.felkng.olha_minha_questao.controller;

import github.felkng.olha_minha_questao.dto.statistics.PlatformSummaryDTO;
import github.felkng.olha_minha_questao.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;

    @GetMapping("/summary")
    public ResponseEntity<PlatformSummaryDTO> getPlatformSummary() {
        PlatformSummaryDTO summary = statisticsService.getPlatformSummary();
        return ResponseEntity.ok(summary);
    }
}
