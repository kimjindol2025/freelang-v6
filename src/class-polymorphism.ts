/**
 * FreeLang v7.2: Polymorphism & vTable (Dynamic Dispatch)
 * 목표: 동적 바인딩 + 가상 메서드 테이블 완성
 *
 * 핵심 설계 (사용자 철학: "기록이 증명이다"):
 * 1. Object Header: 모든 객체 첫 4바이트 = vptr (Class ID, 데이터 아님)
 * 2. vTable = 상수 기록 (배열): 클래스당 하나, 메서드 주소 배열
 *    Animal_vTable = [1000, 3000]   // [Speak_addr, Eat_addr]
 *    Dog_vTable    = [2000, 3000]   // [Dog_Speak_addr, Eat_addr] ← Speak만 갈아끼움
 * 3. 호출 공식: Target = *(*(obj+0) + MethodIndex × 4)
 *
 * 예시:
 * CLASS Animal { METHOD Speak() → addr:1000 }
 * CLASS Dog EXTENDS Animal { METHOD Speak() → addr:2000 (Override) }
 * my_pet = NEW Dog()
 * my_pet.Speak()  // vTable[0] = 2000 → "Woof! Woof!" (Animal 1000번 아님!) ✅
 */

import {
  ClassDef,
  ClassInstance,
  ClassRegistry,
  MethodDef,
} from './class-foundation';
import {
  ClassHierarchy,
  InheritanceFactory,
} from './class-inheritance';

/**
 * 메서드명 → 슬롯 인덱스 매핑 (클래스 계층 전체 공유, 불변)
 */
export interface MethodIndexEntry {
  methodName: string;      // "Speak"
  slotIndex: number;       // 0 (vTable 배열에서의 위치)
  firstDefinedIn: string;  // "Animal" (처음 정의된 클래스)
}

/**
 * 배열 기반 가상 함수 테이블 (클래스당 하나, 상수)
 *
 * 예:
 * Dog_vTable: { className: "Dog", addrs: [2000, 3000], slotCount: 2 }
 * addrs[0] = 2000 (Dog.Speak)
 * addrs[1] = 3000 (Animal.Eat, 오버라이드 안됨)
 */
export interface VirtualTable {
  className: string;       // "Dog"
  addrs: number[];         // [2000, 3000] (슬롯 인덱스별 주소)
  slotCount: number;       // 2 (총 슬롯 수)
  parentClass?: string;    // "Animal"
}

/**
 * 동적 디스패치 결과
 */
export interface DispatchResult {
  methodName: string;
  slotIndex: number;       // 사용된 슬롯 인덱스
  addr: number;            // 최종 실행 주소
  resolvedIn: string;      // "Dog" (어느 클래스의 슬롯인가)
  isDynamic: boolean;      // 동적 디스패치 여부 (업캐스팅 발생 시 true)
}

/**
 * 다형성 객체 (Object Header 포함)
 *
 * vptr (가상 포인터): 객체의 실제 타입 = 클래스 ID
 * 선언 타입: 변수 선언 시 타입 (업캐스팅 기반)
 */
export interface PolymorphicObject {
  vptr: string;            // Class ID (= className, 실제 타입: "Dog")
  instance: ClassInstance; // 기존 ClassInstance (데이터 + 필드)
  declaredType: string;    // 선언 타입 "Animal" (업캐스팅 기반)
}

/**
 * MethodIndexTable: 클래스 계층 전체에서 메서드 슬롯 인덱스 일관성 유지
 *
 * 핵심 보장:
 * Animal.Speak와 Dog.Speak는 동일한 슬롯 인덱스 0을 공유
 * → Dog_vTable[0] = Dog_Speak_addr 로 교체 가능 (오버라이드)
 */
export class MethodIndexTable {
  private slots: Map<string, number> = new Map();
  // "Speak" → 0, "Eat" → 1

  /**
   * 클래스 계층을 스캔하여 슬롯 인덱스 할당
   * 루트부터 순서대로 (Animal 먼저, Dog 나중)
   */
  buildFromHierarchy(
    registry: ClassRegistry,
    hierarchy: ClassHierarchy
  ): void {
    let nextIndex = 0;

    // 루트부터 진행: 모든 클래스 순회
    for (const cls of registry.getAllClasses()) {
      const chain = hierarchy.getInheritanceChain(cls.name);
      for (const ancestor of [...chain].reverse()) {
        const def = registry.getClass(ancestor);
        if (!def) continue;

        for (const method of def.methods) {
          // 처음 나타나는 메서드명에만 슬롯 할당
          if (!this.slots.has(method.name)) {
            this.slots.set(method.name, nextIndex++);
          }
        }
      }
    }
  }

  /**
   * 메서드명에 대한 슬롯 인덱스 조회
   */
  getSlotIndex(methodName: string): number | undefined {
    return this.slots.get(methodName);
  }

  /**
   * 전체 슬롯 목록
   */
  getAllSlots(): MethodIndexEntry[] {
    const entries: MethodIndexEntry[] = [];
    for (const [name, idx] of this.slots) {
      entries.push({
        methodName: name,
        slotIndex: idx,
        firstDefinedIn: '', // 추후 채워짐
      });
    }
    return entries.sort((a, b) => a.slotIndex - b.slotIndex);
  }

  /**
   * 총 슬롯 수
   */
  getSlotCount(): number {
    return this.slots.size;
  }

  /**
   * 초기화
   */
  clear(): void {
    this.slots.clear();
  }
}

/**
 * VTableBuilder: 클래스별 배열 형태의 vTable 생성 + 오버라이드 슬롯 갈아끼우기
 */
export class VTableBuilder {
  private builtTables: Map<string, VirtualTable> = new Map();

  constructor(
    private registry: ClassRegistry,
    private hierarchy: ClassHierarchy,
    private indexTable: MethodIndexTable
  ) {}

  /**
   * 특정 클래스의 vTable 배열 생성
   *
   * 루트 → 자식 순서: 자식 슬롯이 부모 슬롯을 덮어씌움 (오버라이드)
   *
   * 예:
   * Dog vTable 구축:
   *  1. Animal 메서드 등록: addrs[0]=1000 (Speak), addrs[1]=3000 (Eat)
   *  2. Dog 메서드 등록: addrs[0]=2000 (Dog.Speak, 갈아끼움!)
   *  결과: [2000, 3000]
   */
  buildVTable(className: string): VirtualTable {
    // 캐시 확인
    if (this.builtTables.has(className)) {
      return this.builtTables.get(className)!;
    }

    const slotCount = this.indexTable.getSlotCount();
    const addrs = new Array<number>(slotCount).fill(0);

    const chain = this.hierarchy.getInheritanceChain(className);

    // 루트부터 자식까지 (역순)
    for (const cls of [...chain].reverse()) {
      const classDef = this.registry.getClass(cls);
      if (!classDef) continue;

      for (const method of classDef.methods) {
        const idx = this.indexTable.getSlotIndex(method.name);
        if (idx !== undefined && method.addr !== undefined) {
          addrs[idx] = method.addr; // ← 갈아끼우기!
        }
      }
    }

    const vTable: VirtualTable = {
      className,
      addrs,
      slotCount,
      parentClass: this.hierarchy.getParent(className),
    };

    this.builtTables.set(className, vTable);
    return vTable;
  }

  /**
   * 모든 클래스의 vTable을 Map으로 반환
   */
  buildAllTables(): Map<string, VirtualTable> {
    for (const classDef of this.registry.getAllClasses()) {
      this.buildVTable(classDef.name);
    }
    return this.builtTables;
  }

  /**
   * vTable 캐시 조회
   */
  getTable(className: string): VirtualTable | undefined {
    if (!this.builtTables.has(className)) {
      if (this.registry.hasClass(className)) {
        return this.buildVTable(className);
      }
      return undefined;
    }
    return this.builtTables.get(className);
  }

  /**
   * 초기화
   */
  clear(): void {
    this.builtTables.clear();
  }
}

/**
 * VTableDispatcher: `vTable[index]` 조회로 O(1) 동적 디스패치
 *
 * 호출 공식: Target = vTable.addrs[slotIndex]
 *           = *(*(obj+0) + slotIndex × 4)
 */
export class VTableDispatcher {
  private cache: Map<string, VirtualTable> = new Map();

  constructor(
    private builder: VTableBuilder,
    private indexTable: MethodIndexTable,
    private hierarchy: ClassHierarchy
  ) {}

  /**
   * 핵심: 실제 타입(actualClass)의 vTable에서 메서드 주소 조회
   *
   * dispatch("Dog", "Speak") → 공식: vTable[0] = addrs[0] = 2000
   * dispatch("Animal", "Speak") → 공식: vTable[0] = addrs[0] = 1000
   */
  dispatch(
    actualClass: string,     // 실제 객체 타입 "Dog"
    methodName: string,
    declaredClass?: string   // 선언 타입 "Animal" (업캐스팅 기반, 선택)
  ): DispatchResult | null {
    // 1. 슬롯 인덱스 조회
    const slotIndex = this.indexTable.getSlotIndex(methodName);
    if (slotIndex === undefined) return null;

    // 2. 실제 타입의 vTable 가져오기 (캐시 활용)
    let vTable = this.cache.get(actualClass);
    if (!vTable) {
      vTable = this.builder.buildVTable(actualClass);
      this.cache.set(actualClass, vTable);
    }

    // 3. 공식 적용: Target = vTable.addrs[slotIndex]
    const addr = vTable.addrs[slotIndex];
    if (!addr) return null;

    return {
      methodName,
      slotIndex,
      addr,
      resolvedIn: actualClass,
      isDynamic: declaredClass !== undefined && declaredClass !== actualClass,
    };
  }

  /**
   * 업캐스팅된 객체의 동적 디스패치
   *
   * 핵심: poly.vptr (실제 타입)로 디스패치, poly.declaredType은 isDynamic 판정만
   */
  dispatchPolymorphic(
    poly: PolymorphicObject,
    methodName: string
  ): DispatchResult | null {
    return this.dispatch(
      poly.vptr,           // 실제 타입 (Class ID)
      methodName,
      poly.declaredType    // 선언 타입
    );
  }

  /**
   * 캐시 초기화
   */
  clear(): void {
    this.cache.clear();
  }
}

/**
 * PolymorphicFactory: 다형성 객체 생성 + 업캐스팅
 */
export class PolymorphicFactory {
  constructor(
    private inheritanceFactory: InheritanceFactory,
    private hierarchy: ClassHierarchy
  ) {}

  /**
   * 다형성 객체 생성
   *
   * create("Dog", "Animal")
   * → PolymorphicObject { vptr: "Dog", instance: {...}, declaredType: "Animal" }
   */
  create(
    actualClass: string,
    declaredType?: string
  ): PolymorphicObject {
    const instance = this.inheritanceFactory.createWithInheritance(actualClass);
    return {
      vptr: actualClass,                     // Object Header: Class ID
      instance,
      declaredType: declaredType ?? actualClass,
    };
  }

  /**
   * 업캐스팅
   *
   * upcast(dogPoly, "Animal")
   * → vptr="Dog" 유지, declaredType="Animal" 변경
   *
   * 핵심: vptr은 변경하지 않음! (동적 디스패치가 실제 타입을 계속 추적)
   */
  upcast(
    poly: PolymorphicObject,
    targetType: string
  ): PolymorphicObject {
    if (!this.hierarchy.isSubclassOf(poly.vptr, targetType)) {
      throw new Error(
        `업캐스팅 실패: ${poly.vptr} is not a subclass of ${targetType}`
      );
    }

    return {
      ...poly,
      declaredType: targetType, // vptr은 그대로!
    };
  }

  /**
   * 업캐스팅 발생 여부
   */
  isUpcast(poly: PolymorphicObject): boolean {
    return poly.vptr !== poly.declaredType;
  }

  /**
   * 실제 타입 반환
   */
  getActualType(poly: PolymorphicObject): string {
    return poly.vptr;
  }

  /**
   * 선언 타입 반환
   */
  getDeclaredType(poly: PolymorphicObject): string {
    return poly.declaredType;
  }
}
