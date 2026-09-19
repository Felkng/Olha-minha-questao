package github.felkng.olha_minha_questao.service;

import github.felkng.olha_minha_questao.domain.entity.Question;
import github.felkng.olha_minha_questao.domain.entity.QuestionBoard;
import github.felkng.olha_minha_questao.domain.entity.User;
import github.felkng.olha_minha_questao.domain.repository.QuestionBoardRepository;
import github.felkng.olha_minha_questao.domain.repository.QuestionRepository;
import github.felkng.olha_minha_questao.domain.repository.UserRepository;
import github.felkng.olha_minha_questao.dto.board.QuestionBoardRequestDTO;
import github.felkng.olha_minha_questao.dto.board.QuestionBoardResponseDTO;
import github.felkng.olha_minha_questao.exception.ResourceNotFoundException;
import github.felkng.olha_minha_questao.storage.BoardStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuestionBoardService {

    private final QuestionBoardRepository questionBoardRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final BoardStorageService boardStorageService;

    @Transactional(readOnly = true)
    public QuestionBoardResponseDTO getBoard(Long questionId, Long userId) {
        if (userId == null) {
            return QuestionBoardResponseDTO.builder()
                    .questionId(questionId)
                    .userId(null)
                    .xmlContent(null)
                    .build();
        }

        return questionBoardRepository.findByQuestionIdAndUserId(questionId, userId)
                .map(board -> {
                    String xml = boardStorageService.loadBoardXml(board.getStoragePath());
                    return QuestionBoardResponseDTO.builder()
                            .id(board.getId())
                            .questionId(board.getQuestion().getId())
                            .userId(board.getUser().getId())
                            .storagePath(board.getStoragePath())
                            .fileName(board.getFileName())
                            .xmlContent(xml)
                            .createdAt(board.getCreatedAt())
                            .updatedAt(board.getUpdatedAt())
                            .build();
                })
                .orElse(QuestionBoardResponseDTO.builder()
                        .questionId(questionId)
                        .userId(userId)
                        .xmlContent(null)
                        .build());
    }

    @Transactional
    public QuestionBoardResponseDTO saveBoard(Long questionId, Long userId, QuestionBoardRequestDTO dto) {
        if (userId == null) {
            throw new IllegalArgumentException("Usuário deve estar autenticado para salvar a lousa.");
        }

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Questão não encontrada com id: " + questionId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com id: " + userId));

        String storagePath = boardStorageService.storeBoardXml(userId, questionId, dto.getXmlContent());
        String fileName = boardStorageService.getFileName(userId, questionId);

        QuestionBoard board = questionBoardRepository.findByQuestionIdAndUserId(questionId, userId)
                .orElseGet(() -> QuestionBoard.builder()
                        .user(user)
                        .question(question)
                        .build());

        board.setStoragePath(storagePath);
        board.setFileName(fileName);

        QuestionBoard saved = questionBoardRepository.save(board);

        return QuestionBoardResponseDTO.builder()
                .id(saved.getId())
                .questionId(question.getId())
                .userId(user.getId())
                .storagePath(saved.getStoragePath())
                .fileName(saved.getFileName())
                .xmlContent(dto.getXmlContent())
                .createdAt(saved.getCreatedAt())
                .updatedAt(saved.getUpdatedAt())
                .build();
    }
}
