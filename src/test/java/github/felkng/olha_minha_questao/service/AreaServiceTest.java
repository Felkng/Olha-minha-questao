package github.felkng.olha_minha_questao.service;

import github.felkng.olha_minha_questao.dto.area.AreaRequestDTO;
import github.felkng.olha_minha_questao.dto.area.AreaResponseDTO;
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
class AreaServiceTest {

    @Autowired
    private AreaService areaService;

    @Autowired
    private EntityManager entityManager;

    @Test
    @DisplayName("Deve criar uma área com sucesso e buscar por ID")
    void testCreateAndFindById() {
        AreaRequestDTO request = AreaRequestDTO.builder()
                .name("Matemática")
                .description("Matemática e suas Tecnologias")
                .build();

        AreaResponseDTO created = areaService.create(request);
        entityManager.flush();

        assertThat(created.getId()).isNotNull();
        assertThat(created.getName()).isEqualTo("Matemática");

        AreaResponseDTO found = areaService.findById(created.getId());
        assertThat(found.getName()).isEqualTo("Matemática");
    }

    @Test
    @DisplayName("Deve lançar exceção ao tentar criar área com nome duplicado")
    void testCreateDuplicateName_ThrowsException() {
        areaService.create(AreaRequestDTO.builder()
                .name("Física")
                .description("Ciências da Natureza")
                .build());
        entityManager.flush();

        AreaRequestDTO duplicate = AreaRequestDTO.builder()
                .name("física") // case-insensitive
                .description("Outra física")
                .build();

        assertThatThrownBy(() -> areaService.create(duplicate))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Já existe uma área cadastrada com o nome: física");
    }

    @Test
    @DisplayName("Deve atualizar uma área com sucesso")
    void testUpdate() {
        AreaResponseDTO created = areaService.create(AreaRequestDTO.builder()
                .name("Química")
                .description("Química Geral")
                .build());
        entityManager.flush();

        AreaRequestDTO updateRequest = AreaRequestDTO.builder()
                .name("Química Orgânica")
                .description("Química Geral e Orgânica")
                .build();

        AreaResponseDTO updated = areaService.update(created.getId(), updateRequest);
        entityManager.flush();

        assertThat(updated.getName()).isEqualTo("Química Orgânica");
        assertThat(updated.getDescription()).isEqualTo("Química Geral e Orgânica");
    }

    @Test
    @DisplayName("Deve deletar uma área com sucesso")
    void testDelete() {
        AreaResponseDTO created = areaService.create(AreaRequestDTO.builder()
                .name("História")
                .description("História do Brasil e Geral")
                .build());
        entityManager.flush();

        areaService.delete(created.getId());
        entityManager.flush();

        assertThatThrownBy(() -> areaService.findById(created.getId()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Deve listar todas as áreas")
    void testFindAll() {
        areaService.create(AreaRequestDTO.builder().name("AREA_1").build());
        areaService.create(AreaRequestDTO.builder().name("AREA_2").build());
        entityManager.flush();

        List<AreaResponseDTO> list = areaService.findAll();
        assertThat(list).hasSizeGreaterThanOrEqualTo(2);
    }
}
