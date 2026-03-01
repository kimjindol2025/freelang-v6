/**
 * Phase v6.3: Tail Call Optimization (TCO)
 *
 * 목표: SafeSum(100000, 0) = 5000050000을 스택 오버플로우 없이 실행
 *
 * 3 Phases:
 * - Phase 1: Tail Call Detection (20 tests)
 * - Phase 2: Frame Stability (20 tests)
 * - Phase 3: SafeSum Integration (20 tests)
 */

import { TailCallDetector, TCOEngine } from "../src/tco-optimizer";

describe("Phase 10.3: Tail Call Optimization (TCO)", () => {
  // ==========================================
  // Phase 1: Tail Call Detection (20 tests)
  // ==========================================

  describe("Phase 1: Tail Call Detection", () => {
    const detector = new TailCallDetector();

    // 1-1
    test("1-1: TailCallDetector 인스턴스 생성", () => {
      expect(detector).toBeDefined();
      expect(typeof detector.isTailRecursive).toBe("function");
      expect(typeof detector.detectTailCalls).toBe("function");
      expect(typeof detector.hasTailCallPattern).toBe("function");
    });

    // 1-2
    test("1-2: SafeSum 꼬리 재귀 탐지 → isTailRecursive = true", () => {
      const safeSumBody = `
        IF (n <= 0) { RETURN acc }
        RETURN SafeSum(n - 1, acc + n)
      `;
      expect(detector.isTailRecursive("SafeSum", safeSumBody)).toBe(true);
    });

    // 1-3
    test("1-3: Fibonacci (비꼬리) 탐지 → isTailRecursive = false", () => {
      const fibBody = `
        IF (n <= 1) { RETURN n }
        RETURN fib(n - 1) + fib(n - 2)
      `;
      expect(detector.isTailRecursive("fib", fibBody)).toBe(false);
    });

    // 1-4
    test("1-4: Factorial 꼬리 재귀 변환형 탐지", () => {
      const factTCOBody = `
        IF (n <= 1) { RETURN acc }
        RETURN factTCO(n - 1, acc * n)
      `;
      expect(detector.isTailRecursive("factTCO", factTCOBody)).toBe(true);
    });

    // 1-5
    test('1-5: hasTailCallPattern("return SafeSum(", "SafeSum") = true', () => {
      expect(
        detector.hasTailCallPattern("return SafeSum(n-1, acc)", "SafeSum")
      ).toBe(true);
    });

    // 1-6
    test('1-6: hasTailCallPattern("return 1 + fib(", "fib") = false', () => {
      expect(detector.hasTailCallPattern("return 1 + fib(n-1)", "fib")).toBe(
        false
      );
    });

    // 1-7
    test("1-7: detectTailCalls: SafeSum에서 1개 tail call 발견", () => {
      const safeSumBody = `
        IF (n <= 0) { RETURN acc }
        RETURN SafeSum(n - 1, acc + n)
      `;
      const calls = detector.detectTailCalls("SafeSum", safeSumBody);
      expect(calls.length).toBe(1);
    });

    // 1-8
    test("1-8: TailCallInfo.isSelfCall = true (자기 재귀)", () => {
      const safeSumBody = "RETURN SafeSum(n - 1, acc + n)";
      const calls = detector.detectTailCalls("SafeSum", safeSumBody);
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0].isSelfCall).toBe(true);
    });

    // 1-9
    test("1-9: TailCallInfo.argCount = 2 (n, acc)", () => {
      const safeSumBody = "RETURN SafeSum(n - 1, acc + n)";
      const calls = detector.detectTailCalls("SafeSum", safeSumBody);
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0].argCount).toBe(2);
    });

    // 1-10
    test('1-10: TailCallInfo.position = "tail"', () => {
      const safeSumBody = "RETURN SafeSum(n - 1, acc)";
      const calls = detector.detectTailCalls("SafeSum", safeSumBody);
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0].position).toBe("tail");
    });

    // 1-11
    test("1-11: 비재귀 함수 → isTailRecursive = false", () => {
      const addBody = "RETURN a + b";
      expect(detector.isTailRecursive("add", addBody)).toBe(false);
    });

    // 1-12
    test("1-12: 상호 재귀 (A→B) 탐지", () => {
      const bodyA = "RETURN B(n)";
      const calls = detector.detectTailCalls("B", bodyA);
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0].funcName).toBe("B");
    });

    // 1-13
    test("1-13: 삼항 연산자 내 tail call 탐지", () => {
      const ternaryBody = "RETURN n <= 0 ? acc : SafeSum(n-1, acc+n)";
      expect(detector.isTailRecursive("SafeSum", ternaryBody)).toBe(true);
    });

    // 1-14
    test("1-14: 중첩 if 내 tail call", () => {
      const ifBody = `
        IF (n > 0) {
          RETURN SafeSum(n - 1, acc)
        }
      `;
      expect(detector.isTailRecursive("SafeSum", ifBody)).toBe(true);
    });

    // 1-15
    test("1-15: Countdown 꼬리 재귀 탐지", () => {
      const countdownBody = `
        IF (n <= 0) { RETURN 0 }
        RETURN Countdown(n - 1)
      `;
      expect(detector.isTailRecursive("Countdown", countdownBody)).toBe(true);
    });

    // 1-16
    test("1-16: 복수 tail call 위치 탐지", () => {
      const multiBody = `
        IF (cond1) { RETURN f(x) }
        IF (cond2) { RETURN f(y) }
        RETURN f(z)
      `;
      const calls = detector.detectTailCalls("f", multiBody);
      expect(calls.length).toBeGreaterThanOrEqual(1);
    });

    // 1-17
    test("1-17: non-tail call 걸러내기", () => {
      const nonTailBody = "RETURN 1 + SafeSum(n-1, acc)";
      expect(detector.isTailRecursive("SafeSum", nonTailBody)).toBe(false);
    });

    // 1-18
    test("1-18: 빈 함수 → tail call 없음", () => {
      const empty = "";
      const calls = detector.detectTailCalls("f", empty);
      expect(calls.length).toBe(0);
    });

    // 1-19
    test("1-19: 기저 조건 + 꼬리 재귀 정확 분류", () => {
      const fullBody = `
        IF (n <= 0) { RETURN acc }
        RETURN SafeSum(n - 1, acc + n)
      `;
      expect(detector.isTailRecursive("SafeSum", fullBody)).toBe(true);
      const calls = detector.detectTailCalls("SafeSum", fullBody);
      expect(calls.length).toBe(1);
    });

    // 1-20
    test("1-20: ✅ SafeSum 완전 꼬리 재귀 시그니처 확인", () => {
      const safeSumBody = `
        IF (n <= 0) { RETURN acc }
        RETURN SafeSum(n - 1, acc + n)
      `;
      expect(detector.isTailRecursive("SafeSum", safeSumBody)).toBe(true);
      const calls = detector.detectTailCalls("SafeSum", safeSumBody);
      expect(calls.length).toBe(1);
      expect(calls[0].funcName).toBe("SafeSum");
      expect(calls[0].isSelfCall).toBe(true);
      expect(calls[0].argCount).toBe(2);
      expect(calls[0].position).toBe("tail");
    });
  });

  // ==========================================
  // Phase 2: Frame Stability (20 tests)
  // ==========================================

  describe("Phase 2: Frame Stability", () => {
    // 2-1
    test("2-1: TCOEngine 인스턴스 생성", () => {
      const engine = new TCOEngine();
      expect(engine).toBeDefined();
      expect(typeof engine.execute).toBe("function");
      expect(typeof engine.getCurrentDepth).toBe("function");
      expect(typeof engine.getMaxObservedDepth).toBe("function");
      expect(typeof engine.getIterationCount).toBe("function");
    });

    // 2-2
    test("2-2: execute() 기저 조건 즉시 반환", () => {
      const engine = new TCOEngine();
      const baseFn = (args: number[]) => args[0]; // 항상 기저 조건
      const result = engine.execute(baseFn, [42]);
      expect(result).toBe(42);
      expect(engine.getIterationCount()).toBe(1);
    });

    // 2-3
    test("2-3: 1회 재귀 후 depth = 1 유지", () => {
      const engine = new TCOEngine();
      const simpleFn = (args: number[]) => {
        const [n] = args;
        if (n <= 0) return 0;
        return [n - 1];
      };
      engine.execute(simpleFn, [1]);
      expect(engine.getMaxObservedDepth()).toBe(1);
    });

    // 2-4
    test("2-4: 10회 재귀 후 depth = 1 (스택 불변)", () => {
      const engine = new TCOEngine();
      const fn = (args: number[]) => {
        const [n] = args;
        if (n <= 0) return 0;
        return [n - 1];
      };
      engine.execute(fn, [10]);
      expect(engine.getMaxObservedDepth()).toBe(1);
    });

    // 2-5
    test("2-5: 100회 재귀 후 depth = 1", () => {
      const engine = new TCOEngine();
      const fn = (args: number[]) => {
        const [n] = args;
        if (n <= 0) return 0;
        return [n - 1];
      };
      engine.execute(fn, [100]);
      expect(engine.getMaxObservedDepth()).toBe(1);
    });

    // 2-6
    test("2-6: getMaxObservedDepth() = 1 (1000회 재귀)", () => {
      const engine = new TCOEngine();
      const fn = (args: number[]) => {
        const [n] = args;
        if (n <= 0) return 0;
        return [n - 1];
      };
      engine.execute(fn, [1000]);
      expect(engine.getMaxObservedDepth()).toBe(1);
    });

    // 2-7
    test("2-7: getIterationCount() = 11 (10 재귀 + 1 기저)", () => {
      const engine = new TCOEngine();
      const fn = (args: number[]) => {
        const [n] = args;
        if (n <= 0) return n;
        return [n - 1];
      };
      engine.execute(fn, [10]);
      expect(engine.getIterationCount()).toBe(11); // 10 iterations + base case
    });

    // 2-8
    test("2-8: reset() 후 카운터 초기화", () => {
      const engine = new TCOEngine();
      const fn = (args: number[]) => args[0];
      engine.execute(fn, [42]);
      expect(engine.getIterationCount()).toBe(1);
      engine.reset();
      expect(engine.getIterationCount()).toBe(0);
      expect(engine.getCurrentDepth()).toBe(0);
    });

    // 2-9
    test("2-9: SafeSum(10, 0) = 55 정확성", () => {
      const engine = new TCOEngine();
      const safeSumFn = (args: number[]) => {
        const [n, acc] = args;
        if (n <= 0) return acc;
        return [n - 1, acc + n];
      };
      const result = engine.execute(safeSumFn, [10, 0]);
      expect(result).toBe(55); // 10+9+8+...+1
    });

    // 2-10
    test("2-10: SafeSum(100, 0) = 5050 정확성", () => {
      const engine = new TCOEngine();
      const safeSumFn = (args: number[]) => {
        const [n, acc] = args;
        if (n <= 0) return acc;
        return [n - 1, acc + n];
      };
      const result = engine.execute(safeSumFn, [100, 0]);
      expect(result).toBe(5050);
    });

    // 2-11
    test("2-11: Countdown(5) = 0 정확성", () => {
      const engine = new TCOEngine();
      const countdownFn = (args: number[]) => {
        const [n] = args;
        if (n <= 0) return 0;
        return [n - 1];
      };
      const result = engine.execute(countdownFn, [5]);
      expect(result).toBe(0);
    });

    // 2-12
    test("2-12: 1000회 재귀: depth = 1 (비 TCO면 스택 오버플로우)", () => {
      const engine = new TCOEngine();
      const safeSumFn = (args: number[]) => {
        const [n, acc] = args;
        if (n <= 0) return acc;
        return [n - 1, acc + n];
      };
      // 1000 iterations with TCO should NOT overflow
      const result = engine.execute(safeSumFn, [1000, 0]);
      expect(result).toBe(500500); // sum of 1 to 1000
      expect(engine.getMaxObservedDepth()).toBe(1);
    });

    // 2-13
    test("2-13: 10000회 재귀: depth = 1", () => {
      const engine = new TCOEngine();
      const safeSumFn = (args: number[]) => {
        const [n, acc] = args;
        if (n <= 0) return acc;
        return [n - 1, acc + n];
      };
      const result = engine.execute(safeSumFn, [10000, 0]);
      expect(result).toBe(50005000);
      expect(engine.getMaxObservedDepth()).toBe(1);
    });

    // 2-14
    test("2-14: FactorialTCO(5) = 120", () => {
      const engine = new TCOEngine();
      const factTCOFn = (args: number[]) => {
        const [n, acc] = args;
        if (n <= 1) return acc;
        return [n - 1, acc * n];
      };
      const result = engine.execute(factTCOFn, [5, 1]);
      expect(result).toBe(120);
    });

    // 2-15
    test("2-15: FactorialTCO(10) = 3628800", () => {
      const engine = new TCOEngine();
      const factTCOFn = (args: number[]) => {
        const [n, acc] = args;
        if (n <= 1) return acc;
        return [n - 1, acc * n];
      };
      const result = engine.execute(factTCOFn, [10, 1]);
      expect(result).toBe(3628800);
    });

    // 2-16
    test("2-16: 연속 execute() 호출 격리", () => {
      const engine = new TCOEngine();
      const fn = (args: number[]) => {
        const [n] = args;
        if (n <= 0) return 0;
        return [n - 1];
      };
      engine.execute(fn, [5]);
      const count1 = engine.getIterationCount();
      engine.reset();
      engine.execute(fn, [10]);
      const count2 = engine.getIterationCount();
      expect(count1).toBe(6); // 5 + 1 base
      expect(count2).toBe(11); // 10 + 1 base
    });

    // 2-17
    test("2-17: 음수 입력 기저 조건 처리", () => {
      const engine = new TCOEngine();
      const safeSumFn = (args: number[]) => {
        const [n, acc] = args;
        if (n <= 0) return acc;
        return [n - 1, acc + n];
      };
      const result = engine.execute(safeSumFn, [-5, 100]);
      expect(result).toBe(100); // 기저 조건 즉시 반환
    });

    // 2-18
    test("2-18: 0 입력 즉시 종료", () => {
      const engine = new TCOEngine();
      const safeSumFn = (args: number[]) => {
        const [n, acc] = args;
        if (n <= 0) return acc;
        return [n - 1, acc + n];
      };
      const result = engine.execute(safeSumFn, [0, 42]);
      expect(result).toBe(42);
      expect(engine.getIterationCount()).toBe(1);
    });

    // 2-19
    test("2-19: 큰 누산기 값 정확성", () => {
      const engine = new TCOEngine();
      const accumulateFn = (args: number[]) => {
        const [n, acc] = args;
        if (n <= 0) return acc;
        return [n - 1, acc + 1000000];
      };
      const result = engine.execute(accumulateFn, [10, 0]);
      expect(result).toBe(10000000);
    });

    // 2-20
    test("2-20: ✅ FRAME STABILITY: depth = 1 @ 10000 iterations", () => {
      const engine = new TCOEngine();
      const safeSumFn = (args: number[]) => {
        const [n, acc] = args;
        if (n <= 0) return acc;
        return [n - 1, acc + n];
      };
      const result = engine.execute(safeSumFn, [10000, 0]);
      // 10000 + 9999 + ... + 1
      expect(result).toBe(50005000);
      expect(engine.getMaxObservedDepth()).toBe(1);
      expect(engine.getCurrentDepth()).toBe(0); // after execution
    });
  });

  // ==========================================
  // Phase 3: SafeSum Integration (20 tests)
  // ==========================================

  describe("Phase 3: SafeSum Integration", () => {
    const safeSumFn = (args: number[]) => {
      const [n, acc] = args;
      if (n <= 0) return acc;
      return [n - 1, acc + n];
    };

    // 3-1
    test("3-1: SafeSum(1, 0) = 1", () => {
      const engine = new TCOEngine();
      const result = engine.execute(safeSumFn, [1, 0]);
      expect(result).toBe(1);
    });

    // 3-2
    test("3-2: SafeSum(5, 0) = 15", () => {
      const engine = new TCOEngine();
      const result = engine.execute(safeSumFn, [5, 0]);
      expect(result).toBe(15); // 5+4+3+2+1
    });

    // 3-3
    test("3-3: SafeSum(10, 0) = 55", () => {
      const engine = new TCOEngine();
      const result = engine.execute(safeSumFn, [10, 0]);
      expect(result).toBe(55);
    });

    // 3-4
    test("3-4: SafeSum(100, 0) = 5050", () => {
      const engine = new TCOEngine();
      const result = engine.execute(safeSumFn, [100, 0]);
      expect(result).toBe(5050);
    });

    // 3-5
    test("3-5: SafeSum(1000, 0) = 500500", () => {
      const engine = new TCOEngine();
      const result = engine.execute(safeSumFn, [1000, 0]);
      expect(result).toBe(500500);
    });

    // 3-6
    test("3-6: SafeSum(10000, 0) = 50005000", () => {
      const engine = new TCOEngine();
      const result = engine.execute(safeSumFn, [10000, 0]);
      expect(result).toBe(50005000);
    });

    // 3-7
    test("3-7: SafeSum(50000, 0) = 1250025000", () => {
      const engine = new TCOEngine();
      const result = engine.execute(safeSumFn, [50000, 0]);
      expect(result).toBe(1250025000);
    });

    // 3-8 🔥 Main Goal
    test("3-8: ✅ SafeSum(100000, 0) = 5000050000 (THE BIG ONE!)", () => {
      const engine = new TCOEngine();
      const result = engine.execute(safeSumFn, [100000, 0]);
      expect(result).toBe(5000050000);
    });

    // 3-9
    test("3-9: SafeSum(100000, 0): maxDepth = 1 (TCO 증명!)", () => {
      const engine = new TCOEngine();
      engine.execute(safeSumFn, [100000, 0]);
      expect(engine.getMaxObservedDepth()).toBe(1);
    });

    // 3-10
    test("3-10: SafeSum(100000, 0): iterationCount = 100001", () => {
      const engine = new TCOEngine();
      engine.execute(safeSumFn, [100000, 0]);
      expect(engine.getIterationCount()).toBe(100001); // 100000 + 1 base
    });

    // 3-11
    test("3-11: SafeSum(100000, 0): NO stack overflow", () => {
      const engine = new TCOEngine();
      // This should NOT throw "Maximum call stack size exceeded"
      expect(() => engine.execute(safeSumFn, [100000, 0])).not.toThrow();
    });

    // 3-12
    test("3-12: SafeSum(100000, 100) = 5000050100 (초기 acc)", () => {
      const engine = new TCOEngine();
      const result = engine.execute(safeSumFn, [100000, 100]);
      expect(result).toBe(5000050100);
    });

    // 3-13
    test("3-13: TailCallDetector + TCOEngine 통합", () => {
      const detector = new TailCallDetector();
      const engine = new TCOEngine();

      const safeSumBody = `
        IF (n <= 0) { RETURN acc }
        RETURN SafeSum(n - 1, acc + n)
      `;

      // 탐지
      const isTCO = detector.isTailRecursive("SafeSum", safeSumBody);
      expect(isTCO).toBe(true);

      // 실행
      const result = engine.execute(safeSumFn, [100, 0]);
      expect(result).toBe(5050);
    });

    // 3-14
    test("3-14: 탐지 → 실행 파이프라인", () => {
      const detector = new TailCallDetector();

      // Step 1: 탐지
      const safeSumBody = `
        IF (n <= 0) { RETURN acc }
        RETURN SafeSum(n - 1, acc + n)
      `;
      const calls = detector.detectTailCalls("SafeSum", safeSumBody);
      expect(calls.length).toBe(1);

      // Step 2: 실행 가능하면 TCO 사용
      if (calls.length > 0) {
        const engine = new TCOEngine();
        const result = engine.execute(safeSumFn, [10, 0]);
        expect(result).toBe(55);
      }
    });

    // 3-15
    test("3-15: Detector: SafeSum는 TCO 대상 → Engine: 실행 성공", () => {
      const detector = new TailCallDetector();
      const engine = new TCOEngine();

      const safeSumBody = `
        IF (n <= 0) { RETURN acc }
        RETURN SafeSum(n - 1, acc + n)
      `;

      // Detector 검증
      expect(detector.isTailRecursive("SafeSum", safeSumBody)).toBe(true);
      const calls = detector.detectTailCalls("SafeSum", safeSumBody);
      expect(calls.length).toBeGreaterThan(0);

      // Engine 검증
      const result = engine.execute(safeSumFn, [50, 0]);
      expect(result).toBe(1275);
    });

    // 3-16
    test("3-16: 메모리 사용: O(1) 스택 검증", () => {
      const engine = new TCOEngine();
      // Run multiple large iterations
      engine.execute(safeSumFn, [1000, 0]);
      const depth1 = engine.getMaxObservedDepth();
      engine.reset();

      engine.execute(safeSumFn, [10000, 0]);
      const depth2 = engine.getMaxObservedDepth();

      // Depth should be constant O(1) regardless of iteration count
      expect(depth1).toBe(1);
      expect(depth2).toBe(1);
    });

    // 3-17
    test("3-17: 성능: 100000 iterations < 100ms", () => {
      const engine = new TCOEngine();
      const start = Date.now();
      engine.execute(safeSumFn, [100000, 0]);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(100); // Should complete in < 100ms
    });

    // 3-18
    test("3-18: 재사용: 같은 engine으로 여러 함수 실행", () => {
      const engine = new TCOEngine();

      // SafeSum
      const result1 = engine.execute(safeSumFn, [10, 0]);
      expect(result1).toBe(55);

      engine.reset();

      // Factorial TCO
      const factTCOFn = (args: number[]) => {
        const [n, acc] = args;
        if (n <= 1) return acc;
        return [n - 1, acc * n];
      };
      const result2 = engine.execute(factTCOFn, [5, 1]);
      expect(result2).toBe(120);
    });

    // 3-19
    test("3-19: Factorial + SafeSum 순차 실행", () => {
      const engine = new TCOEngine();

      const factTCOFn = (args: number[]) => {
        const [n, acc] = args;
        if (n <= 1) return acc;
        return [n - 1, acc * n];
      };

      // Factorial
      const fact5 = engine.execute(factTCOFn, [5, 1]);
      expect(fact5).toBe(120);
      engine.reset();

      // SafeSum
      const sum10 = engine.execute(safeSumFn, [10, 0]);
      expect(sum10).toBe(55);
    });

    // 3-20 🏆 Final Verification
    test("3-20: ✅ TC_V6_3_SAFESUM_100000 COMPLETE", () => {
      const detector = new TailCallDetector();
      const engine = new TCOEngine();

      const safeSumBody = `
        IF (n <= 0) { RETURN acc }
        RETURN SafeSum(n - 1, acc + n)
      `;

      // Verification 1: Tail Recursion Detection
      expect(detector.isTailRecursive("SafeSum", safeSumBody)).toBe(true);
      const calls = detector.detectTailCalls("SafeSum", safeSumBody);
      expect(calls.length).toBe(1);
      expect(calls[0].funcName).toBe("SafeSum");

      // Verification 2: Execution
      const result = engine.execute(safeSumFn, [100000, 0]);
      expect(result).toBe(5000050000);

      // Verification 3: Frame Stability
      expect(engine.getMaxObservedDepth()).toBe(1);

      // Verification 4: Iteration Count
      expect(engine.getIterationCount()).toBe(100001);

      // All checks passed! 🎉
    });
  });
});
