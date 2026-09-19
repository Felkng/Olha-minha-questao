package github.felkng.olha_minha_questao.service;

import github.felkng.olha_minha_questao.dto.area.AreaRequestDTO;
import github.felkng.olha_minha_questao.dto.area.AreaResponseDTO;
import github.felkng.olha_minha_questao.dto.origin.OriginRequestDTO;
import github.felkng.olha_minha_questao.dto.origin.OriginResponseDTO;
import github.felkng.olha_minha_questao.dto.test.TestRequestDTO;
import github.felkng.olha_minha_questao.dto.test.TestResponseDTO;
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
class TestServiceTest {

    @Autowired
    private TestService testService;

    @Autowired
    private OriginService originService;

    @Autowired
    private AreaService areaService;

    @Autowired
    private EntityManager entityManager;

    @Test
    @DisplayName("Deve criar uma prova com sucesso e buscar por ID")
    void testCreateAndFindById() {
        OriginResponseDTO origin = originService.create(OriginRequestDTO.builder().name("ENEM_TS_TEST").build());
        AreaResponseDTO area = areaService.create(AreaRequestDTO.builder().name("Ciências Humanas_TS_TEST").build());
        entityManager.flush();

        TestRequestDTO request = TestRequestDTO.builder()
                .name("ENEM 2024 - Caderno Branco")
                .year(2024)
                .originId(origin.getId())
                .areaId(area.getId())
                .build();

        TestResponseDTO created = testService.create(request);
        entityManager.flush();

        assertThat(created.getId()).isNotNull();
        assertThat(created.getName()).isEqualTo("ENEM 2024 - Caderno Branco");
        assertThat(created.getOriginName()).isEqualTo("ENEM_TS_TEST");
        assertThat(created.getAreaName()).isEqualTo("Ciências Humanas_TS_TEST");

        TestResponseDTO found = testService.findById(created.getId());
        assertThat(found.getName()).isEqualTo("ENEM 2024 - Caderno Branco");
    }

    @Test
    @DisplayName("Deve lançar exceção ao criar prova com origem inexistente")
    void testCreateWithInvalidOrigin_ThrowsException() {
        TestRequestDTO request = TestRequestDTO.builder()
                .name("Prova Inexistente")
                .year(2024)
                .originId(99999L)
                .build();

        assertThatThrownBy(() -> testService.create(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Origem não encontrada");
    }

    @Test
    @DisplayName("Deve buscar provas por filtros de ano, origem e área")
    void testFindByFilters() {
        OriginResponseDTO origin = originService.create(OriginRequestDTO.builder().name("FUVEST_TS_TEST").build());
        AreaResponseDTO area = areaService.create(AreaRequestDTO.builder().name("Exatas_TS_TEST").build());

        testService.create(TestRequestDTO.builder().name("FUVEST 2023").year(2023).originId(origin.getId()).areaId(area.getId()).build());
        testService.create(TestRequestDTO.builder().name("FUVEST 2024").year(2024).originId(origin.getId()).areaId(area.getId()).build());
        entityManager.flush();

        List<TestResponseDTO> byYear = testService.findAll(origin.getId(), null, 2024);
        assertThat(byYear).isNotEmpty();
        assertThat(byYear).allMatch(t -> t.getYear().equals(2024));

        List<TestResponseDTO> byOrigin = testService.findAll(origin.getId(), null, null);
        assertThat(byOrigin).hasSize(2);
    }

    @Test
    @DisplayName("Deve atualizar uma prova com sucesso")
    void testUpdate() {
        OriginResponseDTO origin = originService.create(OriginRequestDTO.builder().name("UNICAMP_TS_TEST").build());
        TestResponseDTO created = testService.create(TestRequestDTO.builder()
                .name("UNICAMP 2023")
                .year(2023)
                .originId(origin.getId())
                .build());
        entityManager.flush();

        TestRequestDTO updateRequest = TestRequestDTO.builder()
                .name("UNICAMP 2023 - 2ª Fase")
                .year(2023)
                .originId(origin.getId())
                .build();

        TestResponseDTO updated = testService.update(created.getId(), updateRequest);
        entityManager.flush();

        assertThat(updated.getName()).isEqualTo("UNICAMP 2023 - 2ª Fase");
    }

    @Test
    @DisplayName("Deve deletar uma prova com sucesso")
    void testDelete() {
        OriginResponseDTO origin = originService.create(OriginRequestDTO.builder().name("ITA_TS_TEST").build());
        TestResponseDTO created = testService.create(TestRequestDTO.builder()
                .name("ITA 2024")
                .year(2024)
                .originId(origin.getId())
                .build());
        entityManager.flush();

        testService.delete(created.getId());
        entityManager.flush();

        assertThatThrownBy(() -> testService.findById(created.getId()))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
