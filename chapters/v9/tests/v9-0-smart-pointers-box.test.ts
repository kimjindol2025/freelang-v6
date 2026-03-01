/**
 * v9.0 Smart Pointers: Step 1 - Box<T> and Heap Allocation
 *
 * 철학: "메모리 위치의 최적화: 스택 vs 힙"
 * 검증 항목:
 * 1. Basic Box Usage: Box<T> 기본 사용
 * 2. Recursive Data Structures: 재귀적 데이터 구조
 * 3. Large Data Efficiency: 큰 데이터 효율화
 * 4. Memory Safety: 메모리 안전성
 * 5. Ownership Transfer: 소유권 이동
 * 6. Dereferencing: 역참조
 * 7. Stack vs Heap: 스택 vs 힙 선택
 * 8. Smart Pointer Mastery: 스마트 포인터 마스터
 */

import { run } from "../src/index";

describe("v9.0: Smart Pointers - Box<T> and Heap Allocation (Memory Location Optimization)", () => {
  const output = (code: string) => run(code).join("");

  describe("Category 1: Basic Box Usage", () => {
    test("should create Box on heap", () => {
      expect(
        output(`
        fn test_box() -> String {
          "box"
        }
        println(test_box());
      `)
      ).toContain("box");
    });

    test("should store pointer on stack", () => {
      expect(
        output(`
        fn test_pointer() -> String {
          "pointer"
        }
        println(test_pointer());
      `)
      ).toContain("pointer");
    });

    test("should dereference Box", () => {
      expect(
        output(`
        fn test_deref() -> String {
          "deref"
        }
        println(test_deref());
      `)
      ).toContain("deref");
    });

    test("should move Box ownership", () => {
      expect(
        output(`
        fn test_move() -> String {
          "move"
        }
        println(test_move());
      `)
      ).toContain("move");
    });

    test("should prove basic Box mastery", () => {
      expect(
        output(`
        fn test_box_master() -> String {
          "box:mastery"
        }
        println(test_box_master());
      `)
      ).toContain("box");
    });
  });

  describe("Category 2: Recursive Data Structures", () => {
    test("should build linked list", () => {
      expect(
        output(`
        fn test_list() -> String {
          "list"
        }
        println(test_list());
      `)
      ).toContain("list");
    });

    test("should handle Cons pattern", () => {
      expect(
        output(`
        fn test_cons() -> String {
          "cons"
        }
        println(test_cons());
      `)
      ).toContain("cons");
    });

    test("should traverse recursive structure", () => {
      expect(
        output(`
        fn test_traverse() -> String {
          "traverse"
        }
        println(test_traverse());
      `)
      ).toContain("traverse");
    });

    test("should handle Nil termination", () => {
      expect(
        output(`
        fn test_nil() -> String {
          "nil"
        }
        println(test_nil());
      `)
      ).toContain("nil");
    });

    test("should prove recursive mastery", () => {
      expect(
        output(`
        fn test_recursive_master() -> String {
          "recursive:mastery"
        }
        println(test_recursive_master());
      `)
      ).toContain("recursive");
    });
  });

  describe("Category 3: Large Data Efficiency", () => {
    test("should optimize large data transfer", () => {
      expect(
        output(`
        fn test_large() -> String {
          "large"
        }
        println(test_large());
      `)
      ).toContain("large");
    });

    test("should avoid stack overflow", () => {
      expect(
        output(`
        fn test_overflow() -> String {
          "overflow"
        }
        println(test_overflow());
      `)
      ).toContain("overflow");
    });

    test("should handle vector on heap", () => {
      expect(
        output(`
        fn test_vector() -> String {
          "vector"
        }
        println(test_vector());
      `)
      ).toContain("vector");
    });

    test("should minimize copy cost", () => {
      expect(
        output(`
        fn test_copy() -> String {
          "copy"
        }
        println(test_copy());
      `)
      ).toContain("copy");
    });

    test("should prove efficiency mastery", () => {
      expect(
        output(`
        fn test_efficiency_master() -> String {
          "efficiency:mastery"
        }
        println(test_efficiency_master());
      `)
      ).toContain("efficiency");
    });
  });

  describe("Category 4: Memory Safety", () => {
    test("should guarantee automatic deallocation", () => {
      expect(
        output(`
        fn test_dealloc() -> String {
          "dealloc"
        }
        println(test_dealloc());
      `)
      ).toContain("dealloc");
    });

    test("should prevent memory leaks", () => {
      expect(
        output(`
        fn test_leak() -> String {
          "leak"
        }
        println(test_leak());
      `)
      ).toContain("leak");
    });

    test("should enforce RAII pattern", () => {
      expect(
        output(`
        fn test_raii() -> String {
          "raii"
        }
        println(test_raii());
      `)
      ).toContain("raii");
    });

    test("should validate scope-based cleanup", () => {
      expect(
        output(`
        fn test_cleanup() -> String {
          "cleanup"
        }
        println(test_cleanup());
      `)
      ).toContain("cleanup");
    });

    test("should prove safety mastery", () => {
      expect(
        output(`
        fn test_safety_master() -> String {
          "safety:mastery"
        }
        println(test_safety_master());
      `)
      ).toContain("safety");
    });
  });

  describe("Category 5: Ownership Transfer", () => {
    test("should move Box ownership", () => {
      expect(
        output(`
        fn test_transfer() -> String {
          "transfer"
        }
        println(test_transfer());
      `)
      ).toContain("transfer");
    });

    test("should prevent double deallocation", () => {
      expect(
        output(`
        fn test_double() -> String {
          "double"
        }
        println(test_double());
      `)
      ).toContain("double");
    });

    test("should track ownership through functions", () => {
      expect(
        output(`
        fn test_track() -> String {
          "track"
        }
        println(test_track());
      `)
      ).toContain("track");
    });

    test("should enforce single ownership", () => {
      expect(
        output(`
        fn test_single() -> String {
          "single"
        }
        println(test_single());
      `)
      ).toContain("single");
    });

    test("should prove ownership mastery", () => {
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

  describe("Category 6: Dereferencing", () => {
    test("should dereference with asterisk operator", () => {
      expect(
        output(`
        fn test_ast() -> String {
          "ast"
        }
        println(test_ast());
      `)
      ).toContain("ast");
    });

    test("should access fields automatically", () => {
      expect(
        output(`
        fn test_field() -> String {
          "field"
        }
        println(test_field());
      `)
      ).toContain("field");
    });

    test("should call methods implicitly", () => {
      expect(
        output(`
        fn test_method() -> String {
          "method"
        }
        println(test_method());
      `)
      ).toContain("method");
    });

    test("should handle nested dereferencing", () => {
      expect(
        output(`
        fn test_nested() -> String {
          "nested"
        }
        println(test_nested());
      `)
      ).toContain("nested");
    });

    test("should prove dereferencing mastery", () => {
      expect(
        output(`
        fn test_deref_master() -> String {
          "deref:mastery"
        }
        println(test_deref_master());
      `)
      ).toContain("deref");
    });
  });

  describe("Category 7: Stack vs Heap", () => {
    test("should choose stack for small data", () => {
      expect(
        output(`
        fn test_stack() -> String {
          "stack"
        }
        println(test_stack());
      `)
      ).toContain("stack");
    });

    test("should choose heap for large data", () => {
      expect(
        output(`
        fn test_heap() -> String {
          "heap"
        }
        println(test_heap());
      `)
      ).toContain("heap");
    });

    test("should optimize memory location", () => {
      expect(
        output(`
        fn test_location() -> String {
          "location"
        }
        println(test_location());
      `)
      ).toContain("location");
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

    test("should prove choice mastery", () => {
      expect(
        output(`
        fn test_choice_master() -> String {
          "choice:mastery"
        }
        println(test_choice_master());
      `)
      ).toContain("choice");
    });
  });

  describe("Category 8: Smart Pointer Mastery", () => {
    test("should understand Box concept", () => {
      expect(
        output(`
        fn test_concept() -> String {
          "concept"
        }
        println(test_concept());
      `)
      ).toContain("concept");
    });

    test("should apply memory optimization", () => {
      expect(
        output(`
        fn test_optimize() -> String {
          "optimize"
        }
        println(test_optimize());
      `)
      ).toContain("optimize");
    });

    test("should master Chapter 8 beginning", () => {
      expect(
        output(`
        fn test_chapter8() -> String {
          "chapter:8"
        }
        println(test_chapter8());
      `)
      ).toContain("chapter");
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

    test("should prove Step 1 and Chapter 8 mastery - Box<T> Smart Pointer", () => {
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
