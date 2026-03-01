/**
 * Phase v6.4: Mutual Recursion & Indirect Call Integrity
 *
 * 목표: IsEven(10) = true를 스택 오버플로우 없이 처리
 *
 * 3 Phases:
 * - Phase 1: Mutual Call Detection (20 tests)
 * - Phase 2: Scheduler Stability (20 tests)
 * - Phase 3: IsEven/IsOdd Integration (20 tests)
 */

import {
  MutualCallResolver,
  MutualTCOEngine,
  MutualFunctionInfo,
  TrampolineResult,
} from "../src/mutual-recursion";

describe("Phase 10.4: Mutual Recursion & Indirect Call Integrity", () => {
  // ================================================
  // Phase 1: Mutual Call Detection (20 tests)
  // ================================================

  describe("Phase 1: Mutual Call Detection", () => {
    let resolver: MutualCallResolver;

    beforeEach(() => {
      resolver = new MutualCallResolver();
    });

    // 1-1
    test("1-1: MutualCallResolver 인스턴스 생성", () => {
      expect(resolver).toBeDefined();
      expect(typeof resolver.declareFunction).toBe("function");
      expect(typeof resolver.analyzeFunction).toBe("function");
      expect(typeof resolver.resolveAll).toBe("function");
      expect(typeof resolver.hasCircularReference).toBe("function");
    });

    // 1-2
    test("1-2: Pass 1 - declareFunction() 등록 성공", () => {
      resolver.declareFunction("IsEven", 1, "bool");
      resolver.declareFunction("IsOdd", 1, "bool");
      expect(resolver.hasDeclared("IsEven")).toBe(true);
      expect(resolver.hasDeclared("IsOdd")).toBe(true);
    });

    // 1-3
    test("1-3: 등록 직후 상태 = 'defined'", () => {
      resolver.declareFunction("IsEven", 1, "bool");
      expect(resolver.getSymbolState("IsEven")).toBe("defined");
    });

    // 1-4
    test("1-4: analyzeFunction() 후 상태 = 'analyzing'", () => {
      resolver.declareFunction("IsEven", 1, "bool");
      resolver.declareFunction("IsOdd", 1, "bool");
      resolver.analyzeFunction("IsEven", "IF (n === 0) return 1; return IsOdd(n-1)");
      expect(resolver.getSymbolState("IsEven")).toBe("analyzing");
    });

    // 1-5
    test("1-5: resolveAll() 후 상태 = 'resolved'", () => {
      resolver.declareFunction("IsEven", 1, "bool");
      resolver.declareFunction("IsOdd", 1, "bool");
      resolver.analyzeFunction("IsEven", "IF (n === 0) return 1; return IsOdd(n-1)");
      resolver.analyzeFunction("IsOdd", "IF (n === 0) return 0; return IsEven(n-1)");
      resolver.resolveAll();
      expect(resolver.getSymbolState("IsEven")).toBe("resolved");
      expect(resolver.getSymbolState("IsOdd")).toBe("resolved");
    });

    // 1-6
    test("1-6: hasCircularReference('IsEven', 'IsOdd') = true", () => {
      resolver.declareFunction("IsEven", 1, "bool");
      resolver.declareFunction("IsOdd", 1, "bool");
      resolver.analyzeFunction(
        "IsEven",
        "IF (n === 0) return 1; return IsOdd(n-1)"
      );
      resolver.analyzeFunction(
        "IsOdd",
        "IF (n === 0) return 0; return IsEven(n-1)"
      );
      expect(resolver.hasCircularReference("IsEven", "IsOdd")).toBe(true);
    });

    // 1-7
    test("1-7: 비순환 A→B: hasCircularReference = false", () => {
      resolver.declareFunction("A", 1);
      resolver.declareFunction("B", 1);
      resolver.analyzeFunction("A", "return B(x)");
      resolver.analyzeFunction("B", "return 42");
      expect(resolver.hasCircularReference("A", "B")).toBe(false);
    });

    // 1-8
    test("1-8: getMutualPartners('IsEven') = ['IsOdd']", () => {
      resolver.declareFunction("IsEven", 1, "bool");
      resolver.declareFunction("IsOdd", 1, "bool");
      resolver.analyzeFunction(
        "IsEven",
        "IF (n === 0) return 1; return IsOdd(n-1)"
      );
      resolver.analyzeFunction(
        "IsOdd",
        "IF (n === 0) return 0; return IsEven(n-1)"
      );
      const partners = resolver.getMutualPartners("IsEven");
      expect(partners).toContain("IsOdd");
    });

    // 1-9
    test("1-9: getMutualPartners('IsOdd') = ['IsEven']", () => {
      resolver.declareFunction("IsEven", 1, "bool");
      resolver.declareFunction("IsOdd", 1, "bool");
      resolver.analyzeFunction(
        "IsEven",
        "IF (n === 0) return 1; return IsOdd(n-1)"
      );
      resolver.analyzeFunction(
        "IsOdd",
        "IF (n === 0) return 0; return IsEven(n-1)"
      );
      const partners = resolver.getMutualPartners("IsOdd");
      expect(partners).toContain("IsEven");
    });

    // 1-10
    test("1-10: references 목록: IsEven → ['IsOdd']", () => {
      resolver.declareFunction("IsEven", 1, "bool");
      resolver.declareFunction("IsOdd", 1, "bool");
      resolver.analyzeFunction(
        "IsEven",
        "IF (n === 0) return 1; return IsOdd(n-1)"
      );
      const funcs = resolver.getAllFunctions();
      const isEven = funcs.find((f) => f.name === "IsEven");
      expect(isEven?.references).toContain("IsOdd");
    });

    // 1-11
    test("1-11: hasDeclared() Pass 1 후 true", () => {
      resolver.declareFunction("IsEven", 1);
      expect(resolver.hasDeclared("IsEven")).toBe(true);
    });

    // 1-12
    test("1-12: hasDeclared() Pass 1 전 false", () => {
      expect(resolver.hasDeclared("Unknown")).toBe(false);
    });

    // 1-13
    test("1-13: getAllFunctions() 2개 반환", () => {
      resolver.declareFunction("IsEven", 1, "bool");
      resolver.declareFunction("IsOdd", 1, "bool");
      const funcs = resolver.getAllFunctions();
      expect(funcs.length).toBe(2);
    });

    // 1-14
    test("1-14: isFullyResolved() → resolveAll() 후 true", () => {
      resolver.declareFunction("IsEven", 1, "bool");
      resolver.declareFunction("IsOdd", 1, "bool");
      expect(resolver.isFullyResolved()).toBe(false);
      resolver.resolveAll();
      expect(resolver.isFullyResolved()).toBe(true);
    });

    // 1-15
    test("1-15: 2-Pass 전체 플로우: declare → analyze → resolve", () => {
      // Pass 1
      resolver.declareFunction("IsEven", 1, "bool");
      resolver.declareFunction("IsOdd", 1, "bool");
      expect(resolver.getSymbolState("IsEven")).toBe("defined");

      // Pass 2
      resolver.analyzeFunction(
        "IsEven",
        "IF (n === 0) return 1; return IsOdd(n-1)"
      );
      resolver.analyzeFunction(
        "IsOdd",
        "IF (n === 0) return 0; return IsEven(n-1)"
      );
      expect(resolver.getSymbolState("IsEven")).toBe("analyzing");

      // Resolve
      resolver.resolveAll();
      expect(resolver.getSymbolState("IsEven")).toBe("resolved");
      expect(resolver.isFullyResolved()).toBe(true);
    });

    // 1-16
    test("1-16: 3개 함수 상호 참조: A→B→C→A", () => {
      resolver.declareFunction("A", 1);
      resolver.declareFunction("B", 1);
      resolver.declareFunction("C", 1);
      resolver.analyzeFunction("A", "return B(x) and C(x)");  // A가 B와 C 모두 호출
      resolver.analyzeFunction("B", "return C(x) and A(x)");  // B가 C와 A 모두 호출
      resolver.analyzeFunction("C", "return A(x) and B(x)");  // C가 A와 B 모두 호출
      // 모두 상호 순환
      expect(resolver.hasCircularReference("A", "B")).toBe(true);
      expect(resolver.hasCircularReference("B", "C")).toBe(true);
      expect(resolver.hasCircularReference("A", "C")).toBe(true);
    });

    // 1-17
    test("1-17: 자기 참조 (A→A)와 상호 참조(A↔B) 구별", () => {
      resolver.declareFunction("A", 1);
      resolver.declareFunction("B", 1);
      resolver.analyzeFunction("A", "return A(x)");        // 자기 참조
      resolver.analyzeFunction("B", "return A(x)");        // B→A만
      expect(resolver.hasCircularReference("A", "A")).toBe(false);  // 자기 순환 아님
      expect(resolver.hasCircularReference("A", "B")).toBe(false);  // 일방향
    });

    // 1-18
    test("1-18: clear() 후 초기화", () => {
      resolver.declareFunction("IsEven", 1, "bool");
      expect(resolver.hasDeclared("IsEven")).toBe(true);
      resolver.clear();
      expect(resolver.hasDeclared("IsEven")).toBe(false);
      expect(resolver.getAllFunctions().length).toBe(0);
    });

    // 1-19
    test("1-19: 대소문자 무관 참조 탐지", () => {
      resolver.declareFunction("IsEven", 1, "bool");
      resolver.declareFunction("IsOdd", 1, "bool");
      // 소문자로 참조해도 탐지
      resolver.analyzeFunction("IsEven", "return isodd(n-1)");
      resolver.analyzeFunction("IsOdd", "return IsEven(n-1)");
      const evenRefs = resolver.getAllFunctions().find(f => f.name === "IsEven")?.references || [];
      expect(evenRefs).toContain("IsOdd");
    });

    // 1-20
    test("1-20: ✅ IsEven↔IsOdd 순환 참조 완전 해소", () => {
      resolver.declareFunction("IsEven", 1, "bool");
      resolver.declareFunction("IsOdd", 1, "bool");
      resolver.analyzeFunction(
        "IsEven",
        "IF (n === 0) return 1; return IsOdd(n-1)"
      );
      resolver.analyzeFunction(
        "IsOdd",
        "IF (n === 0) return 0; return IsEven(n-1)"
      );
      resolver.resolveAll();

      // 모든 검증
      expect(resolver.isFullyResolved()).toBe(true);
      expect(resolver.hasCircularReference("IsEven", "IsOdd")).toBe(true);
      expect(resolver.getMutualPartners("IsEven").length).toBe(1);
      expect(resolver.getMutualPartners("IsOdd").length).toBe(1);
    });
  });

  // ================================================
  // Phase 2: Scheduler Stability (20 tests)
  // ================================================

  describe("Phase 2: Scheduler Stability", () => {
    let engine: MutualTCOEngine;

    beforeEach(() => {
      engine = new MutualTCOEngine();
    });

    // 2-1
    test("2-1: MutualTCOEngine 인스턴스 생성", () => {
      expect(engine).toBeDefined();
      expect(typeof engine.registerFunction).toBe("function");
      expect(typeof engine.execute).toBe("function");
      expect(typeof engine.getIterationCount).toBe("function");
      expect(typeof engine.getMaxObservedDepth).toBe("function");
    });

    // 2-2
    test("2-2: registerFunction() 등록 성공", () => {
      const fn = (args: number[]): TrampolineResult => ({
        type: "done",
        value: 42,
      });
      engine.registerFunction("TestFunc", fn);
      // 등록되었으므로 execute 호출 가능
      expect(engine.execute("TestFunc", [])).toBe(42);
    });

    // 2-3
    test("2-3: execute() 기저 조건 즉시 반환 (IsEven(0)=1)", () => {
      const isEvenFn = (args: number[]): TrampolineResult => {
        const [n] = args;
        if (n === 0) return { type: "done", value: 1 };
        return { type: "call", name: "IsOdd", args: [n - 1] };
      };
      engine.registerFunction("IsEven", isEvenFn);
      const result = engine.execute("IsEven", [0]);
      expect(result).toBe(1);
    });

    // 2-4
    test("2-4: execute() 기저 조건 즉시 반환 (IsOdd(0)=0)", () => {
      const isOddFn = (args: number[]): TrampolineResult => {
        const [n] = args;
        if (n === 0) return { type: "done", value: 0 };
        return { type: "call", name: "IsEven", args: [n - 1] };
      };
      engine.registerFunction("IsOdd", isOddFn);
      const result = engine.execute("IsOdd", [0]);
      expect(result).toBe(0);
    });

    // 2-5
    test("2-5: 1회 교차 후 depth = 1 (IsEven(1) → IsOdd(0))", () => {
      const isEvenFn = (args: number[]): TrampolineResult => {
        const [n] = args;
        if (n === 0) return { type: "done", value: 1 };
        return { type: "call", name: "IsOdd", args: [n - 1] };
      };
      const isOddFn = (args: number[]): TrampolineResult => {
        const [n] = args;
        if (n === 0) return { type: "done", value: 0 };
        return { type: "call", name: "IsEven", args: [n - 1] };
      };
      engine.registerFunction("IsEven", isEvenFn);
      engine.registerFunction("IsOdd", isOddFn);
      engine.execute("IsEven", [1]);
      expect(engine.getMaxObservedDepth()).toBe(1);
    });

    // 2-6
    test("2-6: 2회 교차 후 depth = 1 (IsEven(2))", () => {
      const isEvenFn = (args: number[]): TrampolineResult => {
        const [n] = args;
        if (n === 0) return { type: "done", value: 1 };
        return { type: "call", name: "IsOdd", args: [n - 1] };
      };
      const isOddFn = (args: number[]): TrampolineResult => {
        const [n] = args;
        if (n === 0) return { type: "done", value: 0 };
        return { type: "call", name: "IsEven", args: [n - 1] };
      };
      engine.registerFunction("IsEven", isEvenFn);
      engine.registerFunction("IsOdd", isOddFn);
      engine.execute("IsEven", [2]);
      expect(engine.getMaxObservedDepth()).toBe(1);
    });

    // 2-7
    test("2-7: getMaxObservedDepth() = 1 (10회 교차)", () => {
      const isEvenFn = (args: number[]): TrampolineResult => {
        const [n] = args;
        if (n === 0) return { type: "done", value: 1 };
        return { type: "call", name: "IsOdd", args: [n - 1] };
      };
      const isOddFn = (args: number[]): TrampolineResult => {
        const [n] = args;
        if (n === 0) return { type: "done", value: 0 };
        return { type: "call", name: "IsEven", args: [n - 1] };
      };
      engine.registerFunction("IsEven", isEvenFn);
      engine.registerFunction("IsOdd", isOddFn);
      engine.execute("IsEven", [10]);
      expect(engine.getMaxObservedDepth()).toBe(1);
    });

    // 2-8
    test("2-8: getIterationCount() 정확성 (IsEven(5): 6 iterations)", () => {
      const isEvenFn = (args: number[]): TrampolineResult => {
        const [n] = args;
        if (n === 0) return { type: "done", value: 1 };
        return { type: "call", name: "IsOdd", args: [n - 1] };
      };
      const isOddFn = (args: number[]): TrampolineResult => {
        const [n] = args;
        if (n === 0) return { type: "done", value: 0 };
        return { type: "call", name: "IsEven", args: [n - 1] };
      };
      engine.registerFunction("IsEven", isEvenFn);
      engine.registerFunction("IsOdd", isOddFn);
      engine.execute("IsEven", [5]);
      // IsEven(5) → IsOdd(4) → IsEven(3) → IsOdd(2) → IsEven(1) → IsOdd(0) = 6 iterations
      expect(engine.getIterationCount()).toBe(6);
    });

    // 2-9
    test("2-9: reset() 후 카운터 초기화", () => {
      const fn = (args: number[]): TrampolineResult => ({
        type: "done",
        value: 1,
      });
      engine.registerFunction("TestFunc", fn);
      engine.execute("TestFunc", []);
      expect(engine.getIterationCount()).toBeGreaterThan(0);
      engine.reset();
      expect(engine.getIterationCount()).toBe(0);
      expect(engine.getMaxObservedDepth()).toBe(0);
    });

    // 2-10
    test("2-10: IsEven(2) = 1 (true) 정확성", () => {
      const isEvenFn = (args: number[]): TrampolineResult => {
        const [n] = args;
        if (n === 0) return { type: "done", value: 1 };
        return { type: "call", name: "IsOdd", args: [n - 1] };
      };
      const isOddFn = (args: number[]): TrampolineResult => {
        const [n] = args;
        if (n === 0) return { type: "done", value: 0 };
        return { type: "call", name: "IsEven", args: [n - 1] };
      };
      engine.registerFunction("IsEven", isEvenFn);
      engine.registerFunction("IsOdd", isOddFn);
      const result = engine.execute("IsEven", [2]);
      expect(result).toBe(1);
    });

    // 2-11
    test("2-11: IsEven(3) = 0 (false) 정확성", () => {
      const isEvenFn = (args: number[]): TrampolineResult => {
        const [n] = args;
        if (n === 0) return { type: "done", value: 1 };
        return { type: "call", name: "IsOdd", args: [n - 1] };
      };
      const isOddFn = (args: number[]): TrampolineResult => {
        const [n] = args;
        if (n === 0) return { type: "done", value: 0 };
        return { type: "call", name: "IsEven", args: [n - 1] };
      };
      engine.registerFunction("IsEven", isEvenFn);
      engine.registerFunction("IsOdd", isOddFn);
      const result = engine.execute("IsEven", [3]);
      expect(result).toBe(0);
    });

    // 2-12
    test("2-12: IsOdd(3) = 1 (true) 정확성", () => {
      const isEvenFn = (args: number[]): TrampolineResult => {
        const [n] = args;
        if (n === 0) return { type: "done", value: 1 };
        return { type: "call", name: "IsOdd", args: [n - 1] };
      };
      const isOddFn = (args: number[]): TrampolineResult => {
        const [n] = args;
        if (n === 0) return { type: "done", value: 0 };
        return { type: "call", name: "IsEven", args: [n - 1] };
      };
      engine.registerFunction("IsEven", isEvenFn);
      engine.registerFunction("IsOdd", isOddFn);
      const result = engine.execute("IsOdd", [3]);
      expect(result).toBe(1);
    });

    // 2-13
    test("2-13: 1000회 교차: depth = 1 (NO overflow)", () => {
      const isEvenFn = (args: number[]): TrampolineResult => {
        const [n] = args;
        if (n === 0) return { type: "done", value: 1 };
        return { type: "call", name: "IsOdd", args: [n - 1] };
      };
      const isOddFn = (args: number[]): TrampolineResult => {
        const [n] = args;
        if (n === 0) return { type: "done", value: 0 };
        return { type: "call", name: "IsEven", args: [n - 1] };
      };
      engine.registerFunction("IsEven", isEvenFn);
      engine.registerFunction("IsOdd", isOddFn);
      engine.execute("IsEven", [1000]);
      expect(engine.getMaxObservedDepth()).toBe(1);
    });

    // 2-14
    test("2-14: IsEven(100) = 1 정확성", () => {
      const isEvenFn = (args: number[]): TrampolineResult => {
        const [n] = args;
        if (n === 0) return { type: "done", value: 1 };
        return { type: "call", name: "IsOdd", args: [n - 1] };
      };
      const isOddFn = (args: number[]): TrampolineResult => {
        const [n] = args;
        if (n === 0) return { type: "done", value: 0 };
        return { type: "call", name: "IsEven", args: [n - 1] };
      };
      engine.registerFunction("IsEven", isEvenFn);
      engine.registerFunction("IsOdd", isOddFn);
      const result = engine.execute("IsEven", [100]);
      expect(result).toBe(1);
    });

    // 2-15
    test("2-15: IsOdd(100) = 0 정확성", () => {
      const isEvenFn = (args: number[]): TrampolineResult => {
        const [n] = args;
        if (n === 0) return { type: "done", value: 1 };
        return { type: "call", name: "IsOdd", args: [n - 1] };
      };
      const isOddFn = (args: number[]): TrampolineResult => {
        const [n] = args;
        if (n === 0) return { type: "done", value: 0 };
        return { type: "call", name: "IsEven", args: [n - 1] };
      };
      engine.registerFunction("IsEven", isEvenFn);
      engine.registerFunction("IsOdd", isOddFn);
      const result = engine.execute("IsOdd", [100]);
      expect(result).toBe(0);
    });

    // 2-16
    test("2-16: 연속 execute() 호출 격리", () => {
      const isEvenFn = (args: number[]): TrampolineResult => {
        const [n] = args;
        if (n === 0) return { type: "done", value: 1 };
        return { type: "call", name: "IsOdd", args: [n - 1] };
      };
      const isOddFn = (args: number[]): TrampolineResult => {
        const [n] = args;
        if (n === 0) return { type: "done", value: 0 };
        return { type: "call", name: "IsEven", args: [n - 1] };
      };
      engine.registerFunction("IsEven", isEvenFn);
      engine.registerFunction("IsOdd", isOddFn);

      engine.execute("IsEven", [5]);
      const iter1 = engine.getIterationCount();

      engine.execute("IsEven", [10]);
      const iter2 = engine.getIterationCount();

      // 두 번째 호출이 카운트 증가
      expect(iter2).toBeGreaterThan(iter1);
    });

    // 2-17
    test("2-17: 미등록 함수 호출 시 에러 처리", () => {
      const isEvenFn = (args: number[]): TrampolineResult => {
        const [n] = args;
        if (n === 0) return { type: "done", value: 1 };
        return { type: "call", name: "UnknownFunc", args: [n - 1] };
      };
      engine.registerFunction("IsEven", isEvenFn);

      expect(() => {
        engine.execute("IsEven", [1]);
      }).toThrow();
    });

    // 2-18
    test("2-18: 같은 engine으로 여러 함수 실행", () => {
      const funcA = (args: number[]): TrampolineResult => ({
        type: "done",
        value: 10,
      });
      const funcB = (args: number[]): TrampolineResult => ({
        type: "done",
        value: 20,
      });
      engine.registerFunction("FuncA", funcA);
      engine.registerFunction("FuncB", funcB);

      const resultA = engine.execute("FuncA", []);
      expect(resultA).toBe(10);

      engine.reset();

      const resultB = engine.execute("FuncB", []);
      expect(resultB).toBe(20);
    });

    // 2-19
    test("2-19: IsEven + IsOdd 동시 실행", () => {
      const isEvenFn = (args: number[]): TrampolineResult => {
        const [n] = args;
        if (n === 0) return { type: "done", value: 1 };
        return { type: "call", name: "IsOdd", args: [n - 1] };
      };
      const isOddFn = (args: number[]): TrampolineResult => {
        const [n] = args;
        if (n === 0) return { type: "done", value: 0 };
        return { type: "call", name: "IsEven", args: [n - 1] };
      };
      engine.registerFunction("IsEven", isEvenFn);
      engine.registerFunction("IsOdd", isOddFn);

      const resultEven = engine.execute("IsEven", [10]);
      engine.reset();
      const resultOdd = engine.execute("IsOdd", [10]);

      expect(resultEven).toBe(1);
      expect(resultOdd).toBe(0);
    });

    // 2-20
    test("2-20: ✅ PING-PONG STABILITY: depth=1 @ 100 교차", () => {
      const isEvenFn = (args: number[]): TrampolineResult => {
        const [n] = args;
        if (n === 0) return { type: "done", value: 1 };
        return { type: "call", name: "IsOdd", args: [n - 1] };
      };
      const isOddFn = (args: number[]): TrampolineResult => {
        const [n] = args;
        if (n === 0) return { type: "done", value: 0 };
        return { type: "call", name: "IsEven", args: [n - 1] };
      };
      engine.registerFunction("IsEven", isEvenFn);
      engine.registerFunction("IsOdd", isOddFn);

      engine.execute("IsEven", [100]);

      expect(engine.getMaxObservedDepth()).toBe(1);
      expect(engine.getIterationCount()).toBe(101);
    });
  });

  // ================================================
  // Phase 3: IsEven/IsOdd Integration (20 tests)
  // ================================================

  describe("Phase 3: IsEven/IsOdd Integration", () => {
    let engine: MutualTCOEngine;
    let resolver: MutualCallResolver;

    beforeEach(() => {
      engine = new MutualTCOEngine();
      resolver = new MutualCallResolver();
    });

    const createIsEvenFn = (): ((args: number[]) => TrampolineResult) => {
      return (args: number[]): TrampolineResult => {
        const [n] = args;
        if (n === 0) return { type: "done", value: 1 };
        return { type: "call", name: "IsOdd", args: [n - 1] };
      };
    };

    const createIsOddFn = (): ((args: number[]) => TrampolineResult) => {
      return (args: number[]): TrampolineResult => {
        const [n] = args;
        if (n === 0) return { type: "done", value: 0 };
        return { type: "call", name: "IsEven", args: [n - 1] };
      };
    };

    // 3-1
    test("3-1: IsEven(0) = 1 (true)", () => {
      engine.registerFunction("IsEven", createIsEvenFn());
      engine.registerFunction("IsOdd", createIsOddFn());
      expect(engine.execute("IsEven", [0])).toBe(1);
    });

    // 3-2
    test("3-2: IsOdd(0) = 0 (false)", () => {
      engine.registerFunction("IsEven", createIsEvenFn());
      engine.registerFunction("IsOdd", createIsOddFn());
      expect(engine.execute("IsOdd", [0])).toBe(0);
    });

    // 3-3
    test("3-3: IsEven(1) = 0 (false)", () => {
      engine.registerFunction("IsEven", createIsEvenFn());
      engine.registerFunction("IsOdd", createIsOddFn());
      expect(engine.execute("IsEven", [1])).toBe(0);
    });

    // 3-4
    test("3-4: IsOdd(1) = 1 (true)", () => {
      engine.registerFunction("IsEven", createIsEvenFn());
      engine.registerFunction("IsOdd", createIsOddFn());
      expect(engine.execute("IsOdd", [1])).toBe(1);
    });

    // 3-5
    test("3-5: IsEven(2) = 1 (true)", () => {
      engine.registerFunction("IsEven", createIsEvenFn());
      engine.registerFunction("IsOdd", createIsOddFn());
      expect(engine.execute("IsEven", [2])).toBe(1);
    });

    // 3-6
    test("3-6: IsOdd(9) = 1 (true)", () => {
      engine.registerFunction("IsEven", createIsEvenFn());
      engine.registerFunction("IsOdd", createIsOddFn());
      expect(engine.execute("IsOdd", [9])).toBe(1);
    });

    // 3-7
    test("3-7: IsEven(10) = 1 (true) ✅", () => {
      engine.registerFunction("IsEven", createIsEvenFn());
      engine.registerFunction("IsOdd", createIsOddFn());
      expect(engine.execute("IsEven", [10])).toBe(1);
    });

    // 3-8
    test("3-8: IsOdd(10) = 0 (false) ✅", () => {
      engine.registerFunction("IsEven", createIsEvenFn());
      engine.registerFunction("IsOdd", createIsOddFn());
      expect(engine.execute("IsOdd", [10])).toBe(0);
    });

    // 3-9
    test("3-9: IsEven(99) = 0 (false)", () => {
      engine.registerFunction("IsEven", createIsEvenFn());
      engine.registerFunction("IsOdd", createIsOddFn());
      expect(engine.execute("IsEven", [99])).toBe(0);
    });

    // 3-10
    test("3-10: IsOdd(99) = 1 (true)", () => {
      engine.registerFunction("IsEven", createIsEvenFn());
      engine.registerFunction("IsOdd", createIsOddFn());
      expect(engine.execute("IsOdd", [99])).toBe(1);
    });

    // 3-11
    test("3-11: IsEven(999) = 0 (false, NO overflow)", () => {
      engine.registerFunction("IsEven", createIsEvenFn());
      engine.registerFunction("IsOdd", createIsOddFn());
      expect(engine.execute("IsEven", [999])).toBe(0);
    });

    // 3-12
    test("3-12: MutualCallResolver + MutualTCOEngine 통합", () => {
      resolver.declareFunction("IsEven", 1, "bool");
      resolver.declareFunction("IsOdd", 1, "bool");
      resolver.analyzeFunction(
        "IsEven",
        "IF (n === 0) return 1; return IsOdd(n-1)"
      );
      resolver.analyzeFunction(
        "IsOdd",
        "IF (n === 0) return 0; return IsEven(n-1)"
      );
      resolver.resolveAll();

      expect(resolver.isFullyResolved()).toBe(true);

      engine.registerFunction("IsEven", createIsEvenFn());
      engine.registerFunction("IsOdd", createIsOddFn());
      const result = engine.execute("IsEven", [10]);
      expect(result).toBe(1);
    });

    // 3-13
    test("3-13: 2-Pass 선언 후 실행 파이프라인", () => {
      // Resolver로 타입 체크
      resolver.declareFunction("IsEven", 1, "bool");
      resolver.declareFunction("IsOdd", 1, "bool");
      resolver.analyzeFunction(
        "IsEven",
        "IF (n === 0) return 1; return IsOdd(n-1)"
      );
      resolver.analyzeFunction(
        "IsOdd",
        "IF (n === 0) return 0; return IsEven(n-1)"
      );
      resolver.resolveAll();

      // Engine으로 실행
      engine.registerFunction("IsEven", createIsEvenFn());
      engine.registerFunction("IsOdd", createIsOddFn());
      const result = engine.execute("IsEven", [5]);  // 5는 홀수, false=0

      expect(result).toBe(0);  // IsEven(5) = false = 0
      expect(resolver.getSymbolState("IsEven")).toBe("resolved");
    });

    // 3-14
    test("3-14: Resolver 결과 기반 engine 실행", () => {
      resolver.declareFunction("IsEven", 1, "bool");
      resolver.declareFunction("IsOdd", 1, "bool");
      resolver.analyzeFunction("IsEven", "return IsOdd(n-1)");
      resolver.analyzeFunction("IsOdd", "return IsEven(n-1)");

      const partners = resolver.getMutualPartners("IsEven");
      expect(partners.length).toBeGreaterThan(0);

      engine.registerFunction("IsEven", createIsEvenFn());
      engine.registerFunction("IsOdd", createIsOddFn());
      engine.execute("IsEven", [10]);

      expect(engine.getMaxObservedDepth()).toBe(1);
    });

    // 3-15
    test("3-15: maxDepth = 1 (999 교차)", () => {
      engine.registerFunction("IsEven", createIsEvenFn());
      engine.registerFunction("IsOdd", createIsOddFn());
      engine.execute("IsEven", [999]);
      expect(engine.getMaxObservedDepth()).toBe(1);
    });

    // 3-16
    test("3-16: iterationCount 정확성 (IsEven(10): 11)", () => {
      engine.registerFunction("IsEven", createIsEvenFn());
      engine.registerFunction("IsOdd", createIsOddFn());
      engine.execute("IsEven", [10]);
      expect(engine.getIterationCount()).toBe(11);
    });

    // 3-17
    test("3-17: 성능: 1000회 교차 < 50ms", () => {
      engine.registerFunction("IsEven", createIsEvenFn());
      engine.registerFunction("IsOdd", createIsOddFn());
      const start = Date.now();
      engine.execute("IsEven", [1000]);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(50);
    });

    // 3-18
    test("3-18: IsEven과 IsOdd 역할 교환 검증", () => {
      engine.registerFunction("IsEven", createIsEvenFn());
      engine.registerFunction("IsOdd", createIsOddFn());

      const evenResult = engine.execute("IsEven", [8]);
      engine.reset();
      const oddResult = engine.execute("IsOdd", [8]);

      expect(evenResult).toBe(1);  // 8은 짝수
      expect(oddResult).toBe(0);   // 8은 홀수 아님
    });

    // 3-19
    test("3-19: 3-way 상호 재귀: Mod3 판별", () => {
      // Mod3(n) = n % 3인지 판별하는 3-way 상호 재귀
      const mod0Fn = (args: number[]): TrampolineResult => {
        const [n] = args;
        if (n === 0) return { type: "done", value: 1 };
        return { type: "call", name: "Mod1", args: [n - 1] };
      };
      const mod1Fn = (args: number[]): TrampolineResult => {
        const [n] = args;
        if (n === 0) return { type: "done", value: 0 };
        return { type: "call", name: "Mod2", args: [n - 1] };
      };
      const mod2Fn = (args: number[]): TrampolineResult => {
        const [n] = args;
        if (n === 0) return { type: "done", value: 0 };
        return { type: "call", name: "Mod0", args: [n - 1] };
      };

      engine.registerFunction("Mod0", mod0Fn);
      engine.registerFunction("Mod1", mod1Fn);
      engine.registerFunction("Mod2", mod2Fn);

      // Mod0(9) = 1 (9 % 3 === 0)
      const result = engine.execute("Mod0", [9]);
      expect(result).toBe(1);
      expect(engine.getMaxObservedDepth()).toBe(1);
    });

    // 3-20
    test("3-20: ✅ TC_V6_4_MUTUAL_RECURSION COMPLETE", () => {
      resolver.declareFunction("IsEven", 1, "bool");
      resolver.declareFunction("IsOdd", 1, "bool");
      resolver.analyzeFunction(
        "IsEven",
        "IF (n === 0) return 1; return IsOdd(n-1)"
      );
      resolver.analyzeFunction(
        "IsOdd",
        "IF (n === 0) return 0; return IsEven(n-1)"
      );
      resolver.resolveAll();

      engine.registerFunction("IsEven", createIsEvenFn());
      engine.registerFunction("IsOdd", createIsOddFn());

      // Phase 1: Detection
      expect(resolver.hasCircularReference("IsEven", "IsOdd")).toBe(true);
      expect(resolver.isFullyResolved()).toBe(true);

      // Phase 2: Stability
      const result = engine.execute("IsEven", [10]);
      expect(engine.getMaxObservedDepth()).toBe(1);
      expect(engine.getIterationCount()).toBe(11);

      // Phase 3: Integration
      expect(result).toBe(1);
      expect(engine.execute("IsOdd", [10])).toBe(0);
      expect(engine.execute("IsEven", [999])).toBe(0);
    });
  });
});
