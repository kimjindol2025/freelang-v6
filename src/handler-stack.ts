/**
 * FreeLang v8.1: Handler Stack Design & Management
 * 목표: TRY 블록 진입 시 핸들러를 기록하고, 예외 발생 시 스택 복원을 보장
 *
 * 핸들러 프레임 (Handler Frame):
 * - PC (catchPC): CATCH 블록 바이트코드 주소
 * - SP (savedSP): TRY 진입 시 데이터 스택 깊이
 * - FP (savedFP): 현재 함수 프레임 깊이
 */

/**
 * 핸들러 프레임: TRY 블록 진입 시 저장되는 스냅샷
 *
 * 예:
 * {
 *   handlerId: "handler_1",
 *   catchPC: 1000,          // CATCH 블록 주소
 *   savedSP: 5,             // TRY 진입 시 스택 깊이
 *   savedFP: 2,             // TRY 진입 시 프레임 깊이
 *   exceptionTypes: ["ZeroDivisionError"],
 *   scope: { startPC: 100, endPC: 500 },
 *   pushedAt: 1771779436
 * }
 */
export interface HandlerFrame {
  handlerId: string;          // 고유 핸들러 ID ("handler_1", "handler_2")
  catchPC: number;            // CATCH 블록 바이트코드 주소 (PC)
  savedSP: number;            // TRY 진입 시점 데이터 스택 깊이 (SP)
  savedFP: number;            // TRY 진입 시점 함수 프레임 깊이 (FP)
  exceptionTypes: string[];   // 처리 가능한 예외 타입 (["ZeroDivisionError", "Any"])
  scope: {
    startPC: number;          // TRY 블록 시작 PC
    endPC: number;            // TRY 블록 끝 PC
  };
  pushedAt: number;           // 등록 타임스탬프
}

/**
 * HandlerStackManager: 독립적인 핸들러 스택 관리
 *
 * 역할:
 * 1. PUSH_HANDLER: TRY 진입 시 HandlerFrame을 스택에 추가
 * 2. POP_HANDLER: TRY 정상 종료 시 핸들러 제거
 * 3. findHandler: 예외 타입과 매칭하는 핸들러 탐색
 * 4. Overflow 방지: maxDepth 초과 시 처리
 * 5. Metadata Integrity: PC/SP/FP 정확성 보장
 */
export class HandlerStackManager {
  private stack: HandlerFrame[] = [];
  // 핸들러 스택 (아래에서 위로: index 0 = 가장 먼저 등록)

  private nextHandlerId = 1;

  private maxDepth: number;

  private statistics = {
    totalPushed: 0,
    totalPopped: 0,
    maxDepthReached: 0,
    overflowAttempts: 0,
  };

  constructor(maxDepth = 1000) {
    this.maxDepth = maxDepth;
  }

  /**
   * PUSH_HANDLER 바이트코드 동작
   * TRY 블록 진입 시 호출되어 현재 상태를 스냅샷 저장
   *
   * @param catchPC - CATCH 블록 바이트코드 주소 (점프 목표)
   * @param savedSP - TRY 진입 시점의 데이터 스택 깊이
   * @param savedFP - TRY 진입 시점의 함수 프레임 깊이
   * @param exceptionTypes - 처리 가능한 예외 타입들
   * @param scope - TRY 블록의 PC 범위
   * @returns HandlerFrame (성공) 또는 null (오버플로우)
   */
  pushHandler(
    catchPC: number,
    savedSP: number,
    savedFP: number,
    exceptionTypes: string[],
    scope: { startPC: number; endPC: number }
  ): HandlerFrame | null {
    // Overflow 방지
    if (this.stack.length >= this.maxDepth) {
      this.statistics.overflowAttempts++;
      return null;
    }

    const frame: HandlerFrame = {
      handlerId: `handler_${this.nextHandlerId++}`,
      catchPC,
      savedSP,
      savedFP,
      exceptionTypes,
      scope,
      pushedAt: Date.now(),
    };

    this.stack.push(frame);
    this.statistics.totalPushed++;

    if (this.stack.length > this.statistics.maxDepthReached) {
      this.statistics.maxDepthReached = this.stack.length;
    }

    return frame;
  }

  /**
   * POP_HANDLER 바이트코드 동작
   * TRY 블록이 정상적으로 종료(예외 없이)되면 호출
   * 등록했던 핸들러를 제거
   *
   * @returns 제거된 HandlerFrame (또는 undefined if 스택이 비어있음)
   */
  popHandler(): HandlerFrame | undefined {
    const frame = this.stack.pop();
    if (frame) {
      this.statistics.totalPopped++;
    }
    return frame;
  }

  /**
   * 현재 핸들러 개수 (__GET_HANDLER_COUNT() 에 해당)
   */
  getHandlerCount(): number {
    return this.stack.length;
  }

  /**
   * 현재 활성 핸들러 (스택 최상단)
   */
  getCurrentHandler(): HandlerFrame | undefined {
    if (this.stack.length === 0) return undefined;
    return this.stack[this.stack.length - 1];
  }

  /**
   * 예외 타입 매칭 핸들러 탐색
   * 스택 최상단부터 역순으로 탐색하여 처리 가능한 핸들러 찾기
   *
   * @param exceptionType - 발생한 예외 타입 ("ZeroDivisionError" 등)
   * @returns 매칭하는 HandlerFrame (또는 undefined)
   */
  findHandler(exceptionType: string): HandlerFrame | undefined {
    // 스택 최상단부터 역순으로 탐색 (가장 가까운 핸들러 우선)
    for (let i = this.stack.length - 1; i >= 0; i--) {
      const frame = this.stack[i];

      // 정확 일치 또는 "Any" 타입이면 처리 가능
      if (
        frame.exceptionTypes.includes(exceptionType) ||
        frame.exceptionTypes.includes('Any')
      ) {
        return frame;
      }
    }

    return undefined; // 처리할 수 있는 핸들러 없음
  }

  /**
   * 특정 PC가 어느 TRY 범위에 있는지 확인
   */
  isInTryScope(frame: HandlerFrame, pc: number): boolean {
    return pc >= frame.scope.startPC && pc <= frame.scope.endPC;
  }

  /**
   * 현재 PC에 해당하는 모든 활성 핸들러 조회
   * (중첩 TRY에서 여러 핸들러가 겹칠 수 있음)
   */
  getHandlersForPC(pc: number): HandlerFrame[] {
    const result: HandlerFrame[] = [];

    for (let i = this.stack.length - 1; i >= 0; i--) {
      const frame = this.stack[i];
      if (this.isInTryScope(frame, pc)) {
        result.push(frame);
      }
    }

    return result;
  }

  /**
   * 현재 핸들러 스택 스냅샷
   */
  getSnapshot(): HandlerFrame[] {
    return [...this.stack];
  }

  /**
   * 통계 조회
   */
  getStatistics(): {
    totalPushed: number;
    totalPopped: number;
    maxDepthReached: number;
    overflowAttempts: number;
    currentDepth: number;
  } {
    return {
      ...this.statistics,
      currentDepth: this.stack.length,
    };
  }

  /**
   * Overflow 발생 여부
   */
  isOverflowAttempted(): boolean {
    return this.statistics.overflowAttempts > 0;
  }

  /**
   * 전체 상태 초기화
   */
  clear(): void {
    this.stack = [];
    this.nextHandlerId = 1;
    this.statistics = {
      totalPushed: 0,
      totalPopped: 0,
      maxDepthReached: 0,
      overflowAttempts: 0,
    };
  }
}

/**
 * 사용 예시 (TC_V8_1_HANDLER_LIFECYCLE)
 *
 * ```typescript
 * const manager = new HandlerStackManager();
 *
 * // 1. 초기 상태
 * expect(manager.getHandlerCount()).toBe(0);
 *
 * // 2. 외부 TRY 진입 (PUSH_HANDLER)
 * manager.pushHandler(
 *   1000,                           // catchPC
 *   0,                              // savedSP
 *   0,                              // savedFP
 *   ['ZeroDivisionError'],
 *   { startPC: 0, endPC: 500 }
 * );
 * expect(manager.getHandlerCount()).toBe(1);
 *
 * // 3. 중첩 TRY 진입
 * manager.pushHandler(
 *   2000,                           // catchPC
 *   1,                              // savedSP
 *   1,                              // savedFP
 *   ['Any'],
 *   { startPC: 100, endPC: 300 }
 * );
 * expect(manager.getHandlerCount()).toBe(2);
 *
 * // 4. 내부 TRY 정상 종료 (POP_HANDLER)
 * manager.popHandler();
 * expect(manager.getHandlerCount()).toBe(1);
 *
 * // 5. 외부 TRY 정상 종료
 * manager.popHandler();
 * expect(manager.getHandlerCount()).toBe(0);
 * // ✅ HANDLER_LIFECYCLE COMPLETE
 * ```
 */
