package github.felkng.olha_minha_questao.controller;

import github.felkng.olha_minha_questao.dto.subject.SubjectRequestDTO;
import github.felkng.olha_minha_questao.dto.subject.SubjectResponseDTO;
import github.felkng.olha_minha_questao.service.SubjectService;
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
@RequestMapping("/api/v1/subjects")
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectService subjectService;

    @GetMapping
    public ResponseEntity<List<SubjectResponseDTO>> findAll() {
        return ResponseEntity.ok(subjectService.findAll());
    }

    @GetMapping("/by-area/{areaId}")
    public ResponseEntity<List<SubjectResponseDTO>> findByAreaId(@PathVariable Long areaId) {
        return ResponseEntity.ok(subjectService.findByAreaId(areaId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SubjectResponseDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(subjectService.findById(id));
    }

    @PostMapping
    public ResponseEntity<SubjectResponseDTO> create(@Valid @RequestBody SubjectRequestDTO dto) {
        SubjectResponseDTO created = subjectService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SubjectResponseDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody SubjectRequestDTO dto,
            @org.springframework.web.bind.annotation.RequestHeader(name = "X-User-Id", required = false) Long userId) {
        return ResponseEntity.ok(subjectService.update(id, dto, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @org.springframework.web.bind.annotation.RequestHeader(name = "X-User-Id", required = false) Long userId) {
        subjectService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }
}
