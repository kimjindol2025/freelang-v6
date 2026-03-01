/**
 * FreeLang v8.2: Register Snapshot & Context Preservation Tests
 * 총 60개 테스트 = 3 Phase × 20 tests
 *
 * Phase 1: SnapshotContext 구조 (20 tests)
 *          → 필드 정확성, 독립성, 중첩 깊이
 *
 * Phase 2: SAVE/RESTORE 동작 (20 tests)
 *          → 저장, 복원, verifySPIntegrity, 스택 관리
 *
 * Phase 3: TC_V8_2_SNAPSHOT_INTEGRITY 통합 (20 tests)
 *          → SP Consistency, Frame Locking, Nested Safety
 */

import { SnapshotContext, SnapshotManager } from '../src/snapshot-context';

describe('Phase 1: SnapshotContext 구조 (20 tests)', () => {
  let manager: SnapshotManager;

  beforeEach(() => {
    manager = new SnapshotManager();
  });

  test('1-1: SnapshotManager 생성', () => {
    expect(manager).toBeDefined();
    expect(manager.getStatistics().currentDepth).toBe(0);
  });

  test('1-2: saveContext() → SnapshotContext 반환', () => {
    const ctx = manager.saveContext('handler_1', 5, 2, 1000);
    expect(ctx).toBeDefined();
    expect(ctx.snapshotId).toBeTruthy();
    expect(ctx.handlerId).toBe('handler_1');
  });

  test('1-3: ctx.snapshotId = "snap_1"', () => {
    const ctx = manager.saveContext('handler_1', 5, 2, 1000);
    expect(ctx.snapshotId).toBe('snap_1');
  });

  test('1-4: ctx.sp 정확성', () => {
    const ctx = manager.saveContext('handler_1', 5, 2, 1000);
    expect(ctx.sp).toBe(5);
  });

  test('1-5: ctx.fp 정확성', () => {
    const ctx = manager.saveContext('handler_1', 5, 2, 1000);
    expect(ctx.fp).toBe(2);
  });

  test('1-6: ctx.pc 정확성', () => {
    const ctx = manager.saveContext('handler_1', 5, 2, 1000);
    expect(ctx.pc).toBe(1000);
  });

  test('1-7: ctx.capturedAt > 0', () => {
    const ctx = manager.saveContext('handler_1', 5, 2, 1000);
    expect(ctx.capturedAt).toBeGreaterThan(0);
  });

  test('1-8: ctx.capturedLocals 스냅샷', () => {
    const locals = new Map([['x', 10], ['y', 20]]);
    const ctx = manager.saveContext('handler_1', 5, 2, 1000, locals);
    expect(ctx.capturedLocals.get('x')).toBe(10);
    expect(ctx.capturedLocals.get('y')).toBe(20);
  });

  test('1-9: ctx.depth = 0 (최초)', () => {
    const ctx = manager.saveContext('handler_1', 5, 2, 1000);
    expect(ctx.depth).toBe(0);
  });

  test('1-10: 두 번째 saveContext → snapshotId = "snap_2"', () => {
    manager.saveContext('handler_1', 5, 2, 1000);
    const ctx2 = manager.saveContext('handler_2', 7, 3, 2000);
    expect(ctx2.snapshotId).toBe('snap_2');
  });

  test('1-11: ctx.handlerId 연결 검증', () => {
    const ctx = manager.saveContext('handler_99', 5, 2, 1000);
    expect(ctx.handlerId).toBe('handler_99');
  });

  test('1-12: locals 독립 복사 (원본 변경에도 스냅샷 유지)', () => {
    const locals = new Map([['x', 10]]);
    const ctx = manager.saveContext('handler_1', 5, 2, 1000, locals);

    // 원본 변경
    locals.set('x', 999);

    // 스냅샷은 불변
    expect(ctx.capturedLocals.get('x')).toBe(10);  // 원래 값 유지
  });

  test('1-13: 필드 독립성 - sp, fp, pc 모두 독립', () => {
    const ctx1 = manager.saveContext('handler_1', 5, 2, 1000);
    const ctx2 = manager.saveContext('handler_2', 10, 4, 2000);

    expect(ctx1.sp).toBe(5);
    expect(ctx2.sp).toBe(10);
    expect(ctx1.fp).toBe(2);
    expect(ctx2.fp).toBe(4);
    expect(ctx1.pc).toBe(1000);
    expect(ctx2.pc).toBe(2000);
  });

  test('1-14: 중첩 depth 검증', () => {
    const ctx1 = manager.saveContext('handler_1', 5, 2, 1000);
    expect(ctx1.depth).toBe(0);

    const ctx2 = manager.saveContext('handler_2', 7, 3, 2000);
    expect(ctx2.depth).toBe(1);

    const ctx3 = manager.saveContext('handler_3', 9, 5, 3000);
    expect(ctx3.depth).toBe(2);
  });

  test('1-15: capturedAt는 타임스탬프', () => {
    const before = Date.now();
    const ctx = manager.saveContext('handler_1', 5, 2, 1000);
    const after = Date.now();

    expect(ctx.capturedAt).toBeGreaterThanOrEqual(before);
    expect(ctx.capturedAt).toBeLessThanOrEqual(after);
  });

  test('1-16: 빈 locals map도 저장 가능', () => {
    const ctx = manager.saveContext('handler_1', 5, 2, 1000, new Map());
    expect(ctx.capturedLocals.size).toBe(0);
  });

  test('1-17: locals 미지정 시 빈 map', () => {
    const ctx = manager.saveContext('handler_1', 5, 2, 1000);
    expect(ctx.capturedLocals.size).toBe(0);
  });

  test('1-18: 여러 locals 저장', () => {
    const locals = new Map<string, any>([
      ['x', 10],
      ['y', 'hello'],
      ['z', true],
      ['obj', { a: 1 }],
    ]);
    const ctx = manager.saveContext('handler_1', 5, 2, 1000, locals);
    expect(ctx.capturedLocals.size).toBe(4);
    expect(ctx.capturedLocals.get('y')).toBe('hello');
    expect(ctx.capturedLocals.get('z')).toBe(true);
  });

  test('1-19: 0 값도 올바르게 저장', () => {
    const ctx = manager.saveContext('handler_1', 0, 0, 0);
    expect(ctx.sp).toBe(0);
    expect(ctx.fp).toBe(0);
    expect(ctx.pc).toBe(0);
  });

  test('1-20: ✅ SNAPSHOT_CONTEXT_COMPLETE', () => {
    const ctx1 = manager.saveContext('handler_1', 5, 2, 1000, new Map([['x', 10]]));
    const ctx2 = manager.saveContext('handler_2', 10, 4, 2000, new Map([['y', 20]]));

    expect(manager.getStatistics().totalSaved).toBe(2);
    expect(ctx1.depth).toBe(0);
    expect(ctx2.depth).toBe(1);
    expect(ctx1.sp).toBe(5);
    expect(ctx2.sp).toBe(10);
  });
});

describe('Phase 2: SAVE/RESTORE 동작 (20 tests)', () => {
  let manager: SnapshotManager;

  beforeEach(() => {
    manager = new SnapshotManager();
  });

  test('2-1: 초기 getCurrentSnapshot() = undefined', () => {
    expect(manager.getCurrentSnapshot()).toBeUndefined();
  });

  test('2-2: saveContext 후 getCurrentSnapshot() 반환', () => {
    const saved = manager.saveContext('handler_1', 5, 2, 1000);
    const current = manager.getCurrentSnapshot();
    expect(current).toBe(saved);
  });

  test('2-3: restoreContext() → {sp, fp, pc, locals} 반환', () => {
    const saved = manager.saveContext('handler_1', 5, 2, 1000, new Map([['x', 10]]));
    const restored = manager.restoreContext(saved.snapshotId);

    expect(restored).toBeDefined();
    expect(restored?.sp).toBe(5);
    expect(restored?.fp).toBe(2);
    expect(restored?.pc).toBe(1000);
    expect(restored?.locals.get('x')).toBe(10);
  });

  test('2-4: restoreContext sp 정확성', () => {
    const saved = manager.saveContext('handler_1', 42, 2, 1000);
    const restored = manager.restoreContext(saved.snapshotId);
    expect(restored?.sp).toBe(42);
  });

  test('2-5: restoreContext fp 정확성', () => {
    const saved = manager.saveContext('handler_1', 5, 99, 1000);
    const restored = manager.restoreContext(saved.snapshotId);
    expect(restored?.fp).toBe(99);
  });

  test('2-6: restoreContext pc 정확성', () => {
    const saved = manager.saveContext('handler_1', 5, 2, 9999);
    const restored = manager.restoreContext(saved.snapshotId);
    expect(restored?.pc).toBe(9999);
  });

  test('2-7: 없는 snapshotId → null', () => {
    const restored = manager.restoreContext('snap_999');
    expect(restored).toBeNull();
  });

  test('2-8: releaseSnapshot() 후 스택에서 제거', () => {
    const saved = manager.saveContext('handler_1', 5, 2, 1000);
    expect(manager.getSnapshotDepth()).toBe(1);

    manager.releaseSnapshot(saved.snapshotId);
    expect(manager.getSnapshotDepth()).toBe(0);
    expect(manager.getCurrentSnapshot()).toBeUndefined();
  });

  test('2-9: verifySPIntegrity(savedSP == currentSP) → false (정상)', () => {
    const saved = manager.saveContext('handler_1', 5, 2, 1000);
    const isContaminated = manager.verifySPIntegrity(saved.snapshotId, 5);
    expect(isContaminated).toBe(false);  // 정상
  });

  test('2-10: verifySPIntegrity(savedSP != currentSP) → true (오염)', () => {
    const saved = manager.saveContext('handler_1', 5, 2, 1000);
    const isContaminated = manager.verifySPIntegrity(saved.snapshotId, 8);
    expect(isContaminated).toBe(true);  // 오염 감지
  });

  test('2-11: 중첩 save/restore - 각 스냅샷 독립', () => {
    const snap1 = manager.saveContext('handler_1', 5, 2, 1000);
    const snap2 = manager.saveContext('handler_2', 10, 4, 2000);

    const rest1 = manager.restoreContext(snap1.snapshotId);
    const rest2 = manager.restoreContext(snap2.snapshotId);

    expect(rest1?.sp).toBe(5);
    expect(rest2?.sp).toBe(10);
  });

  test('2-12: releaseSnapshot 반환값 (성공)', () => {
    const saved = manager.saveContext('handler_1', 5, 2, 1000);
    const result = manager.releaseSnapshot(saved.snapshotId);
    expect(result).toBe(true);
  });

  test('2-13: releaseSnapshot 반환값 (실패)', () => {
    const result = manager.releaseSnapshot('snap_999');
    expect(result).toBe(false);
  });

  test('2-14: locals 독립성 - restore 후 수정해도 원본 유지', () => {
    const locals = new Map([['x', 10]]);
    const saved = manager.saveContext('handler_1', 5, 2, 1000, locals);

    const restored = manager.restoreContext(saved.snapshotId);
    restored!.locals.set('x', 999);

    // 원본 스냅샷은 유지
    const restored2 = manager.restoreContext(saved.snapshotId);
    expect(restored2?.locals.get('x')).toBe(10);
  });

  test('2-15: getCurrentSnapshot 중첩 확인', () => {
    const snap1 = manager.saveContext('handler_1', 5, 2, 1000);
    const snap2 = manager.saveContext('handler_2', 10, 4, 2000);

    const current = manager.getCurrentSnapshot();
    expect(current?.snapshotId).toBe(snap2.snapshotId);  // 최상단 = snap2
  });

  test('2-16: 통계 - totalSaved 카운트', () => {
    manager.saveContext('handler_1', 5, 2, 1000);
    manager.saveContext('handler_2', 10, 4, 2000);

    const stats = manager.getStatistics();
    expect(stats.totalSaved).toBe(2);
  });

  test('2-17: 통계 - totalRestored 카운트', () => {
    const snap1 = manager.saveContext('handler_1', 5, 2, 1000);
    const snap2 = manager.saveContext('handler_2', 10, 4, 2000);

    manager.restoreContext(snap1.snapshotId);
    manager.restoreContext(snap2.snapshotId);

    const stats = manager.getStatistics();
    expect(stats.totalRestored).toBe(2);
  });

  test('2-18: 통계 - totalReleased 카운트', () => {
    const snap1 = manager.saveContext('handler_1', 5, 2, 1000);
    const snap2 = manager.saveContext('handler_2', 10, 4, 2000);

    manager.releaseSnapshot(snap1.snapshotId);
    manager.releaseSnapshot(snap2.snapshotId);

    const stats = manager.getStatistics();
    expect(stats.totalReleased).toBe(2);
  });

  test('2-19: 통계 - maxDepth 기록', () => {
    manager.saveContext('handler_1', 5, 2, 1000);
    manager.saveContext('handler_2', 10, 4, 2000);
    manager.saveContext('handler_3', 15, 6, 3000);

    const stats = manager.getStatistics();
    expect(stats.maxDepth).toBe(3);
  });

  test('2-20: ✅ SAVE_RESTORE_COMPLETE', () => {
    const snap1 = manager.saveContext('handler_1', 5, 2, 1000, new Map([['x', 10]]));
    const snap2 = manager.saveContext('handler_2', 10, 4, 2000, new Map([['y', 20]]));

    const rest1 = manager.restoreContext(snap1.snapshotId);
    const rest2 = manager.restoreContext(snap2.snapshotId);

    expect(rest1?.sp).toBe(5);
    expect(rest1?.locals.get('x')).toBe(10);
    expect(rest2?.sp).toBe(10);
    expect(rest2?.locals.get('y')).toBe(20);

    const stats = manager.getStatistics();
    expect(stats.totalSaved).toBe(2);
    expect(stats.totalRestored).toBe(2);
  });
});

describe('Phase 3: TC_V8_2_SNAPSHOT_INTEGRITY 통합 (20 tests)', () => {
  let manager: SnapshotManager;

  beforeEach(() => {
    manager = new SnapshotManager();
  });

  test('3-1: 초기 상태 확인', () => {
    expect(manager.getSnapshotDepth()).toBe(0);
    expect(manager.getCurrentSnapshot()).toBeUndefined();
  });

  test('3-2: saveContext 호출', () => {
    const ctx = manager.saveContext('handler_1', 5, 2, 1000);
    expect(ctx).toBeDefined();
    expect(manager.getSnapshotDepth()).toBe(1);
  });

  test('3-3: 스택 오염 시뮬레이션', () => {
    const initialSP = 5;
    manager.saveContext('handler_1', initialSP, 2, 1000);

    let currentSP = initialSP;
    currentSP += 3;  // PUSH 100, 200, 300

    expect(currentSP).toBe(8);
  });

  test('3-4: TC_V8_2 핵심 - savedSP == initialSP (스냅샷 불변)', () => {
    const initialSP = 5;
    const ctx = manager.saveContext('handler_1', initialSP, 2, 1000);

    expect(ctx.sp).toBe(initialSP);  // 스냅샷은 초기값 유지
  });

  test('3-5: TC_V8_2 핵심 - savedSP != currentSP (오염 감지)', () => {
    const initialSP = 5;
    const ctx = manager.saveContext('handler_1', initialSP, 2, 1000);

    let currentSP = initialSP;
    currentSP += 3;  // 스택 오염

    expect(ctx.sp).not.toBe(currentSP);  // 5 != 8
  });

  test('3-6: TC_V8_2_SNAPSHOT_INTEGRITY 완전 검증', () => {
    const initialSP = 5;
    const ctx = manager.saveContext('handler_1', initialSP, 2, 1000);

    let currentSP = initialSP;
    currentSP += 3;

    // 핵심 3가지 검증
    expect(ctx.sp).toBe(5);                    // 불변 ✅
    expect(ctx.sp).not.toBe(currentSP);       // 오염 감지 ✅
    expect(manager.verifySPIntegrity(ctx.snapshotId, currentSP)).toBe(true);  // 검증 ✅
  });

  test('3-7: SP Consistency - 정상 상태', () => {
    const snap = manager.saveContext('handler_1', 5, 2, 1000);
    const isClean = !manager.verifySPIntegrity(snap.snapshotId, 5);
    expect(isClean).toBe(true);
  });

  test('3-8: Frame Locking - FP 보존', () => {
    const snap = manager.saveContext('handler_1', 5, 99, 1000);
    const restored = manager.restoreContext(snap.snapshotId);
    expect(restored?.fp).toBe(99);  // FP 정확히 보존
  });

  test('3-9: PC 정확성 - CATCH 복귀 주소', () => {
    const snap = manager.saveContext('handler_1', 5, 2, 5555);
    const restored = manager.restoreContext(snap.snapshotId);
    expect(restored?.pc).toBe(5555);  // CATCH 주소 정확
  });

  test('3-10: 중첩 TRY 각 단계별 독립 스냅샷', () => {
    const snap1 = manager.saveContext('handler_1', 5, 2, 1000);
    const snap2 = manager.saveContext('handler_2', 10, 4, 2000);
    const snap3 = manager.saveContext('handler_3', 15, 6, 3000);

    expect(snap1.depth).toBe(0);
    expect(snap2.depth).toBe(1);
    expect(snap3.depth).toBe(2);

    const rest1 = manager.restoreContext(snap1.snapshotId);
    const rest2 = manager.restoreContext(snap2.snapshotId);
    const rest3 = manager.restoreContext(snap3.snapshotId);

    expect(rest1?.sp).toBe(5);
    expect(rest2?.sp).toBe(10);
    expect(rest3?.sp).toBe(15);
  });

  test('3-11: 중첩 TRY 역순 복원 가능', () => {
    const snap1 = manager.saveContext('handler_1', 5, 2, 1000);
    const snap2 = manager.saveContext('handler_2', 10, 4, 2000);
    const snap3 = manager.saveContext('handler_3', 15, 6, 3000);

    // 아무 순서로든 복원 가능
    const rest3 = manager.restoreContext(snap3.snapshotId);
    const rest1 = manager.restoreContext(snap1.snapshotId);
    const rest2 = manager.restoreContext(snap2.snapshotId);

    expect(rest3?.sp).toBe(15);
    expect(rest1?.sp).toBe(5);
    expect(rest2?.sp).toBe(10);
  });

  test('3-12: 중첩 TRY 부분 해제', () => {
    const snap1 = manager.saveContext('handler_1', 5, 2, 1000);
    const snap2 = manager.saveContext('handler_2', 10, 4, 2000);
    const snap3 = manager.saveContext('handler_3', 15, 6, 3000);

    manager.releaseSnapshot(snap3.snapshotId);  // 최상단 제거
    expect(manager.getSnapshotDepth()).toBe(2);

    manager.releaseSnapshot(snap2.snapshotId);  // 다음 제거
    expect(manager.getSnapshotDepth()).toBe(1);

    expect(manager.getCurrentSnapshot()?.snapshotId).toBe(snap1.snapshotId);
  });

  test('3-13: restoreContext 후 상태 완전 복원', () => {
    const locals = new Map([
      ['x', 10],
      ['y', 20],
    ]);
    const snap = manager.saveContext('handler_1', 5, 2, 1000, locals);

    const restored = manager.restoreContext(snap.snapshotId);

    expect(restored?.sp).toBe(5);
    expect(restored?.fp).toBe(2);
    expect(restored?.pc).toBe(1000);
    expect(restored?.locals.get('x')).toBe(10);
    expect(restored?.locals.get('y')).toBe(20);
  });

  test('3-14: Locals 완전 복원 - 정확성', () => {
    const locals = new Map<string, any>([
      ['name', 'Alice'],
      ['age', 30],
      ['active', true],
    ]);
    const snap = manager.saveContext('handler_1', 5, 2, 1000, locals);
    const restored = manager.restoreContext(snap.snapshotId);

    expect(restored?.locals.size).toBe(3);
    expect(restored?.locals.get('name')).toBe('Alice');
    expect(restored?.locals.get('age')).toBe(30);
    expect(restored?.locals.get('active')).toBe(true);
  });

  test('3-15: Clear 후 상태 초기화', () => {
    manager.saveContext('handler_1', 5, 2, 1000);
    manager.saveContext('handler_2', 10, 4, 2000);

    manager.clear();

    expect(manager.getSnapshotDepth()).toBe(0);
    expect(manager.getCurrentSnapshot()).toBeUndefined();
    const stats = manager.getStatistics();
    expect(stats.totalSaved).toBe(0);
  });

  test('3-16: 성능 - 1000개 스냅샷 < 10ms', () => {
    const start = Date.now();

    for (let i = 0; i < 1000; i++) {
      manager.saveContext(`handler_${i}`, i, i % 10, 1000 + i);
    }

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(10);
    expect(manager.getSnapshotDepth()).toBe(1000);
  });

  test('3-17: 통계 기록', () => {
    manager.saveContext('handler_1', 5, 2, 1000);
    manager.saveContext('handler_2', 10, 4, 2000);

    const stats = manager.getStatistics();
    expect(stats.totalSaved).toBe(2);
    expect(stats.maxDepth).toBe(2);
    expect(stats.currentDepth).toBe(2);
  });

  test('3-18: 재사용 테스트 - 저장 → 복원 → 제거 → 재사용', () => {
    const snap1 = manager.saveContext('handler_1', 5, 2, 1000);
    const rest1 = manager.restoreContext(snap1.snapshotId);
    expect(rest1?.sp).toBe(5);

    manager.releaseSnapshot(snap1.snapshotId);

    const snap2 = manager.saveContext('handler_2', 10, 4, 2000);
    const rest2 = manager.restoreContext(snap2.snapshotId);
    expect(rest2?.sp).toBe(10);

    expect(manager.getSnapshotDepth()).toBe(1);
  });

  test('3-19: isSPContaminated 별칭 메서드', () => {
    const snap = manager.saveContext('handler_1', 5, 2, 1000);
    const contaminated = manager.isSPContaminated(snap.snapshotId, 8);
    expect(contaminated).toBe(true);

    const clean = manager.isSPContaminated(snap.snapshotId, 5);
    expect(clean).toBe(false);
  });

  test('3-20: ✅ TC_V8_2_COMPLETE', () => {
    // 핵심 시나리오: TRY 진입 → 스택 오염 → 검증 → 복원
    const initialSP = 5;
    const initialFP = 2;
    const catchPC = 1000;
    const locals = new Map([['x', 10], ['y', 20]]);

    // TRY 진입: SAVE_CONTEXT
    const snap = manager.saveContext('handler_1', initialSP, initialFP, catchPC, locals);

    // TRY 내부: 스택 오염
    let currentSP = initialSP;
    currentSP += 3;  // PUSH 100, 200, 300

    // 예외 감지: verifySPIntegrity
    expect(manager.verifySPIntegrity(snap.snapshotId, currentSP)).toBe(true);

    // 예외 발생: RESTORE_CONTEXT
    const restored = manager.restoreContext(snap.snapshotId);

    // 복원 검증
    expect(restored?.sp).toBe(initialSP);
    expect(restored?.fp).toBe(initialFP);
    expect(restored?.pc).toBe(catchPC);
    expect(restored?.locals.get('x')).toBe(10);
    expect(restored?.locals.get('y')).toBe(20);

    // 통계 확인
    const stats = manager.getStatistics();
    expect(stats.totalSaved).toBe(1);
    expect(stats.totalRestored).toBe(1);
  });
});
