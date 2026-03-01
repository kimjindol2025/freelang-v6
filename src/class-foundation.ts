/**
 * FreeLang v7.0: Class Foundations & Method Binding
 * 목표: 데이터(구조체) + 행위(메서드) = 객체(Object)
 *
 * 핵심:
 * 1. ClassRegistry: 클래스 정의 저장 + vTable 구성
 * 2. SelfBinder: obj.method(args) → method(obj, args) Dot Notation 변환
 * 3. ClassInstanceFactory: NEW Counter() → 독립적인 ClassInstance 생성
 *
 * 예시:
 * CLASS Counter { Value (Int); METHOD Add(amt) { SET self.Value = self.Value + amt } }
 * REF my_counter = NEW Counter()
 * SET my_counter.Value = 10
 * my_counter.Add(5)  // 내부: Add(my_counter, 5)
 * my_counter.GetValue() // = 15 ✅
 */

/**
 * 클래스 필드 정의 (v5 StructField 확장)
 */
export interface ClassFieldDef {
  name: string;
  type: string;                          // "Int", "Str", "Bool", "f64" etc.
  defaultValue?: number | string | boolean;  // 초기값
  offset?: number;                       // 구조체 내 바이트 오프셋 (자동 계산)
}

/**
 * 메서드 정의
 */
export interface MethodDef {
  name: string;
  className: string;                    // 소속 클래스 (Namespace Isolation 핵심)
  params: string[];                     // self 제외한 외부 파라미터
  returnType: string;                   // "Int", "Str", "Void" etc.
  body?: string;                        // 텍스트 본문 (분석용)
  addr?: number;                        // 런타임 bytecode addr
}

/**
 * 클래스 정의
 */
export interface ClassDef {
  name: string;
  fields: ClassFieldDef[];
  methods: MethodDef[];
  totalSize: number;                    // 자동 계산 (bytes)
  registeredAt: number;                 // 등록 타임스탬프
}

/**
 * 런타임 클래스 인스턴스
 *
 * 예:
 * {
 *   className: "Counter",
 *   fields: { "Value" → 10 },
 *   vTable: { "Add" → 1234, "GetValue" → 1256 }
 * }
 */
export interface ClassInstance {
  className: string;
  fields: Map<string, number | string | boolean>;     // 인스턴스 필드값
  vTable: Map<string, number>;                        // methodName → bytecode addr
}

/**
 * Dot Notation 파싱 결과
 *
 * "my_counter.Add(5)" → DotCallInfo
 */
export interface DotCallInfo {
  receiver: string;   // "my_counter"
  method: string;     // "Add"
  args: string[];     // ["5"]
}

/**
 * 자체 접근 정보
 */
export interface SelfAccessInfo {
  field: string;      // "Value"
}

/**
 * Self 바인딩 후 메서드 호출 정보
 *
 * "my_counter.Add(5)" → MethodCallInfo
 * receiver를 첫 인자로 삽입 (self binding)
 */
export interface MethodCallInfo {
  receiver: string;
  method: string;
  explicitArgs: string[];    // 사용자가 명시한 인자 ["5"]
  fullArgs: string[];        // receiver 포함 ["my_counter", "5"]
}

/**
 * ClassRegistry: 클래스 정의 저장 및 관리
 *
 * 역할:
 * 1. 클래스 등록 (registerClass)
 * 2. 메서드 주소 바인딩 (bindMethodAddr)
 * 3. vTable 생성 (buildVTable)
 * 4. Namespace Isolation: 동일 이름 메서드 충돌 방지
 */
export class ClassRegistry {
  private classes: Map<string, ClassDef> = new Map();

  /**
   * 클래스 정의 등록
   */
  registerClass(def: ClassDef): void {
    this.classes.set(def.name, def);
  }

  /**
   * 클래스 존재 여부
   */
  hasClass(name: string): boolean {
    return this.classes.has(name);
  }

  /**
   * 클래스 정의 조회
   */
  getClass(name: string): ClassDef | undefined {
    return this.classes.get(name);
  }

  /**
   * 메서드 조회 (className.methodName)
   *
   * Namespace Isolation:
   * "Counter" + "Add" = "Counter.Add"
   * "Dog" + "Add" = "Dog.Add"
   * → 별도의 메서드 (주소 분리)
   */
  getMethod(className: string, methodName: string): MethodDef | undefined {
    const classDef = this.classes.get(className);
    if (!classDef) return undefined;
    return classDef.methods.find((m) => m.name === methodName);
  }

  /**
   * 등록된 모든 클래스
   */
  getAllClasses(): ClassDef[] {
    return Array.from(this.classes.values());
  }

  /**
   * 메서드에 bytecode 주소 등록
   *
   * Pass 2: 컴파일 후 각 메서드의 bytecode addr 등록
   */
  bindMethodAddr(className: string, methodName: string, addr: number): void {
    const classDef = this.classes.get(className);
    if (!classDef) return;

    const method = classDef.methods.find((m) => m.name === methodName);
    if (method) {
      method.addr = addr;
    }
  }

  /**
   * vTable 생성
   *
   * className에 등록된 모든 메서드의 주소를 맵으로 반환
   * { "Add" → 1234, "GetValue" → 1256 }
   */
  buildVTable(className: string): Map<string, number> {
    const classDef = this.classes.get(className);
    if (!classDef) return new Map();

    const vTable = new Map<string, number>();
    for (const method of classDef.methods) {
      if (method.addr !== undefined) {
        vTable.set(method.name, method.addr);
      }
    }
    return vTable;
  }

  /**
   * 초기화
   */
  clear(): void {
    this.classes.clear();
  }
}

/**
 * SelfBinder: Dot Notation 확장
 *
 * 역할:
 * 1. "obj.method(args)" 파싱
 * 2. "self.field" 탐지
 * 3. obj를 첫 인자로 삽입 (method(obj, args))
 */
export class SelfBinder {
  /**
   * Dot call 파싱: "my_counter.Add(5)" → DotCallInfo
   *
   * 정규식: /^(\w+)\.(\w+)\(([^)]*)\)$/
   * - receiver: 변수명
   * - method: 메서드명
   * - args: 인자들 (쉼표 분리)
   */
  parseDotCall(expression: string): DotCallInfo | null {
    if (!expression || typeof expression !== "string") return null;

    const pattern = /^(\w+)\.(\w+)\(([^)]*)\)$/;
    const match = expression.trim().match(pattern);
    if (!match) return null;

    const [, receiver, method, argsStr] = match;
    const args =
      argsStr.trim() === ""
        ? []
        : argsStr.split(",").map((a) => a.trim());

    return { receiver, method, args };
  }

  /**
   * Self 접근 판별: "self.field"인가?
   *
   * true: "self.Value", "self.HP"
   * false: "other.Value", "obj.method()"
   */
  isSelfAccess(expression: string): boolean {
    if (!expression || typeof expression !== "string") return false;
    const pattern = /self\.\w+/;
    return pattern.test(expression);
  }

  /**
   * Self 접근 파싱: "self.Value" → { field: "Value" }
   */
  parseSelfAccess(expression: string): SelfAccessInfo | null {
    if (!expression || typeof expression !== "string") return null;

    const pattern = /self\.(\w+)/;
    const match = expression.match(pattern);
    if (!match) return null;

    return { field: match[1] };
  }

  /**
   * Self 바인딩: receiver를 첫 인자로 삽입
   *
   * "my_counter.Add(5)"
   * → MethodCallInfo {
   *      receiver: "my_counter",
   *      method: "Add",
   *      explicitArgs: ["5"],
   *      fullArgs: ["my_counter", "5"]  // self binding!
   *    }
   */
  bindSelf(callExpr: string): MethodCallInfo | null {
    const dotCall = this.parseDotCall(callExpr);
    if (!dotCall) return null;

    return {
      receiver: dotCall.receiver,
      method: dotCall.method,
      explicitArgs: dotCall.args,
      fullArgs: [dotCall.receiver, ...dotCall.args], // receiver를 첫 인자로!
    };
  }
}

/**
 * ClassInstanceFactory: 클래스 인스턴스 생성 및 관리
 *
 * 역할:
 * 1. NEW ClassName() → ClassInstance 생성
 * 2. 필드 접근/설정 (getField, setField)
 * 3. 메서드 주소 조회 (lookupMethod)
 * 4. 인스턴스 독립성 보장 (inst1과 inst2는 독립적)
 */
export class ClassInstanceFactory {
  constructor(private registry: ClassRegistry) {}

  /**
   * 클래스 인스턴스 생성
   *
   * NEW Counter() → ClassInstance
   */
  create(className: string): ClassInstance {
    const classDef = this.registry.getClass(className);
    if (!classDef) {
      throw new Error(`클래스 미등록: ${className}`);
    }

    // 필드 초기화 (기본값 또는 0)
    const fields = new Map<string, number | string | boolean>();
    for (const field of classDef.fields) {
      fields.set(field.name, field.defaultValue ?? 0);
    }

    // vTable 구성 (메서드명 → bytecode addr)
    const vTable = this.registry.buildVTable(className);

    return {
      className,
      fields,
      vTable,
    };
  }

  /**
   * 인스턴스 타입 확인
   */
  isInstance(obj: any): obj is ClassInstance {
    return (
      obj &&
      typeof obj === "object" &&
      "className" in obj &&
      "fields" in obj &&
      "vTable" in obj &&
      obj.fields instanceof Map &&
      obj.vTable instanceof Map
    );
  }

  /**
   * 필드값 조회
   */
  getField(
    instance: ClassInstance,
    fieldName: string
  ): number | string | boolean | undefined {
    return instance.fields.get(fieldName);
  }

  /**
   * 필드값 설정
   */
  setField(
    instance: ClassInstance,
    fieldName: string,
    value: number | string | boolean
  ): void {
    instance.fields.set(fieldName, value);
  }

  /**
   * 메서드 주소 조회 (vTable lookup)
   *
   * instance.vTable["Add"] → bytecode addr
   * → VM의 CALL 명령에 전달
   */
  lookupMethod(instance: ClassInstance, methodName: string): number | undefined {
    return instance.vTable.get(methodName);
  }
}

/**
 * 사용 예시
 *
 * ```typescript
 * // 클래스 정의
 * const counterDef: ClassDef = {
 *   name: "Counter",
 *   fields: [{ name: "Value", type: "Int", defaultValue: 0 }],
 *   methods: [
 *     { name: "Add", className: "Counter", params: ["amt"], returnType: "Void" },
 *     { name: "GetValue", className: "Counter", params: [], returnType: "Int" }
 *   ],
 *   totalSize: 4,
 *   registeredAt: Date.now()
 * };
 *
 * // Registry에 등록
 * const registry = new ClassRegistry();
 * registry.registerClass(counterDef);
 *
 * // 인스턴스 생성
 * const factory = new ClassInstanceFactory(registry);
 * const myCounter = factory.create("Counter");
 *
 * // 필드 설정
 * factory.setField(myCounter, "Value", 10);
 *
 * // Dot notation 파싱
 * const binder = new SelfBinder();
 * const methodCall = binder.bindSelf("myCounter.Add(5)");
 * // methodCall.fullArgs = ["myCounter", "5"]  ← self binding!
 *
 * // vTable lookup
 * const addAddr = factory.lookupMethod(myCounter, "Add");
 * // → bytecode addr (CALL 명령에 전달)
 *
 * // 결과 확인
 * console.log(factory.getField(myCounter, "Value")); // 15 ✅
 * ```
 */
