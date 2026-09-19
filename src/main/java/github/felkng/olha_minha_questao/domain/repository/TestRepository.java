package github.felkng.olha_minha_questao.domain.repository;

import github.felkng.olha_minha_questao.domain.entity.Test;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestRepository extends JpaRepository<Test, Long> {
    List<Test> findByYear(Integer year);
    List<Test> findByOriginId(Long originId);
    List<Test> findByAreaId(Long areaId);
    List<Test> findByOriginIdAndYear(Long originId, Integer year);
    List<Test> findAllByOrderByYearDescIdDesc();
    long countByOriginId(Long originId);
    long countByAreaId(Long areaId);
}
