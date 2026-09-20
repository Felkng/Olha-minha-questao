package github.felkng.olha_minha_questao.controller;

import github.felkng.olha_minha_questao.dto.area.AreaRequestDTO;
import github.felkng.olha_minha_questao.dto.area.AreaResponseDTO;
import github.felkng.olha_minha_questao.service.AreaService;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/areas")
@RequiredArgsConstructor
public class AreaController {

    private final AreaService areaService;
    private final github.felkng.olha_minha_questao.service.QuestionService questionService;

    @GetMapping
    public ResponseEntity<List<AreaResponseDTO>> findAll() {
        return ResponseEntity.ok(areaService.findAll());
    }

    @GetMapping("/cards")
    public ResponseEntity<List<github.felkng.olha_minha_questao.dto.area.AreaCardDTO>> findAreaCards() {
        return ResponseEntity.ok(areaService.findAreaCards());
    }

    @GetMapping("/{id}/questions")
    public ResponseEntity<org.springframework.data.domain.Page<github.felkng.olha_minha_questao.dto.question.QuestionResponseDTO>> findAreaQuestions(
            @PathVariable Long id,
            @org.springframework.data.web.PageableDefault(size = 20) org.springframework.data.domain.Pageable pageable) {
        return ResponseEntity.ok(questionService.findByAreaOrdered(id, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AreaResponseDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(areaService.findById(id));
    }

    @PostMapping
    public ResponseEntity<AreaResponseDTO> create(@Valid @RequestBody AreaRequestDTO dto) {
        AreaResponseDTO created = areaService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AreaResponseDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody AreaRequestDTO dto,
            @org.springframework.web.bind.annotation.RequestHeader(name = "X-User-Id", required = false) Long userId) {
        return ResponseEntity.ok(areaService.update(id, dto, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @org.springframework.web.bind.annotation.RequestHeader(name = "X-User-Id", required = false) Long userId) {
        areaService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }
}
