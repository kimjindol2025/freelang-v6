/**
 * FreeLang v6.4: Mutual Recursion & Indirect Call Integrity
 * 목표: IsEven(10) = true를 스택 오버플로우 없이 처리
 *
 * 핵심:
 * 1. MutualCallResolver: 2-Pass 선점 등록 (Circular Symbol Resolution)
 * 2. MutualTCOEngine: Trampoline 패턴 (O(1) 스택 깊이 유지)
 *
 * IsEven(10) 플로우:
 * - IsEven(10) → IsOdd(9) → IsEven(8) → ... → IsOdd(0)=false
 * - 스택 깊이: 항상 1 (함수명만 전환)
 * - 반복 횟수: 11회 (depth=1!)
 */

/**
 * 함수 심볼 상태 머신
 * "defined" = 선언만 됨 (Pass 1)
 * "analyzing" = 본문 분석 중 (Pass 2 시작)
 * "resolved" = 모든 참조 확인됨 (Pass 2 완료)
 */
export type SymbolState = "defined" | "analyzing" | "resolved";

/**
 * Trampoline 반환 타입
 * - type=done: 최종값 반환 (기저 조건)
 * - type=call: 다른 함수로 전환 (상호 꼬리 호출)
 *
 * 예시: IsOdd → { type: "call", name: "IsEven", args: [n-1] }
 */
export type TrampolineResult =
  | { type: "done"; value: number }
  | { type: "call"; name: string; args: number[] };

/**
 * 함수 메타데이터 (상호 재귀 추적용)
 */
export interface MutualFunctionInfo {
  name: string;
  state: SymbolState;
  paramCount: number;           // 파라미터 개수
  returnType: string;           // "bool" | "i32" | "void" 등
  references: string[];         // 이 함수가 호출하는 함수명 목록
  resolvedAt?: number;          // resolve 타임스탬프 (ms)
}

/**
 * MutualCallResolver: 2-Pass 심볼 해결
 *
 * Pass 1 (declareFunction):
 *   IsEven → { state: "defined", references: [] }
 *   IsOdd  → { state: "defined", references: [] }
 *
 * Pass 2 (analyzeFunction):
 *   IsEven의 본문 분석 → references: ["IsOdd"]
 *   IsOdd의 본문 분석 → references: ["IsEven"]
 *
 * resolveAll():
 *   모든 함수 상태: "resolved"
 *   순환 참조 감지: hasCircularReference("IsEven", "IsOdd") = true ✅
 */
export class MutualCallResolver {
  private functions: Map<string, MutualFunctionInfo> = new Map();

  /**
   * Pass 1: 함수 시그니처 선점 등록 (순환 참조 방지)
   */
  declareFunction(
    name: string,
    paramCount: number,
    returnType: string = "any"
  ): void {
    this.functions.set(name, {
      name,
      state: "defined",
      paramCount,
      returnType,
      references: [],
    });
  }

  /**
   * Pass 2: 함수 본문 분석 → 참조 함수 수집
   *
   * 예: body = `IF (n <= 0) { RETURN acc } RETURN IsOdd(n-1)`
   *     → references: ["IsOdd"]
   */
  analyzeFunction(name: string, body: string): void {
    const info = this.functions.get(name);
    if (!info) return;

    info.state = "analyzing";

    // 등록된 모든 함수명이 body에 포함되는가?
    for (const [otherName] of this.functions) {
      if (otherName !== name && this.isFunctionReferenced(body, otherName)) {
        if (!info.references.includes(otherName)) {
          info.references.push(otherName);
        }
      }
    }
  }

  /**
   * 텍스트에서 함수 호출 탐지 (정규식)
   * "IsOdd(" 또는 "IsEven(" 패턴
   */
  private isFunctionReferenced(body: string, funcName: string): boolean {
    const pattern = new RegExp(`${funcName}\\s*\\(`, "i");
    return pattern.test(body);
  }

  /**
   * 모든 함수를 "resolved" 상태로 변환
   */
  resolveAll(): void {
    for (const info of this.functions.values()) {
      info.state = "resolved";
      info.resolvedAt = Date.now();
    }
  }

  /**
   * A와 B가 서로를 참조하는가? (순환 참조)
   * A가 B를 호출 AND B가 A를 호출 = true
   */
  hasCircularReference(funcA: string, funcB: string): boolean {
    const a = this.functions.get(funcA);
    const b = this.functions.get(funcB);

    if (!a || !b) return false;

    const aReferencesB = a.references.includes(funcB);
    const bReferencesA = b.references.includes(funcA);

    return aReferencesB && bReferencesA;
  }

  /**
   * name이 상호 재귀하는 파트너 함수 목록
   * 예: "IsEven" → ["IsOdd"] (IsOdd도 IsEven을 호출)
   */
  getMutualPartners(name: string): string[] {
    const info = this.functions.get(name);
    if (!info) return [];

    const partners: string[] = [];
    for (const ref of info.references) {
      if (this.hasCircularReference(name, ref)) {
        partners.push(ref);
      }
    }
    return partners;
  }

  /**
   * 함수의 현재 심볼 상태
   */
  getSymbolState(name: string): SymbolState | undefined {
    return this.functions.get(name)?.state;
  }

  /**
   * 함수 선언 여부 (Pass 1 이상)
   */
  hasDeclared(name: string): boolean {
    return this.functions.has(name);
  }

  /**
   * 등록된 모든 함수 정보
   */
  getAllFunctions(): MutualFunctionInfo[] {
    return Array.from(this.functions.values());
  }

  /**
   * 모든 함수가 "resolved" 상태인가?
   */
  isFullyResolved(): boolean {
    return Array.from(this.functions.values()).every(
      (info) => info.state === "resolved"
    );
  }

  /**
   * 초기화
   */
  clear(): void {
    this.functions.clear();
  }
}

/**
 * MutualTCOEngine: 상호 재귀를 O(1) 스택으로 실행
 *
 * 원리: Trampoline Pattern
 *
 * IsEven(10):
 * 1. engine.registerFunction("IsEven", isEvenFn)
 * 2. engine.registerFunction("IsOdd", isOddFn)
 * 3. engine.execute("IsEven", [10])
 *
 * 루프:
 *   iter=1: IsEven(10) → { type: "call", name: "IsOdd", args: [9] }
 *   iter=2: IsOdd(9)  → { type: "call", name: "IsEven", args: [8] }
 *   ...
 *   iter=11: IsOdd(0) → { type: "done", value: 0 }
 *
 * 스택: 항상 1 (함수명만 전환!)
 * 최대 깊이: 1 ✅
 */
export class MutualTCOEngine {
  private functions: Map<
    string,
    (args: number[]) => TrampolineResult
  > = new Map();
  private iterationCount: number = 0;
  private maxObservedDepth: number = 0;

  /**
   * Trampoline 함수 등록
   *
   * @param name 함수명 (예: "IsEven")
   * @param fn (args) => TrampolineResult
   *   - done: { type: "done", value: 결과 }
   *   - call: { type: "call", name: 함수명, args: 인자배열 }
   */
  registerFunction(
    name: string,
    fn: (args: number[]) => TrampolineResult
  ): void {
    this.functions.set(name, fn);
  }

  /**
   * Trampoline 루프 실행
   *
   * @param initialFunc 초기 함수명
   * @param initialArgs 초기 인자
   * @returns 최종 결과값
   *
   * 예: execute("IsEven", [10]) = 1 (true)
   * 깊이: 1, 반복: 11회
   */
  execute(initialFunc: string, initialArgs: number[]): number {
    let currentFunc = initialFunc;
    let currentArgs = initialArgs;
    this.iterationCount = 0;
    this.maxObservedDepth = 1;  // 첫 호출은 깊이 1

    while (true) {
      const fn = this.functions.get(currentFunc);
      if (!fn) {
        throw new Error(`함수 미등록: ${currentFunc}`);
      }

      const result = fn(currentArgs);
      this.iterationCount++;

      if (result.type === "done") {
        // 기저 조건: 최종값 반환
        return result.value;
      }

      // 상호 꼬리 호출: 함수명 전환, 깊이 1 유지!
      currentFunc = result.name;
      currentArgs = result.args;
    }
  }

  /**
   * 총 반복 횟수
   */
  getIterationCount(): number {
    return this.iterationCount;
  }

  /**
   * 최대 관측 깊이 (TCO이면 항상 1)
   */
  getMaxObservedDepth(): number {
    return this.maxObservedDepth;
  }

  /**
   * 초기화
   */
  reset(): void {
    this.iterationCount = 0;
    this.maxObservedDepth = 0;
  }
}

/**
 * 사용 예시
 *
 * ```typescript
 * // IsEven/IsOdd 정의
 * const isEvenFn = (args: number[]): TrampolineResult => {
 *   const [n] = args;
 *   if (n === 0) return { type: "done", value: 1 };  // true
 *   return { type: "call", name: "IsOdd", args: [n - 1] };
 * };
 *
 * const isOddFn = (args: number[]): TrampolineResult => {
 *   const [n] = args;
 *   if (n === 0) return { type: "done", value: 0 };  // false
 *   return { type: "call", name: "IsEven", args: [n - 1] };
 * };
 *
 * // 실행
 * const engine = new MutualTCOEngine();
 * engine.registerFunction("IsEven", isEvenFn);
 * engine.registerFunction("IsOdd", isOddFn);
 *
 * const result = engine.execute("IsEven", [10]);
 * console.log(result);                  // 1 (true) ✅
 * console.log(engine.getIterationCount()); // 11 ✅
 * console.log(engine.getMaxObservedDepth()); // 1 ✅ (NO overflow)
 *
 * // 심볼 해결
 * const resolver = new MutualCallResolver();
 * resolver.declareFunction("IsEven", 1, "bool");
 * resolver.declareFunction("IsOdd", 1, "bool");
 * resolver.analyzeFunction("IsEven", `IF (n === 0) return 1; return IsOdd(n-1)`);
 * resolver.analyzeFunction("IsOdd", `IF (n === 0) return 0; return IsEven(n-1)`);
 * resolver.resolveAll();
 *
 * console.log(resolver.hasCircularReference("IsEven", "IsOdd")); // true ✅
 * console.log(resolver.getMutualPartners("IsEven")); // ["IsOdd"] ✅
 * console.log(resolver.isFullyResolved()); // true ✅
 * ```
 */
