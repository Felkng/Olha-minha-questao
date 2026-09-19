package github.felkng.olha_minha_questao.controller;

import github.felkng.olha_minha_questao.dto.question.QuestionAttemptRequestDTO;
import github.felkng.olha_minha_questao.dto.question.QuestionAttemptResponseDTO;
import github.felkng.olha_minha_questao.dto.question.QuestionRequestDTO;
import github.felkng.olha_minha_questao.dto.question.QuestionResponseDTO;
import github.felkng.olha_minha_questao.service.QuestionService;
import github.felkng.olha_minha_questao.service.StatisticsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
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
@RequestMapping("/api/v1/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;
    private final StatisticsService statisticsService;
    private final github.felkng.olha_minha_questao.domain.repository.QuestionAttemptRepository questionAttemptRepository;

    @GetMapping
    public ResponseEntity<Page<QuestionResponseDTO>> findAll(
            @RequestParam(required = false) Long originId,
            @RequestParam(required = false) Long areaId,
            @RequestParam(required = false) Long testId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sort,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(questionService.findAll(originId, areaId, testId, year, difficulty, search, sort, pageable));
    }

    @PostMapping("/{id}/attempts")
    public ResponseEntity<QuestionAttemptResponseDTO> registerAttempt(
            @PathVariable Long id,
            @RequestBody QuestionAttemptRequestDTO dto,
            @RequestHeader(value = "X-User-Id", required = false) Long userIdHeader) {
        if (dto.getUserId() == null && userIdHeader != null) {
            dto.setUserId(userIdHeader);
        }
        return ResponseEntity.ok(statisticsService.registerQuestionAttempt(id, dto));
    }

    @GetMapping("/attempted-ids")
    public ResponseEntity<List<Long>> getAttemptedQuestionIds(
            @RequestHeader(value = "X-User-Id", required = false) Long userIdHeader,
            @RequestParam(value = "userId", required = false) Long userIdParam) {
        Long userId = userIdHeader != null ? userIdHeader : userIdParam;
        if (userId == null) {
            return ResponseEntity.ok(List.of());
        }
        List<Long> qIds = questionAttemptRepository.findByUserId(userId).stream()
                .map(qa -> qa.getQuestion().getId())
                .distinct()
                .toList();
        return ResponseEntity.ok(qIds);
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuestionResponseDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(questionService.findById(id));
    }

    @PostMapping
    public ResponseEntity<QuestionResponseDTO> create(
            @Valid @RequestBody QuestionRequestDTO dto,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        QuestionResponseDTO created = questionService.create(dto, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<QuestionResponseDTO> update(@PathVariable Long id, @Valid @RequestBody QuestionRequestDTO dto) {
        return ResponseEntity.ok(questionService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        questionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
