package github.felkng.olha_minha_questao.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;

@Service
@Slf4j
public class BoardStorageService {

    private final Path baseStoragePath;

    public BoardStorageService(@Value("${app.storage.board-dir:storage/boards}") String boardDir) {
        this.baseStoragePath = Paths.get(boardDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.baseStoragePath);
        } catch (IOException e) {
            log.error("Não foi possível criar o diretório de storage de lousas: {}", this.baseStoragePath, e);
            throw new RuntimeException("Falha ao inicializar o diretório de storage de lousas", e);
        }
    }

    public String storeBoardXml(Long userId, Long questionId, String xmlContent) {
        String fileName = String.format("user_%d_question_%d.xml", userId, questionId);
        Path targetPath = baseStoragePath.resolve(fileName).normalize();

        try {
            Files.createDirectories(targetPath.getParent());
            Files.writeString(
                    targetPath,
                    xmlContent,
                    StandardCharsets.UTF_8,
                    StandardOpenOption.CREATE,
                    StandardOpenOption.TRUNCATE_EXISTING,
                    StandardOpenOption.WRITE
            );
            return targetPath.toString();
        } catch (IOException e) {
            log.error("Erro ao persistir arquivo XML da lousa em: {}", targetPath, e);
            throw new RuntimeException("Erro ao salvar XML da lousa no storage", e);
        }
    }

    public String loadBoardXml(String storagePath) {
        if (storagePath == null || storagePath.isBlank()) {
            return null;
        }
        Path path = Paths.get(storagePath).toAbsolutePath().normalize();
        if (!Files.exists(path)) {
            log.warn("Arquivo de lousa não encontrado no caminho: {}", path);
            return null;
        }

        try {
            return Files.readString(path, StandardCharsets.UTF_8);
        } catch (IOException e) {
            log.error("Erro ao ler arquivo XML da lousa de: {}", path, e);
            throw new RuntimeException("Erro ao ler XML da lousa do storage", e);
        }
    }

    public void deleteBoardXml(String storagePath) {
        if (storagePath == null || storagePath.isBlank()) {
            return;
        }
        try {
            Path path = Paths.get(storagePath).toAbsolutePath().normalize();
            Files.deleteIfExists(path);
        } catch (IOException e) {
            log.warn("Falha ao deletar arquivo de lousa em: {}", storagePath, e);
        }
    }

    public String getFileName(Long userId, Long questionId) {
        return String.format("user_%d_question_%d.xml", userId, questionId);
    }
}
