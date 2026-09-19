package github.felkng.olha_minha_questao.service;

import github.felkng.olha_minha_questao.dto.origin.OriginRequestDTO;
import github.felkng.olha_minha_questao.dto.origin.OriginResponseDTO;
import github.felkng.olha_minha_questao.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class OriginServiceTest {

    @Autowired
    private OriginService originService;

    @Autowired
    private EntityManager entityManager;

    @Test
    @DisplayName("Deve criar uma origem com sucesso e buscar por ID")
    void testCreateAndFindById() {
        OriginRequestDTO request = OriginRequestDTO.builder()
                .name("ENEM_TEST")
                .description("Exame Nacional do Ensino Médio")
                .build();

        OriginResponseDTO created = originService.create(request);
        entityManager.flush();

        assertThat(created.getId()).isNotNull();
        assertThat(created.getName()).isEqualTo("ENEM_TEST");
        assertThat(created.getDescription()).isEqualTo("Exame Nacional do Ensino Médio");

        OriginResponseDTO found = originService.findById(created.getId());
        assertThat(found.getName()).isEqualTo("ENEM_TEST");
    }

    @Test
    @DisplayName("Deve lançar exceção ao tentar criar origem com nome duplicado")
    void testCreateDuplicateName_ThrowsException() {
        OriginRequestDTO request1 = OriginRequestDTO.builder()
                .name("FUVEST_TEST")
                .description("Vestibular USP")
                .build();
        originService.create(request1);
        entityManager.flush();

        OriginRequestDTO request2 = OriginRequestDTO.builder()
                .name("fuvest_test") // teste case-insensitive
                .description("Outra descrição")
                .build();

        assertThatThrownBy(() -> originService.create(request2))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Já existe uma origem cadastrada com o nome: fuvest_test");
    }

    @Test
    @DisplayName("Deve atualizar uma origem com sucesso")
    void testUpdate() {
        OriginResponseDTO created = originService.create(OriginRequestDTO.builder()
                .name("UNICAMP_TEST")
                .description("Vestibular Unicamp")
                .build());
        entityManager.flush();

        OriginRequestDTO updateRequest = OriginRequestDTO.builder()
                .name("UNICAMP_TEST - Oficial")
                .description("Vestibular Unicamp Atualizado")
                .build();

        OriginResponseDTO updated = originService.update(created.getId(), updateRequest);
        entityManager.flush();

        assertThat(updated.getName()).isEqualTo("UNICAMP_TEST - Oficial");
        assertThat(updated.getDescription()).isEqualTo("Vestibular Unicamp Atualizado");
    }

    @Test
    @DisplayName("Deve deletar uma origem com sucesso")
    void testDelete() {
        OriginResponseDTO created = originService.create(OriginRequestDTO.builder()
                .name("ITA_TEST")
                .description("Instituto Tecnológico de Aeronáutica")
                .build());
        entityManager.flush();

        originService.delete(created.getId());
        entityManager.flush();

        assertThatThrownBy(() -> originService.findById(created.getId()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Deve listar todas as origens")
    void testFindAll() {
        originService.create(OriginRequestDTO.builder().name("ORIGIN_A").build());
        originService.create(OriginRequestDTO.builder().name("ORIGIN_B").build());
        entityManager.flush();

        List<OriginResponseDTO> list = originService.findAll();
        assertThat(list).hasSizeGreaterThanOrEqualTo(2);
    }
}
