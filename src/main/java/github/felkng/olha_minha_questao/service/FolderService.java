package github.felkng.olha_minha_questao.service;

import github.felkng.olha_minha_questao.domain.entity.Folder;
import github.felkng.olha_minha_questao.domain.entity.Question;
import github.felkng.olha_minha_questao.domain.entity.SavedQuestion;
import github.felkng.olha_minha_questao.domain.repository.FolderRepository;
import github.felkng.olha_minha_questao.domain.repository.QuestionRepository;
import github.felkng.olha_minha_questao.domain.repository.SavedQuestionRepository;
import github.felkng.olha_minha_questao.dto.folder.FolderRequestDTO;
import github.felkng.olha_minha_questao.dto.folder.FolderResponseDTO;
import github.felkng.olha_minha_questao.dto.folder.SavedQuestionResponseDTO;
import github.felkng.olha_minha_questao.dto.question.QuestionResponseDTO;
import github.felkng.olha_minha_questao.exception.ResourceNotFoundException;
import github.felkng.olha_minha_questao.mapper.FolderMapper;
import github.felkng.olha_minha_questao.mapper.QuestionMapper;
import github.felkng.olha_minha_questao.mapper.SavedQuestionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FolderService {

    private final FolderRepository folderRepository;
    private final QuestionRepository questionRepository;
    private final SavedQuestionRepository savedQuestionRepository;
    private final FolderMapper folderMapper;
    private final QuestionMapper questionMapper;
    private final SavedQuestionMapper savedQuestionMapper;

    @Transactional(readOnly = true)
    public List<FolderResponseDTO> findAll() {
        return folderRepository.findAllByOrderByNameAsc().stream()
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
        Folder folder = folderMapper.toEntity(dto);
        if (folder.getColor() == null || folder.getColor().isBlank()) {
            folder.setColor("#d9b763");
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

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Questão não encontrada com o id: " + questionId));

        // Se já existir na pasta, retorna o existente
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
}
