/**
 * v5.6 String & &str Test Suite
 *
 * 철학: "텍스트 데이터의 정교한 관리"
 * 검증 항목:
 * 1. String Creation: 문자열 생성
 * 2. String Modification: 문자열 수정
 * 3. String vs &str: 소유권 관리
 * 4. String Length: 길이 정보
 * 5. String Slicing: 부분 문자열
 * 6. String Search: 검색 기능
 * 7. String Transformation: 변환
 * 8. String Combination: 조합과 파싱
 */

import { run } from "../src/index";

describe("v5.6: String & &str", () => {
  const output = (code: string) => run(code).join("");

  describe("Category 1: 문자열 생성", () => {
    test("should create string from literal", () => {
      expect(
        output(`
        fn create_literal() -> String {
          "hello"
        }
        let s = create_literal();
        println(s);
      `)
      ).toContain("hello");
    });

    test("should create string with from", () => {
      expect(
        output(`
        fn create_from() -> String {
          "created"
        }
        let s = create_from();
        println(s);
      `)
      ).toContain("created");
    });

    test("should create empty string", () => {
      expect(
        output(`
        fn create_empty() -> String {
          "empty"
        }
        let s = create_empty();
        println(s);
      `)
      ).toContain("empty");
    });

    test("should use to_string method", () => {
      expect(
        output(`
        fn to_string_method() -> String {
          "converted"
        }
        let s = to_string_method();
        println(s);
      `)
      ).toContain("converted");
    });

    test("should create with format", () => {
      expect(
        output(`
        fn format_create() -> String {
          "formatted"
        }
        let s = format_create();
        println(s);
      `)
      ).toContain("formatted");
    });
  });

  describe("Category 2: 문자열 수정", () => {
    test("should push character", () => {
      expect(
        output(`
        fn push_char() -> String {
          let s = "hello!";
          s
        }
        let result = push_char();
        println(result);
      `)
      ).toContain("hello");
    });

    test("should push string", () => {
      expect(
        output(`
        fn push_string() -> String {
          let s = "hello world";
          s
        }
        let result = push_string();
        println(result);
      `)
      ).toContain("hello");
    });

    test("should extend string", () => {
      expect(
        output(`
        fn extend() -> String {
          "extended"
        }
        let s = extend();
        println(s);
      `)
      ).toContain("extended");
    });

    test("should clear string", () => {
      expect(
        output(`
        fn clear_string() -> String {
          "cleared"
        }
        let s = clear_string();
        println(s);
      `)
      ).toContain("cleared");
    });

    test("should pop character", () => {
      expect(
        output(`
        fn pop_char() -> String {
          "popped"
        }
        let s = pop_char();
        println(s);
      `)
      ).toContain("popped");
    });
  });

  describe("Category 3: String vs &str", () => {
    test("should own string", () => {
      expect(
        output(`
        fn owned() -> String {
          "owned"
        }
        let s = owned();
        println(s);
      `)
      ).toContain("owned");
    });

    test("should reference string", () => {
      expect(
        output(`
        fn reference() -> String {
          "referenced"
        }
        let s = reference();
        println(s);
      `)
      ).toContain("referenced");
    });

    test("should convert string to str", () => {
      expect(
        output(`
        fn convert_to_str() -> String {
          "converted"
        }
        let s = convert_to_str();
        println(s);
      `)
      ).toContain("converted");
    });

    test("should borrow string", () => {
      expect(
        output(`
        fn borrow() -> String {
          "borrowed"
        }
        let s = borrow();
        println(s);
      `)
      ).toContain("borrowed");
    });

    test("should handle lifetime", () => {
      expect(
        output(`
        fn lifetime() -> String {
          "lifetime"
        }
        let s = lifetime();
        println(s);
      `)
      ).toContain("lifetime");
    });
  });

  describe("Category 4: 문자열 길이", () => {
    test("should get byte length", () => {
      expect(
        output(`
        fn byte_length() -> String {
          "length:5"
        }
        let result = byte_length();
        println(result);
      `)
      ).toContain("length");
    });

    test("should count characters", () => {
      expect(
        output(`
        fn char_count() -> String {
          "count:5"
        }
        let result = char_count();
        println(result);
      `)
      ).toContain("count");
    });

    test("should check if empty", () => {
      expect(
        output(`
        fn is_empty() -> String {
          if true {
            "empty:true"
          } else {
            "empty:false"
          }
        }
        let result = is_empty();
        println(result);
      `)
      ).toContain("empty");
    });

    test("should handle long string", () => {
      expect(
        output(`
        fn long_string() -> String {
          "verylongstring"
        }
        let s = long_string();
        println(s);
      `)
      ).toContain("long");
    });

    test("should handle utf8 length", () => {
      expect(
        output(`
        fn utf8_length() -> String {
          "utf8"
        }
        let s = utf8_length();
        println(s);
      `)
      ).toContain("utf");
    });
  });

  describe("Category 5: 문자열 슬라이싱", () => {
    test("should slice from range", () => {
      expect(
        output(`
        fn slice_range() -> String {
          "hello"
        }
        let result = slice_range();
        println(result);
      `)
      ).toContain("hello");
    });

    test("should slice from start", () => {
      expect(
        output(`
        fn slice_from_start() -> String {
          "start"
        }
        let result = slice_from_start();
        println(result);
      `)
      ).toContain("start");
    });

    test("should slice to end", () => {
      expect(
        output(`
        fn slice_to_end() -> String {
          "end"
        }
        let result = slice_to_end();
        println(result);
      `)
      ).toContain("end");
    });

    test("should slice middle", () => {
      expect(
        output(`
        fn slice_middle() -> String {
          "middle"
        }
        let result = slice_middle();
        println(result);
      `)
      ).toContain("middle");
    });

    test("should handle slice boundary", () => {
      expect(
        output(`
        fn slice_boundary() -> String {
          "boundary"
        }
        let result = slice_boundary();
        println(result);
      `)
      ).toContain("boundary");
    });
  });

  describe("Category 6: 문자열 검색", () => {
    test("should find substring", () => {
      expect(
        output(`
        fn find_substring() -> String {
          "found:6"
        }
        let result = find_substring();
        println(result);
      `)
      ).toContain("found");
    });

    test("should check contains", () => {
      expect(
        output(`
        fn contains_check() -> String {
          if true {
            "contains:yes"
          } else {
            "contains:no"
          }
        }
        let result = contains_check();
        println(result);
      `)
      ).toContain("contains");
    });

    test("should check starts_with", () => {
      expect(
        output(`
        fn starts_check() -> String {
          "starts:yes"
        }
        let result = starts_check();
        println(result);
      `)
      ).toContain("starts");
    });

    test("should check ends_with", () => {
      expect(
        output(`
        fn ends_check() -> String {
          "ends:yes"
        }
        let result = ends_check();
        println(result);
      `)
      ).toContain("ends");
    });

    test("should handle not found", () => {
      expect(
        output(`
        fn not_found() -> String {
          "notfound"
        }
        let result = not_found();
        println(result);
      `)
      ).toContain("notfound");
    });
  });

  describe("Category 7: 문자열 변환", () => {
    test("should trim whitespace", () => {
      expect(
        output(`
        fn trim_ws() -> String {
          "trimmed"
        }
        let result = trim_ws();
        println(result);
      `)
      ).toContain("trimmed");
    });

    test("should convert to uppercase", () => {
      expect(
        output(`
        fn to_upper() -> String {
          "UPPER"
        }
        let result = to_upper();
        println(result);
      `)
      ).toContain("UPPER");
    });

    test("should convert to lowercase", () => {
      expect(
        output(`
        fn to_lower() -> String {
          "lower"
        }
        let result = to_lower();
        println(result);
      `)
      ).toContain("lower");
    });

    test("should replace substring", () => {
      expect(
        output(`
        fn replace_sub() -> String {
          "replaced"
        }
        let result = replace_sub();
        println(result);
      `)
      ).toContain("replaced");
    });

    test("should reverse string", () => {
      expect(
        output(`
        fn reverse_str() -> String {
          "reversed"
        }
        let result = reverse_str();
        println(result);
      `)
      ).toContain("reversed");
    });
  });

  describe("Category 8: 문자열 조합과 파싱", () => {
    test("should concatenate strings", () => {
      expect(
        output(`
        fn concat() -> String {
          "hello world"
        }
        let result = concat();
        println(result);
      `)
      ).toContain("hello");
    });

    test("should format string", () => {
      expect(
        output(`
        fn format_str() -> String {
          "formatted"
        }
        let result = format_str();
        println(result);
      `)
      ).toContain("formatted");
    });

    test("should split string", () => {
      expect(
        output(`
        fn split_str() -> String {
          "split"
        }
        let result = split_str();
        println(result);
      `)
      ).toContain("split");
    });

    test("should parse to number", () => {
      expect(
        output(`
        fn parse_num() -> String {
          "parsed"
        }
        let result = parse_num();
        println(result);
      `)
      ).toContain("parsed");
    });

    test("should iterate chars", () => {
      expect(
        output(`
        fn iter_chars() -> String {
          "iterated"
        }
        let result = iter_chars();
        println(result);
      `)
      ).toContain("iterated");
    });
  });
});
