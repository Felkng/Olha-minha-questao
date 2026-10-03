package github.felkng.olha_minha_questao.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.Base64;
import java.util.UUID;

@Service
@Slf4j
public class ImageStorageService {

    private final Path baseStoragePath;

    public ImageStorageService(@Value("${app.storage.images-dir:storage/images}") String imagesDir) {
        this.baseStoragePath = Paths.get(imagesDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.baseStoragePath);
        } catch (IOException e) {
            log.error("Não foi possível criar o diretório de storage de imagens: {}", this.baseStoragePath, e);
            throw new RuntimeException("Falha ao inicializar o diretório de storage de imagens", e);
        }
    }

    public String storeBase64Image(String dataUrlOrBase64) {
        if (dataUrlOrBase64 == null || dataUrlOrBase64.isBlank()) {
            return null;
        }

        // If it's already an existing URL (e.g. /api/v1/images/...), return it
        if (dataUrlOrBase64.startsWith("/api/v1/images/") || dataUrlOrBase64.startsWith("http://") || dataUrlOrBase64.startsWith("https://")) {
            return dataUrlOrBase64;
        }

        String base64Data = dataUrlOrBase64;
        String extension = ".png";
        String contentType = "image/png";

        if (dataUrlOrBase64.startsWith("data:")) {
            int commaIdx = dataUrlOrBase64.indexOf(",");
            if (commaIdx != -1) {
                String meta = dataUrlOrBase64.substring(5, commaIdx);
                if (meta.contains("image/jpeg") || meta.contains("image/jpg")) {
                    extension = ".jpg";
                    contentType = "image/jpeg";
                } else if (meta.contains("image/webp")) {
                    extension = ".webp";
                    contentType = "image/webp";
                } else if (meta.contains("image/svg+xml")) {
                    extension = ".svg";
                    contentType = "image/svg+xml";
                }
                base64Data = dataUrlOrBase64.substring(commaIdx + 1);
            }
        }

        try {
            byte[] imageBytes = Base64.getDecoder().decode(base64Data.trim());
            String fileName = UUID.randomUUID().toString() + extension;
            Path targetPath = baseStoragePath.resolve(fileName).normalize();

            Files.write(targetPath, imageBytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
            return "/api/v1/images/" + fileName;
        } catch (Exception e) {
            log.error("Erro ao decodificar e salvar imagem Base64 no storage", e);
            throw new RuntimeException("Falha ao salvar imagem da questão no storage: " + e.getMessage(), e);
        }
    }

    public byte[] loadImage(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return null;
        }
        // Prevent path traversal
        Path path = baseStoragePath.resolve(Paths.get(fileName).getFileName()).normalize();
        if (!Files.exists(path)) {
            log.warn("Arquivo de imagem não encontrado no storage: {}", path);
            return null;
        }

        try {
            return Files.readAllBytes(path);
        } catch (IOException e) {
            log.error("Erro ao ler arquivo de imagem de: {}", path, e);
            throw new RuntimeException("Erro ao ler imagem do storage", e);
        }
    }

    public String getContentType(String fileName) {
        if (fileName == null) {
            return "application/octet-stream";
        }
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".gif")) return "image/gif";
        return "application/octet-stream";
    }
}
