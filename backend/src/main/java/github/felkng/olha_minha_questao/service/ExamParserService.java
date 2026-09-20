package github.felkng.olha_minha_questao.service;

import github.felkng.olha_minha_questao.dto.parser.ParsedAnswerKeyDTO;
import github.felkng.olha_minha_questao.dto.parser.ParsedQuestionDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.io.IOException;
import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class ExamParserService {

    private final RestClient restClient;

    public ExamParserService(@Value("${app.pdf-worker.url:http://localhost:8001}") String workerUrl) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout((int) Duration.ofSeconds(10).toMillis());
        factory.setReadTimeout((int) Duration.ofSeconds(120).toMillis());

        this.restClient = RestClient.builder()
                .baseUrl(workerUrl)
                .requestFactory(factory)
                .build();
    }

    public github.felkng.olha_minha_questao.dto.parser.ParsedExamResponseDTO parseExamPdf(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Arquivo PDF não fornecido ou vazio.");
        }

        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename() != null ? file.getOriginalFilename() : "prova.pdf";
                }
            };
            body.add("file", resource);

            github.felkng.olha_minha_questao.dto.parser.ParsedExamResponseDTO response = restClient.post()
                    .uri("/parse-exam-pdf")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(github.felkng.olha_minha_questao.dto.parser.ParsedExamResponseDTO.class);

            if (response != null) {
                return response;
            }
            return new github.felkng.olha_minha_questao.dto.parser.ParsedExamResponseDTO();
        } catch (IOException e) {
            log.error("Erro ao ler bytes do arquivo PDF da prova", e);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Erro ao processar o arquivo PDF enviado.");
        } catch (Exception e) {
            log.error("Erro ao comunicar com o worker de PDF para prova", e);
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Falha na extração do PDF da prova via Worker: " + e.getMessage());
        }
    }

    public github.felkng.olha_minha_questao.dto.parser.ParsedAnswerKeyResponseDTO parseAnswerKeyPdf(MultipartFile file) {
        return parseAnswerKeyPdf(file, null);
    }

    public github.felkng.olha_minha_questao.dto.parser.ParsedAnswerKeyResponseDTO parseAnswerKeyPdf(MultipartFile file, String provaName) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Arquivo PDF de gabarito não fornecido ou vazio.");
        }

        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename() != null ? file.getOriginalFilename() : "gabarito.pdf";
                }
            };
            body.add("file", resource);

            String uri = "/parse-answer-key-pdf";
            if (provaName != null && !provaName.isBlank()) {
                uri += "?prova_name=" + java.net.URLEncoder.encode(provaName, java.nio.charset.StandardCharsets.UTF_8);
            }

            github.felkng.olha_minha_questao.dto.parser.ParsedAnswerKeyResponseDTO response = restClient.post()
                    .uri(uri)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(github.felkng.olha_minha_questao.dto.parser.ParsedAnswerKeyResponseDTO.class);

            if (response != null) {
                return response;
            }
            return new github.felkng.olha_minha_questao.dto.parser.ParsedAnswerKeyResponseDTO();
        } catch (IOException e) {
            log.error("Erro ao ler bytes do arquivo PDF do gabarito", e);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Erro ao processar o arquivo PDF do gabarito.");
        } catch (Exception e) {
            log.error("Erro ao comunicar com o worker de PDF para gabarito", e);
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Falha na extração do PDF do gabarito via Worker: " + e.getMessage());
        }
    }
}
