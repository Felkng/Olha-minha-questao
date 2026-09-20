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

    @Transactional(readOnly = true)
    public List<FolderResponseDTO> findAll(FolderType type) {
        return findAll(type, null);
    }

    @Transactional(readOnly = true)
    public List<FolderResponseDTO> findAll(FolderType type, Long createdByUserId) {
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
                .map(folderMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public FolderResponseDTO findById(Long id) {
        Folder folder = folderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pasta não encontrada com o id: " + id));
        return folderMapper.toDTO(folder);
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
        Folder saved = folderRepository.save(folder);
        return folderMapper.toDTO(saved);
    }

    @Transactional
    public FolderResponseDTO update(Long id, FolderRequestDTO dto) {
        Folder folder = folderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pasta não encontrada com o id: " + id));
        folderMapper.updateEntityFromDTO(dto, folder);
        Folder updated = folderRepository.save(folder);
        return folderMapper.toDTO(updated);
    }

    @Transactional
    public void delete(Long id) {
        if (!folderRepository.existsById(id)) {
            throw new ResourceNotFoundException("Pasta não encontrada com o id: " + id);
        }
        folderRepository.deleteById(id);
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
                .map(st -> testMapper.toDTO(st.getTest()))
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
