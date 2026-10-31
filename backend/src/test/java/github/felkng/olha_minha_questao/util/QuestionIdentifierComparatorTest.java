package github.felkng.olha_minha_questao.util;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class QuestionIdentifierComparatorTest {

    private final QuestionIdentifierComparator comparator = new QuestionIdentifierComparator();

    @Test
    void shouldSortNumericIdentifiersNaturally() {
        List<String> list = new ArrayList<>(List.of("10", "1", "2", "20", "3", "9", "11"));
        list.sort(comparator);
        assertEquals(List.of("1", "2", "3", "9", "10", "11", "20"), list);
    }

    @Test
    void shouldSortRomanNumeralsCorrectly() {
        List<String> list = new ArrayList<>(List.of("X", "I", "II", "IV", "V", "IX", "III"));
        list.sort(comparator);
        assertEquals(List.of("I", "II", "III", "IV", "V", "IX", "X"), list);
    }

    @Test
    void shouldSortMixedPrefixedIdentifiers() {
        List<String> list = new ArrayList<>(List.of("Questão 10", "Questão 1", "Questão 2", "Questão 9"));
        list.sort(comparator);
        assertEquals(List.of("Questão 1", "Questão 2", "Questão 9", "Questão 10"), list);
    }

    @Test
    void shouldSortLetters() {
        List<String> list = new ArrayList<>(List.of("C", "A", "B", "D"));
        list.sort(comparator);
        assertEquals(List.of("A", "B", "C", "D"), list);
    }
}
