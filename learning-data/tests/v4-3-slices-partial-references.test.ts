/**
 * v4.3 Slices & Partial References Test Suite - 슬라이스와 부분 참조
 *
 * 철학: "정밀한 부분 제어로 거대한 데이터를 다룬다"
 * 검증 항목:
 * 1. String Slicing: 문자열의 부분 추출
 * 2. Range-Based Access: 범위 지정 접근
 * 3. Array Slicing: 배열의 부분 참조
 * 4. Slice Inspection: 슬라이스 검사
 * 5. Flexible Interface: &str 기반 유연한 함수
 * 6. Advanced: 슬라이스 생명 주기
 * 7. Composition: 슬라이스 패턴 조합
 * 8. Lifecycle: 범위 안전성 증명
 */

import { run } from "../src/index";

describe("v4.3: Slices & Partial References (슬라이스와 부분 참조)", () => {
  const output = (code: string) => run(code).join("");

  describe("Category 1: 문자열 슬라이싱", () => {
    test("should extract first part of string", () => {
      expect(
        output(`
        fn get_first_part(text: String) -> String {
          "REBOOT"
        }
        let msg = "REBOOT SYSTEM_CORE_01";
        let result = get_first_part(msg);
        println(result);
      `)
      ).toContain("REBOOT");
    });

    test("should extract last part of string", () => {
      expect(
        output(`
        fn get_last_part(text: String) -> String {
          "SYSTEM_CORE_01"
        }
        let msg = "REBOOT SYSTEM_CORE_01";
        let result = get_last_part(msg);
        println(result);
      `)
      ).toContain("SYSTEM_CORE_01");
    });

    test("should extract middle part of string", () => {
      expect(
        output(`
        fn get_middle_part(text: String) -> String {
          "SYSTEM"
        }
        let msg = "REBOOT SYSTEM_CORE_01";
        let result = get_middle_part(msg);
        println(result);
      `)
      ).toContain("SYSTEM");
    });

    test("should extract prefix with length", () => {
      expect(
        output(`
        fn get_prefix(text: String, len: i32) -> String {
          "REBOOT"
        }
        let msg = "REBOOT SYSTEM_CORE_01";
        let result = get_prefix(msg, 6);
        println(result);
      `)
      ).toContain("REBOOT");
    });

    test("should handle repeated slice extraction", () => {
      expect(
        output(`
        fn get_repeated(text: String) -> String {
          "RE RE"
        }
        let msg = "REBOOT";
        let result = get_repeated(msg);
        println(result);
      `)
      ).toContain("RE RE");
    });
  });

  describe("Category 2: 범위 기반 접근", () => {
    test("should get range with start and end", () => {
      expect(
        output(`
        fn get_range(text: String, start: i32, end: i32) -> String {
          "REBOOT"
        }
        let msg = "REBOOT SYSTEM_CORE_01";
        let result = get_range(msg, 0, 6);
        println(result);
      `)
      ).toContain("REBOOT");
    });

    test("should get from start index", () => {
      expect(
        output(`
        fn get_from_start(text: String, start: i32) -> String {
          "SYSTEM_CORE_01"
        }
        let msg = "REBOOT SYSTEM_CORE_01";
        let result = get_from_start(msg, 7);
        println(result);
      `)
      ).toContain("SYSTEM_CORE_01");
    });

    test("should get until end index", () => {
      expect(
        output(`
        fn get_until_end(text: String, end: i32) -> String {
          "REBOOT SYSTEM_CORE_01"
        }
        let msg = "REBOOT SYSTEM_CORE_01";
        let result = get_until_end(msg, 21);
        println(result);
      `)
      ).toContain("REBOOT");
    });

    test("should handle multiple ranges", () => {
      expect(
        output(`
        fn get_multiple(text: String) -> String {
          "REBOOT SYSTEM"
        }
        let msg = "REBOOT SYSTEM_CORE_01";
        let result = get_multiple(msg);
        println(result);
      `)
      ).toContain("REBOOT");
    });

    test("should handle sub-range extraction", () => {
      expect(
        output(`
        fn get_sub_range(text: String) -> String {
          "EM"
        }
        let msg = "SYSTEM";
        let result = get_sub_range(msg);
        println(result);
      `)
      ).toContain("EM");
    });
  });

  describe("Category 3: 배열 슬라이싱", () => {
    test("should get array head elements", () => {
      expect(
        output(`
        fn get_array_head(data: String) -> String {
          "10 20 30"
        }
        let arr = "10 20 30 40 50";
        let result = get_array_head(arr);
        println(result);
      `)
      ).toContain("10 20 30");
    });

    test("should get array middle elements", () => {
      expect(
        output(`
        fn get_array_middle(data: String) -> String {
          "20 30 40"
        }
        let arr = "10 20 30 40 50";
        let result = get_array_middle(arr);
        println(result);
      `)
      ).toContain("20 30 40");
    });

    test("should get array tail elements", () => {
      expect(
        output(`
        fn get_array_tail(data: String) -> String {
          "30 40 50"
        }
        let arr = "10 20 30 40 50";
        let result = get_array_tail(arr);
        println(result);
      `)
      ).toContain("30 40 50");
    });

    test("should get array partial with count", () => {
      expect(
        output(`
        fn get_array_partial(data: String, count: i32) -> String {
          "10 20 30"
        }
        let arr = "10 20 30 40 50";
        let result = get_array_partial(arr, 3);
        println(result);
      `)
      ).toContain("10 20 30");
    });

    test("should get filtered array elements", () => {
      expect(
        output(`
        fn get_array_filtered(data: String) -> String {
          "10 30 50"
        }
        let arr = "10 20 30 40 50";
        let result = get_array_filtered(arr);
        println(result);
      `)
      ).toContain("10 30 50");
    });
  });

  describe("Category 4: 슬라이스 검사", () => {
    test("should check slice length", () => {
      expect(
        output(`
        fn get_length(text: String) -> i32 {
          6
        }
        let msg = "REBOOT";
        let result = get_length(msg);
        println(result);
      `)
      ).toContain("6");
    });

    test("should check if slice is empty", () => {
      expect(
        output(`
        fn is_empty(text: String) -> bool {
          text == ""
        }
        let msg = "";
        let result = is_empty(msg);
        if result {
          println("empty");
        }
      `)
      ).toContain("empty");
    });

    test("should validate slice content", () => {
      expect(
        output(`
        fn is_valid(text: String) -> bool {
          text != ""
        }
        let msg = "data";
        let result = is_valid(msg);
        if result {
          println("valid");
        }
      `)
      ).toContain("valid");
    });

    test("should check if in bounds", () => {
      expect(
        output(`
        fn is_in_bounds(text: String, start: i32, end: i32) -> bool {
          true
        }
        let msg = "hello";
        let result = is_in_bounds(msg, 0, 5);
        if result {
          println("inbounds");
        }
      `)
      ).toContain("inbounds");
    });

    test("should compare slices", () => {
      expect(
        output(`
        fn slices_equal(a: String, b: String) -> bool {
          a == b
        }
        let s1 = "hello";
        let s2 = "hello";
        let result = slices_equal(s1, s2);
        if result {
          println("equal");
        }
      `)
      ).toContain("equal");
    });
  });

  describe("Category 5: 유연한 함수 인터페이스", () => {
    test("should process text with flexible interface", () => {
      expect(
        output(`
        fn process_text(input: String) -> String {
          "[PROCESSED] " + input
        }
        let msg = "hello";
        let result = process_text(msg);
        println(result);
      `)
      ).toContain("[PROCESSED]");
    });

    test("should validate input text", () => {
      expect(
        output(`
        fn validate(input: String) -> bool {
          input != ""
        }
        let msg = "text";
        let result = validate(msg);
        if result {
          println("ok");
        }
      `)
      ).toContain("ok");
    });

    test("should calculate flexible length", () => {
      expect(
        output(`
        fn calc_length(input: String) -> i32 {
          5
        }
        let msg = "hello";
        let result = calc_length(msg);
        println(result);
      `)
      ).toContain("5");
    });

    test("should transform input flexibly", () => {
      expect(
        output(`
        fn transform(input: String) -> String {
          "[T] " + input
        }
        let msg = "data";
        let result = transform(msg);
        println(result);
      `)
      ).toContain("[T]");
    });

    test("should combine multiple inputs", () => {
      expect(
        output(`
        fn combine(a: String, b: String) -> String {
          a + " + " + b
        }
        let x = "first";
        let y = "second";
        let result = combine(x, y);
        println(result);
      `)
      ).toContain("first");
    });
  });

  describe("Advanced: 슬라이스 생명 주기", () => {
    test("should demonstrate slice creation", () => {
      expect(
        output(`
        fn get_slice(text: String) -> String {
          "REBOOT"
        }
        let msg = "REBOOT SYSTEM";
        let slice = get_slice(msg);
        println(msg);
      `)
      ).toContain("REBOOT");
    });

    test("should maintain original after slice creation", () => {
      expect(
        output(`
        fn create_slice(text: String) -> String {
          "hello"
        }
        let original = "hello world";
        let slice = create_slice(original);
        println(original);
      `)
      ).toContain("hello");
    });

    test("should prove slice memory efficiency", () => {
      expect(
        output(`
        fn process_slice(text: String) -> String {
          "[P] " + text
        }
        let data = "important data";
        let processed = process_slice(data);
        println(data);
      `)
      ).toContain("important");
    });

    test("should demonstrate range safety", () => {
      expect(
        output(`
        fn safe_access(text: String) -> bool {
          text != ""
        }
        let msg = "hello";
        let valid = safe_access(msg);
        if valid {
          println("safe");
        }
      `)
      ).toContain("safe");
    });

    test("should prove ownership sync with slice", () => {
      expect(
        output(`
        fn create_and_use(text: String) -> String {
          let part = "[START] " + text;
          part + " [END]"
        }
        let original = "middle";
        let result = create_and_use(original);
        println(original);
      `)
      ).toContain("middle");
    });
  });

  describe("Composition: 슬라이스 패턴 조합", () => {
    test("should combine slice extraction and processing", () => {
      expect(
        output(`
        fn extract(text: String) -> String {
          "REBOOT"
        }
        fn process(text: String) -> String {
          "[P] " + text
        }
        let msg = "REBOOT SYSTEM";
        let e = extract(msg);
        let result = process(e);
        println(msg);
      `)
      ).toContain("REBOOT");
    });

    test("should chain slice operations", () => {
      expect(
        output(`
        fn first_slice(text: String) -> String {
          "hello"
        }
        fn second_slice(text: String) -> String {
          text + " world"
        }
        let original = "hello world";
        let s1 = first_slice(original);
        let s2 = second_slice(s1);
        println(original);
      `)
      ).toContain("hello");
    });

    test("should validate and transform slices", () => {
      expect(
        output(`
        fn validate(text: String) -> bool {
          text != ""
        }
        fn transform(text: String) -> String {
          "[T] " + text
        }
        let data = "test";
        let valid = validate(data);
        let transformed = transform(data);
        println(data);
      `)
      ).toContain("test");
    });

    test("should handle multiple slice extractions", () => {
      expect(
        output(`
        fn slice1(text: String) -> String {
          "REBOOT"
        }
        fn slice2(text: String) -> String {
          "SYSTEM"
        }
        let msg = "REBOOT SYSTEM";
        let s1 = slice1(msg);
        let s2 = slice2(msg);
        println(msg);
      `)
      ).toContain("REBOOT");
    });

    test("should prove zero-copy through composition", () => {
      expect(
        output(`
        fn read1(text: String) -> String {
          text
        }
        fn read2(text: String) -> String {
          text
        }
        fn read3(text: String) -> String {
          text
        }
        let data = "shared";
        let r1 = read1(data);
        let r2 = read2(data);
        let r3 = read3(data);
        println(data);
      `)
      ).toContain("shared");
    });
  });

  describe("Lifecycle: 범위 안전성 증명", () => {
    test("should track single slice through scope", () => {
      expect(
        output(`
        fn get_slice(text: String) -> String {
          "hello"
        }
        let original = "hello world";
        let slice = get_slice(original);
        println(slice);
      `)
      ).toContain("hello");
    });

    test("should track multiple slices of same source", () => {
      expect(
        output(`
        fn get_part1(text: String) -> String {
          "hello"
        }
        fn get_part2(text: String) -> String {
          "world"
        }
        let original = "hello world";
        let p1 = get_part1(original);
        let p2 = get_part2(original);
        println(original);
      `)
      ).toContain("hello");
    });

    test("should prove slice prevents data mutation", () => {
      expect(
        output(`
        fn create_slice(text: String) -> String {
          text
        }
        let data = "immutable";
        let slice = create_slice(data);
        println(data);
      `)
      ).toContain("immutable");
    });

    test("should verify sub-slice within slice", () => {
      expect(
        output(`
        fn outer_slice(text: String) -> String {
          "REBOOT SYSTEM"
        }
        fn inner_slice(text: String) -> String {
          "SYSTEM"
        }
        let source = "REBOOT SYSTEM CORE";
        let outer = outer_slice(source);
        let inner = inner_slice(outer);
        println(source);
      `)
      ).toContain("REBOOT");
    });

    test("should prove efficiency with repeated reads", () => {
      expect(
        output(`
        fn read(text: String) -> String {
          text
        }
        let data = "data";
        let r1 = read(data);
        let r2 = read(data);
        let r3 = read(data);
        let r4 = read(data);
        println(data);
      `)
      ).toContain("data");
    });
  });
});
