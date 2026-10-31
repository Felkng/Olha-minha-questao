package github.felkng.olha_minha_questao.util;

import java.io.Serializable;
import java.util.Comparator;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class QuestionIdentifierComparator implements Comparator<String>, Serializable {

    private static final long serialVersionUID = 1L;

    private static final Pattern ROMAN_PATTERN = Pattern.compile("^(M{0,3})(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$");
    private static final Pattern NUMERIC_CHUNK_PATTERN = Pattern.compile("(\\d+)|(\\D+)");

    private static final Map<Character, Integer> ROMAN_VALUES = Map.of(
            'I', 1, 'V', 5, 'X', 10, 'L', 50, 'C', 100, 'D', 500, 'M', 1000
    );

    @Override
    public int compare(String s1, String s2) {
        if (s1 == null && s2 == null) return 0;
        if (s1 == null) return 1;
        if (s2 == null) return -1;

        String str1 = s1.trim();
        String str2 = s2.trim();

        if (str1.equalsIgnoreCase(str2)) return 0;

        Integer r1 = parseRoman(str1);
        Integer r2 = parseRoman(str2);
        if (r1 != null && r2 != null) {
            return Integer.compare(r1, r2);
        }

        // Natural alphanumeric sort
        Matcher m1 = NUMERIC_CHUNK_PATTERN.matcher(str1);
        Matcher m2 = NUMERIC_CHUNK_PATTERN.matcher(str2);

        while (m1.find() && m2.find()) {
            String chunk1 = m1.group();
            String chunk2 = m2.group();

            boolean isNum1 = Character.isDigit(chunk1.charAt(0));
            boolean isNum2 = Character.isDigit(chunk2.charAt(0));

            if (isNum1 && isNum2) {
                try {
                    long n1 = Long.parseLong(chunk1);
                    long n2 = Long.parseLong(chunk2);
                    int cmp = Long.compare(n1, n2);
                    if (cmp != 0) return cmp;
                } catch (NumberFormatException ignored) {
                    int cmp = chunk1.compareTo(chunk2);
                    if (cmp != 0) return cmp;
                }
            } else {
                int cmp = chunk1.compareToIgnoreCase(chunk2);
                if (cmp != 0) return cmp;
            }
        }

        return Integer.compare(str1.length(), str2.length());
    }

    private Integer parseRoman(String s) {
        String upper = s.toUpperCase();
        if (upper.isEmpty() || !ROMAN_PATTERN.matcher(upper).matches()) {
            return null;
        }
        int total = 0;
        int prev = 0;
        for (int i = upper.length() - 1; i >= 0; i--) {
            Integer cur = ROMAN_VALUES.get(upper.charAt(i));
            if (cur == null) return null;
            if (cur < prev) {
                total -= cur;
            } else {
                total += cur;
                prev = cur;
            }
        }
        return total > 0 ? total : null;
    }
}
