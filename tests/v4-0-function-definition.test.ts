/**
 * v4.0 Function Definition Test Suite - 함수의 정의와 캡슐화
 *
 * 설계 검증 항목:
 * 1. 단순 변환 함수: 입력 → 변환 → 출력
 * 2. 판단 함수: 조건 검사 → bool 반환
 * 3. 분류 함수: 범위별 분류 → 문자열 반환
 * 4. 축적 함수: 다중 입력 결합 → 계산 결과
 * 5. 포맷 함수: 입력 조합 → 형식화된 문자열
 */

import { run } from "../src/index";

describe("v4.0: Function Definition (함수의 정의)", () => {
  const output = (code: string) => run(code).join("");

  describe("Category 1: 단순 변환 함수", () => {
    test("should double a number", () => {
      expect(
        output(`
        fn double(x: i32) -> i32 {
          x * 2
        }
        println(double(5));
      `)
      ).toContain("10");
    });

    test("should square a number", () => {
      expect(
        output(`
        fn square(x: i32) -> i32 {
          x * x
        }
        println(square(4));
      `)
      ).toContain("16");
    });

    test("should negate a number", () => {
      expect(
        output(`
        fn negate(x: i32) -> i32 {
          0 - x
        }
        println(negate(10));
      `)
      ).toContain("-10");
    });

    test("should return absolute value", () => {
      expect(
        output(`
        fn absolute(x: i32) -> i32 {
          if x < 0 {
            0 - x
          } else {
            x
          }
        }
        println(absolute(-7));
      `)
      ).toContain("7");
    });

    test("should apply multiple transformations", () => {
      expect(
        output(`
        fn double(x: i32) -> i32 {
          x * 2
        }
        fn add_ten(x: i32) -> i32 {
          x + 10
        }
        let result = double(5);
        let final = add_ten(result);
        println(final);
      `)
      ).toContain("20");
    });
  });

  describe("Category 2: 판단 함수", () => {
    test("should check if even", () => {
      expect(
        output(`
        fn is_even(n: i32) -> bool {
          n % 2 == 0
        }
        if is_even(6) {
          println("even");
        }
      `)
      ).toContain("even");
    });

    test("should check if odd", () => {
      expect(
        output(`
        fn is_odd(n: i32) -> bool {
          n % 2 == 1
        }
        if is_odd(7) {
          println("odd");
        }
      `)
      ).toContain("odd");
    });

    test("should check if positive", () => {
      expect(
        output(`
        fn is_positive(x: i32) -> bool {
          x > 0
        }
        if is_positive(15) {
          println("positive");
        }
      `)
      ).toContain("positive");
    });

    test("should check if in range", () => {
      expect(
        output(`
        fn is_in_range(value: i32, min: i32, max: i32) -> bool {
          value >= min && value <= max
        }
        if is_in_range(50, 0, 100) {
          println("in_range");
        }
      `)
      ).toContain("in_range");
    });

    test("should handle multiple predicates", () => {
      expect(
        output(`
        fn is_even(n: i32) -> bool {
          n % 2 == 0
        }
        fn is_positive(x: i32) -> bool {
          x > 0
        }
        if is_even(6) && is_positive(6) {
          println("both");
        }
      `)
      ).toContain("both");
    });
  });

  describe("Category 3: 분류 함수", () => {
    test("should grade by score", () => {
      expect(
        output(`
        fn grade_letter(score: i32) -> String {
          if score >= 90 {
            "A"
          } else if score >= 80 {
            "B"
          } else {
            "C"
          }
        }
        println(grade_letter(85));
      `)
      ).toContain("B");
    });

    test("should classify status level", () => {
      expect(
        output(`
        fn status_level(value: i32) -> String {
          if value >= 100 {
            "CRITICAL"
          } else if value >= 80 {
            "WARNING"
          } else {
            "NORMAL"
          }
        }
        println(status_level(95));
      `)
      ).toContain("WARNING");
    });

    test("should categorize traffic light", () => {
      expect(
        output(`
        fn traffic_light(value: i32) -> String {
          if value < 30 {
            "GREEN"
          } else if value < 60 {
            "YELLOW"
          } else {
            "RED"
          }
        }
        println(traffic_light(40));
      `)
      ).toContain("YELLOW");
    });

    test("should map temperature zones", () => {
      expect(
        output(`
        fn temperature_zone(celsius: i32) -> String {
          if celsius < 0 {
            "FREEZING"
          } else if celsius < 15 {
            "COLD"
          } else if celsius < 25 {
            "MODERATE"
          } else {
            "WARM"
          }
        }
        println(temperature_zone(20));
      `)
      ).toContain("MODERATE");
    });

    test("should handle boundary conditions", () => {
      expect(
        output(`
        fn categorize(n: i32) -> String {
          if n == 0 {
            "zero"
          } else if n > 0 {
            "positive"
          } else {
            "negative"
          }
        }
        println(categorize(0));
      `)
      ).toContain("zero");
    });
  });

  describe("Category 4: 축적 함수", () => {
    test("should add two numbers", () => {
      expect(
        output(`
        fn add(a: i32, b: i32) -> i32 {
          a + b
        }
        println(add(10, 20));
      `)
      ).toContain("30");
    });

    test("should add three numbers", () => {
      expect(
        output(`
        fn add_three(a: i32, b: i32, c: i32) -> i32 {
          a + b + c
        }
        println(add_three(5, 10, 15));
      `)
      ).toContain("30");
    });

    test("should multiply two numbers", () => {
      expect(
        output(`
        fn multiply(a: i32, b: i32) -> i32 {
          a * b
        }
        println(multiply(6, 7));
      `)
      ).toContain("42");
    });

    test("should divide safely", () => {
      expect(
        output(`
        fn divide(a: i32, b: i32) -> i32 {
          if b == 0 {
            0
          } else {
            a / b
          }
        }
        println(divide(20, 4));
      `)
      ).toContain("5");
    });

    test("should find max value", () => {
      expect(
        output(`
        fn max_value(a: i32, b: i32) -> i32 {
          if a > b {
            a
          } else {
            b
          }
        }
        println(max_value(7, 3));
      `)
      ).toContain("7");
    });

    test("should find min value", () => {
      expect(
        output(`
        fn min_value(a: i32, b: i32) -> i32 {
          if a < b {
            a
          } else {
            b
          }
        }
        println(min_value(7, 3));
      `)
      ).toContain("3");
    });

    test("should handle multiple operations", () => {
      expect(
        output(`
        fn add(a: i32, b: i32) -> i32 {
          a + b
        }
        fn multiply_result(x: i32, y: i32) -> i32 {
          x * y
        }
        let sum = add(3, 4);
        let product = multiply_result(sum, 2);
        println(product);
      `)
      ).toContain("14");
    });
  });

  describe("Category 5: 포맷 함수", () => {
    test("should format simple message", () => {
      expect(
        output(`
        fn format_message(greeting: String, name: String) -> String {
          greeting + ", " + name
        }
        println(format_message("Hello", "Alice"));
      `)
      ).toContain("Hello, Alice");
    });

    test("should format result with label", () => {
      expect(
        output(`
        fn format_result(label: String, value: i32) -> String {
          label + ": " + value
        }
        println(format_result("Temperature", 25));
      `)
      ).toContain("Temperature: 25");
    });

    test("should format status", () => {
      expect(
        output(`
        fn format_status(device: String, status: String) -> String {
          device + " is " + status
        }
        println(format_status("Server", "online"));
      `)
      ).toContain("Server is online");
    });

    test("should format coordinates", () => {
      expect(
        output(`
        fn format_coordinate(x: i32, y: i32) -> String {
          "(" + x + ", " + y + ")"
        }
        println(format_coordinate(10, 20));
      `)
      ).toContain("(10, 20)");
    });

    test("should format percentage", () => {
      expect(
        output(`
        fn format_percentage(part: i32, total: i32) -> String {
          if total == 0 {
            "0%"
          } else {
            let percent = (part * 100) / total;
            percent + "%"
          }
        }
        println(format_percentage(75, 100));
      `)
      ).toContain("75%");
    });
  });

  describe("Advanced: 제2장 로직의 캡슐화", () => {
    test("should encapsulate sensor analysis", () => {
      expect(
        output(`
        fn analyze_sensor_reading(reading: i32) -> String {
          if reading >= 100 {
            "CRITICAL"
          } else if reading >= 80 {
            "WARNING"
          } else {
            "NORMAL"
          }
        }
        println(analyze_sensor_reading(95));
      `)
      ).toContain("WARNING");
    });

    test("should calculate performance rating", () => {
      expect(
        output(`
        fn calculate_performance(score: i32, max: i32) -> String {
          if max <= 0 {
            "INVALID"
          } else {
            let percent = (score * 100) / max;
            if percent >= 90 {
              "EXCELLENT"
            } else if percent >= 70 {
              "GOOD"
            } else {
              "POOR"
            }
          }
        }
        println(calculate_performance(90, 100));
      `)
      ).toContain("EXCELLENT");
    });

    test("should validate and transform", () => {
      expect(
        output(`
        fn validate_age(age: i32) -> bool {
          age >= 0 && age <= 150
        }
        fn can_drive(age: i32) -> bool {
          age >= 18
        }
        if validate_age(25) && can_drive(25) {
          println("valid_driver");
        }
      `)
      ).toContain("valid_driver");
    });

    test("should calculate dynamic discount", () => {
      expect(
        output(`
        fn discount_rate(amount: i32) -> i32 {
          if amount >= 1000 {
            20
          } else if amount >= 500 {
            15
          } else if amount >= 100 {
            10
          } else {
            0
          }
        }
        println(discount_rate(150));
      `)
      ).toContain("10");
    });
  });

  describe("Composition: 함수의 조합", () => {
    test("should compose functions", () => {
      expect(
        output(`
        fn double(x: i32) -> i32 {
          x * 2
        }
        fn add_ten(x: i32) -> i32 {
          x + 10
        }
        let x = 5;
        let y = double(x);
        let z = add_ten(y);
        println(z);
      `)
      ).toContain("20");
    });

    test("should chain transformations", () => {
      expect(
        output(`
        fn classify(n: i32) -> String {
          if n > 0 { "positive" } else { "non_positive" }
        }
        fn format_result(label: String, value: String) -> String {
          label + ": " + value
        }
        let classification = classify(42);
        println(format_result("Number", classification));
      `)
      ).toContain("Number: positive");
    });

    test("should use predicate in control flow", () => {
      expect(
        output(`
        fn is_valid(x: i32) -> bool {
          x >= 0 && x <= 100
        }
        let value = 50;
        if is_valid(value) {
          println("valid");
        }
      `)
      ).toContain("valid");
    });
  });

  describe("API Contract: 함수 규약 검증", () => {
    test("should guarantee input-output contract", () => {
      expect(
        output(`
        fn always_positive(x: i32) -> i32 {
          if x < 0 { 0 - x } else { x }
        }
        let result1 = always_positive(5);
        let result2 = always_positive(-5);
        if result1 > 0 && result2 > 0 {
          println("contract_valid");
        }
      `)
      ).toContain("contract_valid");
    });

    test("should maintain type safety", () => {
      expect(
        output(`
        fn repeat_num(n: i32, times: i32) -> i32 {
          n * times
        }
        let result = repeat_num(3, 5);
        println(result);
      `)
      ).toContain("15");
    });

    test("should predictably handle edge cases", () => {
      expect(
        output(`
        fn safe_divide(a: i32, b: i32) -> i32 {
          if b == 0 { 0 } else { a / b }
        }
        println(safe_divide(10, 0));
      `)
      ).toContain("0");
    });
  });
});
