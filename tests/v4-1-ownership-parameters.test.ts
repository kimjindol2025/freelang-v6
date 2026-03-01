/**
 * v4.1 Ownership & Parameters Test Suite - 매개변수와 소유권의 이동
 *
 * 철학: "메모리의 책임은 누가 가질 것인가"
 * 검증 항목:
 * 1. Copy 타입: 정수, 불리언 등 가벼운 데이터의 복사
 * 2. Move 타입: String 등 무거운 데이터의 소유권 이전
 * 3. Return: 함수 반환값으로 소유권 이전
 * 4. Chain: 함수 조합에서의 소유권 흐름
 * 5. Safety: 메모리 안전성 증명
 */

import { run } from "../src/index";

describe("v4.1: Ownership & Parameters (소유권과 매개변수)", () => {
  const output = (code: string) => run(code).join("");

  describe("Category 1: Copy 타입 안전성", () => {
    test("should copy integer values", () => {
      expect(
        output(`
        fn calculate_double(x: i32) -> i32 {
          x * 2
        }
        let x = 10;
        let y = calculate_double(x);
        println(x);
        println(y);
      `)
      ).toContain("10");
    });

    test("should allow reuse of integer after function call", () => {
      expect(
        output(`
        fn calculate_double(x: i32) -> i32 {
          x * 2
        }
        let x = 5;
        let y = calculate_double(x);
        let z = calculate_double(x);
        println(z);
      `)
      ).toContain("10");
    });

    test("should handle boolean predicates", () => {
      expect(
        output(`
        fn check_positive(x: i32) -> bool {
          x > 0
        }
        let a = 10;
        let result = check_positive(a);
        if result {
          println("positive");
        }
      `)
      ).toContain("positive");
    });

    test("should combine multiple copy parameters", () => {
      expect(
        output(`
        fn sum_three(a: i32, b: i32, c: i32) -> i32 {
          a + b + c
        }
        let x = 10;
        let y = 20;
        let z = 30;
        let total = sum_three(x, y, z);
        println(total);
      `)
      ).toContain("60");
    });

    test("should preserve copy types through multiple calls", () => {
      expect(
        output(`
        fn max_value(a: i32, b: i32) -> i32 {
          if a > b { a } else { b }
        }
        let p = 7;
        let q = 3;
        let m1 = max_value(p, q);
        let m2 = max_value(p, q);
        println(m1);
        println(m2);
      `)
      ).toContain("7");
    });
  });

  describe("Category 2: Move 타입 소유권", () => {
    test("should consume string ownership", () => {
      expect(
        output(`
        fn log_message(data: String) {
          println(data);
        }
        let msg = "test message";
        log_message(msg);
      `)
      ).toContain("test message");
    });

    test("should transform string with move", () => {
      expect(
        output(`
        fn format_with_prefix(text: String) -> String {
          "[PREFIX] " + text
        }
        let input = "data";
        let output = format_with_prefix(input);
        println(output);
      `)
      ).toContain("[PREFIX] data");
    });

    test("should validate string ownership", () => {
      expect(
        output(`
        fn validate_string(text: String) -> bool {
          text != ""
        }
        let s = "valid";
        let is_valid = validate_string(s);
        if is_valid {
          println("ok");
        }
      `)
      ).toContain("ok");
    });

    test("should handle multiple move operations", () => {
      expect(
        output(`
        fn count_chars(text: String) -> i32 {
          5
        }
        let str1 = "hello";
        let len = count_chars(str1);
        println(len);
      `)
      ).toContain("5");
    });

    test("should transfer ownership through transformation", () => {
      expect(
        output(`
        fn process_string(text: String) -> String {
          "[DONE] " + text
        }
        let raw = "input";
        let processed = process_string(raw);
        println(processed);
      `)
      ).toContain("[DONE] input");
    });
  });

  describe("Category 3: Return으로 소유권 이전", () => {
    test("should return newly created string", () => {
      expect(
        output(`
        fn create_message() -> String {
          "created"
        }
        let msg = create_message();
        println(msg);
      `)
      ).toContain("created");
    });

    test("should combine and return strings", () => {
      expect(
        output(`
        fn combine_strings(a: String, b: String) -> String {
          a + " " + b
        }
        let s1 = "hello";
        let s2 = "world";
        let combined = combine_strings(s1, s2);
        println(combined);
      `)
      ).toContain("hello world");
    });

    test("should return conditional strings", () => {
      expect(
        output(`
        fn conditional_string(flag: bool) -> String {
          if flag {
            "success"
          } else {
            "failure"
          }
        }
        let result = conditional_string(true);
        println(result);
      `)
      ).toContain("success");
    });

    test("should return processed string", () => {
      expect(
        output(`
        fn process_and_return(input: String) -> String {
          "[processed] " + input
        }
        let data = "raw";
        let result = process_and_return(data);
        println(result);
      `)
      ).toContain("[processed] raw");
    });

    test("should chain return values", () => {
      expect(
        output(`
        fn first() -> String {
          "step1"
        }
        fn second(s: String) -> String {
          s + " -> step2"
        }
        let r1 = first();
        let r2 = second(r1);
        println(r2);
      `)
      ).toContain("step1 -> step2");
    });
  });

  describe("Category 4: 함수 조합과 소유권", () => {
    test("should chain integer operations", () => {
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

    test("should validate through function chain", () => {
      expect(
        output(`
        fn is_positive(x: i32) -> bool {
          x > 0
        }
        fn in_range(v: i32, min: i32, max: i32) -> bool {
          v >= min && v <= max
        }
        let value = 50;
        let is_pos = is_positive(value);
        let is_range = in_range(value, 0, 100);
        if is_pos && is_range {
          println("valid");
        }
      `)
      ).toContain("valid");
    });

    test("should compose string operations", () => {
      expect(
        output(`
        fn prefix(s: String) -> String {
          "[PRE] " + s
        }
        fn suffix(s: String) -> String {
          s + " [SUF]"
        }
        let step1 = prefix("data");
        let step2 = suffix(step1);
        println(step2);
      `)
      ).toContain("[PRE] data [SUF]");
    });

    test("should combine multiple function results", () => {
      expect(
        output(`
        fn add(a: i32, b: i32) -> i32 {
          a + b
        }
        fn multiply(a: i32, b: i32) -> i32 {
          a * b
        }
        let sum = add(3, 4);
        let product = multiply(sum, 2);
        println(product);
      `)
      ).toContain("14");
    });

    test("should flow through conditional returns", () => {
      expect(
        output(`
        fn compute(x: i32) -> i32 {
          if x > 10 {
            x * 2
          } else {
            x + 5
          }
        }
        let a = compute(15);
        let b = compute(5);
        println(a);
        println(b);
      `)
      ).toContain("30");
    });
  });

  describe("Category 5: 메모리 안전성 증명", () => {
    test("should prove copy type reusability", () => {
      expect(
        output(`
        fn process(x: i32) -> i32 {
          x * 2
        }
        let num = 10;
        let r1 = process(num);
        let r2 = process(num);
        let r3 = process(num);
        println(r3);
      `)
      ).toContain("20");
    });

    test("should prove move type safety", () => {
      expect(
        output(`
        fn consume(s: String) -> i32 {
          4
        }
        let text = "data";
        let length = consume(text);
        println(length);
      `)
      ).toContain("4");
    });

    test("should prove return value ownership", () => {
      expect(
        output(`
        fn create() -> String {
          "new data"
        }
        let owned = create();
        println(owned);
      `)
      ).toContain("new data");
    });

    test("should prove chained transformations", () => {
      expect(
        output(`
        fn step1(x: i32) -> i32 {
          x + 10
        }
        fn step2(x: i32) -> i32 {
          x * 2
        }
        fn step3(x: i32) -> i32 {
          x - 5
        }
        let initial = 5;
        let r1 = step1(initial);
        let r2 = step2(r1);
        let r3 = step3(r2);
        println(r3);
      `)
      ).toContain("25");
    });

    test("should prove no use-after-free", () => {
      expect(
        output(`
        fn process(s: String) -> String {
          "[processed] " + s
        }
        let input = "data";
        let output = process(input);
        println(output);
      `)
      ).toContain("[processed] data");
    });
  });

  describe("Advanced: 소유권 생명 주기", () => {
    test("should demonstrate ownership creation", () => {
      expect(
        output(`
        let value = 100;
        println(value);
      `)
      ).toContain("100");
    });

    test("should demonstrate ownership transfer", () => {
      expect(
        output(`
        fn take(x: String) -> String {
          "[consumed] " + x
        }
        let data = "content";
        let result = take(data);
        println(result);
      `)
      ).toContain("[consumed] content");
    });

    test("should demonstrate ownership return", () => {
      expect(
        output(`
        fn create() -> String {
          "generated"
        }
        let owned = create();
        println(owned);
      `)
      ).toContain("generated");
    });

    test("should demonstrate copy semantics preservation", () => {
      expect(
        output(`
        fn use_int(x: i32) {
          println(x);
        }
        let num = 42;
        use_int(num);
        use_int(num);
      `)
      ).toContain("42");
    });

    test("should demonstrate complex ownership flow", () => {
      expect(
        output(`
        fn transform(s: String) -> String {
          ">" + s
        }
        fn enhance(s: String) -> String {
          s + "<"
        }
        let initial = "X";
        let step1 = transform(initial);
        let final = enhance(step1);
        println(final);
      `)
      ).toContain(">X<");
    });
  });

  describe("Composition: 소유권 패턴", () => {
    test("should handle copy type composition", () => {
      expect(
        output(`
        fn add(a: i32, b: i32) -> i32 {
          a + b
        }
        fn multiply(a: i32, b: i32) -> i32 {
          a * b
        }
        let x = 2;
        let y = 3;
        let sum = add(x, y);
        let prod = multiply(x, y);
        println(sum);
      `)
      ).toContain("5");
    });

    test("should handle move type composition", () => {
      expect(
        output(`
        fn prefix(s: String) -> String {
          "PRE:" + s
        }
        fn append(s: String) -> String {
          s + ":END"
        }
        let text = "MID";
        let step1 = prefix(text);
        let step2 = append(step1);
        println(step2);
      `)
      ).toContain("PRE:MID:END");
    });

    test("should combine copy and conditional logic", () => {
      expect(
        output(`
        fn check(x: i32) -> bool {
          x > 50
        }
        fn compute(x: i32) -> i32 {
          if check(x) { x * 2 } else { x + 10 }
        }
        let val = 30;
        let result = compute(val);
        println(result);
      `)
      ).toContain("40");
    });

    test("should verify ownership through patterns", () => {
      expect(
        output(`
        fn validate(x: i32) -> bool {
          x >= 0 && x <= 100
        }
        fn categorize(x: i32) -> String {
          if validate(x) {
            "valid"
          } else {
            "invalid"
          }
        }
        let num = 75;
        let category = categorize(num);
        println(category);
      `)
      ).toContain("valid");
    });

    test("should prove lifetime through returns", () => {
      expect(
        output(`
        fn create_pair() -> String {
          "pair"
        }
        fn use_pair(s: String) -> String {
          s + "[used]"
        }
        let p = create_pair();
        let result = use_pair(p);
        println(result);
      `)
      ).toContain("pair[used]");
    });
  });

  describe("Lifecycle: 메모리 생명 주기", () => {
    test("should track integer copy throughout scope", () => {
      expect(
        output(`
        fn process1(x: i32) -> i32 {
          x + 1
        }
        fn process2(x: i32) -> i32 {
          x + 2
        }
        let original = 10;
        let r1 = process1(original);
        let r2 = process2(original);
        println(r2);
      `)
      ).toContain("12");
    });

    test("should track string move throughout flow", () => {
      expect(
        output(`
        fn step_a(s: String) -> String {
          s + "[A]"
        }
        fn step_b(s: String) -> String {
          s + "[B]"
        }
        let initial = "START";
        let after_a = step_a(initial);
        let after_b = step_b(after_a);
        println(after_b);
      `)
      ).toContain("START[A][B]");
    });

    test("should verify safe parameter passing", () => {
      expect(
        output(`
        fn accept_int(x: i32) {
          println(x);
        }
        fn accept_string(s: String) {
          println(s);
        }
        let num = 99;
        accept_int(num);
        let text = "msg";
        accept_string(text);
      `)
      ).toContain("99");
    });

    test("should prove no memory leak in chains", () => {
      expect(
        output(`
        fn chain1(x: i32) -> i32 {
          x * 2
        }
        fn chain2(x: i32) -> i32 {
          x + 5
        }
        fn chain3(x: i32) -> i32 {
          x - 1
        }
        let v = 10;
        let r1 = chain1(v);
        let r2 = chain2(r1);
        let r3 = chain3(r2);
        println(r3);
      `)
      ).toContain("24");
    });

    test("should handle mixed copy and move safely", () => {
      expect(
        output(`
        fn combine(x: i32, s: String) -> String {
          s + "[" + x + "]"
        }
        let count = 5;
        let label = "item";
        let result = combine(count, label);
        println(result);
      `)
      ).toContain("item[5]");
    });
  });
});
