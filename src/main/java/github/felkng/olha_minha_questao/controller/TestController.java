package github.felkng.olha_minha_questao.controller;

import github.felkng.olha_minha_questao.dto.test.TestRequestDTO;
import github.felkng.olha_minha_questao.dto.test.TestResponseDTO;
import github.felkng.olha_minha_questao.service.TestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tests")
@RequiredArgsConstructor
public class TestController {

    private final TestService testService;
    private final github.felkng.olha_minha_questao.service.StatisticsService statisticsService;

    @GetMapping
    public ResponseEntity<List<TestResponseDTO>> findAll(
            @RequestParam(required = false) Long originId,
            @RequestParam(required = false) Long areaId,
            @RequestParam(required = false) Integer year) {
        return ResponseEntity.ok(testService.findAll(originId, areaId, year));
    }

    @GetMapping("/cards")
    public ResponseEntity<List<github.felkng.olha_minha_questao.dto.test.TestCardDTO>> findTestCards() {
        return ResponseEntity.ok(testService.findTestCards());
    }

    @GetMapping("/{id}/evaluation")
    public ResponseEntity<github.felkng.olha_minha_questao.dto.test.TestEvaluationDTO> getTestEvaluation(@PathVariable Long id) {
        return ResponseEntity.ok(testService.getTestEvaluation(id));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<github.felkng.olha_minha_questao.dto.test.TestSubmissionResponseDTO> submitTest(
            @PathVariable Long id,
            @RequestBody github.felkng.olha_minha_questao.dto.test.TestSubmissionRequestDTO dto) {
        return ResponseEntity.ok(statisticsService.submitTestAttempt(id, dto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TestResponseDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(testService.findById(id));
    }

    @PostMapping
    public ResponseEntity<TestResponseDTO> create(@Valid @RequestBody TestRequestDTO dto) {
        TestResponseDTO created = testService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TestResponseDTO> update(@PathVariable Long id, @Valid @RequestBody TestRequestDTO dto) {
        return ResponseEntity.ok(testService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        testService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
