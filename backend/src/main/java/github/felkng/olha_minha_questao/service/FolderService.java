package github.felkng.olha_minha_questao.service;

import github.felkng.olha_minha_questao.domain.entity.Folder;
import github.felkng.olha_minha_questao.domain.entity.FolderType;
import github.felkng.olha_minha_questao.domain.entity.Question;
import github.felkng.olha_minha_questao.domain.entity.SavedQuestion;
import github.felkng.olha_minha_questao.domain.entity.SavedTest;
import github.felkng.olha_minha_questao.domain.entity.Test;
import github.felkng.olha_minha_questao.domain.repository.FolderRepository;
import github.felkng.olha_minha_questao.domain.repository.QuestionRepository;
import github.felkng.olha_minha_questao.domain.repository.SavedQuestionRepository;
import github.felkng.olha_minha_questao.domain.repository.SavedTestRepository;
import github.felkng.olha_minha_questao.domain.repository.TestRepository;
import github.felkng.olha_minha_questao.dto.folder.FolderRequestDTO;
import github.felkng.olha_minha_questao.dto.folder.FolderResponseDTO;
import github.felkng.olha_minha_questao.dto.folder.SavedQuestionResponseDTO;
import github.felkng.olha_minha_questao.dto.question.QuestionResponseDTO;
import github.felkng.olha_minha_questao.dto.test.TestResponseDTO;
import github.felkng.olha_minha_questao.exception.ResourceNotFoundException;
import github.felkng.olha_minha_questao.mapper.FolderMapper;
import github.felkng.olha_minha_questao.mapper.QuestionMapper;
import github.felkng.olha_minha_questao.mapper.SavedQuestionMapper;
import github.felkng.olha_minha_questao.mapper.TestMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FolderService {

    private final FolderRepository folderRepository;
    private final QuestionRepository questionRepository;
    private final TestRepository testRepository;
    private final SavedQuestionRepository savedQuestionRepository;
    private final SavedTestRepository savedTestRepository;
    private final github.felkng.olha_minha_questao.domain.repository.UserRepository userRepository;
    private final FolderMapper folderMapper;
    private final QuestionMapper questionMapper;
    private final TestMapper testMapper;
    private final SavedQuestionMapper savedQuestionMapper;

    private final github.felkng.olha_minha_questao.domain.repository.FlashcardRepository flashcardRepository;
    private final github.felkng.olha_minha_questao.mapper.FlashcardMapper flashcardMapper;

    @Transactional(readOnly = true)
    public List<FolderResponseDTO> findAll(FolderType type) {
        return findAll(type, null, null);
    }

    @Transactional(readOnly = true)
    public List<FolderResponseDTO> findAll(FolderType type, Long createdByUserId) {
        return findAll(type, createdByUserId, null);
    }

    @Transactional(readOnly = true)
    public List<FolderResponseDTO> findAll(FolderType type, Long createdByUserId, Long currentUserId) {
        List<Folder> folders;
        if (createdByUserId != null) {
            if (type != null) {
                folders = folderRepository.findByCreatedByUserIdAndFolderTypeOrderByNameAsc(createdByUserId, type);
            } else {
                folders = folderRepository.findByCreatedByUserIdOrderByNameAsc(createdByUserId);
            }
        } else {
            if (type != null) {
                folders = folderRepository.findByFolderTypeOrderByNameAsc(type);
            } else {
                folders = folderRepository.findAllByOrderByNameAsc();
            }
        }

        return folders.stream()
                .filter(f -> {
                    if (createdByUserId != null && createdByUserId.equals(currentUserId)) {
                        return true;
                    }
                    return Boolean.TRUE.equals(f.getIsPublic()) || (currentUserId != null && f.getCreatedByUser() != null && f.getCreatedByUser().getId().equals(currentUserId));
                })
                .map(this::toDTOWithCounts)
                .toList();
    }

    private FolderResponseDTO toDTOWithCounts(Folder folder) {
        FolderResponseDTO dto = folderMapper.toDTO(folder);
        if (folder != null && folder.getId() != null) {
            dto.setFlashcardCount(flashcardRepository.countByFolderId(folder.getId()));
        }
        return dto;
    }

    @Transactional(readOnly = true)
    public FolderResponseDTO findById(Long id) {
        Folder folder = folderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pasta não encontrada com o id: " + id));
        return toDTOWithCounts(folder);
    }

    @Transactional
    public FolderResponseDTO create(FolderRequestDTO dto) {
        return create(dto, null);
    }

    @Transactional
    public FolderResponseDTO create(FolderRequestDTO dto, Long userId) {
        github.felkng.olha_minha_questao.domain.entity.User user = null;
        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
        }

        Folder folder = folderMapper.toEntity(dto);
        folder.setCreatedByUser(user);
        if (folder.getColor() == null || folder.getColor().isBlank()) {
            folder.setColor("#d9b763");
        }
        if (folder.getFolderType() == null) {
            folder.setFolderType(FolderType.QUESTION);
        }
        if (dto.getIsPublic() != null) {
            folder.setIsPublic(dto.getIsPublic());
        }
        Folder saved = folderRepository.save(folder);
        return toDTOWithCounts(saved);
    }

    @Transactional
    public FolderResponseDTO update(Long id, FolderRequestDTO dto) {
        return update(id, dto, null);
    }

    @Transactional
    public FolderResponseDTO update(Long id, FolderRequestDTO dto, Long userId) {
        Folder folder = folderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pasta não encontrada com o id: " + id));

        if (userId != null) {
            github.felkng.olha_minha_questao.domain.entity.User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o id: " + userId));
            if (user.getRole() != github.felkng.olha_minha_questao.domain.entity.UserRole.ADMIN) {
                if (folder.getCreatedByUser() == null || !folder.getCreatedByUser().getId().equals(user.getId())) {
                    throw new org.springframework.web.server.ResponseStatusException(
                            org.springframework.http.HttpStatus.FORBIDDEN,
                            "Você não tem permissão para editar esta pasta.");
                }
            }
        }

        folderMapper.updateEntityFromDTO(dto, folder);
        if (dto.getIsPublic() != null) {
            folder.setIsPublic(dto.getIsPublic());
        }
        Folder updated = folderRepository.save(folder);
        return toDTOWithCounts(updated);
    }

    @Transactional
    public FolderResponseDTO toggleVisibility(Long id, Long userId) {
        Folder folder = folderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pasta não encontrada com o id: " + id));

        if (userId != null) {
            github.felkng.olha_minha_questao.domain.entity.User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o id: " + userId));
            if (user.getRole() != github.felkng.olha_minha_questao.domain.entity.UserRole.ADMIN) {
                if (folder.getCreatedByUser() == null || !folder.getCreatedByUser().getId().equals(user.getId())) {
                    throw new org.springframework.web.server.ResponseStatusException(
                            org.springframework.http.HttpStatus.FORBIDDEN,
                            "Você não tem permissão para alterar a visibilidade desta pasta.");
                }
            }
        }

        folder.setIsPublic(!Boolean.TRUE.equals(folder.getIsPublic()));
        Folder updated = folderRepository.save(folder);
        return toDTOWithCounts(updated);
    }

    @Transactional
    public void delete(Long id) {
        delete(id, null);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        Folder folder = folderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pasta não encontrada com o id: " + id));

        if (userId != null) {
            github.felkng.olha_minha_questao.domain.entity.User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o id: " + userId));
            if (user.getRole() == github.felkng.olha_minha_questao.domain.entity.UserRole.ADMIN) {
                // Admin pode excluir se for público ou criado por ele mesmo
                if (!Boolean.TRUE.equals(folder.getIsPublic()) && (folder.getCreatedByUser() == null || !folder.getCreatedByUser().getId().equals(user.getId()))) {
                    throw new org.springframework.web.server.ResponseStatusException(
                            org.springframework.http.HttpStatus.FORBIDDEN,
                            "Administradores podem moderar apenas conteúdos públicos de terceiros.");
                }
            } else {
                // Usuário comum só pode excluir suas próprias pastas
                if (folder.getCreatedByUser() == null || !folder.getCreatedByUser().getId().equals(user.getId())) {
                    throw new org.springframework.web.server.ResponseStatusException(
                            org.springframework.http.HttpStatus.FORBIDDEN,
                            "Você não tem permissão para excluir esta pasta.");
                }
            }
        }

        folderRepository.delete(folder);
    }

    @Transactional(readOnly = true)
    public List<github.felkng.olha_minha_questao.dto.flashcard.FlashcardResponseDTO> getFlashcardsInFolder(Long folderId) {
        if (!folderRepository.existsById(folderId)) {
            throw new ResourceNotFoundException("Pasta não encontrada com o id: " + folderId);
        }
        return flashcardRepository.findByFolderIdOrderByIdAsc(folderId).stream()
                .map(flashcardMapper::toDTO)
                .toList();
    }

    // ==========================================
    // Questões Salvas em Pastas (Tipo: QUESTION)
    // ==========================================

    @Transactional(readOnly = true)
    public List<QuestionResponseDTO> getQuestionsInFolder(Long folderId) {
        if (!folderRepository.existsById(folderId)) {
            throw new ResourceNotFoundException("Pasta não encontrada com o id: " + folderId);
        }
        return savedQuestionRepository.findByFolderId(folderId).stream()
                .map(sq -> questionMapper.toDTO(sq.getQuestion()))
                .toList();
    }

    @Transactional
    public SavedQuestionResponseDTO addQuestionToFolder(Long folderId, Long questionId, String notes) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new ResourceNotFoundException("Pasta não encontrada com o id: " + folderId));

        if (folder.getFolderType() != FolderType.QUESTION) {
            throw new IllegalArgumentException("Esta pasta é reservada para salvar Provas, não Questões.");
        }

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Questão não encontrada com o id: " + questionId));

        return savedQuestionRepository.findByFolderIdAndQuestionId(folderId, questionId)
                .map(savedQuestionMapper::toDTO)
                .orElseGet(() -> {
                    SavedQuestion sq = SavedQuestion.builder()
                            .folder(folder)
                            .question(question)
                            .notes(notes)
                            .build();
                    SavedQuestion saved = savedQuestionRepository.save(sq);
                    return savedQuestionMapper.toDTO(saved);
                });
    }

    @Transactional
    public void removeQuestionFromFolder(Long folderId, Long questionId) {
        if (!folderRepository.existsById(folderId)) {
            throw new ResourceNotFoundException("Pasta não encontrada com o id: " + folderId);
        }
        if (!questionRepository.existsById(questionId)) {
            throw new ResourceNotFoundException("Questão não encontrada com o id: " + questionId);
        }
        savedQuestionRepository.deleteByFolderIdAndQuestionId(folderId, questionId);
    }

    @Transactional(readOnly = true)
    public List<Long> getFolderIdsForQuestion(Long questionId) {
        return savedQuestionRepository.findByQuestionId(questionId).stream()
                .map(sq -> sq.getFolder().getId())
                .toList();
    }

    // ==========================================
    // Provas Salvas em Pastas (Tipo: TEST)
    // ==========================================

    @Transactional(readOnly = true)
    public List<TestResponseDTO> getTestsInFolder(Long folderId) {
        if (!folderRepository.existsById(folderId)) {
            throw new ResourceNotFoundException("Pasta não encontrada com o id: " + folderId);
        }
        return savedTestRepository.findByFolderId(folderId).stream()
                .map(st -> {
                    TestResponseDTO dto = testMapper.toDTO(st.getTest());
                    if (st.getTest() != null && st.getTest().getId() != null) {
                        dto.setQuestionCount((int) questionRepository.countByTestId(st.getTest().getId()));
                    } else {
                        dto.setQuestionCount(0);
                    }
                    return dto;
                })
                .toList();
    }

    @Transactional
    public void addTestToFolder(Long folderId, Long testId, String notes) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new ResourceNotFoundException("Pasta não encontrada com o id: " + folderId));

        if (folder.getFolderType() != FolderType.TEST) {
            throw new IllegalArgumentException("Esta pasta é reservada para salvar Questões, não Provas.");
        }

        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Prova não encontrada com o id: " + testId));

        if (!savedTestRepository.existsByFolderIdAndTestId(folderId, testId)) {
            SavedTest st = SavedTest.builder()
                    .folder(folder)
                    .test(test)
                    .notes(notes)
                    .build();
            savedTestRepository.save(st);
        }
    }

    @Transactional
    public void removeTestFromFolder(Long folderId, Long testId) {
        if (!folderRepository.existsById(folderId)) {
            throw new ResourceNotFoundException("Pasta não encontrada com o id: " + folderId);
        }
        if (!testRepository.existsById(testId)) {
            throw new ResourceNotFoundException("Prova não encontrada com o id: " + testId);
        }
        savedTestRepository.deleteByFolderIdAndTestId(folderId, testId);
    }

    @Transactional(readOnly = true)
    public List<Long> getFolderIdsForTest(Long testId) {
        return savedTestRepository.findFolderIdsByTestId(testId);
    }
}
