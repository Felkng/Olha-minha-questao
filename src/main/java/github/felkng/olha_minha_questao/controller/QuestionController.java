package github.felkng.olha_minha_questao.controller;

import github.felkng.olha_minha_questao.dto.question.QuestionRequestDTO;
import github.felkng.olha_minha_questao.dto.question.QuestionResponseDTO;
import github.felkng.olha_minha_questao.service.QuestionService;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;
    private final github.felkng.olha_minha_questao.service.StatisticsService statisticsService;

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
    public ResponseEntity<github.felkng.olha_minha_questao.dto.question.QuestionAttemptResponseDTO> registerAttempt(
            @PathVariable Long id,
            @RequestBody github.felkng.olha_minha_questao.dto.question.QuestionAttemptRequestDTO dto) {
        return ResponseEntity.ok(statisticsService.registerQuestionAttempt(id, dto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuestionResponseDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(questionService.findById(id));
    }

    @PostMapping
    public ResponseEntity<QuestionResponseDTO> create(@Valid @RequestBody QuestionRequestDTO dto) {
        QuestionResponseDTO created = questionService.create(dto);
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
