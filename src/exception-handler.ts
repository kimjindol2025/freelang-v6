/**
 * FreeLang v8.0: Exception Handler Manager
 * 목표: TRY-CATCH 핸들러 관리 + 타입 매칭
 *
 * 핸들러 스택의 역할:
 * - TRY 블록 진입 시 핸들러를 스택에 푸시
 * - THROW 발생 시 스택을 역순으로 탐색하며 매칭 핸들러 찾기
 * - CATCH 완료 후 핸들러 스택에서 제거
 */

/**
 * 핸들러 엔트리: TRY 블록의 정보
 *
 * 예:
 * {
 *   handlerId: "handler_1",
 *   catchAddress: 1000,
 *   exceptionTypes: ["ZeroDivisionError"],
 *   scope: { startPC: 100, endPC: 500 },
 *   registeredAt: 1234567890
 * }
 */
export interface HandlerEntry {
  handlerId: string;                 // 고유 핸들러 ID ("handler_1")
  catchAddress: number;              // CATCH 블록 바이트코드 주소
  exceptionTypes: string[];          // 처리 가능한 예외 타입들 (["ZeroDivisionError", "Any"])
  scope: {
    startPC: number;                 // TRY 블록 시작 PC
    endPC: number;                   // TRY 블록 끝 PC
  };
  registeredAt: number;              // 등록 시간 (타임스탐프)
}

/**
 * ExceptionHandlerManager: 핸들러 스택 관리
 *
 * 역할:
 * 1. TRY 블록에 대한 핸들러 등록 (pushHandler)
 * 2. 예외 타입에 맞는 핸들러 찾기 (findMatchingHandler)
 * 3. TRY 완료 후 핸들러 제거 (popHandler)
 * 4. PC가 현재 핸들러 범위 내인지 확인 (isInTryScope)
 */
export class ExceptionHandlerManager {
  private handlers: Map<string, HandlerEntry> = new Map();
  // "handler_1" → { handlerId, catchAddress, exceptionTypes, scope, ... }

  private handlerStack: string[] = [];
  // ["handler_3", "handler_2", "handler_1"] (스택, 마지막이 가장 최근)

  private nextHandlerId = 1;

  private statistics = {
    totalRegistered: 0,
    totalMatched: 0,
    totalMismatched: 0,
  };

  /**
   * TRY 블록 진입 시 호출
   * 핸들러를 등록하고 스택에 푸시
   *
   * 예:
   * const handlerId = manager.pushHandler(
   *   1000,                                    // CATCH 주소
   *   ["ZeroDivisionError", "NullReferenceError"],
   *   { startPC: 100, endPC: 500 }
   * );
   * // handlerId = "handler_1"
   * // 스택: ["handler_1"]
   */
  pushHandler(
    catchAddress: number,
    exceptionTypes: string[],
    scope: { startPC: number; endPC: number }
  ): string {
    const handlerId = `handler_${this.nextHandlerId++}`;

    this.handlers.set(handlerId, {
      handlerId,
      catchAddress,
      exceptionTypes,
      scope,
      registeredAt: Date.now(),
    });

    this.handlerStack.push(handlerId);
    this.statistics.totalRegistered++;

    return handlerId;
  }

  /**
   * TRY-CATCH 완료 시 호출
   * 핸들러를 스택에서 제거
   */
  popHandler(): string | undefined {
    return this.handlerStack.pop();
  }

  /**
   * 현재 활성 핸들러 (스택 최상단)
   * 가장 최근에 진입한 TRY 블록의 핸들러
   */
  getCurrentHandler(): HandlerEntry | undefined {
    const id = this.handlerStack[this.handlerStack.length - 1];
    return id ? this.handlers.get(id) : undefined;
  }

  /**
   * 예외 타입에 맞는 핸들러 찾기
   *
   * 핸들러 스택을 최상단부터 역순으로 탐색
   * 첫 번째로 예외 타입을 처리할 수 있는 핸들러 반환
   *
   * 예:
   * - THROW ZeroDivisionError 발생
   * - Stack: ["handler_3"(IndexError), "handler_2"(Any), "handler_1"(ZeroDivisionError)]
   * - 탐색: handler_3 (No) → handler_2 (Yes, "Any" 처리 가능) → 반환
   *
   * 반환값:
   * - HandlerEntry: 처리 가능한 핸들러 (가장 가까운 것)
   * - undefined: 처리할 수 있는 핸들러 없음 (프로그램 크래시)
   */
  findMatchingHandler(exceptionType: string): HandlerEntry | undefined {
    // 스택 최상단부터 역순으로 탐색
    for (let i = this.handlerStack.length - 1; i >= 0; i--) {
      const handlerId = this.handlerStack[i];
      const handler = this.handlers.get(handlerId);

      if (!handler) continue;

      // 예외 타입 매칭
      // 1. 정확 일치 (ZeroDivisionError == ZeroDivisionError)
      // 2. "Any" 타입이 있으면 모든 예외 처리
      if (
        handler.exceptionTypes.includes(exceptionType) ||
        handler.exceptionTypes.includes('Any')
      ) {
        this.statistics.totalMatched++;
        return handler;
      }
    }

    // 처리할 수 있는 핸들러 없음
    this.statistics.totalMismatched++;
    return undefined;
  }

  /**
   * PC가 특정 핸들러의 TRY 범위 내인가?
   *
   * 스택 언와인딩 중에 현재 PC가 어느 TRY 블록의 범위인지 판단
   * 예를 들어, DangerousDivision(PC=250) 중 에러 발생
   * → handler의 scope.startPC (100) ≤ 250 ≤ endPC (500) 이면 true
   */
  isInTryScope(handlerId: string, pc: number): boolean {
    const handler = this.handlers.get(handlerId);
    if (!handler) return false;

    return pc >= handler.scope.startPC && pc <= handler.scope.endPC;
  }

  /**
   * 현재 PC에 해당하는 모든 활성 핸들러 조회
   *
   * 중첩된 TRY-CATCH에서 현재 PC가 여러 TRY 범위와 겹칠 수 있음
   * 예:
   * TRY { // scope: 0-1000
   *   TRY { // scope: 100-500
   *     action(pc=250)
   *   } CATCH
   * } CATCH
   * → [handler_2, handler_1] 반환 (내부 먼저)
   */
  getHandlersForPC(pc: number): HandlerEntry[] {
    const result: HandlerEntry[] = [];

    // 스택의 역순 (가장 최근 핸들러가 먼저)
    for (let i = this.handlerStack.length - 1; i >= 0; i--) {
      const handlerId = this.handlerStack[i];
      const handler = this.handlers.get(handlerId);

      if (handler && this.isInTryScope(handlerId, pc)) {
        result.push(handler);
      }
    }

    return result;
  }

  /**
   * 현재 핸들러 스택 상태 (스냅샷)
   * 디버깅 목적으로 스택 상태 확인
   */
  getStackSnapshot(): HandlerEntry[] {
    return this.handlerStack
      .map((id) => this.handlers.get(id))
      .filter((h) => h !== undefined) as HandlerEntry[];
  }

  /**
   * 현재 핸들러 깊이
   * 중첩된 TRY-CATCH의 레벨
   */
  getHandlerDepth(): number {
    return this.handlerStack.length;
  }

  /**
   * 특정 예외 타입을 처리할 수 있는 핸들러가 있는가?
   */
  canHandle(exceptionType: string): boolean {
    return this.findMatchingHandler(exceptionType) !== undefined;
  }

  /**
   * 모든 등록된 핸들러 조회
   */
  getAllHandlers(): HandlerEntry[] {
    return Array.from(this.handlers.values());
  }

  /**
   * 통계
   */
  getStatistics(): {
    totalRegistered: number;
    totalMatched: number;
    totalMismatched: number;
    currentDepth: number;
    handlerCount: number;
  } {
    return {
      ...this.statistics,
      currentDepth: this.handlerStack.length,
      handlerCount: this.handlers.size,
    };
  }

  /**
   * 초기화
   */
  clear(): void {
    this.handlers.clear();
    this.handlerStack = [];
    this.nextHandlerId = 1;
    this.statistics = {
      totalRegistered: 0,
      totalMatched: 0,
      totalMismatched: 0,
    };
  }
}

/**
 * 사용 예시
 *
 * ```typescript
 * const manager = new ExceptionHandlerManager();
 *
 * // 1. TRY 블록 진입
 * const h1 = manager.pushHandler(
 *   1000,  // CATCH 주소
 *   ["ZeroDivisionError"],
 *   { startPC: 100, endPC: 500 }
 * );
 * // h1 = "handler_1"
 *
 * // 2. 중첩된 TRY 진입
 * const h2 = manager.pushHandler(
 *   2000,
 *   ["NullReferenceError"],
 *   { startPC: 200, endPC: 400 }
 * );
 * // h2 = "handler_2"
 *
 * // 3. 깊이 확인
 * manager.getHandlerDepth() // 2 ✅
 *
 * // 4. 예외 매칭
 * const handler = manager.findMatchingHandler("NullReferenceError");
 * // handler.catchAddress == 2000 ✅ (h2 매칭)
 *
 * // 5. PC 범위 확인
 * manager.isInTryScope("handler_2", 300); // true ✅
 * manager.isInTryScope("handler_2", 600); // false
 *
 * // 6. TRY 완료
 * manager.popHandler();  // h2 제거
 * manager.getHandlerDepth() // 1
 *
 * // 7. 처리할 수 없는 예외
 * const unhandled = manager.findMatchingHandler("IOException");
 * // unhandled == undefined (처리 불가)
 *
 * // 8. 통계
 * const stats = manager.getStatistics();
 * // { totalRegistered: 2, totalMatched: 1, totalMismatched: 1, ... }
 * ```
 */

