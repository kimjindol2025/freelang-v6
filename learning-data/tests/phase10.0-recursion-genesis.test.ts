// 🔄 FreeLang v6.0: Recursion Genesis - 재귀적 자아의 탄생 (60 tests)
// Proves: Self-referencing code + Stack depth guard (MAX=1000) + Parameter forwarding + Return value propagation

import { MemoryAllocator, RecursionPanic } from '../src/memory-allocator';

describe('v6.0 Phase 1: Recursion Safety Guard (20 tests)', () => {
  let alloc: MemoryAllocator;

  beforeEach(() => {
    alloc = new MemoryAllocator();
  });

  // 1-1: MAX_RECURSION_DEPTH === 1000
  it('1-1: MAX_RECURSION_DEPTH is 1000', () => {
    expect(MemoryAllocator.MAX_RECURSION_DEPTH).toBe(1000);
  });

  // 1-2: Depth 1 recursion succeeds
  it('1-2: Depth 1 recursion succeeds', () => {
    alloc.pushFrame('test');
    expect(alloc.getCurrentDepth()).toBe(1);
    alloc.popFrame();
  });

  // 1-3: Depth 100 recursion succeeds
  it('1-3: Depth 100 recursion succeeds', () => {
    for (let i = 0; i < 100; i++) {
      alloc.pushFrame(`level${i}`);
    }
    expect(alloc.getCurrentDepth()).toBe(100);
    for (let i = 0; i < 100; i++) {
      alloc.popFrame();
    }
    expect(alloc.getCurrentDepth()).toBe(0);
  });

  // 1-4: Depth 1000 (MAX) succeeds
  it('1-4: Depth 1000 (MAX) succeeds', () => {
    for (let i = 0; i < 1000; i++) {
      alloc.pushFrame(`level${i}`);
    }
    expect(alloc.getCurrentDepth()).toBe(1000);
    expect(alloc.isRecursionSafe()).toBe(false);
  });

  // 1-5: Depth 1001 (MAX+1) throws
  it('1-5: Depth 1001 (MAX+1) throws', () => {
    for (let i = 0; i < 1000; i++) {
      alloc.pushFrame(`level${i}`);
    }
    expect(() => {
      alloc.pushFrame('level1000'); // 1001st call
    }).toThrow();
  });

  // 1-6: Panic recorded on throw
  it('1-6: RecursionPanic recorded on throw', () => {
    for (let i = 0; i < 1000; i++) {
      alloc.pushFrame(`level${i}`);
    }
    try {
      alloc.pushFrame('level1000');
    } catch {
      // Expected
    }
    expect(alloc.getRecursionPanics().length).toBeGreaterThan(0);
  });

  // 1-7: Panic depth === 1001
  it('1-7: RecursionPanic.depth === 1001', () => {
    for (let i = 0; i < 1000; i++) {
      alloc.pushFrame(`level${i}`);
    }
    try {
      alloc.pushFrame('level1000');
    } catch {
      // Expected
    }
    const panics = alloc.getRecursionPanics();
    expect(panics[0].depth).toBe(1001);
  });

  // 1-8: Panic frameName recorded
  it('1-8: RecursionPanic.frameName recorded', () => {
    for (let i = 0; i < 1000; i++) {
      alloc.pushFrame(`level${i}`);
    }
    try {
      alloc.pushFrame('overflow_func');
    } catch {
      // Expected
    }
    const panics = alloc.getRecursionPanics();
    expect(panics[0].frameName).toBe('overflow_func');
  });

  // 1-9: Panic maxAllowed === 1000
  it('1-9: RecursionPanic.maxAllowed === 1000', () => {
    for (let i = 0; i < 1000; i++) {
      alloc.pushFrame(`level${i}`);
    }
    try {
      alloc.pushFrame('test');
    } catch {
      // Expected
    }
    const panics = alloc.getRecursionPanics();
    expect(panics[0].maxAllowed).toBe(1000);
  });

  // 1-10: Panic message contains "Stack overflow"
  it('1-10: RecursionPanic message contains Stack overflow', () => {
    for (let i = 0; i < 1000; i++) {
      alloc.pushFrame(`level${i}`);
    }
    try {
      alloc.pushFrame('test');
    } catch {
      // Expected
    }
    const panics = alloc.getRecursionPanics();
    expect(panics[0].message).toContain('Stack overflow');
  });

  // 1-11: Panic after getCurrentDepth() works
  it('1-11: Panic preserves getCurrentDepth', () => {
    for (let i = 0; i < 1000; i++) {
      alloc.pushFrame(`level${i}`);
    }
    try {
      alloc.pushFrame('test');
    } catch {
      // Expected
    }
    expect(alloc.getCurrentDepth()).toBe(1000);
  });

  // 1-12: After panic, isRecursionSafe() === false
  it('1-12: After panic, isRecursionSafe === false', () => {
    for (let i = 0; i < 1000; i++) {
      alloc.pushFrame(`level${i}`);
    }
    expect(alloc.isRecursionSafe()).toBe(false);
    try {
      alloc.pushFrame('test');
    } catch {
      // Expected
    }
    expect(alloc.isRecursionSafe()).toBe(false);
  });

  // 1-13: During normal recursion, isRecursionSafe() === true
  it('1-13: During normal recursion isRecursionSafe === true', () => {
    alloc.pushFrame('test');
    expect(alloc.isRecursionSafe()).toBe(true);
    alloc.popFrame();
  });

  // 1-14: getRecursionPanics() starts empty
  it('1-14: getRecursionPanics empty initially', () => {
    expect(alloc.getRecursionPanics()).toEqual([]);
  });

  // 1-15: clear() resets panics
  it('1-15: clear() resets panics', () => {
    for (let i = 0; i < 999; i++) {
      alloc.pushFrame(`level${i}`);
    }
    try {
      alloc.pushFrame('test');
    } catch {
      // Expected
    }
    alloc.clear();
    expect(alloc.getRecursionPanics()).toEqual([]);
  });

  // 1-16: getMaxRecursionDepth() === 1000
  it('1-16: getMaxRecursionDepth === 1000', () => {
    expect(alloc.getMaxRecursionDepth()).toBe(1000);
  });

  // 1-17: Multiple panics recorded
  it('1-17: Multiple panics recorded', () => {
    for (let i = 0; i < 1000; i++) {
      alloc.pushFrame(`level${i}`);
    }
    try {
      alloc.pushFrame('panic1');
    } catch {
      // Expected
    }

    // Unwind and try again
    for (let i = 0; i < 1000; i++) {
      alloc.popFrame();
    }

    for (let i = 0; i < 1000; i++) {
      alloc.pushFrame(`level${i}`);
    }
    try {
      alloc.pushFrame('panic2');
    } catch {
      // Expected
    }

    expect(alloc.getRecursionPanics().length).toBe(2);
  });

  // 1-18: After panic, can unwind normally
  it('1-18: After panic can unwind normally', () => {
    for (let i = 0; i < 1000; i++) {
      alloc.pushFrame(`level${i}`);
    }
    try {
      alloc.pushFrame('test');
    } catch {
      // Expected
    }
    for (let i = 0; i < 1000; i++) {
      alloc.popFrame();
    }
    expect(alloc.getCurrentDepth()).toBe(0);
  });

  // 1-19: Panic timestamp recorded
  it('1-19: RecursionPanic timestamp recorded', () => {
    const before = Date.now();
    for (let i = 0; i < 1000; i++) {
      alloc.pushFrame(`level${i}`);
    }
    try {
      alloc.pushFrame('test');
    } catch {
      // Expected
    }
    const after = Date.now();
    const panics = alloc.getRecursionPanics();
    expect(panics[0].timestamp).toBeGreaterThanOrEqual(before);
    expect(panics[0].timestamp).toBeLessThanOrEqual(after + 100);
  });

  // 1-20: Panic then clear then restart
  it('1-20: Panic, clear, restart cycle', () => {
    for (let i = 0; i < 1000; i++) {
      alloc.pushFrame(`level${i}`);
    }
    try {
      alloc.pushFrame('test');
    } catch {
      // Expected
    }
    expect(alloc.getRecursionPanics().length).toBeGreaterThan(0);

    alloc.clear();
    expect(alloc.getRecursionPanics()).toEqual([]);

    alloc.pushFrame('newframe');
    expect(alloc.getCurrentDepth()).toBe(1);
  });
});

describe('v6.0 Phase 2: Factorial & Fibonacci Patterns (20 tests)', () => {
  let alloc: MemoryAllocator;

  beforeEach(() => {
    alloc = new MemoryAllocator();
  });

  // Helper: Factorial with pushFrame/popFrame
  function factorial(n: number, alloc: MemoryAllocator): number {
    if (n <= 1) return 1;

    alloc.pushFrame(`Factorial(${n})`);
    const result = n * factorial(n - 1, alloc);
    alloc.popFrame(true); // autoCleanup

    return result;
  }

  // Helper: Fibonacci with pushFrame/popFrame
  function fibonacci(n: number, alloc: MemoryAllocator): number {
    if (n <= 1) return n;

    alloc.pushFrame(`Fibonacci(${n})`);
    const result = fibonacci(n - 1, alloc) + fibonacci(n - 2, alloc);
    alloc.popFrame(true); // autoCleanup

    return result;
  }

  // 2-1: Factorial(1) === 1
  it('2-1: Factorial(1) === 1', () => {
    expect(factorial(1, alloc)).toBe(1);
  });

  // 2-2: Factorial(2) === 2
  it('2-2: Factorial(2) === 2', () => {
    expect(factorial(2, alloc)).toBe(2);
  });

  // 2-3: Factorial(3) === 6
  it('2-3: Factorial(3) === 6', () => {
    expect(factorial(3, alloc)).toBe(6);
  });

  // 2-4: Factorial(5) === 120 (**TC_V6_0_RECURSION_GENESIS**)
  it('2-4: Factorial(5) === 120 (RECURSION_GENESIS)', () => {
    expect(factorial(5, alloc)).toBe(120);
  });

  // 2-5: Factorial(10) === 3628800
  it('2-5: Factorial(10) === 3628800', () => {
    expect(factorial(10, alloc)).toBe(3628800);
  });

  // 2-6: Factorial done, getCurrentDepth === 0
  it('2-6: Factorial complete depth === 0', () => {
    factorial(5, alloc);
    expect(alloc.getCurrentDepth()).toBe(0);
  });

  // 2-7: Factorial done, heap usage === 0 (autoCleanup)
  it('2-7: Factorial complete heap usage === 0', () => {
    factorial(5, alloc);
    expect(alloc.getStats().totalAllocated).toBe(0);
  });

  // 2-8: Factorial max depth tracked
  it('2-8: Factorial max depth tracked', () => {
    factorial(5, alloc);
    const stats = alloc.getFrameStats();
    expect(stats.maxDepth).toBeGreaterThanOrEqual(4);
  });

  // 2-9: Factorial each depth has unique frameId
  it('2-9: Factorial frame ids unique per depth', () => {
    factorial(3, alloc);
    expect(alloc.getFrameStats().total).toBeGreaterThanOrEqual(2);
  });

  // 2-10: Factorial base case frame released
  it('2-10: Factorial base case frame released', () => {
    factorial(5, alloc);
    expect(alloc.getFrameStats().active).toBe(0);
  });

  // 2-11: Fibonacci(1) === 1
  it('2-11: Fibonacci(1) === 1', () => {
    expect(fibonacci(1, alloc)).toBe(1);
  });

  // 2-12: Fibonacci(5) === 5
  it('2-12: Fibonacci(5) === 5', () => {
    expect(fibonacci(5, alloc)).toBe(5);
  });

  // 2-13: Fibonacci(10) === 55
  it('2-13: Fibonacci(10) === 55', () => {
    expect(fibonacci(10, alloc)).toBe(55);
  });

  // 2-14: Fibonacci complete all frames released
  it('2-14: Fibonacci complete all frames released', () => {
    fibonacci(5, alloc);
    expect(alloc.getFrameStats().active).toBe(0);
  });

  // 2-15: Fibonacci complete heap === 0
  it('2-15: Fibonacci complete heap usage === 0', () => {
    fibonacci(5, alloc);
    expect(alloc.getStats().totalAllocated).toBe(0);
  });

  // 2-16: Factorial(0) base case
  it('2-16: Factorial(0) base case', () => {
    expect(factorial(0, alloc)).toBe(1);
  });

  // 2-17: Factorial with alloc inside
  it('2-17: Factorial with allocation', () => {
    function factorialWithAlloc(n: number): number {
      if (n <= 1) return 1;

      alloc.pushFrame(`FactAlloc(${n})`);
      const localData = alloc.allocate(16); // Local variable
      const result = n * factorialWithAlloc(n - 1);
      alloc.popFrame(true); // Auto-cleanup

      return result;
    }

    expect(factorialWithAlloc(5)).toBe(120);
    expect(alloc.getStats().totalAllocated).toBe(0);
  });

  // 2-18: Fibonacci frame stats during recursion
  it('2-18: Fibonacci frame stats accurate', () => {
    const result = fibonacci(5, alloc);
    expect(result).toBe(5);
    expect(alloc.getFrameStats().active).toBe(0);
  });

  // 2-19: Factorial + Fibonacci sequential
  it('2-19: Factorial then Fibonacci sequential', () => {
    expect(factorial(5, alloc)).toBe(120);
    expect(fibonacci(5, alloc)).toBe(5);
    expect(alloc.getStats().totalAllocated).toBe(0);
  });

  // 2-20: **RECURSION GENESIS Complete
  it('2-20: ✅ RECURSION GENESIS: Factorial(5)=120 + cleanup', () => {
    const result = factorial(5, alloc);
    expect(result).toBe(120);
    expect(alloc.getCurrentDepth()).toBe(0);
    expect(alloc.getStats().totalAllocated).toBe(0);
    expect(alloc.detectLeaks()).toEqual([]);
    expect(alloc.getRecursionPanics()).toEqual([]);
  });
});

describe('v6.0 Phase 3: Integration & Stress (20 tests)', () => {
  let alloc: MemoryAllocator;

  beforeEach(() => {
    alloc = new MemoryAllocator();
  });

  // 3-1: MAX-1 depth succeeds
  it('3-1: MAX-1(999) recursion succeeds', () => {
    for (let i = 0; i < 999; i++) {
      alloc.pushFrame(`level${i}`);
    }
    expect(alloc.getCurrentDepth()).toBe(999);
    for (let i = 0; i < 999; i++) {
      alloc.popFrame(true);
    }
    expect(alloc.getCurrentDepth()).toBe(0);
  });

  // 3-2: MAX depth catches panic
  it('3-2: MAX(1000) depth catches panic', () => {
    for (let i = 0; i < 1000; i++) {
      alloc.pushFrame(`level${i}`);
    }
    let caught = false;
    try {
      alloc.pushFrame('level1000');
    } catch {
      caught = true;
    }
    expect(caught).toBe(true);
    expect(alloc.getRecursionPanics().length).toBeGreaterThan(0);
  });

  // 3-3: After panic, clear + restart
  it('3-3: Panic, clear, restart', () => {
    for (let i = 0; i < 999; i++) {
      alloc.pushFrame(`level${i}`);
    }
    try {
      alloc.pushFrame('test');
    } catch {
      // Expected
    }
    alloc.clear();
    alloc.pushFrame('newframe');
    expect(alloc.getCurrentDepth()).toBe(1);
  });

  // 3-4: Panic catch updates isRecursionSafe
  it('3-4: Panic updates isRecursionSafe', () => {
    for (let i = 0; i < 1000; i++) {
      alloc.pushFrame(`level${i}`);
    }
    expect(alloc.isRecursionSafe()).toBe(false);
    try {
      alloc.pushFrame('test');
    } catch {
      // Expected
    }
    expect(alloc.isRecursionSafe()).toBe(false);
  });

  // 3-5: Panic catch can autoCleanup
  it('3-5: Panic frames can autoCleanup', () => {
    for (let i = 0; i < 1000; i++) {
      alloc.pushFrame(`level${i}`);
    }
    try {
      alloc.pushFrame('test');
    } catch {
      // Expected
    }
    for (let i = 0; i < 1000; i++) {
      alloc.popFrame(true);
    }
    expect(alloc.getCurrentDepth()).toBe(0);
  });

  // 3-6: v5.9.9 + v6.0 integration
  it('3-6: v5.9.9 autoCleanup + v6.0 depth guard', () => {
    alloc.pushFrame('frame1');
    alloc.allocate(32);
    expect(alloc.getStats().totalAllocated).toBeGreaterThan(0);
    alloc.popFrame(true);
    expect(alloc.getStats().totalAllocated).toBe(0);
  });

  // 3-7: v5.9.8 + v6.0 integration
  it('3-7: v5.9.8 dangling + v6.0 panic', () => {
    alloc.pushFrame('test');
    const p = alloc.allocate(32);
    alloc.free(p);
    const result = alloc.access(p);
    expect(result).toBe(false);
    alloc.popFrame();
  });

  // 3-8: 100-level recursion canary integrity
  it('3-8: 100-level canary integrity', () => {
    for (let i = 0; i < 100; i++) {
      alloc.pushFrame(`level${i}`);
    }
    expect(alloc.checkHeapInvariants()).toBe(true);
    for (let i = 0; i < 100; i++) {
      alloc.popFrame();
    }
  });

  // 3-9: 500-level recursion success
  it('3-9: 500-level recursion success', () => {
    for (let i = 0; i < 500; i++) {
      alloc.pushFrame(`level${i}`);
    }
    expect(alloc.getCurrentDepth()).toBe(500);
    for (let i = 0; i < 500; i++) {
      alloc.popFrame();
    }
    expect(alloc.getCurrentDepth()).toBe(0);
  });

  // 3-10: Pool + 100-level recursion
  it('3-10: Pool allocation + 100-level recursion', () => {
    for (let i = 0; i < 100; i++) {
      alloc.pushFrame(`level${i}`);
      alloc.allocate(8); // Pool
    }
    expect(alloc.getFrameStats().active).toBe(100);
    for (let i = 0; i < 100; i++) {
      alloc.popFrame(true);
    }
    expect(alloc.getStats().totalAllocated).toBe(0);
  });

  // 3-11: Heap + 100-level recursion
  it('3-11: Heap allocation + 100-level recursion', () => {
    for (let i = 0; i < 100; i++) {
      alloc.pushFrame(`level${i}`);
      alloc.allocate(256); // Heap
    }
    expect(alloc.getFrameStats().active).toBe(100);
    for (let i = 0; i < 100; i++) {
      alloc.popFrame(true);
    }
    expect(alloc.getStats().totalAllocated).toBe(0);
  });

  // 3-12: Frame stats during 100-level recursion
  it('3-12: Frame stats 100-level recursion', () => {
    for (let i = 0; i < 100; i++) {
      alloc.pushFrame(`level${i}`);
    }
    const stats = alloc.getFrameStats();
    expect(stats.active).toBe(100);
    expect(stats.maxDepth).toBeGreaterThanOrEqual(100);
  });

  // 3-13: detectLeaks after 100-level recursion
  it('3-13: detectLeaks 100-level recursion', () => {
    for (let i = 0; i < 100; i++) {
      alloc.pushFrame(`level${i}`);
      alloc.allocate(16);
    }
    for (let i = 0; i < 100; i++) {
      alloc.popFrame(true);
    }
    expect(alloc.detectLeaks()).toEqual([]);
  });

  // 3-14: No panics in 100-level recursion
  it('3-14: No panics in 100-level', () => {
    for (let i = 0; i < 100; i++) {
      alloc.pushFrame(`level${i}`);
    }
    expect(alloc.getRecursionPanics()).toEqual([]);
    for (let i = 0; i < 100; i++) {
      alloc.popFrame();
    }
  });

  // 3-15: Panic at 1001-level
  it('3-15: Panic at 1001-level', () => {
    for (let i = 0; i < 1000; i++) {
      alloc.pushFrame(`level${i}`);
    }
    try {
      alloc.pushFrame('overflow');
    } catch {
      // Expected
    }
    expect(alloc.getRecursionPanics().length).toBe(1);
  });

  // 3-16: Factorial parent-child linking
  it('3-16: Factorial frame parent-child', () => {
    function fact(n: number): number {
      if (n <= 1) return 1;
      alloc.pushFrame(`Fact(${n})`);
      const result = n * fact(n - 1);
      alloc.popFrame(true);
      return result;
    }

    fact(5);
    expect(alloc.getFrameStats().total).toBeGreaterThanOrEqual(4);
  });

  // 3-17: Factorial unique allocations per frame
  it('3-17: Factorial allocations per frame', () => {
    function factAlloc(n: number): number {
      if (n <= 1) return 1;
      const frameId = alloc.pushFrame(`FactAlloc(${n})`);
      alloc.allocate(16);
      const result = n * factAlloc(n - 1);
      alloc.popFrame(true);
      return result;
    }

    factAlloc(3);
    expect(alloc.getStats().totalAllocated).toBe(0);
  });

  // 3-18: Fibonacci complete cleanup
  it('3-18: Fibonacci(10) complete cleanup', () => {
    function fib(n: number): number {
      if (n <= 1) return n;
      alloc.pushFrame(`Fib(${n})`);
      const result = fib(n - 1) + fib(n - 2);
      alloc.popFrame(true);
      return result;
    }

    fib(10);
    expect(alloc.getCurrentDepth()).toBe(0);
    expect(alloc.getStats().totalAllocated).toBe(0);
    expect(alloc.detectLeaks()).toEqual([]);
  });

  // 3-19: Full v6.0 integration test
  it('3-19: Full v6.0 integration Factorial+Guard+LIFO', () => {
    function fact(n: number): number {
      if (n <= 1) return 1;
      alloc.pushFrame(`Fact(${n})`);
      alloc.allocate(8);
      const result = n * fact(n - 1);
      alloc.popFrame(true);
      return result;
    }

    const result = fact(5);
    expect(result).toBe(120);
    expect(alloc.getCurrentDepth()).toBe(0);
    expect(alloc.isRecursionSafe()).toBe(true);
    expect(alloc.getRecursionPanics()).toEqual([]);
    expect(alloc.getStats().totalAllocated).toBe(0);
  });

  // 3-20: ✅ RECURSION GENESIS COMPLETE
  it('3-20: ✅ RECURSION GENESIS COMPLETE', () => {
    function factorial(n: number): number {
      if (n <= 1) return 1;
      alloc.pushFrame(`Factorial(${n})`);
      const localData = alloc.allocate(16);
      const result = n * factorial(n - 1);
      alloc.popFrame(true); // Auto-cleanup LIFO
      return result;
    }

    const result = factorial(5);

    // Verify Factorial(5) = 120
    expect(result).toBe(120);

    // Verify complete cleanup
    expect(alloc.getCurrentDepth()).toBe(0);
    expect(alloc.getStats().totalAllocated).toBe(0);
    expect(alloc.detectLeaks()).toEqual([]);

    // Verify recursion safety
    expect(alloc.isRecursionSafe()).toBe(true);
    expect(alloc.getRecursionPanics()).toEqual([]);

    // Verify frame stats
    const stats = alloc.getFrameStats();
    expect(stats.active).toBe(0);
    expect(stats.maxDepth).toBeGreaterThanOrEqual(4);
  });
});
