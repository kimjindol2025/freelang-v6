/**
 * FreeLang v8.0: Stack Unwinding Engine
 * 목표: 예외 발생 시 스택 역순 정리 및 소멸자 호출 보장
 *
 * 언와인딩 프로세스:
 * - 현재 스택부터 역순으로 올라감
 * - 각 프레임의 지역 변수 정리
 * - v7.5 Destructor 호출 (객체 리소스 정리)
 * - 프레임 제거 후 다음 계층으로
 * - 일치하는 핸들러의 프레임에서 멈춤
 */

/**
 * 언와인딩 이벤트: 특정 프레임 정리 중에 일어난 일
 *
 * 예:
 * {
 *   frameIndex: 2,
 *   functionName: "DangerousDivision",
 *   destructorsCalled: ["x", "y"],  // 객체 멤버들
 *   variablesCleared: 5
 * }
 */
export interface UnwindingEvent {
  frameIndex: number;                // 정리 중인 프레임 인덱스 (0 = 가장 아래)
  functionName: string;              // 함수명 ("DangerousDivision")
  destructorsCalled: string[];       // 소멸자 호출된 변수명들
  variablesCleared: number;          // 정리된 지역 변수 개수
}

/**
 * 호출 스택 프레임 내부 구조
 */
export interface CallFrame {
  functionName: string;              // 함수명
  variables: Map<string, any>;       // 지역 변수들 {name → value}
  createdAt: number;                 // 프레임 생성 시간
}

/**
 * StackUnwindingEngine: 스택 언와인딩 관리
 *
 * 역할:
 * 1. 호출 스택 추적 (pushFrame)
 * 2. 정상 반환 (popFrame)
 * 3. 예외 발생 시 스택 역순 정리 (unwind)
 * 4. v7.5 Destructor 호출
 * 5. 언와인딩 프로세스 로깅
 *
 * 예:
 * const unwinder = new StackUnwindingEngine(destructorEngine);
 * unwinder.pushFrame("main", new Map([["x", 10]]));
 * unwinder.pushFrame("foo", new Map([["y", obj1], ["z", obj2]]));
 * unwinder.pushFrame("bar", new Map());
 * // Call Stack: ["main", "foo", "bar"]
 *
 * unwinder.unwind(0);  // main 프레임 제외하고 모두 정리
 * // → foo와 bar 정리, v7.5 destructors 호출
 * // → Call Stack: ["main"]
 *
 * const log = unwinder.getUnwindingLog();
 * // [{frameIndex: 2, functionName: "bar", ...},
 * //  {frameIndex: 1, functionName: "foo", destructorsCalled: ["y", "z"], ...}]
 */
export class StackUnwindingEngine {
  private callStack: CallFrame[] = [];
  // 호출 스택 (아래에서 위로: index 0 = 가장 먼저 호출)

  private unwindingLog: UnwindingEvent[] = [];
  // 언와인딩 이벤트 로그

  constructor(private destructorEngine?: any) {}
  // destructorEngine: v7.5의 DestructorEngine (선택)
  // finalize(obj) 메서드를 가져야 함

  /**
   * 호출 스택에 프레임 푸시
   * 함수 호출 시마다 호출됨
   *
   * 예: pushFrame("foo", new Map([["x", 10], ["y", 20]]))
   */
  pushFrame(functionName: string, variables: Map<string, any>): void {
    this.callStack.push({
      functionName,
      variables,
      createdAt: Date.now(),
    });
  }

  /**
   * 정상 복귀 시 스택에서 프레임 제거
   * RETURN 명령어 실행 후 호출
   */
  popFrame(): CallFrame | undefined {
    return this.callStack.pop();
  }

  /**
   * 예외 발생 시 스택 언와인딩
   *
   * 흐름:
   * 1. upToFrameIndex보다 위의 모든 프레임 역순 처리
   * 2. 각 프레임에서:
   *    - 지역 변수 순회
   *    - v7.5 객체이면 finalize() 호출
   *    - 변수 맵 비우기
   * 3. 프레임 제거
   * 4. 언와인딩 로그 기록
   *
   * 예:
   * // Call Stack: [main, foo, bar]
   * unwinder.unwind(0);  // 프레임 1, 2 정리 (인덱스 1 이상)
   *
   * // 또는
   * unwinder.unwind(1);  // 프레임 2만 정리 (인덱스 2 이상)
   *
   * @param upToFrameIndex - 이 인덱스까지는 유지하고, 이 위의 프레임들만 정리
   */
  unwind(upToFrameIndex: number): void {
    const startIndex = this.callStack.length - 1;

    for (let i = startIndex; i > upToFrameIndex; i--) {
      const frame = this.callStack[i];
      const event: UnwindingEvent = {
        frameIndex: i,
        functionName: frame.functionName,
        destructorsCalled: [],
        variablesCleared: 0,
      };

      // Step 1: 지역 변수 순회 및 소멸자 호출
      const variableCount = frame.variables.size;

      for (const [varName, varValue] of frame.variables.entries()) {
        // v7.5 객체 판정: destroyed 필드가 있으면 v7.5 객체
        if (
          varValue &&
          typeof varValue === 'object' &&
          'destroyed' in varValue &&
          this.destructorEngine
        ) {
          // v7.5 Destructor 호출
          try {
            this.destructorEngine.finalize(varValue);
            event.destructorsCalled.push(varName);
          } catch (e) {
            // 소멸자 실패해도 계속 진행 (robust unwinding)
            console.warn(`Destructor failed for ${varName}:`, e);
          }
        }
      }

      // Step 2: 변수 맵 전체 정리
      frame.variables.clear();
      event.variablesCleared = variableCount;

      // Step 3: 프레임 제거
      this.callStack.pop();

      // Step 4: 로그에 기록
      this.unwindingLog.push(event);
    }
  }

  /**
   * 언와인딩 이벤트 로그 조회
   * 언와인딩 중에 일어난 모든 프레임 정리 내역
   */
  getUnwindingLog(): UnwindingEvent[] {
    return [...this.unwindingLog];
  }

  /**
   * 현재 호출 스택 깊이
   */
  getStackDepth(): number {
    return this.callStack.length;
  }

  /**
   * 현재 호출 스택 스냅샷
   * 디버깅/모니터링 용도
   */
  getStackSnapshot(): Array<{
    functionName: string;
    variableCount: number;
  }> {
    return this.callStack.map((frame) => ({
      functionName: frame.functionName,
      variableCount: frame.variables.size,
    }));
  }

  /**
   * 특정 프레임의 지역 변수 조회
   */
  getFrameVariables(frameIndex: number): Map<string, any> | undefined {
    if (frameIndex >= 0 && frameIndex < this.callStack.length) {
      return new Map(this.callStack[frameIndex].variables);
    }
    return undefined;
  }

  /**
   * 특정 프레임의 지역 변수 값 조회
   */
  getVariable(frameIndex: number, varName: string): any {
    const frame = this.callStack[frameIndex];
    if (!frame) return undefined;
    return frame.variables.get(varName);
  }

  /**
   * 깊이 확인: 현재 스택이 특정 깊이인가?
   */
  isAtDepth(depth: number): boolean {
    return this.callStack.length === depth;
  }

  /**
   * 최상위 프레임 (가장 최근 호출)
   */
  getCurrentFrame(): CallFrame | undefined {
    return this.callStack[this.callStack.length - 1];
  }

  /**
   * 특정 함수명 찾기 (가장 위의 occurrence)
   */
  findFrameByFunction(functionName: string): number {
    for (let i = this.callStack.length - 1; i >= 0; i--) {
      if (this.callStack[i].functionName === functionName) {
        return i;
      }
    }
    return -1;
  }

  /**
   * 언와인딩 통계
   */
  getStatistics(): {
    totalFramesUnwound: number;
    totalDestructorsCalled: number;
    totalVariablesCleared: number;
  } {
    let totalDestructorsCalled = 0;
    let totalVariablesCleared = 0;

    for (const event of this.unwindingLog) {
      totalDestructorsCalled += event.destructorsCalled.length;
      totalVariablesCleared += event.variablesCleared;
    }

    return {
      totalFramesUnwound: this.unwindingLog.length,
      totalDestructorsCalled,
      totalVariablesCleared,
    };
  }

  /**
   * 언와인딩 로그 초기화
   * 새로운 언와인딩 시작 전 호출 (선택)
   */
  clearUnwindingLog(): void {
    this.unwindingLog = [];
  }

  /**
   * 전체 상태 초기화
   */
  clear(): void {
    this.callStack = [];
    this.unwindingLog = [];
  }
}

/**
 * 사용 예시
 *
 * ```typescript
 * const destructorEngine = new DestructorEngine();
 * const unwinder = new StackUnwindingEngine(destructorEngine);
 *
 * // 1. 호출 스택 구성
 * const mainVars = new Map([["x", 10], ["y", 20]]);
 * unwinder.pushFrame("main", mainVars);
 *
 * const fooVars = new Map([["a", obj1], ["b", obj2]]);
 * unwinder.pushFrame("foo", fooVars);
 *
 * const barVars = new Map([["p", obj3]]);
 * unwinder.pushFrame("bar", barVars);
 *
 * // 2. 현재 상태 확인
 * unwinder.getStackDepth() // 3
 * unwinder.getStackSnapshot() // [{functionName: "main", variableCount: 2}, ...]
 *
 * // 3. 예외 발생 → 스택 언와인딩
 * unwinder.unwind(0);  // foo와 bar 프레임 정리
 *
 * // 4. 결과 확인
 * unwinder.getStackDepth() // 1 (main만 남음)
 * const log = unwinder.getUnwindingLog();
 * // [
 * //   {frameIndex: 2, functionName: "bar", destructorsCalled: ["p"], variablesCleared: 1},
 * //   {frameIndex: 1, functionName: "foo", destructorsCalled: ["a", "b"], variablesCleared: 2}
 * // ]
 *
 * const stats = unwinder.getStatistics();
 * // {totalFramesUnwound: 2, totalDestructorsCalled: 3, totalVariablesCleared: 3}
 * ```
 */
