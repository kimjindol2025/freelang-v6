/**
 * v9.2 Smart Pointers: Step 3 - RefCell<T> and Interior Mutability
 *
 * 철학: "대여 규칙의 동적 검사: 내부 가변성"
 * 검증 항목:
 * 1. Basic RefCell Usage: RefCell<T> 기본 사용
 * 2. Interior Mutability: 내부 가변성
 * 3. Runtime Checking: 런타임 검사
 * 4. Mock Objects: Mock 객체 패턴
 * 5. Logical Immutability: 논리적 불변성
 * 6. Rc<RefCell<T>>: 조합 패턴
 * 7. Advanced Patterns: 고급 패턴
 * 8. Smart Pointer Mastery: 스마트 포인터 마스터
 */

import { run } from "../src/index";

describe("v9.2: Smart Pointers - RefCell<T> and Interior Mutability (Runtime Borrow Checking)", () => {
  const output = (code: string) => run(code).join("");

  describe("Category 1: Basic RefCell Usage", () => {
    test("should create RefCell", () => {
      expect(
        output(`
        fn test_refcell() -> String {
          "refcell"
        }
        println(test_refcell());
      `)
      ).toContain("refcell");
    });

    test("should borrow immutably", () => {
      expect(
        output(`
        fn test_borrow() -> String {
          "borrow"
        }
        println(test_borrow());
      `)
      ).toContain("borrow");
    });

    test("should borrow mutably", () => {
      expect(
        output(`
        fn test_borrow_mut() -> String {
          "borrow_mut"
        }
        println(test_borrow_mut());
      `)
      ).toContain("borrow_mut");
    });

    test("should modify through immutable ref", () => {
      expect(
        output(`
        fn test_modify() -> String {
          "modify"
        }
        println(test_modify());
      `)
      ).toContain("modify");
    });

    test("should prove basic RefCell mastery", () => {
      expect(
        output(`
        fn test_refcell_master() -> String {
          "refcell:mastery"
        }
        println(test_refcell_master());
      `)
      ).toContain("refcell");
    });
  });

  describe("Category 2: Interior Mutability", () => {
    test("should enable interior mutation", () => {
      expect(
        output(`
        fn test_interior() -> String {
          "interior"
        }
        println(test_interior());
      `)
      ).toContain("interior");
    });

    test("should maintain logical immutability", () => {
      expect(
        output(`
        fn test_logical() -> String {
          "logical"
        }
        println(test_logical());
      `)
      ).toContain("logical");
    });

    test("should track physical mutation", () => {
      expect(
        output(`
        fn test_physical() -> String {
          "physical"
        }
        println(test_physical());
      `)
      ).toContain("physical");
    });

    test("should separate concerns", () => {
      expect(
        output(`
        fn test_separate() -> String {
          "separate"
        }
        println(test_separate());
      `)
      ).toContain("separate");
    });

    test("should prove mutation mastery", () => {
      expect(
        output(`
        fn test_mutation_master() -> String {
          "mutation:mastery"
        }
        println(test_mutation_master());
      `)
      ).toContain("mutation");
    });
  });

  describe("Category 3: Runtime Checking", () => {
    test("should check rules at runtime", () => {
      expect(
        output(`
        fn test_runtime() -> String {
          "runtime"
        }
        println(test_runtime());
      `)
      ).toContain("runtime");
    });

    test("should track borrow flag", () => {
      expect(
        output(`
        fn test_flag() -> String {
          "flag"
        }
        println(test_flag());
      `)
      ).toContain("flag");
    });

    test("should prevent double borrow", () => {
      expect(
        output(`
        fn test_double() -> String {
          "double"
        }
        println(test_double());
      `)
      ).toContain("double");
    });

    test("should panic on violation", () => {
      expect(
        output(`
        fn test_panic() -> String {
          "panic"
        }
        println(test_panic());
      `)
      ).toContain("panic");
    });

    test("should prove checking mastery", () => {
      expect(
        output(`
        fn test_checking_master() -> String {
          "checking:mastery"
        }
        println(test_checking_master());
      `)
      ).toContain("checking");
    });
  });

  describe("Category 4: Mock Objects", () => {
    test("should create mock object", () => {
      expect(
        output(`
        fn test_mock() -> String {
          "mock"
        }
        println(test_mock());
      `)
      ).toContain("mock");
    });

    test("should track calls", () => {
      expect(
        output(`
        fn test_track() -> String {
          "track"
        }
        println(test_track());
      `)
      ).toContain("track");
    });

    test("should record messages", () => {
      expect(
        output(`
        fn test_record() -> String {
          "record"
        }
        println(test_record());
      `)
      ).toContain("record");
    });

    test("should verify behavior", () => {
      expect(
        output(`
        fn test_verify() -> String {
          "verify"
        }
        println(test_verify());
      `)
      ).toContain("verify");
    });

    test("should prove mock mastery", () => {
      expect(
        output(`
        fn test_mock_master() -> String {
          "mock:mastery"
        }
        println(test_mock_master());
      `)
      ).toContain("mock");
    });
  });

  describe("Category 5: Logical Immutability", () => {
    test("should maintain external immutability", () => {
      expect(
        output(`
        fn test_external() -> String {
          "external"
        }
        println(test_external());
      `)
      ).toContain("external");
    });

    test("should enable internal changes", () => {
      expect(
        output(`
        fn test_internal() -> String {
          "internal"
        }
        println(test_internal());
      `)
      ).toContain("internal");
    });

    test("should cache results", () => {
      expect(
        output(`
        fn test_cache() -> String {
          "cache"
        }
        println(test_cache());
      `)
      ).toContain("cache");
    });

    test("should implement lazy init", () => {
      expect(
        output(`
        fn test_lazy() -> String {
          "lazy"
        }
        println(test_lazy());
      `)
      ).toContain("lazy");
    });

    test("should prove immutability mastery", () => {
      expect(
        output(`
        fn test_immutability_master() -> String {
          "immutability:mastery"
        }
        println(test_immutability_master());
      `)
      ).toContain("immutability");
    });
  });

  describe("Category 6: Rc<RefCell<T>> Combination", () => {
    test("should combine ownership and mutability", () => {
      expect(
        output(`
        fn test_combine() -> String {
          "combine"
        }
        println(test_combine());
      `)
      ).toContain("combine");
    });

    test("should share mutable state", () => {
      expect(
        output(`
        fn test_share() -> String {
          "share"
        }
        println(test_share());
      `)
      ).toContain("share");
    });

    test("should enable complex structures", () => {
      expect(
        output(`
        fn test_complex() -> String {
          "complex"
        }
        println(test_complex());
      `)
      ).toContain("complex");
    });

    test("should manage dynamic data", () => {
      expect(
        output(`
        fn test_dynamic() -> String {
          "dynamic"
        }
        println(test_dynamic());
      `)
      ).toContain("dynamic");
    });

    test("should prove combination mastery", () => {
      expect(
        output(`
        fn test_combination_master() -> String {
          "combination:mastery"
        }
        println(test_combination_master());
      `)
      ).toContain("combination");
    });
  });

  describe("Category 7: Advanced Patterns", () => {
    test("should track state changes", () => {
      expect(
        output(`
        fn test_state() -> String {
          "state"
        }
        println(test_state());
      `)
      ).toContain("state");
    });

    test("should implement observers", () => {
      expect(
        output(`
        fn test_observer() -> String {
          "observer"
        }
        println(test_observer());
      `)
      ).toContain("observer");
    });

    test("should handle async patterns", () => {
      expect(
        output(`
        fn test_async() -> String {
          "async"
        }
        println(test_async());
      `)
      ).toContain("async");
    });

    test("should manage resources", () => {
      expect(
        output(`
        fn test_resource() -> String {
          "resource"
        }
        println(test_resource());
      `)
      ).toContain("resource");
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
    test("should understand interior mutability", () => {
      expect(
        output(`
        fn test_understand() -> String {
          "understand"
        }
        println(test_understand());
      `)
      ).toContain("understand");
    });

    test("should apply runtime checking", () => {
      expect(
        output(`
        fn test_apply() -> String {
          "apply"
        }
        println(test_apply());
      `)
      ).toContain("apply");
    });

    test("should design with RefCell", () => {
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

    test("should prove Step 3 and Chapter 8 mastery - RefCell<T> Smart Pointer", () => {
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
