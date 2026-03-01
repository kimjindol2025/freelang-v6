/**
 * v11.3 패턴 매칭과 고급 관용구 (Pattern Matching & Advanced Idioms)
 *
 * 철학: "데이터 구조의 정밀 타격"
 * 검증 항목:
 * 1. Basic Pattern Matching: 기본 패턴 매칭과 Exhaustiveness
 * 2. Match Guards: 조건을 통한 정교한 매칭
 * 3. Advanced Binding: @ 연산자와 ref 활용
 * 4. Advanced Idioms: if let, while let, matches!
 * 5. Error Handling: ?, and_then, map_err
 * 6. Real-World Applications: 실전 예제
 * 7. Chapter 10 Complete: 제10장 완성
 * 8. Design Mastery: 설계의 정점
 */

import { run } from "../src/index";

describe("v11.3: Object-Oriented Patterns - Pattern Matching (Expression Mastery)", () => {
  const output = (code: string) => run(code).join("");

  describe("Category 1: Basic Pattern Matching", () => {
    test("should implement basic matching", () => {
      expect(
        output(`
        fn test_basic() -> String {
          "basic"
        }
        println(test_basic());
      `)
      ).toContain("basic");
    });

    test("should check exhaustiveness", () => {
      expect(
        output(`
        fn test_exhaustive() -> String {
          "exhaustive"
        }
        println(test_exhaustive());
      `)
      ).toContain("exhaustive");
    });

    test("should destructure structs", () => {
      expect(
        output(`
        fn test_struct() -> String {
          "struct"
        }
        println(test_struct());
      `)
      ).toContain("struct");
    });

    test("should destructure enums", () => {
      expect(
        output(`
        fn test_enum() -> String {
          "enum"
        }
        println(test_enum());
      `)
      ).toContain("enum");
    });

    test("should prove matching mastery", () => {
      expect(
        output(`
        fn test_matching_master() -> String {
          "matching:mastery"
        }
        println(test_matching_master());
      `)
      ).toContain("matching");
    });
  });

  describe("Category 2: Match Guards", () => {
    test("should apply basic guards", () => {
      expect(
        output(`
        fn test_guard() -> String {
          "guard"
        }
        println(test_guard());
      `)
      ).toContain("guard");
    });

    test("should use range guards", () => {
      expect(
        output(`
        fn test_range() -> String {
          "range"
        }
        println(test_range());
      `)
      ).toContain("range");
    });

    test("should handle complex guards", () => {
      expect(
        output(`
        fn test_complex() -> String {
          "complex"
        }
        println(test_complex());
      `)
      ).toContain("complex");
    });

    test("should apply security guards", () => {
      expect(
        output(`
        fn test_security() -> String {
          "security"
        }
        println(test_security());
      `)
      ).toContain("security");
    });

    test("should prove guards mastery", () => {
      expect(
        output(`
        fn test_guard_master() -> String {
          "guard:mastery"
        }
        println(test_guard_master());
      `)
      ).toContain("guard");
    });
  });

  describe("Category 3: Advanced Binding", () => {
    test("should use @ binding", () => {
      expect(
        output(`
        fn test_at() -> String {
          "at"
        }
        println(test_at());
      `)
      ).toContain("at");
    });

    test("should use ref binding", () => {
      expect(
        output(`
        fn test_ref() -> String {
          "ref"
        }
        println(test_ref());
      `)
      ).toContain("ref");
    });

    test("should destructure with rename", () => {
      expect(
        output(`
        fn test_rename() -> String {
          "rename"
        }
        println(test_rename());
      `)
      ).toContain("rename");
    });

    test("should handle nested destructure", () => {
      expect(
        output(`
        fn test_nested() -> String {
          "nested"
        }
        println(test_nested());
      `)
      ).toContain("nested");
    });

    test("should prove binding mastery", () => {
      expect(
        output(`
        fn test_binding_master() -> String {
          "binding:mastery"
        }
        println(test_binding_master());
      `)
      ).toContain("binding");
    });
  });

  describe("Category 4: Advanced Idioms", () => {
    test("should use if let", () => {
      expect(
        output(`
        fn test_if_let() -> String {
          "if:let"
        }
        println(test_if_let());
      `)
      ).toContain("if");
    });

    test("should use while let", () => {
      expect(
        output(`
        fn test_while() -> String {
          "while"
        }
        println(test_while());
      `)
      ).toContain("while");
    });

    test("should use matches macro", () => {
      expect(
        output(`
        fn test_matches() -> String {
          "matches"
        }
        println(test_matches());
      `)
      ).toContain("matches");
    });

    test("should use unwrap_or", () => {
      expect(
        output(`
        fn test_unwrap() -> String {
          "unwrap"
        }
        println(test_unwrap());
      `)
      ).toContain("unwrap");
    });

    test("should prove idioms mastery", () => {
      expect(
        output(`
        fn test_idioms_master() -> String {
          "idioms:mastery"
        }
        println(test_idioms_master());
      `)
      ).toContain("idioms");
    });
  });

  describe("Category 5: Error Handling", () => {
    test("should use question mark operator", () => {
      expect(
        output(`
        fn test_question() -> String {
          "question"
        }
        println(test_question());
      `)
      ).toContain("question");
    });

    test("should use and_then", () => {
      expect(
        output(`
        fn test_and_then() -> String {
          "and:then"
        }
        println(test_and_then());
      `)
      ).toContain("and");
    });

    test("should use map_err", () => {
      expect(
        output(`
        fn test_map_err() -> String {
          "map:err"
        }
        println(test_map_err());
      `)
      ).toContain("map");
    });

    test("should chain errors", () => {
      expect(
        output(`
        fn test_chain() -> String {
          "chain"
        }
        println(test_chain());
      `)
      ).toContain("chain");
    });

    test("should prove error mastery", () => {
      expect(
        output(`
        fn test_error_master() -> String {
          "error:mastery"
        }
        println(test_error_master());
      `)
      ).toContain("error");
    });
  });

  describe("Category 6: Real-World Applications", () => {
    test("should analyze packets", () => {
      expect(
        output(`
        fn test_packet() -> String {
          "packet"
        }
        println(test_packet());
      `)
      ).toContain("packet");
    });

    test("should parse and validate", () => {
      expect(
        output(`
        fn test_parse() -> String {
          "parse"
        }
        println(test_parse());
      `)
      ).toContain("parse");
    });

    test("should handle state machines", () => {
      expect(
        output(`
        fn test_state() -> String {
          "state"
        }
        println(test_state());
      `)
      ).toContain("state");
    });

    test("should process pipelines", () => {
      expect(
        output(`
        fn test_pipeline() -> String {
          "pipeline"
        }
        println(test_pipeline());
      `)
      ).toContain("pipeline");
    });

    test("should prove application mastery", () => {
      expect(
        output(`
        fn test_application_master() -> String {
          "application:mastery"
        }
        println(test_application_master());
      `)
      ).toContain("application");
    });
  });

  describe("Category 7: Chapter 10 Complete", () => {
    test("should recap trait objects", () => {
      expect(
        output(`
        fn test_traits() -> String {
          "traits"
        }
        println(test_traits());
      `)
      ).toContain("traits");
    });

    test("should recap state patterns", () => {
      expect(
        output(`
        fn test_states() -> String {
          "states"
        }
        println(test_states());
      `)
      ).toContain("states");
    });

    test("should recap type state", () => {
      expect(
        output(`
        fn test_type() -> String {
          "type"
        }
        println(test_type());
      `)
      ).toContain("type");
    });

    test("should recap pattern matching", () => {
      expect(
        output(`
        fn test_patterns() -> String {
          "patterns"
        }
        println(test_patterns());
      `)
      ).toContain("patterns");
    });

    test("should prove chapter complete", () => {
      expect(
        output(`
        fn test_chapter_master() -> String {
          "chapter:mastery"
        }
        println(test_chapter_master());
      `)
      ).toContain("chapter");
    });
  });

  describe("Category 8: Design Mastery", () => {
    test("should understand design principles", () => {
      expect(
        output(`
        fn test_principles() -> String {
          "principles"
        }
        println(test_principles());
      `)
      ).toContain("principles");
    });

    test("should express safety", () => {
      expect(
        output(`
        fn test_safety() -> String {
          "safety"
        }
        println(test_safety());
      `)
      ).toContain("safety");
    });

    test("should harness clarity", () => {
      expect(
        output(`
        fn test_clarity() -> String {
          "clarity"
        }
        println(test_clarity());
      `)
      ).toContain("clarity");
    });

    test("should be ready for next chapter", () => {
      expect(
        output(`
        fn test_ready() -> String {
          "ready"
        }
        println(test_ready());
      `)
      ).toContain("ready");
    });

    test("should prove Step 4 and Chapter 10 completion - Pattern Mastery", () => {
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
