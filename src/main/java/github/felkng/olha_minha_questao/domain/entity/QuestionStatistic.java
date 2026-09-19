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
@Table(name = "question_statistic")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionStatistic {

    @Id
    @Column(name = "question_id")
    private Long questionId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "question_id")
    private Question question;

    @Column(name = "total_attempts", nullable = false)
    @Builder.Default
    private Long totalAttempts = 0L;

    @Column(name = "first_attempts", nullable = false)
    @Builder.Default
    private Long firstAttempts = 0L;

    @Column(name = "first_attempt_correct", nullable = false)
    @Builder.Default
    private Long firstAttemptCorrect = 0L;

    @Column(name = "first_attempt_accuracy", nullable = false)
    @Builder.Default
    private Double firstAttemptAccuracy = 0.0;

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty_level", nullable = false, length = 20)
    @Builder.Default
    private DifficultyLevel difficultyLevel = DifficultyLevel.SEM_DADOS;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
