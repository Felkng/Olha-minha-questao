package github.felkng.olha_minha_questao.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "test_statistic")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestStatistic {

    @Id
    @Column(name = "test_id")
    private Long testId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "test_id")
    private Test test;

    @Column(name = "total_attempts", nullable = false)
    @Builder.Default
    private Long totalAttempts = 0L;

    @Column(name = "average_score", nullable = false)
    @Builder.Default
    private Double averageScore = 0.0;

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty_level", nullable = false, length = 20)
    @Builder.Default
    private DifficultyLevel difficultyLevel = DifficultyLevel.SEM_DADOS;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
