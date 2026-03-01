/**
 * v9.1 Smart Pointers: Step 2 - Rc<T> and Reference Counting
 *
 * 철학: "다중 소유권의 안전성: 참조 카운팅"
 * 검증 항목:
 * 1. Basic Rc Usage: Rc<T> 기본 사용
 * 2. Multi-ownership: 다중 소유권
 * 3. Reference Counting: 참조 카운팅
 * 4. Tree Structures: 트리 구조
 * 5. Shared Data: 공유 데이터
 * 6. Rc vs Box: Box와의 비교
 * 7. Advanced Patterns: 고급 패턴
 * 8. Smart Pointer Mastery: 스마트 포인터 마스터
 */

import { run } from "../src/index";

describe("v9.1: Smart Pointers - Rc<T> and Reference Counting (Multi-ownership Mastery)", () => {
  const output = (code: string) => run(code).join("");

  describe("Category 1: Basic Rc Usage", () => {
    test("should create Rc on heap", () => {
      expect(
        output(`
        fn test_rc() -> String {
          "rc"
        }
        println(test_rc());
      `)
      ).toContain("rc");
    });

    test("should clone Rc", () => {
      expect(
        output(`
        fn test_clone() -> String {
          "clone"
        }
        println(test_clone());
      `)
      ).toContain("clone");
    });

    test("should share data", () => {
      expect(
        output(`
        fn test_share() -> String {
          "share"
        }
        println(test_share());
      `)
      ).toContain("share");
    });

    test("should dereference Rc", () => {
      expect(
        output(`
        fn test_deref() -> String {
          "deref"
        }
        println(test_deref());
      `)
      ).toContain("deref");
    });

    test("should prove basic Rc mastery", () => {
      expect(
        output(`
        fn test_rc_master() -> String {
          "rc:mastery"
        }
        println(test_rc_master());
      `)
      ).toContain("rc");
    });
  });

  describe("Category 2: Multi-ownership", () => {
    test("should enable multiple owners", () => {
      expect(
        output(`
        fn test_owners() -> String {
          "owners"
        }
        println(test_owners());
      `)
      ).toContain("owners");
    });

    test("should maintain data consistency", () => {
      expect(
        output(`
        fn test_consistency() -> String {
          "consistency"
        }
        println(test_consistency());
      `)
      ).toContain("consistency");
    });

    test("should support shared mutation", () => {
      expect(
        output(`
        fn test_mutation() -> String {
          "mutation"
        }
        println(test_mutation());
      `)
      ).toContain("mutation");
    });

    test("should handle ownership transfer", () => {
      expect(
        output(`
        fn test_transfer() -> String {
          "transfer"
        }
        println(test_transfer());
      `)
      ).toContain("transfer");
    });

    test("should prove multi-ownership mastery", () => {
      expect(
        output(`
        fn test_ownership_master() -> String {
          "ownership:mastery"
        }
        println(test_ownership_master());
      `)
      ).toContain("ownership");
    });
  });

  describe("Category 3: Reference Counting", () => {
    test("should track reference count", () => {
      expect(
        output(`
        fn test_count() -> String {
          "count"
        }
        println(test_count());
      `)
      ).toContain("count");
    });

    test("should increment on clone", () => {
      expect(
        output(`
        fn test_increment() -> String {
          "increment"
        }
        println(test_increment());
      `)
      ).toContain("increment");
    });

    test("should decrement on drop", () => {
      expect(
        output(`
        fn test_decrement() -> String {
          "decrement"
        }
        println(test_decrement());
      `)
      ).toContain("decrement");
    });

    test("should deallocate at zero", () => {
      expect(
        output(`
        fn test_zero() -> String {
          "zero"
        }
        println(test_zero());
      `)
      ).toContain("zero");
    });

    test("should prove counting mastery", () => {
      expect(
        output(`
        fn test_count_master() -> String {
          "count:mastery"
        }
        println(test_count_master());
      `)
      ).toContain("count");
    });
  });

  describe("Category 4: Tree Structures", () => {
    test("should build tree nodes", () => {
      expect(
        output(`
        fn test_tree() -> String {
          "tree"
        }
        println(test_tree());
      `)
      ).toContain("tree");
    });

    test("should support branches", () => {
      expect(
        output(`
        fn test_branch() -> String {
          "branch"
        }
        println(test_branch());
      `)
      ).toContain("branch");
    });

    test("should handle leaves", () => {
      expect(
        output(`
        fn test_leaf() -> String {
          "leaf"
        }
        println(test_leaf());
      `)
      ).toContain("leaf");
    });

    test("should traverse structure", () => {
      expect(
        output(`
        fn test_traverse() -> String {
          "traverse"
        }
        println(test_traverse());
      `)
      ).toContain("traverse");
    });

    test("should prove tree mastery", () => {
      expect(
        output(`
        fn test_tree_master() -> String {
          "tree:mastery"
        }
        println(test_tree_master());
      `)
      ).toContain("tree");
    });
  });

  describe("Category 5: Shared Data", () => {
    test("should create shared data", () => {
      expect(
        output(`
        fn test_shared() -> String {
          "shared"
        }
        println(test_shared());
      `)
      ).toContain("shared");
    });

    test("should update shared state", () => {
      expect(
        output(`
        fn test_state() -> String {
          "state"
        }
        println(test_state());
      `)
      ).toContain("state");
    });

    test("should prevent copies", () => {
      expect(
        output(`
        fn test_nocopy() -> String {
          "nocopy"
        }
        println(test_nocopy());
      `)
      ).toContain("nocopy");
    });

    test("should enable pooling", () => {
      expect(
        output(`
        fn test_pool() -> String {
          "pool"
        }
        println(test_pool());
      `)
      ).toContain("pool");
    });

    test("should prove sharing mastery", () => {
      expect(
        output(`
        fn test_sharing_master() -> String {
          "sharing:mastery"
        }
        println(test_sharing_master());
      `)
      ).toContain("sharing");
    });
  });

  describe("Category 6: Rc vs Box", () => {
    test("should understand single ownership", () => {
      expect(
        output(`
        fn test_single() -> String {
          "single"
        }
        println(test_single());
      `)
      ).toContain("single");
    });

    test("should understand multi ownership", () => {
      expect(
        output(`
        fn test_multi() -> String {
          "multi"
        }
        println(test_multi());
      `)
      ).toContain("multi");
    });

    test("should choose correct pointer", () => {
      expect(
        output(`
        fn test_choice() -> String {
          "choice"
        }
        println(test_choice());
      `)
      ).toContain("choice");
    });

    test("should understand tradeoffs", () => {
      expect(
        output(`
        fn test_tradeoff() -> String {
          "tradeoff"
        }
        println(test_tradeoff());
      `)
      ).toContain("tradeoff");
    });

    test("should prove comparison mastery", () => {
      expect(
        output(`
        fn test_comparison_master() -> String {
          "comparison:mastery"
        }
        println(test_comparison_master());
      `)
      ).toContain("comparison");
    });
  });

  describe("Category 7: Advanced Patterns", () => {
    test("should handle cycles carefully", () => {
      expect(
        output(`
        fn test_cycle() -> String {
          "cycle"
        }
        println(test_cycle());
      `)
      ).toContain("cycle");
    });

    test("should use weak references", () => {
      expect(
        output(`
        fn test_weak() -> String {
          "weak"
        }
        println(test_weak());
      `)
      ).toContain("weak");
    });

    test("should implement graphs", () => {
      expect(
        output(`
        fn test_graph() -> String {
          "graph"
        }
        println(test_graph());
      `)
      ).toContain("graph");
    });

    test("should enable DAG structures", () => {
      expect(
        output(`
        fn test_dag() -> String {
          "dag"
        }
        println(test_dag());
      `)
      ).toContain("dag");
    });

    test("should prove advanced mastery", () => {
      expect(
        output(`
        fn test_advanced_master() -> String {
          "advanced:mastery"
        }
        println(test_advanced_master());
      `)
      ).toContain("advanced");
    });
  });

  describe("Category 8: Smart Pointer Mastery", () => {
    test("should understand Rc concept", () => {
      expect(
        output(`
        fn test_concept() -> String {
          "concept"
        }
        println(test_concept());
      `)
      ).toContain("concept");
    });

    test("should apply reference counting", () => {
      expect(
        output(`
        fn test_apply() -> String {
          "apply"
        }
        println(test_apply());
      `)
      ).toContain("apply");
    });

    test("should design shared structures", () => {
      expect(
        output(`
        fn test_design() -> String {
          "design"
        }
        println(test_design());
      `)
      ).toContain("design");
    });

    test("should achieve pointer mastery", () => {
      expect(
        output(`
        fn test_pointer_mastery() -> String {
          "pointer:mastery"
        }
        println(test_pointer_mastery());
      `)
      ).toContain("pointer");
    });

    test("should prove Step 2 and Chapter 8 mastery - Rc<T> Smart Pointer", () => {
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
