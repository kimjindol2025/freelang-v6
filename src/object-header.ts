/**
 * FreeLang v7.5: Object Header & Reference Counting
 * 목표: 객체 메모리 레이아웃 + 참조 카운팅 기초
 *
 * 객체 메모리 구조:
 * Offset 0: vPtr (vTable 주소, 클래스명)
 * Offset 4: RefCount (참조 횟수)
 * Offset 8: classId (클래스 고유 ID)
 * Offset 12: destroyed (소멸 플래그)
 * Offset 16: createdAt (생성 시간)
 * Offset 24: instanceData (필드 데이터)
 */

/**
 * 객체 헤더 인터페이스
 * 모든 v7 객체의 메타데이터 포함
 */
export interface ObjectHeader {
  vPtr: string;                        // vTable 주소 (= 클래스명)
  refCount: number;                    // 참조 카운트 (초기값: 1)
  classId: string;                     // 클래스 고유 ID
  destroyed: boolean;                  // 소멸 플래그
  createdAt: number;                   // 생성 시간 (타임스탐프)
  instanceData: Map<string, any>;      // 필드 데이터
}

/**
 * 객체 헤더 관리자
 *
 * 역할:
 * 1. 객체 헤더 생성 (초기값 설정)
 * 2. 참조 카운트 관리 (증가/감소)
 * 3. 필드 접근 (get/set)
 * 4. 객체 소멸 상태 추적
 */
export class ObjectHeaderManager {
  /**
   * 객체 헤더 생성
   *
   * 초기값:
   * - refCount: 1 (생성 시점에 하나의 참조 = 객체 자체)
   * - destroyed: false
   * - createdAt: 현재 시간
   * - instanceData: 빈 Map
   */
  create(className: string, classId: string): ObjectHeader {
    return {
      vPtr: className,
      refCount: 1,
      classId,
      destroyed: false,
      createdAt: Date.now(),
      instanceData: new Map(),
    };
  }

  /**
   * 참조 카운트 증가
   *
   * 상황:
   * - 변수 대입 시 (obj2 = obj1)
   * - 메서드 인자 전달 시 (foo(obj))
   * - 배열/컬렉션 추가 시
   */
  incrementRef(header: ObjectHeader): void {
    if (header.destroyed) {
      throw new Error(
        `[RefCount Error] Use-After-Free: 소멸한 객체 ${header.classId}에 새로운 참조를 추가할 수 없습니다`
      );
    }
    header.refCount++;
  }

  /**
   * 참조 카운트 감소
   *
   * 반환값:
   * - true: refCount가 0이 되었음 → 즉시 메모리 해제 필요
   * - false: 여전히 다른 참조가 있음 → 아직 살아있음
   */
  decrementRef(header: ObjectHeader): boolean {
    header.refCount--;
    return header.refCount === 0; // true = 완전히 해제 가능
  }

  /**
   * 필드 저장
   */
  setField(header: ObjectHeader, fieldName: string, value: any): void {
    if (header.destroyed) {
      throw new Error(
        `[Field Access Error] 소멸한 객체에 필드를 설정할 수 없습니다: ${fieldName}`
      );
    }
    header.instanceData.set(fieldName, value);
  }

  /**
   * 필드 조회
   */
  getField(header: ObjectHeader, fieldName: string): any {
    if (header.destroyed) {
      throw new Error(
        `[Field Access Error] 소멸한 객체에서 필드를 읽을 수 없습니다: ${fieldName}`
      );
    }
    return header.instanceData.get(fieldName);
  }

  /**
   * 필드 존재 여부 확인
   */
  hasField(header: ObjectHeader, fieldName: string): boolean {
    return header.instanceData.has(fieldName);
  }

  /**
   * 모든 필드명 조회
   */
  getAllFieldNames(header: ObjectHeader): string[] {
    return Array.from(header.instanceData.keys());
  }

  /**
   * 필드 개수
   */
  getFieldCount(header: ObjectHeader): number {
    return header.instanceData.size;
  }

  /**
   * 모든 필드 정리
   * (소멸자 호출 시 사용)
   */
  clearAllFields(header: ObjectHeader): void {
    header.instanceData.clear();
  }

  /**
   * 객체 정보 요약
   */
  getSummary(header: ObjectHeader): {
    className: string;
    classId: string;
    refCount: number;
    destroyed: boolean;
    fieldCount: number;
    createdAt: string;
  } {
    return {
      className: header.vPtr,
      classId: header.classId,
      refCount: header.refCount,
      destroyed: header.destroyed,
      fieldCount: header.instanceData.size,
      createdAt: new Date(header.createdAt).toISOString(),
    };
  }
}

/**
 * 사용 예시
 *
 * ```typescript
 * const manager = new ObjectHeaderManager();
 *
 * // 1. 객체 헤더 생성
 * const header = manager.create("Derived", "derived_1");
 * // { vPtr: "Derived", refCount: 1, destroyed: false, ... }
 *
 * // 2. 필드 저장
 * manager.setField(header, "ID", 100);
 * manager.setField(header, "Secret", 999);
 *
 * // 3. 필드 조회
 * const id = manager.getField(header, "ID");  // 100
 *
 * // 4. 참조 증가 (변수 대입)
 * const obj2 = header;
 * manager.incrementRef(header);  // refCount: 1 → 2
 *
 * // 5. 참조 감소 (변수 해제)
 * const shouldDelete = manager.decrementRef(header);  // false (아직 살아있음)
 * shouldDelete = manager.decrementRef(header);  // true (완전히 해제)
 *
 * // 6. 소멸 전 필드 정리
 * manager.clearAllFields(header);
 * header.destroyed = true;
 * ```
 */

