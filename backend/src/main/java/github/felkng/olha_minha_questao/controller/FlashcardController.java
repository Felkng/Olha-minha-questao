package github.felkng.olha_minha_questao.controller;

import github.felkng.olha_minha_questao.dto.flashcard.FlashcardRequestDTO;
import github.felkng.olha_minha_questao.dto.flashcard.FlashcardResponseDTO;
import github.felkng.olha_minha_questao.dto.flashcard.FlashcardSessionRequestDTO;
import github.felkng.olha_minha_questao.dto.flashcard.FlashcardSessionResponseDTO;
import github.felkng.olha_minha_questao.service.FlashcardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
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
@RequestMapping("/api/v1/flashcards")
@RequiredArgsConstructor
public class FlashcardController {

    private final FlashcardService flashcardService;

    @GetMapping
    public ResponseEntity<Page<FlashcardResponseDTO>> findAll(
            @RequestParam(required = false) Long areaId,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) Long folderId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long createdByUserId,
            @RequestHeader(value = "X-User-Id", required = false) Long currentUserId,
            @PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(flashcardService.findAll(areaId, subjectId, folderId, search, createdByUserId, currentUserId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FlashcardResponseDTO> findById(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long currentUserId) {
        return ResponseEntity.ok(flashcardService.findById(id, currentUserId));
    }

    @PostMapping
    public ResponseEntity<FlashcardResponseDTO> create(
            @Valid @RequestBody FlashcardRequestDTO dto,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        FlashcardResponseDTO created = flashcardService.create(dto, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FlashcardResponseDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody FlashcardRequestDTO dto,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return ResponseEntity.ok(flashcardService.update(id, dto, userId));
    }

    @PatchMapping("/{id}/visibility")
    public ResponseEntity<FlashcardResponseDTO> toggleVisibility(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return ResponseEntity.ok(flashcardService.toggleVisibility(id, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        flashcardService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/sessions")
    public ResponseEntity<FlashcardSessionResponseDTO> saveSession(
            @Valid @RequestBody FlashcardSessionRequestDTO dto,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return ResponseEntity.ok(flashcardService.saveSession(dto, userId));
    }

    @GetMapping("/sessions/my")
    public ResponseEntity<List<FlashcardSessionResponseDTO>> getUserSessions(
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return ResponseEntity.ok(flashcardService.getUserSessions(userId));
    }
}
