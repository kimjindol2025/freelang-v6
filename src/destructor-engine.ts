/**
 * FreeLang v7.5: Destructor Engine & Finalizer
 * 목표: 객체 소멸 시 자동으로 호출되는 정리 로직
 *
 * 패턴:
 * - Destructor 메서드: 각 클래스에서 정의 가능
 * - Finalizer: 객체가 메모리에서 해제되기 직전에 호출
 * - 상속 체인: 부모 Destructor도 자동 호출
 */

import { ClassHierarchy } from './class-inheritance';
import { ObjectHeader } from './object-header';

/**
 * Destructor 정의
 *
 * 예:
 * {
 *   className: "FileHandle",
 *   code: "IF_OPEN then CLOSE_FILE else NOOP",
 *   onDelete: () => { console.log("FileHandle 정리"); }
 * }
 */
export interface DestructorDef {
  className: string;           // 클래스명
  code?: string;               // Destructor 코드 (선택사항)
  onDelete?: () => void;       // 콜백 함수
  registeredAt?: number;       // 등록 시간
}

/**
 * Destructor 레지스트리 항목
 */
interface DestructorEntry {
  def: DestructorDef;
  callCount: number;           // 호출 횟수 (통계용)
}

/**
 * DestructorEngine: 소멸자 관리
 *
 * 역할:
 * 1. Destructor 등록 (클래스별)
 * 2. 객체 소멸 시 Destructor 호출 (finalize)
 * 3. 상속 체인에서 Destructor 해석
 * 4. 통계 추적
 */
export class DestructorEngine {
  private destructors: Map<string, DestructorEntry> = new Map();
  // "Derived" → { def: DestructorDef, callCount: 0 }

  private statistics = {
    totalRegistered: 0,
    totalFinalized: 0,
    startTime: Date.now(),
  };

  /**
   * Destructor 등록
   *
   * 예:
   * engine.register({
   *   className: "FileHandle",
   *   onDelete: () => { file.close(); }
   * });
   */
  register(def: DestructorDef): void {
    this.destructors.set(def.className, {
      def: {
        ...def,
        registeredAt: Date.now(),
      },
      callCount: 0,
    });
    this.statistics.totalRegistered++;
  }

  /**
   * 특정 클래스의 Destructor 조회
   *
   * 반환값:
   * - DestructorDef: Destructor 정의
   * - undefined: 정의되지 않음
   */
  getDestructor(className: string): DestructorDef | undefined {
    const entry = this.destructors.get(className);
    return entry?.def;
  }

  /**
   * 상속 체인에서 Destructor 해석
   *
   * 루트 클래스부터 현재 클래스까지 순회하면서
   * 첫 번째로 정의된 Destructor 찾기
   *
   * 예: C extends B extends A
   * getInheritanceChain("C") = ["C", "B", "A"]
   * → 역순 = ["A", "B", "C"]
   * → A에서 찾고, 없으면 B, 없으면 C
   */
  resolveDestructor(
    className: string,
    hierarchy: ClassHierarchy
  ): DestructorDef | undefined {
    const chain = hierarchy.getInheritanceChain(className);

    // 루트부터 현재 클래스까지 순회
    for (const cls of [...chain].reverse()) {
      const destructor = this.destructors.get(cls);
      if (destructor) {
        return destructor.def;
      }
    }

    return undefined;
  }

  /**
   * 객체 소멸 (finalize)
   *
   * 단계:
   * 1. 이미 소멸했으면 skip (idempotent)
   * 2. Destructor가 정의되었으면 콜백 실행
   * 3. 모든 필드 정리
   * 4. destroyed 플래그 설정
   * 5. 통계 기록
   */
  finalize(header: ObjectHeader, hierarchy?: ClassHierarchy): void {
    // Step 1: 이미 소멸했으면 skip
    if (header.destroyed) {
      return;
    }

    // Step 2: Destructor 찾기 및 실행
    let destructor: DestructorDef | undefined;

    if (hierarchy) {
      // 상속 체인에서 찾기
      destructor = this.resolveDestructor(header.vPtr, hierarchy);
    } else {
      // 직접 클래스만 찾기
      destructor = this.getDestructor(header.vPtr);
    }

    if (destructor?.onDelete) {
      destructor.onDelete();
      // 통계 기록
      const entry = this.destructors.get(header.vPtr);
      if (entry) {
        entry.callCount++;
      }
    }

    // Step 3: 필드 정리
    header.instanceData.clear();

    // Step 4: 소멸 플래그 설정
    header.destroyed = true;

    // Step 5: 통계
    this.statistics.totalFinalized++;
  }

  /**
   * 다중 클래스 Destructor 순서대로 호출
   * (상속 체인의 모든 Destructor)
   */
  finalizeWithChain(
    header: ObjectHeader,
    hierarchy: ClassHierarchy
  ): void {
    if (header.destroyed) return;

    const chain = hierarchy.getInheritanceChain(header.vPtr);

    // 자식에서 부모 순서로 호출 (후입선출)
    for (const cls of chain) {
      const destructor = this.destructors.get(cls);
      if (destructor?.def.onDelete) {
        destructor.def.onDelete();
        destructor.callCount++;
      }
    }

    // 필드 정리 및 소멸 플래그
    header.instanceData.clear();
    header.destroyed = true;
    this.statistics.totalFinalized++;
  }

  /**
   * 모든 Destructor 조회
   */
  getAllDestructors(): DestructorDef[] {
    return Array.from(this.destructors.values()).map((e) => e.def);
  }

  /**
   * 통계
   */
  getStatistics(): {
    totalRegistered: number;
    totalFinalized: number;
    callCounts: Record<string, number>;
    uptime: number;
  } {
    const callCounts: Record<string, number> = {};
    for (const [className, entry] of this.destructors) {
      callCounts[className] = entry.callCount;
    }

    return {
      totalRegistered: this.statistics.totalRegistered,
      totalFinalized: this.statistics.totalFinalized,
      callCounts,
      uptime: Date.now() - this.statistics.startTime,
    };
  }

  /**
   * 초기화
   */
  clear(): void {
    this.destructors.clear();
    this.statistics = {
      totalRegistered: 0,
      totalFinalized: 0,
      startTime: Date.now(),
    };
  }
}

/**
 * 사용 예시
 *
 * ```typescript
 * const engine = new DestructorEngine();
 * const hierarchy = new ClassHierarchy();
 * const registry = new ClassRegistry();
 *
 * // 1. 상속 구조 설정
 * hierarchy.extend("Derived", "Base");
 *
 * // 2. Destructor 등록
 * engine.register({
 *   className: "Base",
 *   onDelete: () => { console.log("Base 정리"); }
 * });
 * engine.register({
 *   className: "Derived",
 *   onDelete: () => { console.log("Derived 정리"); }
 * });
 *
 * // 3. 객체 생성
 * const header = manager.create("Derived", "derived_1");
 * manager.setField(header, "ID", 100);
 *
 * // 4. 객체 소멸 (단순)
 * engine.finalize(header);
 * // 출력: "Derived 정리"
 * // header.destroyed == true ✅
 *
 * // 5. 객체 소멸 (상속 체인)
 * const header2 = manager.create("Derived", "derived_2");
 * engine.finalizeWithChain(header2, hierarchy);
 * // 출력: "Derived 정리", "Base 정리" (순서대로)
 * // header2.destroyed == true ✅
 *
 * // 6. 통계 확인
 * const stats = engine.getStatistics();
 * // { totalRegistered: 2, totalFinalized: 2, callCounts: {...} }
 * ```
 */

