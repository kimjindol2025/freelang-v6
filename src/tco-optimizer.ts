/**
 * FreeLang v6.3: Tail Call Optimization (TCO)
 * 목표: SafeSum(100000, 0) = 5000050000을 O(1) 스택으로 실행
 *
 * 원리: 꼬리 재귀 = `return f(args)`가 마지막 연산일 때
 *       스택 프레임 재사용 (새 push 없음) → 루프 변환
 */

export interface TailCallInfo {
  funcName: string;                    // 재귀 호출되는 함수명
  isSelfCall: boolean;                 // 자기 자신을 호출하는가
  argCount: number;                    // 인자 수
  position: "tail" | "non-tail";       // 꼬리 위치인가
}

/**
 * Tail Call Detection: return f(args) 패턴 탐지
 * 패턴 기반 분석 (AST 아님)
 */
export class TailCallDetector {
  /**
   * 함수가 꼬리 재귀 가능한지 판단
   *
   * 꼬리 재귀 = `return funcName(...)` 이 전체이고 AND
   *           덧셈/뺄셈 등 후속 연산 없음
   * (대소문자 무시)
   */
  isTailRecursive(funcName: string, body: string): boolean {
    if (!body || body.trim() === "") return false;

    // return 뒤에 함수 호출만 있는지 확인 (후속 연산 없음)
    const lines = body.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();

      // "RETURN" 또는 "return"으로 시작하는지 확인
      const returnMatch = trimmed.match(/^(return|RETURN)\s+(.+)$/i);
      if (!returnMatch) continue;

      const afterReturn = returnMatch[2]; // return 뒤의 전체 표현식

      // 삼항 연산자 처리
      if (afterReturn.includes("?")) {
        // 삼항: "cond ? val : f(...)" 형태
        const colonIndex = afterReturn.lastIndexOf(":");
        if (colonIndex > 0) {
          const elseBranch = afterReturn.substring(colonIndex + 1).trim();
          // else 브랜치가 정확히 "funcName(...)" 형태인가?
          const isTailInElse = new RegExp(
            `^${funcName}\\s*\\([^)]*\\)\\s*$`,
            "i"
          ).test(elseBranch);
          if (isTailInElse) {
            return true; // tail call in else branch ✅
          }
        }
      } else {
        // 단순 return f(...) 형태
        // "return funcName(...)" 가 전부인가?
        // "return funcName(...) + x" 는 안 됨!
        const isSingleTailCall = new RegExp(
          `^${funcName}\\s*\\([^)]*\\)\\s*$`,
          "i"
        ).test(afterReturn);
        if (isSingleTailCall) {
          return true; // tail call ✅
        }
      }
    }

    return false;
  }

  /**
   * body에서 모든 tail call 위치 찾기 (대소문자 무시)
   */
  detectTailCalls(funcName: string, body: string): TailCallInfo[] {
    const calls: TailCallInfo[] = [];
    if (!body) return calls;

    // "return funcName(" 패턴 찾기 (모든 위치, 대소문자 무시)
    const pattern = new RegExp(`(return|RETURN)\\s+${funcName}\\s*\\(([^)]*)\\)`, "gi");
    let match;

    while ((match = pattern.exec(body)) !== null) {
      const argStr = match[2];
      // 인자 개수: 쉼표로 분리
      const argCount = argStr.trim() === "" ? 0 : argStr.split(",").length;

      calls.push({
        funcName,
        isSelfCall: true,
        argCount,
        position: "tail",
      });
    }

    return calls;
  }

  /**
   * 단순 패턴: "return funcName(" 존재 여부 (대소문자 무시)
   */
  hasTailCallPattern(body: string, funcName: string): boolean {
    if (!body || !funcName) return false;
    const pattern = new RegExp(`(return|RETURN)\\s+${funcName}\\s*\\(`, "i");
    return pattern.test(body);
  }
}

/**
 * TCO Engine: 꼬리 재귀를 루프로 실행
 *
 * 원리:
 * - fn(args)가 배열 반환 → 다음 재귀 인자 (루프 계속)
 * - fn(args)가 숫자 반환 → 최종 결과 (기저 조건, 루프 종료)
 *
 * 스택 깊이: 항상 1 (프레임 재사용!)
 */
export class TCOEngine {
  private callDepth: number = 0;
  private maxObservedDepth: number = 0;
  private iterationCount: number = 0;

  /**
   * 꼬리 재귀 함수를 루프로 실행
   *
   * @param fn (args: number[]) => number[] | number
   *   - 배열 반환: 다음 재귀 호출 인자 (꼬리 재귀 계속)
   *   - 숫자 반환: 최종 결과 (기저 조건)
   * @param initialArgs 초기 인자
   * @returns 최종 결과값
   *
   * 예시: SafeSum(100000, 0)
   * ```
   * const safeSumFn = (args) => {
   *   const [n, acc] = args;
   *   if (n <= 0) return acc;  // 숫자 → 루프 종료
   *   return [n - 1, acc + n]; // 배열 → 루프 계속
   * };
   * const result = engine.execute(safeSumFn, [100000, 0]);
   * // result === 5000050000 ✅
   * // callDepth === 1 ✅ (스택 폭발 없음!)
   * ```
   */
  execute(
    fn: (args: number[]) => number[] | number,
    initialArgs: number[]
  ): number {
    // 초기화
    this.callDepth = 1;  // 첫 호출은 깊이 1에서 시작
    this.maxObservedDepth = 1;
    this.iterationCount = 0;

    let args = initialArgs;

    // TCO 루프: 스택 깊이 항상 1
    while (true) {
      const result = fn(args);
      this.iterationCount++;

      if (typeof result === "number") {
        // 기저 조건: 숫자 반환 → 최종값
        this.callDepth = 0;
        return result;
      }

      // 꼬리 재귀: 배열 반환 → 인자만 교체, 루프 계속
      // 💡 중요: 스택 깊이는 1 그대로 (프레임 재사용!)
      args = result;
    }
  }

  /**
   * 현재 콜 깊이 (TCO 중이면 항상 1, 실행 중 0)
   */
  getCurrentDepth(): number {
    return this.callDepth;
  }

  /**
   * 최대 관측 깊이 (TCO이면 항상 1)
   */
  getMaxObservedDepth(): number {
    return this.maxObservedDepth;
  }

  /**
   * 총 반복 횟수
   */
  getIterationCount(): number {
    return this.iterationCount;
  }

  /**
   * 초기화
   */
  reset(): void {
    this.callDepth = 0;
    this.maxObservedDepth = 0;
    this.iterationCount = 0;
  }
}

/**
 * 사용 예시
 *
 * ```typescript
 * // SafeSum 구현
 * const safeSumFn = (args: number[]) => {
 *   const [n, acc] = args;
 *   if (n <= 0) return acc;         // 기저: 숫자 반환
 *   return [n - 1, acc + n];        // 꼬리: 배열 반환
 * };
 *
 * const engine = new TCOEngine();
 * const result = engine.execute(safeSumFn, [100000, 0]);
 *
 * console.log(result);                   // 5000050000 ✅
 * console.log(engine.getMaxObservedDepth()); // 1 ✅
 * console.log(engine.getIterationCount());   // 100001 ✅
 *
 * // 탐지
 * const detector = new TailCallDetector();
 * const isSafeSumTCO = detector.isTailRecursive("SafeSum", safeSumBody);
 * console.log(isSafeSumTCO); // true ✅
 * ```
 */
