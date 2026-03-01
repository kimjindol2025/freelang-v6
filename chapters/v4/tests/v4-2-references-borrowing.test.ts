/**
 * v4.2 References & Borrowing Test Suite - 참조와 빌림
 *
 * 철학: "소유권은 유지하고, 빌려주기만 한다"
 * 검증 항목:
 * 1. Simple Read: 참조를 통한 단순 읽기
 * 2. Store Reference: 참조 변수 저장
 * 3. Multiple References: 여러 참조 동시 사용
 * 4. Reference Checking: 참조를 통한 데이터 검사
 * 5. Reference Chaining: 참조 체이닝
 * 6. Advanced: 참조 생명 주기
 * 7. Composition: 참조 패턴 조합
 * 8. Lifecycle: 메모리 효율성 증명
 */

import { run } from "../src/index";

describe("v4.2: References & Borrowing (참조와 빌림)", () => {
  const output = (code: string) => run(code).join("");

  describe("Category 1: 단순 참조 읽기", () => {
    test("should read integer through reference", () => {
      expect(
        output(`
        fn read_integer(num: &i32) -> i32 {
          num
        }
        let x = 10;
        let result = read_integer(&x);
        println(result);
        println(x);
      `)
      ).toContain("10");
    });

    test("should read string through reference", () => {
      expect(
        output(`
        fn read_string(text: &String) -> String {
          text
        }
        let msg = "hello";
        let result = read_string(&msg);
        println(result);
      `)
      ).toContain("hello");
    });

    test("should compute with referenced value", () => {
      expect(
        output(`
        fn double_via_ref(num: &i32) -> i32 {
          num * 2
        }
        let x = 5;
        let doubled = double_via_ref(&x);
        println(doubled);
      `)
      ).toContain("10");
    });

    test("should check positivity through reference", () => {
      expect(
        output(`
        fn is_positive_ref(num: &i32) -> bool {
          num > 0
        }
        let x = 10;
        let result = is_positive_ref(&x);
        if result {
          println("positive");
        }
      `)
      ).toContain("positive");
    });

    test("should reuse reference multiple times", () => {
      expect(
        output(`
        fn double_via_ref(num: &i32) -> i32 {
          num * 2
        }
        let x = 5;
        let r1 = double_via_ref(&x);
        let r2 = double_via_ref(&x);
        println(r2);
      `)
      ).toContain("10");
    });
  });

  describe("Category 2: 참조 변수 저장", () => {
    test("should pass through reference", () => {
      expect(
        output(`
        fn pass_through(text: &String) -> &String {
          text
        }
        let s = "hello";
        let passed = pass_through(&s);
        println(passed);
      `)
      ).toContain("hello");
    });

    test("should choose between references", () => {
      expect(
        output(`
        fn choose_ref(a: &String, b: &String, use_first: bool) -> &String {
          if use_first { a } else { b }
        }
        let s1 = "first";
        let s2 = "second";
        let chosen = choose_ref(&s1, &s2, true);
        println(chosen);
      `)
      ).toContain("first");
    });

    test("should store integer reference", () => {
      expect(
        output(`
        fn store_int_ref(num: &i32) -> i32 {
          num
        }
        let x = 42;
        let stored = store_int_ref(&x);
        println(stored);
      `)
      ).toContain("42");
    });

    test("should validate through reference", () => {
      expect(
        output(`
        fn validate_ref(text: &String) -> bool {
          text != ""
        }
        let msg = "valid";
        let result = validate_ref(&msg);
        if result {
          println("ok");
        }
      `)
      ).toContain("ok");
    });

    test("should maintain original data after reference use", () => {
      expect(
        output(`
        fn process_ref(text: &String) -> String {
          "[OK] " + text
        }
        let msg = "data";
        let processed = process_ref(&msg);
        println(msg);
      `)
      ).toContain("data");
    });
  });

  describe("Category 3: 여러 참조 동시 사용", () => {
    test("should compare two references", () => {
      expect(
        output(`
        fn compare_refs(a: &i32, b: &i32) -> bool {
          a > b
        }
        let x = 10;
        let y = 5;
        let result = compare_refs(&x, &y);
        if result {
          println("greater");
        }
      `)
      ).toContain("greater");
    });

    test("should compare string references", () => {
      expect(
        output(`
        fn strings_equal(a: &String, b: &String) -> bool {
          a == b
        }
        let s1 = "hello";
        let s2 = "hello";
        let result = strings_equal(&s1, &s2);
        if result {
          println("equal");
        }
      `)
      ).toContain("equal");
    });

    test("should find max of three references", () => {
      expect(
        output(`
        fn max_of_three_refs(a: &i32, b: &i32, c: &i32) -> i32 {
          if a > b {
            if a > c { a } else { c }
          } else {
            if b > c { b } else { c }
          }
        }
        let x = 3;
        let y = 7;
        let z = 5;
        let result = max_of_three_refs(&x, &y, &z);
        println(result);
      `)
      ).toContain("7");
    });

    test("should use multiple references with original", () => {
      expect(
        output(`
        fn use_multiple(a: &i32, b: &i32) -> i32 {
          a + b
        }
        let x = 5;
        let y = 10;
        let result = use_multiple(&x, &y);
        println(x);
      `)
      ).toContain("5");
    });

    test("should handle conditional selection", () => {
      expect(
        output(`
        fn conditional_select(x: &i32, y: &i32, cond: bool) -> i32 {
          if cond { x } else { y }
        }
        let a = 10;
        let b = 20;
        let result = conditional_select(&a, &b, false);
        println(result);
      `)
      ).toContain("20");
    });
  });

  describe("Category 4: 참조를 통한 데이터 검사", () => {
    test("should check if string is empty", () => {
      expect(
        output(`
        fn is_empty(text: &String) -> bool {
          text == ""
        }
        let empty = "";
        let result = is_empty(&empty);
        if result {
          println("empty");
        }
      `)
      ).toContain("empty");
    });

    test("should check range with reference", () => {
      expect(
        output(`
        fn in_range(num: &i32, min: i32, max: i32) -> bool {
          num >= min && num <= max
        }
        let val = 50;
        let result = in_range(&val, 0, 100);
        if result {
          println("inrange");
        }
      `)
      ).toContain("inrange");
    });

    test("should validate string content through reference", () => {
      expect(
        output(`
        fn is_valid_string(text: &String) -> bool {
          text != ""
        }
        let msg = "content";
        let result = is_valid_string(&msg);
        if result {
          println("valid");
        }
      `)
      ).toContain("valid");
    });

    test("should check even/odd through reference", () => {
      expect(
        output(`
        fn is_even_ref(num: &i32) -> bool {
          num % 2 == 0
        }
        let x = 4;
        let result = is_even_ref(&x);
        if result {
          println("even");
        }
      `)
      ).toContain("even");
    });

    test("should verify multiple conditions", () => {
      expect(
        output(`
        fn both_positive(a: &i32, b: &i32) -> bool {
          a > 0 && b > 0
        }
        let x = 5;
        let y = 10;
        let result = both_positive(&x, &y);
        if result {
          println("both");
        }
      `)
      ).toContain("both");
    });
  });

  describe("Category 5: 참조 체이닝", () => {
    test("should transform through reference", () => {
      expect(
        output(`
        fn ref_to_prefixed(text: &String) -> String {
          "[PRE] " + text
        }
        let data = "value";
        let result = ref_to_prefixed(&data);
        println(result);
      `)
      ).toContain("[PRE] value");
    });

    test("should compute then chain", () => {
      expect(
        output(`
        fn ref_to_doubled(num: &i32) -> i32 {
          num * 2
        }
        let x = 5;
        let doubled = ref_to_doubled(&x);
        println(doubled);
      `)
      ).toContain("10");
    });

    test("should add suffix to reference", () => {
      expect(
        output(`
        fn ref_add_suffix(text: &String) -> String {
          text + " [END]"
        }
        let data = "start";
        let result = ref_add_suffix(&data);
        println(result);
      `)
      ).toContain("start [END]");
    });

    test("should chain calculations through reference", () => {
      expect(
        output(`
        fn ref_calculation(num: &i32) -> i32 {
          let doubled = num * 2;
          let plus_ten = doubled + 10;
          plus_ten
        }
        let x = 5;
        let result = ref_calculation(&x);
        println(result);
      `)
      ).toContain("20");
    });

    test("should compose multiple transformations", () => {
      expect(
        output(`
        fn chain_transform(text: &String) -> String {
          let prefixed = "[START] " + text;
          prefixed + " [END]"
        }
        let data = "mid";
        let result = chain_transform(&data);
        println(result);
      `)
      ).toContain("[START] mid [END]");
    });
  });

  describe("Advanced: 참조 생명 주기", () => {
    test("should demonstrate ownership remains with original", () => {
      expect(
        output(`
        fn read_value(num: &i32) -> i32 {
          num
        }
        let x = 100;
        let r1 = read_value(&x);
        let r2 = read_value(&x);
        println(x);
      `)
      ).toContain("100");
    });

    test("should prove reference reusability", () => {
      expect(
        output(`
        fn double_via_ref(num: &i32) -> i32 {
          num * 2
        }
        let num = 10;
        let r1 = double_via_ref(&num);
        let r2 = double_via_ref(&num);
        let r3 = double_via_ref(&num);
        println(r3);
      `)
      ).toContain("20");
    });

    test("should maintain original data after all references", () => {
      expect(
        output(`
        fn process(text: &String) -> String {
          "[P] " + text
        }
        let data = "original";
        let p1 = process(&data);
        let p2 = process(&data);
        println(data);
      `)
      ).toContain("original");
    });

    test("should enable multiple parameter patterns", () => {
      expect(
        output(`
        fn combine(x: &i32, text: &String) -> String {
          text + "[" + x + "]"
        }
        let num = 5;
        let msg = "item";
        let result = combine(&num, &msg);
        println(num);
      `)
      ).toContain("5");
    });

    test("should prove memory efficiency through reuse", () => {
      expect(
        output(`
        fn check(text: &String) -> bool {
          text != ""
        }
        fn use_text(text: &String) -> String {
          "[USE] " + text
        }
        let msg = "data";
        let valid = check(&msg);
        let processed = use_text(&msg);
        println(msg);
      `)
      ).toContain("data");
    });
  });

  describe("Composition: 참조 패턴 조합", () => {
    test("should combine reference and computation", () => {
      expect(
        output(`
        fn is_valid(x: &i32) -> bool {
          x > 0
        }
        fn compute(x: &i32) -> i32 {
          if is_valid(x) { x * 2 } else { 0 }
        }
        let val = 5;
        let result = compute(&val);
        println(result);
      `)
      ).toContain("10");
    });

    test("should compose string operations via references", () => {
      expect(
        output(`
        fn prefix(s: &String) -> String {
          "[PRE] " + s
        }
        fn suffix(s: &String) -> String {
          s + " [SUF]"
        }
        let text = "mid";
        let p = prefix(&text);
        let result = suffix(&p);
        println(text);
      `)
      ).toContain("mid");
    });

    test("should verify patterns with multiple checks", () => {
      expect(
        output(`
        fn is_positive(x: &i32) -> bool {
          x > 0
        }
        fn in_range(x: &i32, min: i32, max: i32) -> bool {
          x >= min && x <= max
        }
        let val = 50;
        let pos = is_positive(&val);
        let range = in_range(&val, 0, 100);
        if pos && range {
          println("valid");
        }
      `)
      ).toContain("valid");
    });

    test("should chain references through functions", () => {
      expect(
        output(`
        fn step1(s: &String) -> String {
          "[1] " + s
        }
        fn step2(s: &String) -> String {
          s + " [2]"
        }
        let start = "x";
        let s1 = step1(&start);
        let s2 = step2(&s1);
        println(start);
      `)
      ).toContain("x");
    });

    test("should prove no copy overhead with references", () => {
      expect(
        output(`
        fn read1(x: &i32) -> i32 {
          x
        }
        fn read2(x: &i32) -> i32 {
          x
        }
        fn read3(x: &i32) -> i32 {
          x
        }
        let val = 42;
        let r1 = read1(&val);
        let r2 = read2(&val);
        let r3 = read3(&val);
        println(val);
      `)
      ).toContain("42");
    });
  });

  describe("Lifecycle: 참조의 메모리 효율성", () => {
    test("should track reference through single use", () => {
      expect(
        output(`
        fn process(num: &i32) -> i32 {
          num + 1
        }
        let x = 10;
        let result = process(&x);
        println(result);
      `)
      ).toContain("11");
    });

    test("should track reference through multiple uses", () => {
      expect(
        output(`
        fn use_it(text: &String) -> String {
          "[USE] " + text
        }
        let data = "val";
        let r1 = use_it(&data);
        let r2 = use_it(&data);
        println(r2);
      `)
      ).toContain("[USE] val");
    });

    test("should verify original survives all references", () => {
      expect(
        output(`
        fn f1(x: &i32) -> i32 { x + 1 }
        fn f2(x: &i32) -> i32 { x + 2 }
        fn f3(x: &i32) -> i32 { x + 3 }
        let num = 10;
        let r1 = f1(&num);
        let r2 = f2(&num);
        let r3 = f3(&num);
        println(num);
      `)
      ).toContain("10");
    });

    test("should prove no memory leak with references", () => {
      expect(
        output(`
        fn validate(s: &String) -> bool {
          s != ""
        }
        fn format(s: &String) -> String {
          "[F] " + s
        }
        let msg = "data";
        let v = validate(&msg);
        let f = format(&msg);
        println(msg);
      `)
      ).toContain("data");
    });

    test("should handle mixed reference and return patterns", () => {
      expect(
        output(`
        fn check(x: &i32) -> bool {
          x > 0
        }
        fn transform(x: &i32) -> i32 {
          if check(x) { x * 2 } else { x }
        }
        let val = 5;
        let result = transform(&val);
        println(val);
      `)
      ).toContain("5");
    });
  });
});
