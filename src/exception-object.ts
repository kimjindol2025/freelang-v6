/**
 * FreeLang v8.0: Exception Object & Stack Trace
 * 목표: 예외를 v7 객체처럼 다루기
 *
 * Exception의 특징:
 * - Type: 예외 종류 ("ZeroDivisionError", "NullReferenceError" 등)
 * - Message: 에러 메시지
 * - StackTrace: 호출 스택 정보 (어디서 발생했는가)
 * - Code: 에러 코드 (선택사항)
 * - Cause: 근본 원인 (예외 체이닝)
 */

/**
 * 스택 프레임: 호출 스택의 한 단계
 *
 * 예:
 * {
 *   functionName: "DangerousDivision",
 *   lineNumber: 42,
 *   address: 1500,
 *   context: "dividing 10 by 0"
 * }
 */
export interface StackFrame {
  functionName: string;              // 함수명
  lineNumber: number;                // 소스 코드 라인 번호
  address: number;                   // 바이트코드 주소
  context?: string;                  // 추가 문맥 정보 (선택)
}

/**
 * 스택 트레이스: 전체 호출 스택
 *
 * 깊은 함수 호출 중 에러가 발생했을 때,
 * 어느 경로로 그 지점에 도달했는지를 기록
 */
export interface StackTrace {
  frames: StackFrame[];              // 스택 프레임 배열 (루트부터)
  capturedAt: number;                // 캡처 시간 (타임스탐프)
  depth: number;                     // 스택 깊이
}

/**
 * Exception 객체 인터페이스
 *
 * v7의 객체처럼 다뤄지지만, 특별한 의미를 가짐:
 * - 예외 발생 시 자동으로 생성
 * - CATCH 블록에서 접근 가능
 * - 체이닝으로 근본 원인 추적 가능
 */
export interface ExceptionObject {
  type: string;                      // "ZeroDivisionError" 등
  message: string;                   // "Cannot divide by zero"
  stackTrace: StackTrace;            // 호출 스택 정보
  code?: number;                     // 에러 코드 (선택)
  cause?: ExceptionObject;           // 근본 원인 (예외 체이닝)
  timestamp: number;                 // 예외 발생 시간
}

/**
 * ExceptionObjectFactory: Exception 생성 및 관리
 *
 * 역할:
 * 1. Exception 객체 생성
 * 2. 예외 체이닝 (근본 원인 추적)
 * 3. 스택 트레이스 포맷팅
 * 4. 예외 분류 및 통계
 */
export class ExceptionObjectFactory {
  private exceptionCount = 0;
  private exceptionsByType: Map<string, number> = new Map();

  /**
   * Exception 객체 생성
   *
   * 기본 사용법:
   * ```
   * const ex = factory.create(
   *   "ZeroDivisionError",
   *   "Cannot divide by zero",
   *   stackTrace
   * );
   * ```
   */
  create(
    type: string,
    message: string,
    stackTrace: StackTrace,
    code?: number
  ): ExceptionObject {
    this.exceptionCount++;
    this.exceptionsByType.set(
      type,
      (this.exceptionsByType.get(type) ?? 0) + 1
    );

    return {
      type,
      message,
      stackTrace,
      code,
      timestamp: Date.now(),
    };
  }

  /**
   * StackTrace 생성
   *
   * 현재 호출 스택으로부터 스택 트레이스 생성
   */
  createStackTrace(frames: StackFrame[]): StackTrace {
    return {
      frames,
      capturedAt: Date.now(),
      depth: frames.length,
    };
  }

  /**
   * StackFrame 생성
   */
  createStackFrame(
    functionName: string,
    lineNumber: number,
    address: number,
    context?: string
  ): StackFrame {
    return {
      functionName,
      lineNumber,
      address,
      context,
    };
  }

  /**
   * 예외 체이닝: 근본 원인 추적
   *
   * 예:
   * const cause = factory.create("FileNotFound", "config.txt", ...);
   * const main = factory.create("InitializationError", "Cannot init", ...);
   * factory.chainCause(main, cause);  // main.cause = cause
   */
  chainCause(
    mainException: ExceptionObject,
    causeException: ExceptionObject
  ): ExceptionObject {
    return {
      ...mainException,
      cause: causeException,
    };
  }

  /**
   * 근본 원인 찾기 (예외 체인 끝까지 따라가기)
   *
   * 반환: 가장 처음의 근본 원인
   */
  getRootCause(exception: ExceptionObject): ExceptionObject {
    let current = exception;
    while (current.cause) {
      current = current.cause;
    }
    return current;
  }

  /**
   * 스택 트레이스 포맷팅 (인간 읽기 가능한 형식)
   *
   * 출력 예:
   * ```
   * ZeroDivisionError: Cannot divide by zero
   * Stack trace:
   *   at DangerousDivision (line 42, address 1500)
   *   at BusinessLogic (line 50, address 1600)
   *   at main (line 55, address 1700)
   * ```
   */
  formatStackTrace(exception: ExceptionObject): string {
    let result = `${exception.type}: ${exception.message}\n`;

    if (exception.code !== undefined) {
      result += `[Error Code: ${exception.code}]\n`;
    }

    result += 'Stack trace:\n';
    for (let i = 0; i < exception.stackTrace.frames.length; i++) {
      const frame = exception.stackTrace.frames[i];
      result += `  ${i + 1}. at ${frame.functionName}`;
      result += ` (line ${frame.lineNumber}, address ${frame.address})`;

      if (frame.context) {
        result += ` [${frame.context}]`;
      }

      result += '\n';
    }

    // 예외 체인 출력
    if (exception.cause) {
      result += '\nCaused by:\n';
      result += this.formatStackTrace(exception.cause);
    }

    return result;
  }

  /**
   * 예외 체인 전체 출력
   */
  formatExceptionChain(exception: ExceptionObject): string {
    const parts: string[] = [];
    let current: ExceptionObject | undefined = exception;

    while (current) {
      parts.push(`${current.type}: ${current.message}`);
      current = current.cause;
    }

    return parts.join(' → ');  // ZeroDivisionError → FileNotFound 같은 형식
  }

  /**
   * 예외 비교 (같은 타입과 메시지인가?)
   */
  equals(ex1: ExceptionObject, ex2: ExceptionObject): boolean {
    return ex1.type === ex2.type && ex1.message === ex2.message;
  }

  /**
   * 예외 타입 확인
   */
  isType(exception: ExceptionObject, type: string): boolean {
    return exception.type === type;
  }

  /**
   * 예외 복사 (깊은 복사)
   */
  clone(exception: ExceptionObject): ExceptionObject {
    return {
      type: exception.type,
      message: exception.message,
      code: exception.code,
      timestamp: exception.timestamp,
      stackTrace: {
        frames: [...exception.stackTrace.frames],
        capturedAt: exception.stackTrace.capturedAt,
        depth: exception.stackTrace.depth,
      },
      cause: exception.cause ? this.clone(exception.cause) : undefined,
    };
  }

  /**
   * 통계
   */
  getStatistics(): {
    totalExceptions: number;
    byType: Record<string, number>;
    mostCommon: string | undefined;
  } {
    let mostCommon: string | undefined = undefined;
    let maxCount = 0;

    for (const [type, count] of this.exceptionsByType) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = type;
      }
    }

    return {
      totalExceptions: this.exceptionCount,
      byType: Object.fromEntries(this.exceptionsByType),
      mostCommon,
    };
  }

  /**
   * 초기화
   */
  clear(): void {
    this.exceptionCount = 0;
    this.exceptionsByType.clear();
  }
}

/**
 * 사용 예시
 *
 * ```typescript
 * const factory = new ExceptionObjectFactory();
 *
 * // 1. 스택 트레이스 생성
 * const frames = [
 *   factory.createStackFrame("DangerousDivision", 42, 1500),
 *   factory.createStackFrame("BusinessLogic", 50, 1600),
 *   factory.createStackFrame("main", 55, 1700),
 * ];
 * const stackTrace = factory.createStackTrace(frames);
 *
 * // 2. Exception 생성
 * const exception = factory.create(
 *   "ZeroDivisionError",
 *   "Cannot divide by zero",
 *   stackTrace,
 *   100  // 에러 코드
 * );
 *
 * // 3. 포맷팅
 * console.log(factory.formatStackTrace(exception));
 * // 출력:
 * // ZeroDivisionError: Cannot divide by zero
 * // [Error Code: 100]
 * // Stack trace:
 * //   1. at DangerousDivision (line 42, address 1500)
 * //   2. at BusinessLogic (line 50, address 1600)
 * //   3. at main (line 55, address 1700)
 *
 * // 4. 예외 체이닝
 * const fileNotFound = factory.create(
 *   "FileNotFound",
 *   "config.txt not found",
 *   factory.createStackTrace([...])
 * );
 * const initialized = factory.chainCause(exception, fileNotFound);
 *
 * // 5. 근본 원인 찾기
 * const root = factory.getRootCause(initialized);
 * // root.type == "FileNotFound" ✅
 * ```
 */

