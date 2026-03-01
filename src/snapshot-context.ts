/**
 * FreeLang v8.2: Register Snapshot & Context Preservation
 * 목표: TRY 진입 순간의 VM 레지스터 상태를 "박제"하고, 예외 발생 시 정확히 복원
 *
 * 스냅샷 프로세스:
 * - SAVE_CONTEXT (TRY 진입): SP/FP/PC + 지역변수 map을 SnapshotContext로 저장
 * - TRY 내부: 스택이 오염되어도 스냅샷은 불변
 * - RESTORE_CONTEXT (exception): 스냅샷에서 SP/FP/PC/locals 복원 (4바이트 오차 없음)
 */

/**
 * 레지스터 스냅샷: TRY 진입 순간의 VM 상태 박제
 *
 * 예:
 * {
 *   snapshotId: "snap_1",
 *   handlerId: "handler_1",
 *   sp: 5,                    // TRY 진입 시 데이터 스택 깊이
 *   fp: 2,                    // TRY 진입 시 함수 프레임 깊이
 *   pc: 1000,                 // CATCH 블록 복귀 주소
 *   capturedLocals: {"x": 10, "y": 20},  // TRY 진입 시점 지역변수
 *   capturedAt: 1771781061000,
 *   depth: 0                  // 중첩 깊이 (0 = 최상단, 1 = 1단계 중첩)
 * }
 */
export interface SnapshotContext {
  snapshotId: string;         // 고유 스냅샷 ID ("snap_1", "snap_2", ...)
  handlerId: string;          // 연결된 핸들러 ("handler_1") - handler-stack.ts와 연결
  sp: number;                 // SP: 데이터 스택 최상단 위치 (TRY 진입 시점)
  fp: number;                 // FP: 함수 프레임 기준점 (TRY 진입 시점)
  pc: number;                 // PC: CATCH 블록 바이트코드 주소 (복귀 대상)
  capturedLocals: Map<string, any>;  // 지역 변수 스냅샷 (TRY 진입 시점)
  capturedAt: number;         // 캡처 타임스탬프
  depth: number;              // 중첩 깊이 (Nested Safety: 같은 레벨에서 독립적)
}

/**
 * SnapshotManager: 컨텍스트 스냅샷 관리
 *
 * 역할:
 * 1. SAVE_CONTEXT: TRY 진입 시 VM 상태 박제 (SP/FP/PC/locals)
 * 2. RESTORE_CONTEXT: 예외 발생 시 스냅샷에서 복원
 * 3. Nested Safety: 중첩 TRY마다 독립적인 스냅샷 유지
 * 4. SP Integrity Check: 스택 오염 감지 (savedSP != currentSP)
 *
 * 예:
 * const manager = new SnapshotManager();
 *
 * // 1. TRY 진입 시 스냅샷 저장
 * const snap = manager.saveContext("handler_1", 5, 2, 1000, new Map([["x", 10]]));
 * // snap.snapshotId = "snap_1", sp = 5 (불변!)
 *
 * // 2. TRY 내부 스택 오염 (SP = 5 → 8)
 * const currentSP = 8;
 * expect(manager.verifySPIntegrity(snap.snapshotId, currentSP)).toBe(true);
 * // 오염이 감지됨 (savedSP=5 != currentSP=8)
 *
 * // 3. 예외 발생 → 복원
 * const restored = manager.restoreContext(snap.snapshotId);
 * expect(restored?.sp).toBe(5);  // 원상 복구!
 */
export class SnapshotManager {
  private snapshots: Map<string, SnapshotContext> = new Map();
  // snapshotId → SnapshotContext 맵

  private snapshotStack: string[] = [];
  // 중첩 TRY 순서 추적 (아래에서 위로: index 0 = 가장 먼저 저장)

  private nextId = 0;

  private statistics = {
    totalSaved: 0,
    totalRestored: 0,
    totalReleased: 0,
    maxDepth: 0,
  };

  /**
   * SAVE_CONTEXT: TRY 진입 시 호출
   * 현재 VM 상태를 스냅샷으로 저장
   *
   * @param handlerId - 연결된 핸들러 ID ("handler_1")
   * @param sp - 데이터 스택 깊이 (TRY 진입 시점)
   * @param fp - 함수 프레임 깊이 (TRY 진입 시점)
   * @param pc - CATCH 블록 바이트코드 주소
   * @param locals - 지역 변수 map (선택)
   * @returns 저장된 SnapshotContext
   */
  saveContext(
    handlerId: string,
    sp: number,
    fp: number,
    pc: number,
    locals?: Map<string, any>
  ): SnapshotContext {
    const snapshotId = `snap_${++this.nextId}`;

    const ctx: SnapshotContext = {
      snapshotId,
      handlerId,
      sp,          // ← 불변! TRY 진입 시점의 값
      fp,          // ← 불변! TRY 진입 시점의 값
      pc,          // ← 불변! CATCH 복귀 주소
      capturedLocals: new Map(locals ?? []),  // 깊은 복사 (독립성 보장)
      capturedAt: Date.now(),
      depth: this.snapshotStack.length,  // 중첩 깊이
    };

    this.snapshots.set(snapshotId, ctx);
    this.snapshotStack.push(snapshotId);
    this.statistics.totalSaved++;

    if (this.snapshotStack.length > this.statistics.maxDepth) {
      this.statistics.maxDepth = this.snapshotStack.length;
    }

    return ctx;
  }

  /**
   * RESTORE_CONTEXT: 예외 발생 시 호출
   * 스냅샷에서 SP/FP/PC/locals를 복원
   *
   * @param snapshotId - 복원할 스냅샷 ID
   * @returns {sp, fp, pc, locals} 또는 null (not found)
   */
  restoreContext(snapshotId: string): {
    sp: number;
    fp: number;
    pc: number;
    locals: Map<string, any>;
  } | null {
    const ctx = this.snapshots.get(snapshotId);
    if (!ctx) return null;

    this.statistics.totalRestored++;

    return {
      sp: ctx.sp,  // 원상 복구
      fp: ctx.fp,  // 원상 복구
      pc: ctx.pc,  // 원상 복구
      locals: new Map(ctx.capturedLocals),  // 독립 복사본 반환
    };
  }

  /**
   * 현재 활성 스냅샷 (스택 최상단)
   * 중첩 TRY의 가장 최근 스냅샷
   */
  getCurrentSnapshot(): SnapshotContext | undefined {
    if (this.snapshotStack.length === 0) return undefined;
    const id = this.snapshotStack[this.snapshotStack.length - 1];
    return this.snapshots.get(id);
  }

  /**
   * 스냅샷 제거 (TRY 정상 종료 시)
   * 스택에서 제거하고 map도 정리
   *
   * @param snapshotId - 제거할 스냅샷 ID
   * @returns 성공 여부
   */
  releaseSnapshot(snapshotId: string): boolean {
    const ctx = this.snapshots.get(snapshotId);
    if (!ctx) return false;

    // 스택에서 제거
    const idx = this.snapshotStack.lastIndexOf(snapshotId);
    if (idx >= 0) {
      this.snapshotStack.splice(idx, 1);
    }

    // map에서 제거
    this.snapshots.delete(snapshotId);
    this.statistics.totalReleased++;

    return true;
  }

  /**
   * SP Integrity 검증: 스택 오염 감지
   *
   * TRY 진입 시 savedSP = 5라고 해도,
   * TRY 내부에서 PUSH 100,200,300을 하면 currentSP = 8이 됨.
   * 이 메서드는 savedSP != currentSP를 감지.
   *
   * @param snapshotId - 스냅샷 ID
   * @param currentSP - 현재 스택 깊이
   * @returns true (오염 감지됨), false (정상)
   */
  verifySPIntegrity(snapshotId: string, currentSP: number): boolean {
    const ctx = this.snapshots.get(snapshotId);
    if (!ctx) return false;

    // savedSP와 currentSP가 다르면 오염이 발생했음
    return ctx.sp !== currentSP;
  }

  /**
   * 특정 스냅샷의 저장된 SP와 현재 SP가 다른지 확인
   * (verifySPIntegrity의 다른 이름)
   */
  isSPContaminated(snapshotId: string, currentSP: number): boolean {
    return this.verifySPIntegrity(snapshotId, currentSP);
  }

  /**
   * 모든 활성 스냅샷 조회 (스택 순서)
   */
  getSnapshot(): SnapshotContext[] {
    return this.snapshotStack
      .map((id) => this.snapshots.get(id))
      .filter((ctx) => ctx !== undefined) as SnapshotContext[];
  }

  /**
   * 현재 스냅샷 깊이
   */
  getSnapshotDepth(): number {
    return this.snapshotStack.length;
  }

  /**
   * 특정 깊이의 스냅샷 조회
   */
  getSnapshotAtDepth(depth: number): SnapshotContext | undefined {
    if (depth < 0 || depth >= this.snapshotStack.length) return undefined;
    const id = this.snapshotStack[depth];
    return this.snapshots.get(id);
  }

  /**
   * 통계
   */
  getStatistics(): {
    totalSaved: number;
    totalRestored: number;
    totalReleased: number;
    maxDepth: number;
    currentDepth: number;
  } {
    return {
      ...this.statistics,
      currentDepth: this.snapshotStack.length,
    };
  }

  /**
   * 전체 상태 초기화
   */
  clear(): void {
    this.snapshots.clear();
    this.snapshotStack = [];
    this.nextId = 0;
    this.statistics = {
      totalSaved: 0,
      totalRestored: 0,
      totalReleased: 0,
      maxDepth: 0,
    };
  }
}

/**
 * 사용 예시 (TC_V8_2_SNAPSHOT_INTEGRITY)
 *
 * ```typescript
 * const manager = new SnapshotManager();
 *
 * // 1. 초기 SP = 5
 * const initialSP = 5;
 *
 * // 2. TRY 진입 → SAVE_CONTEXT
 * const ctx = manager.saveContext("handler_1", initialSP, 2, 1000);
 * expect(ctx.sp).toBe(initialSP);  // 5
 *
 * // 3. TRY 내부 스택 오염: SP = 5 → 8 (PUSH 100,200,300)
 * let currentSP = initialSP;
 * currentSP += 3;  // SP = 8
 *
 * // 4. 핵심 검증
 * expect(ctx.sp).toBe(5);              // 스냅샷은 불변 ✅
 * expect(ctx.sp).not.toBe(currentSP);  // 오염 감지 (5 != 8) ✅
 * expect(manager.verifySPIntegrity(ctx.snapshotId, currentSP)).toBe(true);
 *
 * // 5. 복원
 * const restored = manager.restoreContext(ctx.snapshotId);
 * expect(restored?.sp).toBe(initialSP);  // 5로 복원 ✅
 *
 * // 6. 통계
 * const stats = manager.getStatistics();
 * expect(stats.totalSaved).toBe(1);
 * expect(stats.totalRestored).toBe(1);
 * ```
 */
