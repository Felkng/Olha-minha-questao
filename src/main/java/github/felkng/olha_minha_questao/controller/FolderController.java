package github.felkng.olha_minha_questao.controller;

import github.felkng.olha_minha_questao.domain.entity.FolderType;
import github.felkng.olha_minha_questao.dto.folder.FolderRequestDTO;
import github.felkng.olha_minha_questao.dto.folder.FolderResponseDTO;
import github.felkng.olha_minha_questao.dto.folder.SavedQuestionResponseDTO;
import github.felkng.olha_minha_questao.dto.question.QuestionResponseDTO;
import github.felkng.olha_minha_questao.dto.test.TestResponseDTO;
import github.felkng.olha_minha_questao.service.FolderService;
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
@RequestMapping("/api/v1/folders")
@RequiredArgsConstructor
public class FolderController {

    private final FolderService folderService;

    @GetMapping
    public ResponseEntity<List<FolderResponseDTO>> findAll(@RequestParam(required = false) FolderType type) {
        return ResponseEntity.ok(folderService.findAll(type));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FolderResponseDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(folderService.findById(id));
    }

    @PostMapping
    public ResponseEntity<FolderResponseDTO> create(@Valid @RequestBody FolderRequestDTO dto) {
        FolderResponseDTO created = folderService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FolderResponseDTO> update(@PathVariable Long id, @Valid @RequestBody FolderRequestDTO dto) {
        return ResponseEntity.ok(folderService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        folderService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // Questões Salvas
    @GetMapping("/{id}/questions")
    public ResponseEntity<List<QuestionResponseDTO>> getQuestionsInFolder(@PathVariable Long id) {
        return ResponseEntity.ok(folderService.getQuestionsInFolder(id));
    }

    @PostMapping("/{id}/questions/{questionId}")
    public ResponseEntity<SavedQuestionResponseDTO> addQuestionToFolder(
            @PathVariable Long id,
            @PathVariable Long questionId,
            @RequestParam(required = false) String notes) {
        SavedQuestionResponseDTO saved = folderService.addQuestionToFolder(id, questionId, notes);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/{id}/questions/{questionId}")
    public ResponseEntity<Void> removeQuestionFromFolder(
            @PathVariable Long id,
            @PathVariable Long questionId) {
        folderService.removeQuestionFromFolder(id, questionId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/by-question/{questionId}")
    public ResponseEntity<List<Long>> getFolderIdsForQuestion(@PathVariable Long questionId) {
        return ResponseEntity.ok(folderService.getFolderIdsForQuestion(questionId));
    }

    // Provas Salvas
    @GetMapping("/{id}/tests")
    public ResponseEntity<List<TestResponseDTO>> getTestsInFolder(@PathVariable Long id) {
        return ResponseEntity.ok(folderService.getTestsInFolder(id));
    }

    @PostMapping("/{id}/tests/{testId}")
    public ResponseEntity<Void> addTestToFolder(
            @PathVariable Long id,
            @PathVariable Long testId,
            @RequestParam(required = false) String notes) {
        folderService.addTestToFolder(id, testId, notes);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{id}/tests/{testId}")
    public ResponseEntity<Void> removeTestFromFolder(
            @PathVariable Long id,
            @PathVariable Long testId) {
        folderService.removeTestFromFolder(id, testId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/by-test/{testId}")
    public ResponseEntity<List<Long>> getFolderIdsForTest(@PathVariable Long testId) {
        return ResponseEntity.ok(folderService.getFolderIdsForTest(testId));
    }
}
