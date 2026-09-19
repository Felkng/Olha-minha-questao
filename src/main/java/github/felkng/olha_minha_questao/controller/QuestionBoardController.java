package github.felkng.olha_minha_questao.controller;

import github.felkng.olha_minha_questao.dto.board.QuestionBoardRequestDTO;
import github.felkng.olha_minha_questao.dto.board.QuestionBoardResponseDTO;
import github.felkng.olha_minha_questao.service.QuestionBoardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/questions/{questionId}/board")
@RequiredArgsConstructor
public class QuestionBoardController {

    private final QuestionBoardService questionBoardService;

    @GetMapping
    public ResponseEntity<QuestionBoardResponseDTO> getBoard(
            @PathVariable Long questionId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        QuestionBoardResponseDTO dto = questionBoardService.getBoard(questionId, userId);
        return ResponseEntity.ok(dto);
    }

    @PutMapping
    public ResponseEntity<QuestionBoardResponseDTO> saveBoard(
            @PathVariable Long questionId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @Valid @RequestBody QuestionBoardRequestDTO requestDTO) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        QuestionBoardResponseDTO dto = questionBoardService.saveBoard(questionId, userId, requestDTO);
        return ResponseEntity.ok(dto);
    }
}
