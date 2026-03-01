/**
 * FreeLang v6: Error Reporter System
 * 목표: 위치 정보와 컨텍스트를 포함한 상세한 에러 메시지 생성
 *
 * 예시:
 *   Error at line 42, column 15:
 *     Type mismatch: expected 'i32' but got 'str'
 *
 *     42 |   let x: i32 = "hello";
 *        |               ^^^^^^^^
 *
 *     Hint: Remove quotes or use a numeric type.
 */

export type ErrorLevel = "error" | "warning" | "info";

export type ErrorContext = {
  line: number;
  column: number;
  length?: number;
  source?: string[];
};

export interface ErrorReport {
  level: ErrorLevel;
  code: string;
  message: string;
  context?: ErrorContext;
  hint?: string;
}

export class ErrorReporter {
  private errors: ErrorReport[] = [];

  /**
   * 타입 에러 (가장 일반적)
   */
  addTypeError(
    message: string,
    expected: string,
    actual: string,
    context: ErrorContext,
    hint?: string
  ): void {
    this.errors.push({
      level: "error",
      code: "E001",
      message: `${message}: expected '${expected}' but got '${actual}'`,
      context,
      hint: hint || this.guessTypeErrorHint(expected, actual),
    });
  }

  /**
   * 정의되지 않은 변수 에러
   */
  addUndefinedError(name: string, context: ErrorContext): void {
    this.errors.push({
      level: "error",
      code: "E002",
      message: `Undefined variable '${name}'`,
      context,
      hint: `Variable '${name}' is not defined in this scope`,
    });
  }

  /**
   * 함수 호출 에러
   */
  addCallError(
    funcName: string,
    expected: number,
    actual: number,
    context: ErrorContext
  ): void {
    this.errors.push({
      level: "error",
      code: "E003",
      message: `Function '${funcName}' expects ${expected} argument(s), got ${actual}`,
      context,
      hint: `Call syntax: ${funcName}(${Array(expected)
        .fill("arg")
        .map((a, i) => `${a}${i + 1}`)
        .join(", ")})`,
    });
  }

  /**
   * 문법 에러
   */
  addSyntaxError(
    expected: string,
    actual: string,
    context: ErrorContext
  ): void {
    this.errors.push({
      level: "error",
      code: "E004",
      message: `Syntax error: expected ${expected}, got '${actual}'`,
      context,
      hint: this.guessSyntaxErrorHint(expected, actual),
    });
  }

  /**
   * 컴파일 에러
   */
  addCompileError(message: string, context: ErrorContext): void {
    this.errors.push({
      level: "error",
      code: "E005",
      message,
      context,
    });
  }

  /**
   * 범위 에러 (인덱스 범위 초과 등)
   */
  addRangeError(message: string, context: ErrorContext): void {
    this.errors.push({
      level: "error",
      code: "E006",
      message,
      context,
      hint: "Check array/object bounds",
    });
  }

  /**
   * 타입 에러에 대한 자동 힌트 생성
   */
  private guessTypeErrorHint(expected: string, actual: string): string {
    const hints: Record<string, Record<string, string>> = {
      i32: {
        str: "Remove quotes or use parseInt() to convert",
        f64: "Use floor() or truncate to convert float to integer",
      },
      f64: {
        i32: "No conversion needed; i32 is compatible with f64",
        str: "Remove quotes or use parseFloat() to convert",
      },
      str: {
        i32: "Wrap value in quotes or use toString()",
        f64: "Wrap value in quotes or use toString()",
      },
      bool: {
        i32: "Use !=0 or >=1 for comparison",
        str: 'Use "true"/"false" string or =="true"',
      },
    };

    return (
      hints[expected]?.[actual] ||
      `Convert ${actual} to ${expected} using appropriate function`
    );
  }

  /**
   * 문법 에러에 대한 자동 힌트 생성
   */
  private guessSyntaxErrorHint(expected: string, actual: string): string {
    if (expected === ":" && actual !== ":") {
      return "Variable declarations require type annotation: let x: type = value";
    }
    if (expected === "=>" && actual !== "=>") {
      return "Function syntax: fn name(param: type) -> type { ... }";
    }
    return `Expected '${expected}' but found '${actual}'`;
  }

  /**
   * 에러 포맷팅 및 출력
   */
  formatError(error: ErrorReport): string {
    const lines: string[] = [];

    // 헤더
    lines.push(
      `${error.code}: ${error.level.toUpperCase()} - ${error.message}`
    );

    // 위치 정보
    if (error.context) {
      const { line, column, length = 1, source = [] } = error.context;
      lines.push(
        `  at line ${line}, column ${column} (length: ${length} chars)`
      );

      // 소스 코드 표시
      if (source && source.length > 0 && line > 0 && line <= source.length) {
        const sourceLine = source[line - 1];
        lines.push("");
        lines.push(`  ${line.toString().padStart(4)} | ${sourceLine}`);

        // 에러 위치 표시
        const pointer = " ".repeat(column - 1) + "^".repeat(length);
        lines.push(
          `       | ${" ".repeat(column - 1)}${pointer.slice(column - 1)}`
        );
      }
    }

    // 힌트
    if (error.hint) {
      lines.push("");
      lines.push(`  💡 Hint: ${error.hint}`);
    }

    return lines.join("\n");
  }

  /**
   * 모든 에러 출력
   */
  printAll(): void {
    if (this.errors.length === 0) {
      console.log("✅ No errors found!");
      return;
    }

    console.error(
      `\n❌ Compilation failed with ${this.errors.length} error(s):\n`
    );
    this.errors.forEach((error, index) => {
      console.error(this.formatError(error));
      if (index < this.errors.length - 1) {
        console.error("\n" + "─".repeat(60) + "\n");
      }
    });
  }

  /**
   * 에러 개수 반환
   */
  count(): number {
    return this.errors.length;
  }

  /**
   * 에러 목록 반환
   */
  getErrors(): ErrorReport[] {
    return [...this.errors];
  }

  /**
   * 에러 리셋
   */
  clear(): void {
    this.errors = [];
  }
}

/**
 * 사용 예시:
 *
 * const reporter = new ErrorReporter();
 *
 * reporter.addTypeError(
 *   "Type mismatch",
 *   "i32",
 *   "str",
 *   { line: 42, column: 15, length: 7, source: lines }
 * );
 *
 * reporter.printAll();
 */
