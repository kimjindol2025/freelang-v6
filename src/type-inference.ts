/**
 * FreeLang v6: Type Inference System
 * 목표: 명시적 타입 선언 없이도 타입을 자동으로 추론
 *
 * 예시:
 *   let x = 10;        // ✅ i32 추론
 *   let y = 3.14;      // ✅ f64 추론
 *   let z = "hello";   // ✅ str 추론
 *   let b = true;      // ✅ bool 추론
 *   let arr = [1,2,3]; // ✅ i32[] 추론
 */

import { Expr, Stmt } from "./ast";

export type TypeTag =
  | "i32"      // 32-bit integer
  | "f64"      // 64-bit float
  | "str"      // string
  | "bool"     // boolean
  | "void"     // no return value
  | "any"      // any type (unknown)
  | "array"    // array type
  | "object"   // object type
  | "function" // function type
  | "null";    // null type

export type TypeInfo = {
  tag: TypeTag;
  elementType?: TypeInfo;  // for arrays
  paramTypes?: TypeInfo[]; // for functions
  returnType?: TypeInfo;   // for functions
};

// v6.1: Forward Declaration 지원
export interface FunctionSignature {
  name: string;
  paramCount: number;     // 파라미터 수
  returnType: TypeInfo;   // 반환 타입 (pending이면 { tag: "any" })
  isPending: boolean;     // 반환 타입 미확정 (분석 중)
  declaredAt: number;     // 선언 타임스탬프
}

export class TypeInference {
  private typeTable: Map<string, TypeInfo> = new Map();
  private expressionTypes: Map<any, TypeInfo> = new Map();
  // v6.1: Forward Declaration 지원
  private functionSignatures: Map<string, FunctionSignature> = new Map();
  // v6.1: Call Context Trace - 현재 분석 중인 함수 스택
  private callContextStack: string[] = [];

  /**
   * 리터럴 값의 타입 추론
   *
   * 예시:
   *   42        → i32
   *   3.14      → f64
   *   "hello"   → str
   *   true/false → bool
   *   [1,2,3]   → i32[]
   */
  inferLiteralType(value: any): TypeInfo {
    if (typeof value === "number") {
      // 정수인지 부동소수점인지 판단
      return Number.isInteger(value)
        ? { tag: "i32" }
        : { tag: "f64" };
    }

    if (typeof value === "string") {
      return { tag: "str" };
    }

    if (typeof value === "boolean") {
      return { tag: "bool" };
    }

    if (Array.isArray(value)) {
      // 배열의 모든 원소가 같은 타입이면 해당 타입 배열
      const elementType = this.inferLiteralType(value[0]);
      const allSame = value.every(v =>
        JSON.stringify(this.inferLiteralType(v)) === JSON.stringify(elementType)
      );

      if (allSame) {
        return { tag: "array", elementType };
      } else {
        return { tag: "array", elementType: { tag: "any" } };
      }
    }

    if (value === null) {
      return { tag: "null" };
    }

    if (typeof value === "object") {
      return { tag: "object" };
    }

    return { tag: "any" };
  }

  /**
   * 이진 연산자의 결과 타입 추론
   *
   * 예시:
   *   10 + 20     → i32
   *   3.14 + 2.0  → f64
   *   "a" + "b"   → str
   *   1 < 2       → bool
   */
  inferBinaryOpType(op: string, left: TypeInfo, right: TypeInfo): TypeInfo {
    // 산술 연산
    if (["+", "-", "*", "/", "%"].includes(op)) {
      if (left.tag === "str" || right.tag === "str") {
        return { tag: "str" }; // 문자열 연결
      }

      if (left.tag === "f64" || right.tag === "f64") {
        return { tag: "f64" }; // 부동소수점
      }

      return { tag: "i32" }; // 정수
    }

    // 비교 연산
    if (["<", ">", "<=", ">=", "==", "!="].includes(op)) {
      return { tag: "bool" };
    }

    // 논리 연산
    if (["&&", "||"].includes(op)) {
      return { tag: "bool" };
    }

    return { tag: "any" };
  }

  /**
   * 함수 호출의 반환 타입 추론
   */
  inferFunctionReturnType(funcName: string, argTypes: TypeInfo[]): TypeInfo {
    // 표준 라이브러리 함수들의 반환 타입
    const builtinReturnTypes: Record<string, TypeInfo> = {
      // String functions
      "length": { tag: "i32" },
      "charAt": { tag: "str" },
      "substring": { tag: "str" },
      "toUpperCase": { tag: "str" },
      "toLowerCase": { tag: "str" },

      // Math functions
      "abs": argTypes[0],      // 입력과 같은 타입
      "sqrt": { tag: "f64" },
      "floor": { tag: "i32" },
      "ceil": { tag: "i32" },
      "round": { tag: "i32" },

      // Array functions
      "push": { tag: "i32" },   // 배열 길이 반환
      "pop": argTypes[0]?.elementType || { tag: "any" },
      "slice": argTypes[0],     // 배열 반환

      // Type checking
      "typeof": { tag: "str" },
      "instanceof": { tag: "bool" },
    };

    return builtinReturnTypes[funcName] || { tag: "any" };
  }

  /**
   * 변수 선언의 타입 저장
   */
  declareVariable(name: string, type: TypeInfo): void {
    this.typeTable.set(name, type);
  }

  /**
   * 변수의 타입 조회
   */
  getVariableType(name: string): TypeInfo | undefined {
    return this.typeTable.get(name);
  }

  /**
   * 타입 호환성 검사
   *
   * 예시:
   *   i32 ← i32 ✅
   *   f64 ← i32 ✅ (타입 캐스트 가능)
   *   str ← i32 ❌ (호환 불가)
   */
  isTypeCompatible(target: TypeInfo, source: TypeInfo): boolean {
    if (target.tag === source.tag) return true;
    if (target.tag === "any" || source.tag === "any") return true;

    // i32 → f64 호환
    if (target.tag === "f64" && source.tag === "i32") return true;

    // null → 다른 타입 호환
    if (source.tag === "null") return true;

    return false;
  }

  /**
   * 타입 에러 메시지 생성
   */
  generateTypeError(
    line: number,
    column: number,
    expected: TypeInfo,
    actual: TypeInfo,
    context?: string
  ): string {
    return `
Type Error at line ${line}, column ${column}:
  Expected: ${this.typeToString(expected)}
  Actual:   ${this.typeToString(actual)}
  ${context ? `Context: ${context}` : ""}
    `.trim();
  }

  /**
   * 타입을 문자열로 변환
   */
  private typeToString(type: TypeInfo): string {
    if (type.tag === "array" && type.elementType) {
      return `${this.typeToString(type.elementType)}[]`;
    }

    if (type.tag === "function" && type.paramTypes && type.returnType) {
      const params = type.paramTypes.map(t => this.typeToString(t)).join(", ");
      return `(${params}) -> ${this.typeToString(type.returnType)}`;
    }

    return type.tag;
  }

  /**
   * 타입 추론 결과 리포트
   */
  reportTypeInference(expr: Expr, type: TypeInfo): void {
    // 디버그/로깅용
    console.log(`[Type Inference] ${JSON.stringify(expr)} => ${this.typeToString(type)}`);
  }

  /**
   * v6.1: Forward Declaration - 함수 시그니처 선언
   */
  declareFunction(
    name: string,
    paramCount: number,
    returnType?: TypeInfo
  ): void {
    this.functionSignatures.set(name, {
      name,
      paramCount,
      returnType: returnType || { tag: "any" },
      isPending: !returnType,
      declaredAt: Date.now(),
    });
  }

  /**
   * v6.1: 함수 시그니처 조회
   */
  getFunctionSignature(name: string): FunctionSignature | undefined {
    return this.functionSignatures.get(name);
  }

  /**
   * v6.1: 함수 선언 여부 확인
   */
  hasFunctionDeclared(name: string): boolean {
    return this.functionSignatures.has(name);
  }

  /**
   * v6.1: 함수 호출의 반환 타입 추론 (Forward Declaration + builtin)
   */
  resolveFunctionReturnType(funcName: string, argTypes: TypeInfo[]): TypeInfo {
    // 1. 사용자 정의 함수 시그니처 확인
    const sig = this.functionSignatures.get(funcName);
    if (sig) {
      return sig.returnType;
    }

    // 2. 빌트인 함수 확인 (기존 inferFunctionReturnType 로직)
    return this.inferFunctionReturnType(funcName, argTypes);
  }

  /**
   * v6.1: Call Context 진입 (재귀 깊이 추적)
   */
  enterCallContext(funcName: string): void {
    this.callContextStack.push(funcName);
  }

  /**
   * v6.1: Call Context 복귀
   */
  exitCallContext(funcName: string): void {
    if (this.callContextStack.length > 0) {
      this.callContextStack.pop();
    }
  }

  /**
   * v6.1: 현재 Call Context 깊이
   */
  getCurrentCallDepth(): number {
    return this.callContextStack.length;
  }

  /**
   * v6.1: 함수 반환 타입 확정 (pending → locked)
   */
  lockReturnType(funcName: string, resolvedType: TypeInfo): void {
    const sig = this.functionSignatures.get(funcName);
    if (sig) {
      sig.returnType = resolvedType;
      sig.isPending = false;
    }
  }

  /**
   * v6.1: 함수 반환 타입이 보류 상태인지 확인
   */
  isPendingReturn(funcName: string): boolean {
    const sig = this.functionSignatures.get(funcName);
    return sig ? sig.isPending : false;
  }
}

/**
 * 사용 예시:
 *
 * const ti = new TypeInference();
 *
 * // 리터럴 타입 추론
 * const t1 = ti.inferLiteralType(42);        // { tag: "i32" }
 * const t2 = ti.inferLiteralType(3.14);      // { tag: "f64" }
 * const t3 = ti.inferLiteralType("hello");   // { tag: "str" }
 * const t4 = ti.inferLiteralType([1,2,3]);   // { tag: "array", elementType: { tag: "i32" } }
 *
 * // 연산 타입 추론
 * const t5 = ti.inferBinaryOpType("+", t1, t1);  // { tag: "i32" }
 * const t6 = ti.inferBinaryOpType("<", t1, t1);  // { tag: "bool" }
 *
 * // 변수 타입 선언
 * ti.declareVariable("x", { tag: "i32" });
 * ti.declareVariable("y", { tag: "str" });
 *
 * // 타입 호환성 확인
 * ti.isTypeCompatible({ tag: "f64" }, { tag: "i32" });  // true
 * ti.isTypeCompatible({ tag: "str" }, { tag: "i32" });  // false
 */
