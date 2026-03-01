/**
 * FreeLang v7.3: Interfaces & Abstract Contract
 * 목표: 엔진이 강제하는 인터페이스 계약 (Contract Enforcement)
 *
 * 핵심 설계:
 * 1. Pure Virtual Functions: 추상 메서드는 vTable에 NULL 또는 Panic_Address
 * 2. Abstract Check: NEW 시점에서 NULL 슬롯 감지 시 컴파일 에러
 * 3. Zero-Data Rule: 인터페이스는 메서드만 정의, 데이터 멤버 불가
 *
 * 예시: INTERFACE Shape { GetArea() }
 *       CLASS Square IMPLEMENTS Shape (GetArea 미구현)
 *       NEW Square() → ERROR: missing methods GetArea ✅
 */

import {
  ClassDef,
  ClassRegistry,
  MethodDef,
} from './class-foundation';
import {
  VirtualTable,
} from './class-polymorphism';

/**
 * 인터페이스 메서드 정의 (구현체 없음)
 */
export interface InterfaceMethodDef {
  name: string;              // "GetArea"
  params: string[];          // ["self"] (self 포함)
  returnType: string;        // "Int", "Str", etc.
  slotIndex: number;         // 인터페이스 내 슬롯 위치 (0, 1, 2, ...)
}

/**
 * 인터페이스 정의
 *
 * 예:
 * {
 *   name: "Shape",
 *   methods: [
 *     { name: "GetArea", params: ["self"], returnType: "Int", slotIndex: 0 },
 *     { name: "GetPerimeter", params: ["self"], returnType: "Int", slotIndex: 1 }
 *   ]
 * }
 */
export interface InterfaceDef {
  name: string;                      // "Shape"
  methods: InterfaceMethodDef[];     // 메서드 선언 (구현체 없음)
  registeredAt: number;              // 등록 타임스탐프
}

/**
 * 계약 구현 추적
 *
 * 클래스가 인터페이스를 구현할 때, 각 슬롯이 실제 메서드와 바인딩되는지 추적
 */
export interface ContractMapping {
  className: string;                 // "Circle"
  implementedInterfaces: string[];    // ["Shape", "Drawable"]
  slotToMethod: Map<
    number,
    {
      interfaceName: string;         // "Shape"
      slotIndex: number;             // 0 (GetArea slot)
      methodName: string;            // "GetArea" (실제 구현 메서드명)
      methodAddr?: number;           // 실제 bytecode 주소 (있으면 OK, 없으면 에러!)
    }
  >;
}

/**
 * 계약 위반 정보
 */
export interface ContractViolation {
  className: string;                 // "Square"
  interfaceName: string;             // "Shape"
  missingMethods: string[];          // ["GetPerimeter"]
  severity: 'error' | 'warning';
}

/**
 * InterfaceRegistry: 인터페이스 정의 저장 + 슬롯 매핑
 *
 * 역할:
 * 1. 인터페이스 등록
 * 2. 클래스의 인터페이스 구현 추적
 * 3. 계약 매핑 관리
 */
export class InterfaceRegistry {
  private interfaces: Map<string, InterfaceDef> = new Map();
  private contractMappings: Map<string, ContractMapping> = new Map();

  /**
   * 인터페이스 등록
   */
  registerInterface(def: InterfaceDef): void {
    this.interfaces.set(def.name, def);
  }

  /**
   * 인터페이스 조회
   */
  getInterface(name: string): InterfaceDef | undefined {
    return this.interfaces.get(name);
  }

  /**
   * 클래스가 인터페이스 구현 추적
   */
  mapImplementation(
    className: string,
    interfaceNames: string[]
  ): ContractMapping {
    const mapping: ContractMapping = {
      className,
      implementedInterfaces: interfaceNames,
      slotToMethod: new Map(),
    };
    this.contractMappings.set(className, mapping);
    return mapping;
  }

  /**
   * 구현 추적 조회
   */
  getContractMapping(className: string): ContractMapping | undefined {
    return this.contractMappings.get(className);
  }

  /**
   * 모든 인터페이스 조회
   */
  getAllInterfaces(): InterfaceDef[] {
    return Array.from(this.interfaces.values());
  }

  /**
   * 모든 계약 매핑 조회
   */
  getAllMappings(): ContractMapping[] {
    return Array.from(this.contractMappings.values());
  }

  /**
   * 초기화
   */
  clear(): void {
    this.interfaces.clear();
    this.contractMappings.clear();
  }
}

/**
 * AbstractValidator: 추상 메서드 구현 강제성 검증
 *
 * 역할:
 * 1. 클래스가 인터페이스의 모든 메서드를 구현했는가?
 * 2. vTable에서 NULL 슬롯 감지
 * 3. 계약 위반 보고
 */
export class AbstractValidator {
  constructor(
    private registry: ClassRegistry,
    private interfaceRegistry: InterfaceRegistry
  ) {}

  /**
   * 클래스가 인터페이스의 모든 메서드를 구현했는가?
   *
   * null = 완벽하게 구현됨
   * ContractViolation = 누락된 메서드 있음
   */
  validateImplementation(
    className: string,
    interfaceNames: string[]
  ): ContractViolation | null {
    const classDef = this.registry.getClass(className);
    if (!classDef) return null;

    for (const interfaceName of interfaceNames) {
      const interfaceDef = this.interfaceRegistry.getInterface(interfaceName);
      if (!interfaceDef) continue;

      // 인터페이스의 모든 메서드가 클래스에 구현되어 있나?
      const missingMethods: string[] = [];
      for (const ifMethod of interfaceDef.methods) {
        const classMethod = classDef.methods.find(
          (m) => m.name === ifMethod.name
        );
        // 메서드가 없거나 주소가 없으면 미구현
        if (!classMethod || classMethod.addr === undefined) {
          missingMethods.push(ifMethod.name);
        }
      }

      if (missingMethods.length > 0) {
        return {
          className,
          interfaceName,
          missingMethods,
          severity: 'error',
        };
      }
    }

    return null;
  }

  /**
   * vTable에서 NULL 슬롯 감지
   *
   * vTable.addrs = (number | null)[]
   * null이 있으면 미구현 메서드 있음
   */
  checkVTableCompleteness(vTable: VirtualTable): boolean {
    return !vTable.addrs.some((addr) => addr === null || addr === 0);
  }

  /**
   * 모든 클래스의 계약 위반 검증
   */
  validateAllClasses(): ContractViolation[] {
    const violations: ContractViolation[] = [];

    for (const mapping of this.interfaceRegistry.getAllMappings()) {
      for (const interfaceName of mapping.implementedInterfaces) {
        const violation = this.validateImplementation(
          mapping.className,
          [interfaceName]
        );
        if (violation) {
          violations.push(violation);
        }
      }
    }

    return violations;
  }

  /**
   * 특정 슬롯이 실제로 구현되었는가?
   */
  isSlotImplemented(
    vTable: VirtualTable,
    slotIndex: number
  ): boolean {
    if (slotIndex >= vTable.addrs.length) return false;
    const addr = vTable.addrs[slotIndex];
    return addr !== null && addr !== 0;
  }
}

/**
 * ContractChecker: NEW 시점과 호출 시점의 NULL 슬롯 감지
 *
 * 역할:
 * 1. NEW 시점: 미완성 클래스 블로킹
 * 2. 호출 시점: NULL 슬롯 감지
 * 3. 계약 위반 보고서 생성
 */
export class ContractChecker {
  constructor(
    private registry: ClassRegistry,
    private interfaceRegistry: InterfaceRegistry,
    private validator: AbstractValidator
  ) {}

  /**
   * NEW 시점: 미완성 클래스 블로킹
   *
   * 예: NEW Square() 시도 → "missing methods" 에러
   */
  checkInstanceCreation(className: string): boolean {
    const classDef = this.registry.getClass(className);
    if (!classDef) return false;

    // 이 클래스가 구현하는 인터페이스 확인
    const mapping = this.interfaceRegistry.getContractMapping(className);
    if (!mapping) {
      // 인터페이스를 구현하지 않으면 OK (기본 클래스)
      return true;
    }

    // 각 인터페이스의 필수 메서드 체크
    for (const interfaceName of mapping.implementedInterfaces) {
      const violation = this.validator.validateImplementation(
        className,
        [interfaceName]
      );
      if (violation) {
        throw new Error(
          `Cannot instantiate '${className}': ` +
          `missing methods in '${interfaceName}': ${violation.missingMethods.join(', ')}`
        );
      }
    }

    return true;
  }

  /**
   * 호출 시점: NULL 슬롯 감지
   *
   * 예: 미구현 메서드 호출 시도 → "Abstract method invocation" 에러
   */
  checkMethodInvocation(
    vTable: VirtualTable,
    slotIndex: number
  ): boolean {
    if (slotIndex >= vTable.addrs.length) {
      throw new Error(
        `Invalid slot index ${slotIndex} in vTable '${vTable.className}'`
      );
    }

    const addr = vTable.addrs[slotIndex];
    if (addr === null || addr === 0) {
      throw new Error(
        `Abstract method invocation in '${vTable.className}' at slot ${slotIndex}`
      );
    }

    return true;
  }

  /**
   * 계약 위반 보고서
   */
  generateReport(): {
    totalInterfaces: number;
    totalClasses: number;
    totalMappings: number;
    violations: ContractViolation[];
  } {
    return {
      totalInterfaces: this.interfaceRegistry.getAllInterfaces().length,
      totalClasses: this.registry.getAllClasses().length,
      totalMappings: this.interfaceRegistry.getAllMappings().length,
      violations: this.validator.validateAllClasses(),
    };
  }

  /**
   * 인터페이스의 슬롯 개수
   */
  getInterfaceSlotCount(interfaceName: string): number {
    const interfaceDef = this.interfaceRegistry.getInterface(interfaceName);
    if (!interfaceDef) return 0;
    return interfaceDef.methods.length;
  }

  /**
   * 인터페이스의 슬롯 맵 (메서드명 → 슬롯 인덱스)
   */
  getInterfaceSlotMap(interfaceName: string): Map<string, number> {
    const interfaceDef = this.interfaceRegistry.getInterface(interfaceName);
    if (!interfaceDef) return new Map();

    const slotMap = new Map<string, number>();
    for (const method of interfaceDef.methods) {
      slotMap.set(method.name, method.slotIndex);
    }
    return slotMap;
  }
}

/**
 * 사용 예시
 *
 * ```typescript
 * // 1. 인터페이스 정의
 * const shapeInterface: InterfaceDef = {
 *   name: "Shape",
 *   methods: [
 *     { name: "GetArea", params: ["self"], returnType: "Int", slotIndex: 0 },
 *     { name: "GetPerimeter", params: ["self"], returnType: "Int", slotIndex: 1 }
 *   ],
 *   registeredAt: Date.now()
 * };
 *
 * // 2. 레지스트리 등록
 * const ifRegistry = new InterfaceRegistry();
 * ifRegistry.registerInterface(shapeInterface);
 *
 * // 3. 클래스 정의 (Shape 구현)
 * const circleDef: ClassDef = {
 *   name: "Circle",
 *   fields: [{ name: "Radius", type: "Int" }],
 *   methods: [
 *     { name: "GetArea", className: "Circle", params: ["self"], returnType: "Int", addr: 1500 }
 *   ],
 *   totalSize: 8,
 *   registeredAt: Date.now()
 * };
 *
 * const registry = new ClassRegistry();
 * registry.registerClass(circleDef);
 *
 * // 4. 계약 매핑
 * ifRegistry.mapImplementation("Circle", ["Shape"]);
 *
 * // 5. 검증
 * const validator = new AbstractValidator(registry, ifRegistry);
 * const violation = validator.validateImplementation("Circle", ["Shape"]);
 * // → null (완벽하게 구현됨) ✅
 *
 * // 6. 인스턴스 생성 검증
 * const checker = new ContractChecker(registry, ifRegistry, validator);
 * checker.checkInstanceCreation("Circle");
 * // → true (OK) ✅
 * ```
 */
