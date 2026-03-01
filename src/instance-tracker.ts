/**
 * FreeLang v7.5: Instance Tracker & Heap Memory Management
 * 목표: 힙에 할당된 모든 객체 추적
 *
 * 역할:
 * 1. 객체 생성/소멸 기록
 * 2. 메모리 누수 감지
 * 3. 통계 및 보고서 생성
 */

import { ObjectHeader } from './object-header';

/**
 * 인스턴스 레코드
 *
 * 각 객체가 생성/소멸되는 과정을 기록
 */
export interface InstanceRecord {
  instanceId: string;          // 고유 인스턴스 ID ("inst_1")
  className: string;           // 클래스명 ("Derived")
  header: ObjectHeader;        // 객체 헤더 참조
  refCount: number;            // 생성 시점의 refCount
  createdAt: number;           // 생성 시간
  freedAt?: number;            // 해제 시간
  isFreed: boolean;            // 해제되었는가?
}

/**
 * InstanceTracker: 힙 메모리 추적자
 *
 * 역할:
 * 1. 객체 생성 시 trackCreate() 호출
 * 2. 객체 해제 시 trackFree() 호출
 * 3. 메모리 누수 검사: checkMemoryLeak()
 * 4. 통계 조회: getStats()
 */
export class InstanceTracker {
  private instances: Map<string, InstanceRecord> = new Map();
  // "inst_1" → { instanceId, className, header, ... }

  private nextInstanceId = 1;

  private statistics = {
    startTime: Date.now(),
    peakActiveCount: 0,    // 동시 활성 객체 최대치
  };

  /**
   * 객체 생성 추적
   *
   * 호출 시점: NEW 연산자로 객체 생성 직후
   *
   * 반환값: InstanceRecord (통계용)
   */
  trackCreate(className: string, header: ObjectHeader): InstanceRecord {
    const instanceId = `inst_${this.nextInstanceId++}`;

    const record: InstanceRecord = {
      instanceId,
      className,
      header,
      refCount: header.refCount,
      createdAt: header.createdAt,
      isFreed: false,
    };

    this.instances.set(instanceId, record);

    // 통계 업데이트
    const activeCount = this.getActiveCount();
    if (activeCount > this.statistics.peakActiveCount) {
      this.statistics.peakActiveCount = activeCount;
    }

    return record;
  }

  /**
   * 객체 해제 추적
   *
   * 호출 시점: DELETE 또는 refCount=0 시
   */
  trackFree(instanceId: string): void {
    const record = this.instances.get(instanceId);
    if (!record) return;

    record.isFreed = true;
    record.freedAt = Date.now();
  }

  /**
   * 활성 인스턴스 조회 (아직 해제되지 않은 것들)
   */
  getActiveInstances(): InstanceRecord[] {
    return Array.from(this.instances.values()).filter((r) => !r.isFreed);
  }

  /**
   * 모든 인스턴스 조회 (해제된 것 포함)
   */
  getAllInstances(): InstanceRecord[] {
    return Array.from(this.instances.values());
  }

  /**
   * 활성 인스턴스 개수
   */
  getActiveCount(): number {
    return this.getActiveInstances().length;
  }

  /**
   * 클래스별 활성 인스턴스 개수
   */
  getActiveCountByClass(className: string): number {
    return this.getActiveInstances().filter((r) => r.className === className)
      .length;
  }

  /**
   * 클래스별 활성 인스턴스 조회
   */
  getActiveInstancesByClass(className: string): InstanceRecord[] {
    return this.getActiveInstances().filter((r) => r.className === className);
  }

  /**
   * 메모리 누수 검사
   *
   * 반환값: 해제되지 않은 인스턴스 목록
   * 빈 배열 = 메모리 누수 없음 ✅
   */
  checkMemoryLeak(): InstanceRecord[] {
    return this.getActiveInstances();
  }

  /**
   * 특정 인스턴스 조회
   */
  getInstance(instanceId: string): InstanceRecord | undefined {
    return this.instances.get(instanceId);
  }

  /**
   * 통계
   */
  getStats(): {
    totalCreated: number;
    totalFreed: number;
    activeCount: number;
    leakedCount: number;
    peakActiveCount: number;
    uptime: number;
    createdPerSecond: number;
    classSummary: Record<string, { created: number; active: number }>;
  } {
    const all = this.getAllInstances();
    const active = this.getActiveInstances();
    const freed = all.filter((r) => r.isFreed);

    // 클래스별 통계
    const classSummary: Record<string, { created: number; active: number }> =
      {};
    for (const instance of all) {
      if (!classSummary[instance.className]) {
        classSummary[instance.className] = { created: 0, active: 0 };
      }
      classSummary[instance.className].created++;
      if (!instance.isFreed) {
        classSummary[instance.className].active++;
      }
    }

    const uptime = Date.now() - this.statistics.startTime;
    const createdPerSecond =
      uptime > 0 ? (all.length / uptime) * 1000 : 0;

    return {
      totalCreated: all.length,
      totalFreed: freed.length,
      activeCount: active.length,
      leakedCount: active.length, // 메모리 누수 = 해제되지 않은 것
      peakActiveCount: this.statistics.peakActiveCount,
      uptime,
      createdPerSecond,
      classSummary,
    };
  }

  /**
   * 상세 보고서
   */
  generateReport(): {
    summary: {
      totalCreated: number;
      totalFreed: number;
      activeCount: number;
      leakedCount: number;
    };
    leakedInstances: InstanceRecord[];
    timeline: Array<{
      instanceId: string;
      className: string;
      created: string;
      freed?: string;
      lifetime: number;
    }>;
    classSummary: Record<string, { created: number; active: number }>;
  } {
    const all = this.getAllInstances();
    const active = this.getActiveInstances();

    // 클래스별 통계
    const classSummary: Record<string, { created: number; active: number }> =
      {};
    for (const instance of all) {
      if (!classSummary[instance.className]) {
        classSummary[instance.className] = { created: 0, active: 0 };
      }
      classSummary[instance.className].created++;
      if (!instance.isFreed) {
        classSummary[instance.className].active++;
      }
    }

    // 타임라인
    const timeline = all.map((r) => ({
      instanceId: r.instanceId,
      className: r.className,
      created: new Date(r.createdAt).toISOString(),
      freed: r.freedAt ? new Date(r.freedAt).toISOString() : undefined,
      lifetime: r.freedAt ? r.freedAt - r.createdAt : Date.now() - r.createdAt,
    }));

    return {
      summary: {
        totalCreated: all.length,
        totalFreed: all.filter((r) => r.isFreed).length,
        activeCount: active.length,
        leakedCount: active.length,
      },
      leakedInstances: active,
      timeline,
      classSummary,
    };
  }

  /**
   * 초기화
   */
  clear(): void {
    this.instances.clear();
    this.nextInstanceId = 1;
    this.statistics = {
      startTime: Date.now(),
      peakActiveCount: 0,
    };
  }
}

/**
 * 사용 예시
 *
 * ```typescript
 * const tracker = new InstanceTracker();
 * const manager = new ObjectHeaderManager();
 *
 * // 1. 객체 생성
 * const header1 = manager.create("Derived", "derived_1");
 * const record1 = tracker.trackCreate("Derived", header1);
 * // record1.instanceId == "inst_1" ✅
 *
 * // 2. 또 다른 객체 생성
 * const header2 = manager.create("Derived", "derived_2");
 * const record2 = tracker.trackCreate("Derived", header2);
 * // record2.instanceId == "inst_2" ✅
 *
 * // 3. 활성 인스턴스 확인
 * tracker.getActiveCount() == 2 ✅
 * tracker.getActiveCountByClass("Derived") == 2 ✅
 *
 * // 4. 첫 번째 객체 해제
 * tracker.trackFree("inst_1");
 * tracker.getActiveCount() == 1 ✅
 * tracker.checkMemoryLeak().length == 1 ✅
 *
 * // 5. 두 번째 객체도 해제
 * tracker.trackFree("inst_2");
 * tracker.getActiveCount() == 0 ✅
 * tracker.checkMemoryLeak().length == 0 ✅ (메모리 누수 없음!)
 *
 * // 6. 통계 확인
 * const stats = tracker.getStats();
 * // {
 * //   totalCreated: 2,
 * //   totalFreed: 2,
 * //   activeCount: 0,
 * //   leakedCount: 0,
 * //   peakActiveCount: 2,
 * //   ...
 * // }
 * ```
 */

