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
import org.springframework.web.bind.annotation.RequestHeader;
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
    private final github.felkng.olha_minha_questao.service.ExamParserService examParserService;

    @GetMapping
    public ResponseEntity<List<TestResponseDTO>> findAll(
            @RequestParam(required = false) Long originId,
            @RequestParam(required = false) Long areaId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Long createdByUserId) {
        return ResponseEntity.ok(testService.findAll(originId, areaId, year, createdByUserId));
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
            @RequestBody github.felkng.olha_minha_questao.dto.test.TestSubmissionRequestDTO dto,
            @RequestHeader(value = "X-User-Id", required = false) Long userIdHeader) {
        Long userId = dto.getUserId() != null ? dto.getUserId() : userIdHeader;
        return ResponseEntity.ok(statisticsService.submitTestAttempt(id, dto, userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TestResponseDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(testService.findById(id));
    }

    @PostMapping
    public ResponseEntity<TestResponseDTO> create(
            @Valid @RequestBody TestRequestDTO dto,
            @org.springframework.web.bind.annotation.RequestHeader(name = "X-User-Id", required = false) Long userId) {
        TestResponseDTO created = testService.create(dto, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/with-questions")
    public ResponseEntity<TestResponseDTO> createWithQuestions(
            @Valid @RequestBody github.felkng.olha_minha_questao.dto.test.TestWithQuestionsRequestDTO dto,
            @org.springframework.web.bind.annotation.RequestHeader(name = "X-User-Id", required = false) Long userId) {
        TestResponseDTO created = testService.createWithQuestions(dto, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping(value = "/parse-exam-pdf", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<github.felkng.olha_minha_questao.dto.parser.ParsedExamResponseDTO> parseExamPdf(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        return ResponseEntity.ok(examParserService.parseExamPdf(file));
    }

    @PostMapping(value = "/parse-answer-key-pdf", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<github.felkng.olha_minha_questao.dto.parser.ParsedAnswerKeyResponseDTO> parseAnswerKeyPdf(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam(value = "provaName", required = false) String provaName) {
        return ResponseEntity.ok(examParserService.parseAnswerKeyPdf(file, provaName));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TestResponseDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody TestRequestDTO dto,
            @org.springframework.web.bind.annotation.RequestHeader(name = "X-User-Id", required = false) Long userId) {
        return ResponseEntity.ok(testService.update(id, dto, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @org.springframework.web.bind.annotation.RequestHeader(name = "X-User-Id", required = false) Long userId) {
        testService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }
}
