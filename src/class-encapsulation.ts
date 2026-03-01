/**
 * FreeLang v7.4: Encapsulation & Access Control
 * 목표: 캡슐화와 정보 은닉을 통한 보안 성벽 구축
 *
 * 핵심 설계:
 * 1. Access Modifiers: private(-), protected(#), public(+)
 * 2. Metadata Flagging: 각 멤버에 2비트 권한 플래그
 * 3. Access Validation Pass: 컴파일 타임 접근 권한 검사
 *
 * 예시:
 * CLASS BankAccount { PRIVATE Balance(Int), PUBLIC GetBalance() }
 * my_acc.Balance = 999 → ERROR: "Property Balance is private" ✅
 * my_acc.GetBalance() → OK ✅
 */

import {
  ClassDef,
  ClassRegistry,
} from './class-foundation';
import {
  ClassHierarchy,
} from './class-inheritance';

/**
 * 접근 수준 (Access Level)
 *
 * 2비트로 표현:
 * 00 (0) = PRIVATE: 클래스 내부만
 * 01 (1) = PROTECTED: 클래스 + 자식클래스
 * 10 (2) = PUBLIC: 모두
 */
export enum AccessLevel {
  PRIVATE = 0,      // 클래스 내부에서만 접근 가능
  PROTECTED = 1,    // 클래스 내부 + 자식클래스에서 접근 가능
  PUBLIC = 2,       // 모두 접근 가능
}

/**
 * 멤버 메타데이터 (필드/메서드 권한 정보)
 *
 * 예:
 * {
 *   name: "Balance",
 *   type: "field",
 *   accessLevel: PRIVATE,
 *   className: "BankAccount"
 * }
 */
export interface MemberMetadata {
  name: string;                    // "Balance", "GetBalance"
  type: 'field' | 'method';       // 필드 또는 메서드
  accessLevel: AccessLevel;        // PRIVATE, PROTECTED, PUBLIC
  className: string;               // 소속 클래스 "BankAccount"
  isStatic?: boolean;              // Static 멤버 여부
}

/**
 * 접근 문맥 (Access Context)
 *
 * 누가 어디서 무엇에 접근하려고 하는가?
 */
export interface AccessContext {
  accessingClass?: string;        // 접근하는 클래스 (undefined = 외부)
  accessingIsSubclass?: boolean;  // 자식클래스인가?
  targetClass: string;            // 접근 대상 클래스 "BankAccount"
  targetMember: string;           // 접근 대상 멤버 "Balance"
}

/**
 * 접근 위반 정보 (Access Violation)
 *
 * 권한 없는 접근이 감지되었을 때의 상세 정보
 */
export interface AccessViolation {
  violationType: 'private_access' | 'protected_access' | 'invalid_context';
  targetClass: string;
  targetMember: string;
  requiredLevel: AccessLevel;
  context: AccessContext;
  message: string;
}

/**
 * AccessModifierValidator: 클래스 멤버에 권한 플래그 부착
 *
 * 역할:
 * 1. 필드/메서드에 PRIVATE/PROTECTED/PUBLIC 플래그 등록
 * 2. 멤버 권한 정보 저장 및 조회
 * 3. 클래스별 멤버 메타데이터 관리
 */
export class AccessModifierValidator {
  private memberMetadata: Map<string, MemberMetadata[]> = new Map();
  // "BankAccount" → [
  //   { name: "Balance", type: "field", accessLevel: PRIVATE, ... },
  //   { name: "PIN", type: "field", accessLevel: PROTECTED, ... },
  //   { name: "GetBalance", type: "method", accessLevel: PUBLIC, ... }
  // ]

  /**
   * 멤버에 권한 플래그 부착
   */
  registerMember(metadata: MemberMetadata): void {
    const key = metadata.className;
    if (!this.memberMetadata.has(key)) {
      this.memberMetadata.set(key, []);
    }
    this.memberMetadata.get(key)!.push(metadata);
  }

  /**
   * 특정 멤버의 권한 정보 조회
   */
  getMember(className: string, memberName: string): MemberMetadata | undefined {
    const members = this.memberMetadata.get(className);
    if (!members) return undefined;
    return members.find((m) => m.name === memberName);
  }

  /**
   * 클래스의 모든 멤버 조회
   */
  getAllMembers(className: string): MemberMetadata[] {
    return this.memberMetadata.get(className) ?? [];
  }

  /**
   * 특정 권한의 멤버들만 필터링
   */
  getMembersByAccessLevel(
    className: string,
    level: AccessLevel
  ): MemberMetadata[] {
    return this.getAllMembers(className).filter((m) => m.accessLevel === level);
  }

  /**
   * 초기화
   */
  clear(): void {
    this.memberMetadata.clear();
  }
}

/**
 * AccessValidator: 접근 권한 검증
 *
 * 역할:
 * 1. 접근 요청을 문맥과 함께 분석
 * 2. 멤버의 권한 수준과 비교
 * 3. 위반 시 AccessViolation 반환
 */
export class AccessValidator {
  constructor(
    private modifier: AccessModifierValidator,
    private hierarchy: ClassHierarchy,
    private registry: ClassRegistry
  ) {}

  /**
   * 접근 권한 검증 (핵심 알고리즘)
   *
   * 규칙:
   * - PRIVATE: 같은 클래스 내부에서만 접근 가능
   * - PROTECTED: 같은 클래스 또는 자식클래스에서만 접근 가능
   * - PUBLIC: 어디서든 접근 가능
   */
  validateAccess(context: AccessContext): AccessViolation | null {
    const member = this.modifier.getMember(context.targetClass, context.targetMember);
    if (!member) return null;

    // 규칙 1: PRIVATE 멤버
    if (member.accessLevel === AccessLevel.PRIVATE) {
      if (!context.accessingClass || context.accessingClass !== member.className) {
        return {
          violationType: 'private_access',
          targetClass: context.targetClass,
          targetMember: context.targetMember,
          requiredLevel: AccessLevel.PRIVATE,
          context,
          message: `Property '${context.targetMember}' is private and only accessible within class '${member.className}'`,
        };
      }
      return null;
    }

    // 규칙 2: PROTECTED 멤버
    if (member.accessLevel === AccessLevel.PROTECTED) {
      if (!context.accessingClass) {
        // 외부에서 접근 시도
        return {
          violationType: 'protected_access',
          targetClass: context.targetClass,
          targetMember: context.targetMember,
          requiredLevel: AccessLevel.PROTECTED,
          context,
          message: `Property '${context.targetMember}' is protected and only accessible within class '${member.className}' or its subclasses`,
        };
      }

      // 접근하는 클래스가 대상 클래스의 자식인가?
      const isSameClass = context.accessingClass === member.className;
      const isSubclass = this.hierarchy.isSubclassOf(
        context.accessingClass,
        member.className
      );

      if (!isSameClass && !isSubclass) {
        return {
          violationType: 'protected_access',
          targetClass: context.targetClass,
          targetMember: context.targetMember,
          requiredLevel: AccessLevel.PROTECTED,
          context,
          message: `Property '${context.targetMember}' is protected`,
        };
      }
      return null;
    }

    // 규칙 3: PUBLIC 멤버 (제약 없음)
    return null;
  }

  /**
   * 접근 가능 여부 간단 확인
   */
  isAccessible(context: AccessContext): boolean {
    return this.validateAccess(context) === null;
  }

  /**
   * 여러 멤버 접근 일괄 검증
   */
  validateMultipleAccess(
    context: AccessContext,
    memberNames: string[]
  ): AccessViolation[] {
    const violations: AccessViolation[] = [];
    for (const memberName of memberNames) {
      const violation = this.validateAccess({
        ...context,
        targetMember: memberName,
      });
      if (violation) violations.push(violation);
    }
    return violations;
  }
}

/**
 * EncapsulationChecker: 전체 캡슐화 검증 및 보고
 *
 * 역할:
 * 1. 필드/메서드 접근 검증
 * 2. 공개/보호/비공개 멤버 필터링
 * 3. 캡슐화 통계 및 보고서 생성
 */
export class EncapsulationChecker {
  constructor(
    private modifier: AccessModifierValidator,
    private validator: AccessValidator,
    private hierarchy: ClassHierarchy,
    private registry: ClassRegistry
  ) {}

  /**
   * 필드 접근 검증
   */
  checkFieldAccess(
    className: string,
    fieldName: string,
    accessingClass?: string
  ): AccessViolation | null {
    return this.validator.validateAccess({
      accessingClass,
      targetClass: className,
      targetMember: fieldName,
    });
  }

  /**
   * 메서드 호출 검증
   */
  checkMethodCall(
    className: string,
    methodName: string,
    accessingClass?: string
  ): AccessViolation | null {
    return this.validator.validateAccess({
      accessingClass,
      targetClass: className,
      targetMember: methodName,
    });
  }

  /**
   * 공개 멤버만 필터링
   */
  getAllPublicMembers(className: string): MemberMetadata[] {
    return this.modifier
      .getAllMembers(className)
      .filter((m) => m.accessLevel === AccessLevel.PUBLIC);
  }

  /**
   * 보호된 멤버만 필터링
   */
  getAllProtectedMembers(className: string): MemberMetadata[] {
    return this.modifier
      .getAllMembers(className)
      .filter((m) => m.accessLevel === AccessLevel.PROTECTED);
  }

  /**
   * 비공개 멤버만 필터링
   */
  getAllPrivateMembers(className: string): MemberMetadata[] {
    return this.modifier
      .getAllMembers(className)
      .filter((m) => m.accessLevel === AccessLevel.PRIVATE);
  }

  /**
   * 공개 인터페이스 (외부에서 접근 가능한 멤버)
   */
  getPublicInterface(className: string): MemberMetadata[] {
    return this.getAllPublicMembers(className);
  }

  /**
   * 자식클래스가 접근 가능한 멤버 (PUBLIC + PROTECTED)
   */
  getSubclassInterface(className: string): MemberMetadata[] {
    return this.modifier
      .getAllMembers(className)
      .filter((m) => m.accessLevel === AccessLevel.PUBLIC || m.accessLevel === AccessLevel.PROTECTED);
  }

  /**
   * 캡슐화 보고서 생성
   */
  generateEncapsulationReport(): {
    totalClasses: number;
    totalMembers: number;
    violations: AccessViolation[];
    summary: Array<{
      className: string;
      totalMembers: number;
      publicCount: number;
      protectedCount: number;
      privateCount: number;
    }>;
  } {
    const summary = [];
    let totalMembers = 0;

    for (const classDef of this.registry.getAllClasses()) {
      const members = this.modifier.getAllMembers(classDef.name);
      const publicMembers = this.getAllPublicMembers(classDef.name);
      const protectedMembers = this.getAllProtectedMembers(classDef.name);
      const privateMembers = this.getAllPrivateMembers(classDef.name);

      totalMembers += members.length;

      summary.push({
        className: classDef.name,
        totalMembers: members.length,
        publicCount: publicMembers.length,
        protectedCount: protectedMembers.length,
        privateCount: privateMembers.length,
      });
    }

    return {
      totalClasses: this.registry.getAllClasses().length,
      totalMembers,
      violations: [],
      summary,
    };
  }

  /**
   * 캡슐화 강도 분석 (0-100)
   *
   * 비공개 멤버의 비율이 높을수록 캡슐화 강도 높음
   */
  getEncapsulationStrength(className: string): number {
    const members = this.modifier.getAllMembers(className);
    if (members.length === 0) return 0;

    const privateCount = this.getAllPrivateMembers(className).length;
    return Math.round((privateCount / members.length) * 100);
  }
}

/**
 * 사용 예시
 *
 * ```typescript
 * // 1. 멤버에 권한 플래그 부착
 * const validator = new AccessModifierValidator();
 * validator.registerMember({
 *   name: "Balance",
 *   type: "field",
 *   accessLevel: AccessLevel.PRIVATE,
 *   className: "BankAccount"
 * });
 * validator.registerMember({
 *   name: "GetBalance",
 *   type: "method",
 *   accessLevel: AccessLevel.PUBLIC,
 *   className: "BankAccount"
 * });
 *
 * // 2. 접근 권한 검증
 * const accessValidator = new AccessValidator(validator, hierarchy, registry);
 * const violation = accessValidator.validateAccess({
 *   accessingClass: undefined,  // 외부 접근
 *   targetClass: "BankAccount",
 *   targetMember: "Balance"
 * });
 * // → AccessViolation (PRIVATE 멤버를 외부에서 접근 시도)
 *
 * // 3. 캡슐화 검증
 * const checker = new EncapsulationChecker(validator, accessValidator, hierarchy, registry);
 * const publicMembers = checker.getAllPublicMembers("BankAccount");
 * // → [{ name: "GetBalance", type: "method", accessLevel: PUBLIC, ... }]
 * ```
 */
