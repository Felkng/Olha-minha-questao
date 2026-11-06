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
    private final github.felkng.olha_minha_questao.service.TestSessionService testSessionService;
    private final github.felkng.olha_minha_questao.service.StatisticsService statisticsService;
    private final github.felkng.olha_minha_questao.service.ExamParserService examParserService;

    @GetMapping
    public ResponseEntity<List<TestResponseDTO>> findAll(
            @RequestParam(required = false) Long originId,
            @RequestParam(required = false) Long areaId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Long createdByUserId,
            @RequestHeader(value = "X-User-Id", required = false) Long currentUserId) {
        return ResponseEntity.ok(testService.findAll(originId, areaId, year, createdByUserId, currentUserId));
    }

    @GetMapping("/cards")
    public ResponseEntity<List<github.felkng.olha_minha_questao.dto.test.TestCardDTO>> findTestCards(
            @RequestHeader(value = "X-User-Id", required = false) Long currentUserId) {
        return ResponseEntity.ok(testService.findTestCards(currentUserId));
    }

    @org.springframework.web.bind.annotation.PatchMapping("/{id}/visibility")
    public ResponseEntity<TestResponseDTO> toggleVisibility(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return ResponseEntity.ok(testService.toggleVisibility(id, userId));
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

    @GetMapping("/{id}/attempts")
    public ResponseEntity<List<github.felkng.olha_minha_questao.dto.test.TestAttemptSummaryDTO>> getTestAttempts(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long userIdHeader,
            @RequestParam(required = false) Long userId) {
        Long targetUser = userId != null ? userId : userIdHeader;
        return ResponseEntity.ok(statisticsService.getTestAttempts(id, targetUser));
    }

    @GetMapping("/attempts/{attemptId}")
    public ResponseEntity<github.felkng.olha_minha_questao.dto.test.TestAttemptDetailDTO> getTestAttemptDetail(
            @PathVariable Long attemptId) {
        return ResponseEntity.ok(statisticsService.getTestAttemptDetail(attemptId));
    }

    @GetMapping("/user-attempts/{userId}")
    public ResponseEntity<List<github.felkng.olha_minha_questao.dto.test.TestAttemptSummaryDTO>> getUserTestAttempts(
            @PathVariable Long userId) {
        return ResponseEntity.ok(statisticsService.getUserTestAttempts(userId));
    }

    @GetMapping("/sessions/my")
    public ResponseEntity<List<github.felkng.olha_minha_questao.dto.test.TestSessionResponseDTO>> getMyTestSessions(
            @RequestHeader(value = "X-User-Id") Long userId) {
        return ResponseEntity.ok(testSessionService.getUserSessions(userId));
    }

    @GetMapping("/sessions/user/{targetUserId}")
    public ResponseEntity<List<github.felkng.olha_minha_questao.dto.test.TestSessionResponseDTO>> getUserTestSessions(
            @PathVariable Long targetUserId) {
        return ResponseEntity.ok(testSessionService.getUserSessions(targetUserId));
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<github.felkng.olha_minha_questao.dto.test.TestSessionResponseDTO> getTestSessionById(
            @PathVariable Long sessionId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return ResponseEntity.ok(testSessionService.getSessionById(sessionId, userId));
    }

    @PutMapping("/sessions/{sessionId}")
    public ResponseEntity<github.felkng.olha_minha_questao.dto.test.TestSessionResponseDTO> updateTestSession(
            @PathVariable Long sessionId,
            @RequestBody github.felkng.olha_minha_questao.dto.test.TestSessionRequestDTO dto,
            @RequestHeader(value = "X-User-Id") Long userId) {
        return ResponseEntity.ok(testSessionService.updateSession(sessionId, dto, userId));
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<Void> deleteTestSession(
            @PathVariable Long sessionId,
            @RequestHeader(value = "X-User-Id") Long userId) {
        testSessionService.deleteSession(sessionId, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/sessions")
    public ResponseEntity<github.felkng.olha_minha_questao.dto.test.TestSessionResponseDTO> createOrUpdateTestSession(
            @PathVariable Long id,
            @RequestBody(required = false) github.felkng.olha_minha_questao.dto.test.TestSessionRequestDTO dto,
            @RequestHeader(value = "X-User-Id") Long userId) {
        var result = testSessionService.createOrUpdateSession(id, dto != null ? dto : new github.felkng.olha_minha_questao.dto.test.TestSessionRequestDTO(), userId);
        if (result.isCreated()) {
            return ResponseEntity.status(HttpStatus.CREATED).body(result.getResponse());
        }
        return ResponseEntity.ok(result.getResponse());
    }

    @GetMapping("/{id}/sessions/active")
    public ResponseEntity<github.felkng.olha_minha_questao.dto.test.TestSessionResponseDTO> getActiveTestSession(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return testSessionService.getActiveSession(id, userId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
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
            @org.springframework.web.bind.annotation.RequestParam(required = false, defaultValue = "false") boolean deleteQuestions,
            @org.springframework.web.bind.annotation.RequestHeader(name = "X-User-Id", required = false) Long userId) {
        testService.delete(id, userId, deleteQuestions);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/questions/{questionId}")
    public ResponseEntity<Void> addQuestionToTest(
            @PathVariable Long id,
            @PathVariable Long questionId) {
        testService.addQuestionToTest(id, questionId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{id}/questions/{questionId}")
    public ResponseEntity<Void> removeQuestionFromTest(
            @PathVariable Long id,
            @PathVariable Long questionId) {
        testService.removeQuestionFromTest(id, questionId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/by-question/{questionId}")
    public ResponseEntity<List<Long>> getTestIdsForQuestion(@PathVariable Long questionId) {
        return ResponseEntity.ok(testService.getTestIdsForQuestion(questionId));
    }
}
