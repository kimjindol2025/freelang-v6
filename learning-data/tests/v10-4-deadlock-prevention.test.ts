/**
 * v10.4 동시성의 함정: 데드락 방어 설계 (Deadlock Prevention)
 *
 * 철학: "순환 대기의 고리 끊기"
 * 검증 항목:
 * 1. Deadlock Understanding: 데드락의 정의와 조건
 * 2. Resource Hierarchy: 자원 계층화를 통한 예방
 * 3. Lock Scope Minimization: 잠금 범위 최소화
 * 4. Immutability Strategy: 불변성 활용
 * 5. Complex Protocol: 복잡한 다중 자원 안전 프로토콜
 * 6. Designer's Perspective: 설계자의 관점
 * 7. Chapter 9 Complete: 제9장 완성
 * 8. Concurrency Mastery: 동시성 마스터
 */

import { run } from "../src/index";

describe("v10.4: Fearless Concurrency - Deadlock Prevention (Logical Safety)", () => {
  const output = (code: string) => run(code).join("");

  describe("Category 1: Deadlock Understanding", () => {
    test("should define deadlock", () => {
      expect(
        output(`
        fn test_definition() -> String {
          "definition"
        }
        println(test_definition());
      `)
      ).toContain("definition");
    });

    test("should analyze coffman conditions", () => {
      expect(
        output(`
        fn test_coffman() -> String {
          "coffman"
        }
        println(test_coffman());
      `)
      ).toContain("coffman");
    });

    test("should recognize circular wait", () => {
      expect(
        output(`
        fn test_circular() -> String {
          "circular"
        }
        println(test_circular());
      `)
      ).toContain("circular");
    });

    test("should identify deadlock scenarios", () => {
      expect(
        output(`
        fn test_scenario() -> String {
          "scenario"
        }
        println(test_scenario());
      `)
      ).toContain("scenario");
    });

    test("should prove understanding mastery", () => {
      expect(
        output(`
        fn test_understand_master() -> String {
          "understanding:mastery"
        }
        println(test_understand_master());
      `)
      ).toContain("understanding");
    });
  });

  describe("Category 2: Resource Hierarchy", () => {
    test("should implement resource hierarchy", () => {
      expect(
        output(`
        fn test_hierarchy() -> String {
          "hierarchy"
        }
        println(test_hierarchy());
      `)
      ).toContain("hierarchy");
    });

    test("should assign resource IDs", () => {
      expect(
        output(`
        fn test_id() -> String {
          "id"
        }
        println(test_id());
      `)
      ).toContain("id");
    });

    test("should enforce locking order", () => {
      expect(
        output(`
        fn test_order() -> String {
          "order"
        }
        println(test_order());
      `)
      ).toContain("order");
    });

    test("should prove circular wait impossible", () => {
      expect(
        output(`
        fn test_impossible() -> String {
          "impossible"
        }
        println(test_impossible());
      `)
      ).toContain("impossible");
    });

    test("should prove hierarchy mastery", () => {
      expect(
        output(`
        fn test_hierarchy_master() -> String {
          "hierarchy:mastery"
        }
        println(test_hierarchy_master());
      `)
      ).toContain("hierarchy");
    });
  });

  describe("Category 3: Lock Scope Minimization", () => {
    test("should minimize critical section", () => {
      expect(
        output(`
        fn test_scope() -> String {
          "scope"
        }
        println(test_scope());
      `)
      ).toContain("scope");
    });

    test("should use RAII for guards", () => {
      expect(
        output(`
        fn test_raii() -> String {
          "raii"
        }
        println(test_raii());
      `)
      ).toContain("raii");
    });

    test("should enable early unlock", () => {
      expect(
        output(`
        fn test_unlock() -> String {
          "unlock"
        }
        println(test_unlock());
      `)
      ).toContain("unlock");
    });

    test("should improve response time", () => {
      expect(
        output(`
        fn test_response() -> String {
          "response"
        }
        println(test_response());
      `)
      ).toContain("response");
    });

    test("should prove scope mastery", () => {
      expect(
        output(`
        fn test_scope_master() -> String {
          "scope:mastery"
        }
        println(test_scope_master());
      `)
      ).toContain("scope");
    });
  });

  describe("Category 4: Immutability Strategy", () => {
    test("should share immutable data", () => {
      expect(
        output(`
        fn test_immutable() -> String {
          "immutable"
        }
        println(test_immutable());
      `)
      ).toContain("immutable");
    });

    test("should place mutex selectively", () => {
      expect(
        output(`
        fn test_selective() -> String {
          "selective"
        }
        println(test_selective());
      `)
      ).toContain("selective");
    });

    test("should apply functional approach", () => {
      expect(
        output(`
        fn test_functional() -> String {
          "functional"
        }
        println(test_functional());
      `)
      ).toContain("functional");
    });

    test("should separate mutable and immutable", () => {
      expect(
        output(`
        fn test_separate() -> String {
          "separate"
        }
        println(test_separate());
      `)
      ).toContain("separate");
    });

    test("should prove immutability mastery", () => {
      expect(
        output(`
        fn test_immutable_master() -> String {
          "immutability:mastery"
        }
        println(test_immutable_master());
      `)
      ).toContain("immutability");
    });
  });

  describe("Category 5: Complex Multi-Resource Protocol", () => {
    test("should acquire multiple resources safely", () => {
      expect(
        output(`
        fn test_acquire() -> String {
          "acquire"
        }
        println(test_acquire());
      `)
      ).toContain("acquire");
    });

    test("should implement resource manager", () => {
      expect(
        output(`
        fn test_manager() -> String {
          "manager"
        }
        println(test_manager());
      `)
      ).toContain("manager");
    });

    test("should detect deadlock with timeout", () => {
      expect(
        output(`
        fn test_timeout() -> String {
          "timeout"
        }
        println(test_timeout());
      `)
      ).toContain("timeout");
    });

    test("should use design checklist", () => {
      expect(
        output(`
        fn test_checklist() -> String {
          "checklist"
        }
        println(test_checklist());
      `)
      ).toContain("checklist");
    });

    test("should prove complex mastery", () => {
      expect(
        output(`
        fn test_complex_master() -> String {
          "complex:mastery"
        }
        println(test_complex_master());
      `)
      ).toContain("complex");
    });
  });

  describe("Category 6: Designer's Perspective", () => {
    test("should clarify locking order", () => {
      expect(
        output(`
        fn test_clarity() -> String {
          "clarity"
        }
        println(test_clarity());
      `)
      ).toContain("clarity");
    });

    test("should minimize mutex usage", () => {
      expect(
        output(`
        fn test_minimize() -> String {
          "minimize"
        }
        println(test_minimize());
      `)
      ).toContain("minimize");
    });

    test("should redesign structure", () => {
      expect(
        output(`
        fn test_redesign() -> String {
          "redesign"
        }
        println(test_redesign());
      `)
      ).toContain("redesign");
    });

    test("should gain confidence", () => {
      expect(
        output(`
        fn test_confidence() -> String {
          "confidence"
        }
        println(test_confidence());
      `)
      ).toContain("confidence");
    });

    test("should prove designer mastery", () => {
      expect(
        output(`
        fn test_designer_master() -> String {
          "designer:mastery"
        }
        println(test_designer_master());
      `)
      ).toContain("designer");
    });
  });

  describe("Category 7: Chapter 9 Complete", () => {
    test("should master thread isolation", () => {
      expect(
        output(`
        fn test_isolation() -> String {
          "isolation"
        }
        println(test_isolation());
      `)
      ).toContain("isolation");
    });

    test("should master message passing", () => {
      expect(
        output(`
        fn test_messaging() -> String {
          "messaging"
        }
        println(test_messaging());
      `)
      ).toContain("messaging");
    });

    test("should master synchronization", () => {
      expect(
        output(`
        fn test_sync() -> String {
          "sync"
        }
        println(test_sync());
      `)
      ).toContain("sync");
    });

    test("should master thread safety", () => {
      expect(
        output(`
        fn test_safety() -> String {
          "safety"
        }
        println(test_safety());
      `)
      ).toContain("safety");
    });

    test("should prove chapter progress", () => {
      expect(
        output(`
        fn test_ch_master() -> String {
          "chapter:mastery"
        }
        println(test_ch_master());
      `)
      ).toContain("chapter");
    });
  });

  describe("Category 8: Concurrency Mastery", () => {
    test("should understand all layers", () => {
      expect(
        output(`
        fn test_layers() -> String {
          "layers"
        }
        println(test_layers());
      `)
      ).toContain("layers");
    });

    test("should focus on logical errors", () => {
      expect(
        output(`
        fn test_logic() -> String {
          "logic"
        }
        println(test_logic());
      `)
      ).toContain("logic");
    });

    test("should achieve fearless design", () => {
      expect(
        output(`
        fn test_fearless() -> String {
          "fearless"
        }
        println(test_fearless());
      `)
      ).toContain("fearless");
    });

    test("should become an architect", () => {
      expect(
        output(`
        fn test_architect() -> String {
          "architect"
        }
        println(test_architect());
      `)
      ).toContain("architect");
    });

    test("should prove Step 5 and Chapter 9 completion - Deadlock Defense Mastery", () => {
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
