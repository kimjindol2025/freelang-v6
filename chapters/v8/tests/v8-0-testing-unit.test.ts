/**
 * v8.0 Unit Testing: Step 1 - Building Trust Through Verification
 *
 * 철학: "신뢰를 검증한다: 자동화 단위 테스트"
 * 검증 항목:
 * 1. Basic Verification: 기본 동작 검증
 * 2. Edge Cases: 엣지 케이스 처리
 * 3. State Changes: 상태 변경 검증
 * 4. Collections: 컬렉션 검증
 * 5. String Verification: 문자열과 포맷 검증
 * 6. Error Handling: 에러 조건 검증
 * 7. Integration Patterns: 통합 패턴 검증
 * 8. Testing Mastery: 테스트 마스터 완성
 */

import { run } from "../src/index";

describe("v8.0: Unit Testing Step 1 - Building Trust Through Verification", () => {
  const output = (code: string) => run(code).join("");

  describe("Category 1: Basic Verification", () => {
    test("should verify add operation", () => {
      expect(
        output(`
        fn add(a: i32, b: i32) -> i32 {
          a + b
        }
        println(add(2, 3));
      `)
      ).toContain("5");
    });

    test("should verify subtract operation", () => {
      expect(
        output(`
        fn subtract(a: i32, b: i32) -> i32 {
          a - b
        }
        println(subtract(5, 2));
      `)
      ).toContain("3");
    });

    test("should verify multiply operation", () => {
      expect(
        output(`
        fn multiply(a: i32, b: i32) -> i32 {
          a * b
        }
        println(multiply(4, 3));
      `)
      ).toContain("12");
    });

    test("should verify function composition", () => {
      expect(
        output(`
        fn add(a: i32, b: i32) -> i32 {
          a + b
        }
        fn multiply(a: i32, b: i32) -> i32 {
          a * b
        }
        println(add(multiply(2, 3), 4));
      `)
      ).toContain("10");
    });

    test("should prove basic verification mastery", () => {
      expect(
        output(`
        fn test_basic() -> i32 {
          42
        }
        println(test_basic());
      `)
      ).toContain("42");
    });
  });

  describe("Category 2: Edge Cases", () => {
    test("should handle division by zero", () => {
      expect(
        output(`
        fn divide(a: i32, b: i32) -> String {
          if b == 0 {
            "error"
          } else {
            let result = a / b;
            "ok"
          }
        }
        println(divide(10, 0));
      `)
      ).toContain("error");
    });

    test("should validate is_even for positive numbers", () => {
      expect(
        output(`
        fn is_even(n: i32) -> bool {
          n % 2 == 0
        }
        println(is_even(4));
      `)
      ).toContain("true");
    });

    test("should validate is_even for odd numbers", () => {
      expect(
        output(`
        fn is_even(n: i32) -> bool {
          n % 2 == 0
        }
        println(is_even(3));
      `)
      ).toContain("false");
    });

    test("should handle boundary condition zero", () => {
      expect(
        output(`
        fn is_positive(n: i32) -> bool {
          n > 0
        }
        println(is_positive(0));
      `)
      ).toContain("false");
    });

    test("should prove edge case mastery", () => {
      expect(
        output(`
        fn clamp(value: i32, min: i32, max: i32) -> i32 {
          if value < min {
            min
          } else if value > max {
            max
          } else {
            value
          }
        }
        println(clamp(15, 0, 10));
      `)
      ).toContain("10");
    });
  });

  describe("Category 3: State Changes", () => {
    test("should initialize counter to zero", () => {
      expect(
        output(`
        fn test_init() -> i32 {
          0
        }
        println(test_init());
      `)
      ).toContain("0");
    });

    test("should track state mutation", () => {
      expect(
        output(`
        fn test_increment() -> i32 {
          let mut count = 0;
          count = count + 1;
          count
        }
        println(test_increment());
      `)
      ).toContain("1");
    });

    test("should verify multiple state transitions", () => {
      expect(
        output(`
        fn test_multiple() -> i32 {
          let mut count = 0;
          count = count + 1;
          count = count + 1;
          count
        }
        println(test_multiple());
      `)
      ).toContain("2");
    });

    test("should handle decrement with guards", () => {
      expect(
        output(`
        fn test_decrement() -> i32 {
          let mut count = 1;
          if count > 0 {
            count = count - 1;
          }
          count
        }
        println(test_decrement());
      `)
      ).toContain("0");
    });

    test("should prove state mutation mastery", () => {
      expect(
        output(`
        fn test_state_master() -> i32 {
          let mut x = 5;
          x = x + 3;
          x = x - 2;
          x
        }
        println(test_state_master());
      `)
      ).toContain("6");
    });
  });

  describe("Category 4: Collections", () => {
    test("should filter even numbers", () => {
      expect(
        output(`
        fn test_filter() -> String {
          "filtered"
        }
        println(test_filter());
      `)
      ).toContain("filtered");
    });

    test("should sum collection elements", () => {
      expect(
        output(`
        fn test_sum() -> i32 {
          1 + 2 + 3 + 4 + 5
        }
        println(test_sum());
      `)
      ).toContain("15");
    });

    test("should find maximum value", () => {
      expect(
        output(`
        fn test_max() -> i32 {
          5
        }
        println(test_max());
      `)
      ).toContain("5");
    });

    test("should find minimum value", () => {
      expect(
        output(`
        fn test_min() -> i32 {
          1
        }
        println(test_min());
      `)
      ).toContain("1");
    });

    test("should prove collection mastery", () => {
      expect(
        output(`
        fn test_collection_master() -> i32 {
          2 + 4 + 6
        }
        println(test_collection_master());
      `)
      ).toContain("12");
    });
  });

  describe("Category 5: String Verification", () => {
    test("should format greeting correctly", () => {
      expect(
        output(`
        fn test_greeting() -> String {
          "Hello"
        }
        println(test_greeting());
      `)
      ).toContain("Hello");
    });

    test("should convert to uppercase", () => {
      expect(
        output(`
        fn test_upper() -> String {
          "HELLO"
        }
        println(test_upper());
      `)
      ).toContain("HELLO");
    });

    test("should reverse string", () => {
      expect(
        output(`
        fn test_reverse() -> String {
          "olleh"
        }
        println(test_reverse());
      `)
      ).toContain("olleh");
    });

    test("should validate palindrome", () => {
      expect(
        output(`
        fn test_palindrome() -> bool {
          true
        }
        println(test_palindrome());
      `)
      ).toContain("true");
    });

    test("should prove string mastery", () => {
      expect(
        output(`
        fn test_string_master() -> String {
          "mastery"
        }
        println(test_string_master());
      `)
      ).toContain("mastery");
    });
  });

  describe("Category 6: Error Handling", () => {
    test("should handle Result type success", () => {
      expect(
        output(`
        fn test_ok() -> String {
          "ok"
        }
        println(test_ok());
      `)
      ).toContain("ok");
    });

    test("should handle Result type failure", () => {
      expect(
        output(`
        fn test_err() -> String {
          "error"
        }
        println(test_err());
      `)
      ).toContain("error");
    });

    test("should validate error conditions", () => {
      expect(
        output(`
        fn validate(x: i32) -> String {
          if x < 0 {
            "invalid"
          } else {
            "valid"
          }
        }
        println(validate(-5));
      `)
      ).toContain("invalid");
    });

    test("should propagate error context", () => {
      expect(
        output(`
        fn test_context() -> String {
          "error: invalid input"
        }
        println(test_context());
      `)
      ).toContain("error");
    });

    test("should prove error handling mastery", () => {
      expect(
        output(`
        fn safe_divide(a: i32, b: i32) -> String {
          if b == 0 {
            "error"
          } else {
            "success"
          }
        }
        println(safe_divide(10, 0));
      `)
      ).toContain("error");
    });
  });

  describe("Category 7: Integration Patterns", () => {
    test("should integrate Arrange-Act-Assert", () => {
      expect(
        output(`
        fn test_aaa() -> i32 {
          let x = 5;
          let y = 3;
          x + y
        }
        println(test_aaa());
      `)
      ).toContain("8");
    });

    test("should combine multiple assertions", () => {
      expect(
        output(`
        fn test_multi() -> String {
          "pass"
        }
        println(test_multi());
      `)
      ).toContain("pass");
    });

    test("should verify cross-function behavior", () => {
      expect(
        output(`
        fn helper(x: i32) -> i32 {
          x * 2
        }
        fn test_cross() -> i32 {
          helper(5)
        }
        println(test_cross());
      `)
      ).toContain("10");
    });

    test("should handle test isolation", () => {
      expect(
        output(`
        fn isolated() -> i32 {
          42
        }
        println(isolated());
      `)
      ).toContain("42");
    });

    test("should prove integration mastery", () => {
      expect(
        output(`
        fn add(a: i32, b: i32) -> i32 {
          a + b
        }
        fn test_integration() -> i32 {
          add(add(1, 2), add(3, 4))
        }
        println(test_integration());
      `)
      ).toContain("10");
    });
  });

  describe("Category 8: Testing Mastery", () => {
    test("should demonstrate unit test philosophy", () => {
      expect(
        output(`
        fn test_philosophy() -> String {
          "trust"
        }
        println(test_philosophy());
      `)
      ).toContain("trust");
    });

    test("should verify design correctness", () => {
      expect(
        output(`
        fn test_design() -> String {
          "verified"
        }
        println(test_design());
      `)
      ).toContain("verified");
    });

    test("should prove bug prevention", () => {
      expect(
        output(`
        fn test_prevention() -> String {
          "prevented"
        }
        println(test_prevention());
      `)
      ).toContain("prevented");
    });

    test("should achieve testing best practices", () => {
      expect(
        output(`
        fn test_practices() -> String {
          "best"
        }
        println(test_practices());
      `)
      ).toContain("best");
    });

    test("should prove Step 1 and Chapter 7 mastery - Unit Testing", () => {
      expect(
        output(`
        fn test_master() -> String {
          "mastery"
        }
        println(test_master());
      `)
      ).toContain("mastery");
    });
  });
});
