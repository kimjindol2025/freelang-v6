/**
 * FreeLang v7.1: Inheritance & Memory Offset Expansion
 * 목표: 부모 클래스의 메모리 레이아웃과 메서드를 자식 클래스가 온전히 물려받음
 *
 * 핵심:
 * 1. ClassHierarchy: 부모-자식 관계 맵, 상속 체인 추적
 * 2. InheritanceLayout: 부모 오프셋 보존 + 자식 필드 추가 (4-byte 정렬)
 * 3. SuperBinder: super.method() 파싱 및 부모 메서드 디스패치
 * 4. InheritanceFactory: 상속 필드 포함 인스턴스 생성
 *
 * 예시:
 * CLASS Point { X (Int); Y (Int) }                   // 8B
 * CLASS Point3D EXTENDS Point { Z (Int) }             // 12B
 * REF p3 = NEW Point3D()
 * SET p3.X = 10  // offset=0 (부모에서 물려받음)
 * SET p3.Y = 20  // offset=4 (부모에서 물려받음)
 * SET p3.Z = 30  // offset=8 (자식이 추가)
 * CHECK(sizeof(Point3D) == 12)  ✅
 * CHECK(p3.X == 10)             ✅
 */

import { ClassDef, ClassFieldDef, MethodDef, ClassInstance, ClassRegistry } from './class-foundation';

/**
 * 상속 관계 정의
 */
export interface InheritanceDef {
  childClass: string;   // "Point3D"
  parentClass: string;  // "Point"
  registeredAt: number;
}

/**
 * 상속된 필드 정보 (오프셋 포함)
 */
export interface InheritedFieldInfo {
  name: string;
  type: string;
  offset: number;       // 메모리 오프셋 (바이트)
  inheritedFrom: string; // 상속 출처 ("Point", "Point3D", etc.)
}

/**
 * 클래스 메모리 레이아웃 (상속 포함)
 */
export interface ClassLayout {
  className: string;
  fields: InheritedFieldInfo[]; // 부모 필드 + 자식 필드 (순서 보장)
  parentSize: number;           // 부모가 차지하는 바이트 수
  ownSize: number;              // 자식 고유 필드 크기
  totalSize: number;            // parentSize + ownSize
}

/**
 * Super 바인딩 결과
 */
export interface SuperCallInfo {
  targetClass: string;   // "Point" (부모 클래스)
  method: string;        // "SetPoint"
  fullArgs: string[];    // [receiver, ...args]
}

/**
 * ClassHierarchy: 부모-자식 관계 관리
 *
 * 역할:
 * 1. 상속 관계 등록 (extend)
 * 2. 상속 체인 추적 (getInheritanceChain)
 * 3. 부모-자식 관계 확인 (isSubclassOf)
 */
export class ClassHierarchy {
  private parents: Map<string, string> = new Map();
  // parents: { "Point3D" → "Point", "Point4D" → "Point3D" }

  /**
   * 자식 클래스가 부모 클래스를 상속
   * "Point3D EXTENDS Point"
   */
  extend(childName: string, parentName: string): void {
    this.parents.set(childName, parentName);
  }

  /**
   * 특정 클래스의 직속 부모 반환
   * getParent("Point3D") = "Point"
   */
  getParent(className: string): string | undefined {
    return this.parents.get(className);
  }

  /**
   * 클래스가 부모를 가지는가?
   * hasParent("Point3D") = true
   * hasParent("Point") = false
   */
  hasParent(className: string): boolean {
    return this.parents.has(className);
  }

  /**
   * 상속 체인 반환 (루트부터 역순)
   *
   * "Point3D" ← "Point" 상속
   * → getInheritanceChain("Point3D") = ["Point3D", "Point"]
   *
   * "Point3D" ← "Point3D" ← "Point" (3단계)
   * → getInheritanceChain("Point4D") = ["Point4D", "Point3D", "Point"]
   */
  getInheritanceChain(className: string): string[] {
    const chain: string[] = [];
    let current: string | undefined = className;

    while (current) {
      chain.push(current);
      current = this.parents.get(current);
    }

    return chain; // 자식부터 부모 순서
  }

  /**
   * 자식 클래스가 부모 클래스의 서브클래스인가?
   *
   * isSubclassOf("Point3D", "Point") = true
   * isSubclassOf("Point", "Point3D") = false
   * isSubclassOf("Point", "Point") = false (자신은 제외)
   */
  isSubclassOf(childName: string, parentName: string): boolean {
    const chain = this.getInheritanceChain(childName);
    // ["Point3D", "Point"] 에서 "Point" 포함 여부 확인
    // 단, 자신(chain[0])은 제외
    return chain.includes(parentName) && chain[0] !== parentName;
  }

  /**
   * 상속 체인의 루트 클래스 (최상위 부모)
   *
   * Point3D ← Point3D ← Point
   * → getRootClass("Point4D") = "Point"
   */
  getRootClass(className: string): string {
    const chain = this.getInheritanceChain(className);
    return chain[chain.length - 1];
  }

  /**
   * 등록된 모든 상속 관계
   */
  getAllRelations(): InheritanceDef[] {
    return Array.from(this.parents.entries()).map(([childClass, parentClass]) => ({
      childClass,
      parentClass,
      registeredAt: Date.now(),
    }));
  }

  /**
   * 초기화
   */
  clear(): void {
    this.parents.clear();
  }
}

/**
 * InheritanceLayout: 메모리 레이아웃 계산
 *
 * 역할:
 * 1. 부모 오프셋 보존
 * 2. 자식 필드를 부모 다음부터 추가 (4-byte 정렬)
 * 3. 최종 크기 계산
 */
export class InheritanceLayout {
  // 타입별 크기 (v5.9 패턴 재사용)
  private static TYPE_SIZES: Record<string, number> = {
    'Int': 4, 'i32': 4, 'i64': 8, 'f32': 4, 'f64': 8,
    'Bool': 4, 'bool': 1, 'Str': 16, 'string': 16, 'any': 8
  };

  /**
   * 타입의 크기 반환
   */
  getTypeSize(type: string): number {
    return InheritanceLayout.TYPE_SIZES[type] ?? 8; // 기본값 8
  }

  /**
   * 부모 클래스 기본 레이아웃 계산
   *
   * Point { X (Int); Y (Int) }
   * → { fields: [{X, offset: 0}, {Y, offset: 4}], totalSize: 8 }
   */
  calculateParentLayout(
    parentDef: ClassDef,
    hierarchy: ClassHierarchy,
    registry: ClassRegistry
  ): ClassLayout {
    // 부모의 부모가 있으면 먼저 계산
    const parentOfParent = hierarchy.getParent(parentDef.name);
    let parentLayout: ClassLayout | null = null;
    let startOffset = 0;

    if (parentOfParent) {
      const parentOfParentDef = registry.getClass(parentOfParent);
      if (parentOfParentDef) {
        parentLayout = this.calculateParentLayout(parentOfParentDef, hierarchy, registry);
        startOffset = parentLayout.totalSize;
      }
    }

    const fields: InheritedFieldInfo[] = [];

    // 부모의 부모 필드 먼저 추가
    if (parentLayout) {
      fields.push(...parentLayout.fields);
    }

    // 현재 클래스의 필드 추가
    let offset = startOffset;
    for (const field of parentDef.fields) {
      const size = this.getTypeSize(field.type);
      // 4-byte 정렬
      const aligned = Math.ceil(offset / 4) * 4;

      fields.push({
        name: field.name,
        type: field.type,
        offset: aligned,
        inheritedFrom: parentDef.name,
      });

      offset = aligned + size;
    }

    return {
      className: parentDef.name,
      fields,
      parentSize: parentLayout?.totalSize ?? 0,
      ownSize: offset - (parentLayout?.totalSize ?? 0),
      totalSize: offset,
    };
  }

  /**
   * 자식 클래스 레이아웃 계산
   *
   * 부모 레이아웃을 받아서, 자식 필드를 부모 다음부터 추가
   */
  calculateChildLayout(childDef: ClassDef, parentLayout: ClassLayout): ClassLayout {
    const fields: InheritedFieldInfo[] = [
      ...parentLayout.fields, // 부모 필드 유지 (offset 그대로)
    ];

    let offset = parentLayout.totalSize; // 자식 필드는 부모 다음부터!

    for (const field of childDef.fields) {
      const size = this.getTypeSize(field.type);
      // 4-byte 정렬
      const aligned = Math.ceil(offset / 4) * 4;

      fields.push({
        name: field.name,
        type: field.type,
        offset: aligned,
        inheritedFrom: childDef.name,
      });

      offset = aligned + size;
    }

    return {
      className: childDef.name,
      fields,
      parentSize: parentLayout.totalSize,
      ownSize: offset - parentLayout.totalSize,
      totalSize: offset,
    };
  }

  /**
   * 상속 체인 전체 레이아웃 계산
   *
   * "Point3D"의 레이아웃을 구하려면:
   * 1. getInheritanceChain("Point3D") = ["Point3D", "Point"]
   * 2. 역순으로: ["Point", "Point3D"]
   * 3. Point 레이아웃 계산
   * 4. Point3D 레이아웃 계산 (Point 위에 추가)
   */
  calculateLayoutForClass(
    className: string,
    hierarchy: ClassHierarchy,
    registry: ClassRegistry
  ): ClassLayout {
    const chain = hierarchy.getInheritanceChain(className);
    let layout: ClassLayout | null = null;

    // 루트부터 계산 (역순)
    for (let i = chain.length - 1; i >= 0; i--) {
      const cls = chain[i];
      const classDef = registry.getClass(cls);

      if (!classDef) {
        throw new Error(`클래스 미등록: ${cls}`);
      }

      if (!layout) {
        // 루트 클래스: 부모가 없으므로 0부터 시작
        const rootLayout = this.calculateParentLayout(classDef, hierarchy, registry);
        layout = rootLayout;
      } else {
        // 자식 클래스: 부모 레이아웃 위에 추가
        layout = this.calculateChildLayout(classDef, layout);
      }
    }

    if (!layout) {
      throw new Error(`레이아웃 계산 실패: ${className}`);
    }

    return layout;
  }
}

/**
 * SuperBinder: super.method() 파싱 및 부모 메서드 디스패치
 *
 * 역할:
 * 1. "super.method(args)" 패턴 탐지
 * 2. 부모 클래스의 메서드 조회
 * 3. Super call info 반환
 */
export class SuperBinder {
  constructor(
    private hierarchy: ClassHierarchy,
    private registry: ClassRegistry
  ) {}

  /**
   * Super call 판별: "super.method(" 패턴인가?
   */
  isSuperCall(expression: string): boolean {
    if (!expression || typeof expression !== 'string') return false;
    const pattern = /^super\.\w+\(/;
    return pattern.test(expression);
  }

  /**
   * Super call 파싱
   *
   * "super.SetPoint(1, 2)" → SuperCallInfo
   */
  parseSuperCall(expression: string): SuperCallInfo | null {
    if (!expression || typeof expression !== 'string') return null;

    const pattern = /^super\.(\w+)\(([^)]*)\)$/;
    const match = expression.trim().match(pattern);
    if (!match) return null;

    const [, methodName, argsStr] = match;
    const args =
      argsStr.trim() === ''
        ? []
        : argsStr.split(',').map((a) => a.trim());

    return {
      targetClass: '', // 호출 컨텍스트에서 채움
      method: methodName,
      fullArgs: ['this', ...args], // this 추가
    };
  }

  /**
   * 부모 메서드 조회
   *
   * resolveSuperMethod("Point3D", "SetPoint")
   * → Point 클래스의 SetPoint 메서드
   */
  resolveSuperMethod(
    className: string,
    methodName: string
  ): MethodDef | undefined {
    const parentName = this.hierarchy.getParent(className);
    if (!parentName) return undefined; // 부모가 없음

    return this.registry.getMethod(parentName, methodName);
  }
}

/**
 * InheritanceFactory: 상속을 포함한 인스턴스 생성
 *
 * 역할:
 * 1. 상속 체인 전체 필드 초기화
 * 2. 부모 메서드 + 자식 오버라이드 vTable 생성
 * 3. 타입 캐스팅 검증 (upcasting)
 */
export class InheritanceFactory {
  constructor(
    private registry: ClassRegistry,
    private hierarchy: ClassHierarchy,
    private layout: InheritanceLayout
  ) {}

  /**
   * 상속을 포함하여 인스턴스 생성
   *
   * NEW Point3D() → ClassInstance (X, Y, Z 필드 포함)
   */
  createWithInheritance(className: string): ClassInstance {
    const classDef = this.registry.getClass(className);
    if (!classDef) {
      throw new Error(`클래스 미등록: ${className}`);
    }

    // 상속 체인 전체 레이아웃 계산
    const layout = this.layout.calculateLayoutForClass(className, this.hierarchy, this.registry);

    // 모든 필드 초기화 (부모 필드 + 자식 필드)
    const fields = this.initializeFields(layout);

    // 상속 포함 vTable 생성
    const vTable = this.buildInheritedVTable(className);

    return {
      className,
      fields,
      vTable,
    };
  }

  /**
   * 상속된 vTable 생성
   *
   * 루트부터 자식까지 메서드를 등록
   * (자식이 오버라이드 시 덮어씌움)
   */
  buildInheritedVTable(className: string): Map<string, number> {
    const chain = this.hierarchy.getInheritanceChain(className);
    const vTable = new Map<string, number>();

    // 루트부터 계산 (자식이 마지막에 덮어씌워 오버라이드 구현)
    for (const cls of [...chain].reverse()) {
      const classDef = this.registry.getClass(cls);
      if (!classDef) continue;

      for (const method of classDef.methods) {
        if (method.addr !== undefined) {
          vTable.set(method.name, method.addr);
        }
      }
    }

    return vTable;
  }

  /**
   * 필드 초기화 (부모 + 자식 모두)
   */
  private initializeFields(layout: ClassLayout): Map<string, number | string | boolean> {
    const fields = new Map<string, number | string | boolean>();

    for (const field of layout.fields) {
      // 각 필드의 기본값 조회
      const classDef = this.registry.getClass(field.inheritedFrom);
      if (!classDef) continue;

      const fieldDef = classDef.fields.find((f) => f.name === field.name);
      fields.set(field.name, fieldDef?.defaultValue ?? 0);
    }

    return fields;
  }

  /**
   * 인스턴스가 특정 클래스의 인스턴스인가? (upcasting 포함)
   *
   * p3 is Point3D? → true
   * p3 is Point? → true (upcasting, 부모 타입)
   */
  isInstanceOfClass(instance: ClassInstance, targetClass: string): boolean {
    if (instance.className === targetClass) return true;

    // 상속 체인 확인 (부모 타입도 허용)
    return this.hierarchy.isSubclassOf(instance.className, targetClass);
  }
}
