// FreeLang v6: Heap Manager (New Memory Model)
// 모든 값이 HeapObject 기반으로 통일

/**
 * HeapObject: 모든 Freelang 값의 기초 단위
 */
export interface HeapObject {
  id: number              // 고유 ID
  typeId: number          // 타입 ID
  refCount: number        // 참조 계수
  gcMark: boolean         // GC 마크 (향후 사용)
  flags: number           // 추가 플래그
  payload: any            // 실제 데이터
  createdAt: number       // 생성 시간 (추적용)
}

/**
 * TypeInfo: 타입 정보 테이블
 */
export interface TypeInfo {
  id: number
  name: string
  size: number           // 대략적 크기 (바이트)
  isPrimitive: boolean
}

/**
 * 타입 ID 상수
 */
export const TYPE_ID = {
  NUM: 1,
  STR: 2,
  BOOL: 3,
  NULL: 4,
  ARRAY: 5,
  OBJECT: 6,
  FN: 7,
  BUILTIN: 8,
  ITER: 9,
  PTR: 10,
} as const;

/**
 * HeapManager: 모든 메모리 할당/해제 관리
 */
export class HeapManager {
  private objects: Map<number, HeapObject> = new Map();
  private nextId: number = 1;
  private typeTable: Map<number, TypeInfo> = new Map();
  private stats = {
    totalAllocated: 0,
    totalFreed: 0,
    currentObjects: 0,
  };

  constructor() {
    this.initializeTypeTable();
  }

  /**
   * TypeTable 초기화
   */
  private initializeTypeTable(): void {
    const types: TypeInfo[] = [
      { id: TYPE_ID.NUM, name: "number", size: 8, isPrimitive: true },
      { id: TYPE_ID.STR, name: "string", size: -1, isPrimitive: true },
      { id: TYPE_ID.BOOL, name: "boolean", size: 1, isPrimitive: true },
      { id: TYPE_ID.NULL, name: "null", size: 0, isPrimitive: true },
      { id: TYPE_ID.ARRAY, name: "array", size: -1, isPrimitive: false },
      { id: TYPE_ID.OBJECT, name: "object", size: -1, isPrimitive: false },
      { id: TYPE_ID.FN, name: "function", size: -1, isPrimitive: false },
      { id: TYPE_ID.BUILTIN, name: "builtin", size: 8, isPrimitive: false },
      { id: TYPE_ID.ITER, name: "iterator", size: -1, isPrimitive: false },
      { id: TYPE_ID.PTR, name: "pointer", size: 8, isPrimitive: false },
    ];

    types.forEach(type => this.typeTable.set(type.id, type));
  }

  /**
   * 새로운 HeapObject 할당
   */
  public allocate(typeId: number, payload: any): number {
    const id = this.nextId++;
    const obj: HeapObject = {
      id,
      typeId,
      refCount: 1,
      gcMark: false,
      flags: 0,
      payload,
      createdAt: Date.now(),
    };

    this.objects.set(id, obj);
    this.stats.totalAllocated++;
    this.stats.currentObjects++;

    return id;
  }

  /**
   * HeapObject 접근
   */
  public get(ptr: number): HeapObject | null {
    const obj = this.objects.get(ptr);
    if (!obj) {
      console.error(`[HeapManager] Invalid pointer: ${ptr}`);
      return null;
    }
    return obj;
  }

  /**
   * HeapObject 수정 (업데이트)
   */
  public set(ptr: number, obj: Partial<HeapObject>): void {
    const existing = this.objects.get(ptr);
    if (!existing) {
      console.error(`[HeapManager] Invalid pointer for set: ${ptr}`);
      return;
    }

    Object.assign(existing, obj);
  }

  /**
   * 메모리 해제
   */
  public free(ptr: number): void {
    const obj = this.objects.get(ptr);
    if (!obj) {
      console.error(`[HeapManager] Free on invalid pointer: ${ptr}`);
      return;
    }

    this.objects.delete(ptr);
    this.stats.totalFreed++;
    this.stats.currentObjects--;
  }

  /**
   * 참조 계수 증가
   */
  public incrementRefCount(ptr: number): void {
    const obj = this.objects.get(ptr);
    if (!obj) {
      console.error(`[HeapManager] RefCount++ on invalid pointer: ${ptr}`);
      return;
    }
    obj.refCount++;
  }

  /**
   * 참조 계수 감소 (0이 되면 해제)
   */
  public decrementRefCount(ptr: number): void {
    const obj = this.objects.get(ptr);
    if (!obj) {
      console.error(`[HeapManager] RefCount-- on invalid pointer: ${ptr}`);
      return;
    }

    obj.refCount--;
    if (obj.refCount <= 0) {
      this.free(ptr);
    }
  }

  /**
   * 참조 계수 조회
   */
  public getRefCount(ptr: number): number {
    const obj = this.objects.get(ptr);
    return obj ? obj.refCount : -1;
  }

  /**
   * 포인터 유효성 확인
   */
  public isValid(ptr: number): boolean {
    return this.objects.has(ptr);
  }

  /**
   * GC 마크 설정
   */
  public setGCMark(ptr: number, mark: boolean): void {
    const obj = this.objects.get(ptr);
    if (obj) {
      obj.gcMark = mark;
    }
  }

  /**
   * 통계
   */
  public getStats(): {
    totalAllocated: number;
    totalFreed: number;
    currentObjects: number;
    peakObjects: number;
  } {
    return {
      ...this.stats,
      peakObjects: this.stats.totalAllocated - this.stats.totalFreed,
    };
  }

  /**
   * 디버그: 모든 객체 출력
   */
  public debugDump(): void {
    console.log(`[HeapManager] ${this.stats.currentObjects} objects alive`);
    this.objects.forEach((obj, id) => {
      const type = this.typeTable.get(obj.typeId);
      const typeName = type ? type.name : "unknown";
      console.log(
        `  [${id}] ${typeName} (refCount=${obj.refCount}, payload=${JSON.stringify(obj.payload).substring(0, 30)}...)`
      );
    });
  }

  /**
   * 메모리 누수 검사 (간단한 버전)
   */
  public checkLeaks(): { leakedCount: number; totalSize: number } {
    let leakedCount = 0;
    let totalSize = 0;

    this.objects.forEach(obj => {
      if (obj.refCount > 0) {
        leakedCount++;
        const type = this.typeTable.get(obj.typeId);
        totalSize += type?.size || 0;
      }
    });

    return { leakedCount, totalSize };
  }

  /**
   * 모든 객체 명시적 해제 (테스트용)
   */
  public clear(): void {
    this.objects.clear();
    this.stats = {
      totalAllocated: 0,
      totalFreed: 0,
      currentObjects: 0,
    };
  }
}
