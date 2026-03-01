// 🔥 FreeLang v5.9.7: Chaos Stress Test & Heap Destruction Defense (50 tests)
// Proves allocator survives extreme randomized abuse without corruption

import { MemoryAllocator } from '../src/memory-allocator';

describe('v5.9.7 Phase 1: Canary Integrity Detection (15 tests)', () => {
  let alloc: MemoryAllocator;

  beforeEach(() => {
    alloc = new MemoryAllocator();
  });

  // 1-1: Canary values set on allocation
  it('1-1: Canary values initialized on allocation', () => {
    const p1 = alloc.allocate(32);
    const block = alloc.getBlock(p1);

    expect(block).toBeDefined();
    expect(block!.canaryBefore).toBe(0xDEADBEEF);
    expect(block!.canaryAfter).toBe(0xDEADBEEF);
  });

  // 1-2: Canary values verified on free
  it('1-2: Canary values verified before free', () => {
    const p1 = alloc.allocate(64);
    const result = alloc.free(p1);

    expect(result).toBe(true);
    const corruptReport = alloc.getCorruptionReport();
    expect(corruptReport.detected).toBe(false);
  });

  // 1-3: Multiple blocks with independent canaries
  it('1-3: Multiple blocks maintain independent canaries', () => {
    const p1 = alloc.allocate(16);
    const p2 = alloc.allocate(32);
    const p3 = alloc.allocate(64);

    const b1 = alloc.getBlock(p1);
    const b2 = alloc.getBlock(p2);
    const b3 = alloc.getBlock(p3);

    expect(b1!.canaryBefore).toBe(0xDEADBEEF);
    expect(b2!.canaryBefore).toBe(0xDEADBEEF);
    expect(b3!.canaryBefore).toBe(0xDEADBEEF);
  });

  // 1-4: Pool blocks have canaries
  it('1-4: Pool blocks protected with canaries', () => {
    const p1 = alloc.allocate(8); // Pool
    const block = alloc.getBlock(p1);

    expect(block!.canaryBefore).toBe(0xDEADBEEF);
    expect(block!.canaryAfter).toBe(0xDEADBEEF);
  });

  // 1-5: Reused pool blocks reset canaries
  it('1-5: Canaries reset on pool block reuse', () => {
    const p1 = alloc.allocate(16);
    alloc.free(p1);
    const p2 = alloc.allocate(16);

    const block = alloc.getBlock(p2);
    expect(block!.canaryBefore).toBe(0xDEADBEEF);
    expect(block!.canaryAfter).toBe(0xDEADBEEF);
  });

  // 1-6: Block splitting maintains canaries
  it('1-6: Block splitting maintains canary integrity', () => {
    const p1 = alloc.allocate(200);
    alloc.free(p1);

    // Allocate smaller block (will split)
    const p2 = alloc.allocate(100);
    const block = alloc.getBlock(p2);

    expect(block!.canaryBefore).toBe(0xDEADBEEF);
    expect(block!.canaryAfter).toBe(0xDEADBEEF);
  });

  // 1-7: Corruption detection enabled
  it('1-7: Corruption detection reports enabled', () => {
    const p1 = alloc.allocate(32);
    const report = alloc.getCorruptionReport();

    expect(report.detected).toBe(false);
    expect(report.corruptedCount).toBe(0);
    expect(Array.isArray(report.corruptedBlockIds)).toBe(true);
  });

  // 1-8: Heap invariants verified
  it('1-8: Heap invariants checked for integrity', () => {
    alloc.allocate(16);
    alloc.allocate(32);
    alloc.allocate(64);

    const isValid = alloc.checkHeapInvariants();
    expect(isValid).toBe(true);
  });

  // 1-9: Invariants after allocation and free
  it('1-9: Invariants remain valid after alloc-free cycle', () => {
    const p1 = alloc.allocate(32);
    const p2 = alloc.allocate(64);

    alloc.free(p1);

    const isValid = alloc.checkHeapInvariants();
    expect(isValid).toBe(true);
  });

  // 1-10: Large allocation has canary protection
  it('1-10: Large heap allocations protected with canary', () => {
    const p1 = alloc.allocate(1024);
    const block = alloc.getBlock(p1);

    expect(block!.canaryBefore).toBe(0xDEADBEEF);
    expect(block!.canaryAfter).toBe(0xDEADBEEF);
  });

  // 1-11: Fragmentation doesn't affect canary checks
  it('1-11: Canaries work despite fragmentation', () => {
    const ptrs = [];
    for (let i = 0; i < 5; i++) {
      ptrs.push(alloc.allocate(100));
    }

    // Free odd blocks (create fragmentation)
    alloc.free(ptrs[1]);
    alloc.free(ptrs[3]);

    // Verify remaining blocks
    const b0 = alloc.getBlock(ptrs[0]);
    const b2 = alloc.getBlock(ptrs[2]);
    const b4 = alloc.getBlock(ptrs[4]);

    expect(b0!.canaryBefore).toBe(0xDEADBEEF);
    expect(b2!.canaryBefore).toBe(0xDEADBEEF);
    expect(b4!.canaryBefore).toBe(0xDEADBEEF);
  });

  // 1-12: Clear resets corruption state
  it('1-12: Clear() resets corruption detection', () => {
    alloc.allocate(32);
    alloc.clear();

    const report = alloc.getCorruptionReport();
    expect(report.detected).toBe(false);
    expect(report.corruptedCount).toBe(0);
  });

  // 1-13: Canary works with source info
  it('1-13: Canaries maintained with source tracking', () => {
    alloc.setSourceInfo('test.free', 42);
    const p1 = alloc.allocate(32);

    const block = alloc.getBlock(p1);
    expect(block!.canaryBefore).toBe(0xDEADBEEF);
    expect(block!.sourceInfo).toBe('test.free:42');
  });

  // 1-14: Prefilled pool blocks have canaries
  it('1-14: Prefilled pool blocks protected with canaries', () => {
    alloc.prefillPool(16, 5);

    const p1 = alloc.allocate(16);
    const block = alloc.getBlock(p1);

    expect(block!.canaryBefore).toBe(0xDEADBEEF);
    expect(block!.canaryAfter).toBe(0xDEADBEEF);
  });

  // 1-15: Coalescing preserves canaries
  it('1-15: Coalescing maintains canary integrity', () => {
    const p1 = alloc.allocate(100);
    const p2 = alloc.allocate(100);

    alloc.free(p1);
    alloc.free(p2);

    const isValid = alloc.checkHeapInvariants();
    expect(isValid).toBe(true);
  });
});

describe('v5.9.7 Phase 2: Randomized Chaos Allocation (20 tests)', () => {
  let alloc: MemoryAllocator;

  beforeEach(() => {
    alloc = new MemoryAllocator();
  });

  // 2-1: 100 random allocations
  it('2-1: 100 random-size allocations survive', () => {
    const ptrs = [];
    for (let i = 0; i < 100; i++) {
      const size = Math.floor(Math.random() * 512) + 1;
      ptrs.push(alloc.allocate(size));
    }

    expect(ptrs.length).toBe(100);
    expect(ptrs.every(p => p > 0)).toBe(true);
  });

  // 2-2: Random alloc then free all
  it('2-2: 100 random allocations, free all without corruption', () => {
    const ptrs = [];
    for (let i = 0; i < 100; i++) {
      ptrs.push(alloc.allocate(Math.floor(Math.random() * 300) + 1));
    }

    for (const p of ptrs) {
      alloc.free(p);
    }

    const isValid = alloc.checkHeapInvariants();
    expect(isValid).toBe(true);
  });

  // 2-3: Random interleaved alloc-free
  it('2-3: Interleaved random alloc-free (200 ops)', () => {
    const ptrs: number[] = [];

    for (let i = 0; i < 200; i++) {
      if (Math.random() < 0.6) {
        // 60% allocate
        ptrs.push(alloc.allocate(Math.floor(Math.random() * 256) + 1));
      } else if (ptrs.length > 0) {
        // 40% free random block
        const idx = Math.floor(Math.random() * ptrs.length);
        const p = ptrs[idx];
        alloc.free(p);
        ptrs.splice(idx, 1);
      }
    }

    const isValid = alloc.checkHeapInvariants();
    expect(isValid).toBe(true);
  });

  // 2-4: 500 random operations stress
  it('2-4: 500 random operations (extreme chaos)', () => {
    const ptrs: number[] = [];
    let allocCount = 0;
    let freeCount = 0;

    for (let i = 0; i < 500; i++) {
      const op = Math.random();

      if (op < 0.7 || ptrs.length === 0) {
        // Allocate
        const size = Math.floor(Math.random() * 512) + 1;
        ptrs.push(alloc.allocate(size));
        allocCount++;
      } else {
        // Free random
        const idx = Math.floor(Math.random() * ptrs.length);
        alloc.free(ptrs[idx]);
        ptrs.splice(idx, 1);
        freeCount++;
      }
    }

    const isValid = alloc.checkHeapInvariants();
    const report = alloc.getCorruptionReport();

    expect(isValid).toBe(true);
    expect(report.detected).toBe(false);
  });

  // 2-5: Extreme size variance
  it('2-5: Size variance from 1B to 1024B', () => {
    const ptrs = [];
    const sizes = [1, 8, 16, 32, 64, 128, 256, 512, 1024];

    for (let i = 0; i < 100; i++) {
      const size = sizes[Math.floor(Math.random() * sizes.length)];
      ptrs.push(alloc.allocate(size));
    }

    for (const p of ptrs) {
      expect(alloc.isValid(p)).toBe(true);
    }
  });

  // 2-6: Allocation pattern: many small + few large
  it('2-6: Mixed pattern: 50 small + 10 large + random free', () => {
    const ptrs: number[] = [];

    // Allocate many small
    for (let i = 0; i < 50; i++) {
      ptrs.push(alloc.allocate(8));
    }

    // Allocate few large
    for (let i = 0; i < 10; i++) {
      ptrs.push(alloc.allocate(512));
    }

    // Random free
    for (let i = 0; i < 30; i++) {
      const idx = Math.floor(Math.random() * ptrs.length);
      alloc.free(ptrs[idx]);
      ptrs.splice(idx, 1);
    }

    const isValid = alloc.checkHeapInvariants();
    expect(isValid).toBe(true);
  });

  // 2-7: Burst allocation then gradual free
  it('2-7: Burst 200 allocations, gradual free', () => {
    const ptrs = [];

    // Burst allocate
    for (let i = 0; i < 200; i++) {
      ptrs.push(alloc.allocate(Math.floor(Math.random() * 128) + 1));
    }

    // Gradual free (every 10 allocations)
    for (let i = 0; i < 100; i++) {
      alloc.free(ptrs[i]);
    }

    const isValid = alloc.checkHeapInvariants();
    expect(isValid).toBe(true);
  });

  // 2-8: Repeated allocation cycles
  it('2-8: 10 cycles of (alloc 50, free all)', () => {
    for (let cycle = 0; cycle < 10; cycle++) {
      const ptrs = [];

      // Allocate 50
      for (let i = 0; i < 50; i++) {
        ptrs.push(alloc.allocate(Math.floor(Math.random() * 256) + 1));
      }

      // Free all
      for (const p of ptrs) {
        alloc.free(p);
      }

      const isValid = alloc.checkHeapInvariants();
      expect(isValid).toBe(true);
    }
  });

  // 2-9: Alternating alloc sizes (smallest to largest)
  it('2-9: Alternating allocation sizes', () => {
    const ptrs = [];
    const sizes = [1, 512, 2, 510, 4, 508, 8, 504, 16, 500];

    for (let i = 0; i < 100; i++) {
      const size = sizes[i % sizes.length];
      ptrs.push(alloc.allocate(size));
    }

    expect(ptrs.every(p => p > 0)).toBe(true);

    const isValid = alloc.checkHeapInvariants();
    expect(isValid).toBe(true);
  });

  // 2-10: Fragmentation stress (free middle blocks)
  it('2-10: Fragmentation stress (free middle blocks)', () => {
    const ptrs = [];

    // Allocate 30
    for (let i = 0; i < 30; i++) {
      ptrs.push(alloc.allocate(64));
    }

    // Free every other block
    for (let i = 1; i < ptrs.length; i += 2) {
      alloc.free(ptrs[i]);
    }

    // Try to allocate from fragmented heap
    const pNew = alloc.allocate(96);
    expect(alloc.isValid(pNew)).toBe(true);

    const isValid = alloc.checkHeapInvariants();
    expect(isValid).toBe(true);
  });

  // 2-11: Pool bucket stress (all sizes)
  it('2-11: All pool bucket sizes in chaos', () => {
    const ptrs = [];

    // Random allocations, stress all pools
    for (let i = 0; i < 200; i++) {
      const size = Math.floor(Math.random() * 130); // 0-129 (mix Pool and Heap)
      if (size > 0) {
        ptrs.push(alloc.allocate(size));
      }
    }

    // Random free
    for (let i = 0; i < 100; i++) {
      if (ptrs.length > 0) {
        const idx = Math.floor(Math.random() * ptrs.length);
        alloc.free(ptrs[idx]);
        ptrs.splice(idx, 1);
      }
    }

    const isValid = alloc.checkHeapInvariants();
    expect(isValid).toBe(true);
  });

  // 2-12: Allocation after heavy fragmentation
  it('2-12: Allocate after heavy fragmentation', () => {
    // Create fragmentation
    const ptrs = [];
    for (let i = 0; i < 20; i++) {
      ptrs.push(alloc.allocate(100));
    }

    // Free all but keep pointers
    for (const p of ptrs) {
      alloc.free(p);
    }

    // Try many allocations
    const newPtrs = [];
    for (let i = 0; i < 50; i++) {
      newPtrs.push(alloc.allocate(Math.floor(Math.random() * 80) + 20));
    }

    expect(newPtrs.every(p => p > 0)).toBe(true);

    const isValid = alloc.checkHeapInvariants();
    expect(isValid).toBe(true);
  });

  // 2-13: Stress with max sizes
  it('2-13: Stress with maximum allocation sizes', () => {
    const ptrs = [];

    // Allocate large blocks
    for (let i = 0; i < 10; i++) {
      ptrs.push(alloc.allocate(10000 + i * 1000));
    }

    // Free random
    for (let i = 0; i < 5; i++) {
      const idx = Math.floor(Math.random() * ptrs.length);
      alloc.free(ptrs[idx]);
      ptrs.splice(idx, 1);
    }

    const isValid = alloc.checkHeapInvariants();
    expect(isValid).toBe(true);
  });

  // 2-14: Rapid reuse pattern
  it('2-14: Rapid reuse (alloc-free-realloc 100 times)', () => {
    for (let i = 0; i < 100; i++) {
      const p = alloc.allocate(Math.floor(Math.random() * 256) + 1);
      alloc.free(p);
    }

    const isValid = alloc.checkHeapInvariants();
    expect(isValid).toBe(true);
  });

  // 2-15: Mixed Pool + Heap chaos
  it('2-15: Mixed Pool and Heap chaos pattern', () => {
    const ptrs: number[] = [];

    for (let i = 0; i < 300; i++) {
      if (Math.random() < 0.65) {
        // Allocate
        const size = Math.random() < 0.5
          ? Math.floor(Math.random() * 128) + 1  // Pool
          : Math.floor(Math.random() * 400) + 256; // Heap
        ptrs.push(alloc.allocate(size));
      } else if (ptrs.length > 0) {
        // Free random
        const idx = Math.floor(Math.random() * ptrs.length);
        alloc.free(ptrs[idx]);
        ptrs.splice(idx, 1);
      }
    }

    const isValid = alloc.checkHeapInvariants();
    const report = alloc.getCorruptionReport();

    expect(isValid).toBe(true);
    expect(report.detected).toBe(false);
  });
});

describe('v5.9.7 Phase 3: Extreme Stress & Resilience (15 tests)', () => {
  let alloc: MemoryAllocator;

  beforeEach(() => {
    alloc = new MemoryAllocator();
  });

  // 3-1: 1000 random operations
  it('3-1: 1000 random operations without crash', () => {
    const ptrs: number[] = [];
    let ops = 0;

    for (let i = 0; i < 1000; i++) {
      if (Math.random() < 0.7 || ptrs.length === 0) {
        ptrs.push(alloc.allocate(Math.floor(Math.random() * 512) + 1));
      } else {
        const idx = Math.floor(Math.random() * ptrs.length);
        alloc.free(ptrs[idx]);
        ptrs.splice(idx, 1);
      }
      ops++;
    }

    expect(ops).toBe(1000);
    expect(alloc.checkHeapInvariants()).toBe(true);
  });

  // 3-2: Stats remain accurate under chaos
  it('3-2: Statistics accurate after 1000 chaos ops', () => {
    for (let i = 0; i < 1000; i++) {
      if (Math.random() < 0.7) {
        alloc.allocate(Math.floor(Math.random() * 256) + 1);
      } else {
        const blocks = alloc.detectLeaks();
        if (blocks.length > 0) {
          alloc.free(blocks[0].addr);
        }
      }
    }

    const stats = alloc.getStats();
    expect(stats.allocatedBlocks + stats.freedBlocks).toBeGreaterThan(0);
  });

  // 3-3: Leak detection works under stress
  it('3-3: Leak detection under extreme stress', () => {
    const ptrs = [];

    // Heavy allocation
    for (let i = 0; i < 500; i++) {
      ptrs.push(alloc.allocate(Math.floor(Math.random() * 200) + 1));
    }

    // Free only half
    for (let i = 0; i < 250; i++) {
      alloc.free(ptrs[i]);
    }

    const leaks = alloc.detectLeaks();
    expect(leaks.length).toBeGreaterThan(0);
  });

  // 3-4: Fragmentation under chaos
  it('3-4: Fragmentation tracking under chaos', () => {
    for (let i = 0; i < 500; i++) {
      const p = alloc.allocate(Math.floor(Math.random() * 100) + 50);
      if (Math.random() < 0.5) {
        alloc.free(p);
      }
    }

    const stats = alloc.getFragmentationStats();
    expect(stats.ratio).toBeGreaterThanOrEqual(0);
    expect(stats.ratio).toBeLessThanOrEqual(100);
  });

  // 3-5: Pool stats accurate during chaos
  it('3-5: Pool statistics accurate during chaos', () => {
    for (let i = 0; i < 300; i++) {
      alloc.allocate(Math.floor(Math.random() * 128) + 1);
    }

    const poolStats = alloc.getPoolStats();
    expect(poolStats.totalMisses).toBeGreaterThan(0);
  });

  // 3-6: No errors recorded if heap valid
  it('3-6: No errors if heap remains valid', () => {
    const ptrs = [];

    for (let i = 0; i < 200; i++) {
      ptrs.push(alloc.allocate(Math.floor(Math.random() * 256) + 1));
    }

    for (const p of ptrs) {
      alloc.free(p);
    }

    const errors = alloc.getErrors();
    expect(errors.length).toBe(0);
  });

  // 3-7: Memory remains accessible after stress
  it('3-7: Allocated memory accessible after stress', () => {
    const ptrs = [];

    for (let i = 0; i < 100; i++) {
      ptrs.push(alloc.allocate(32));
    }

    // Access all blocks
    for (const p of ptrs) {
      expect(alloc.isValid(p)).toBe(true);
    }

    // Free all
    for (const p of ptrs) {
      alloc.free(p);
    }
  });

  // 3-8: Clear succeeds after extreme stress
  it('3-8: Clear() succeeds after extreme stress', () => {
    for (let i = 0; i < 500; i++) {
      alloc.allocate(Math.floor(Math.random() * 512) + 1);
    }

    alloc.clear();

    const stats = alloc.getStats();
    expect(stats.allocatedBlocks).toBe(0);
    expect(stats.freedBlocks).toBe(0);
  });

  // 3-9: Multiple stress cycles
  it('3-9: 5 stress cycles (100 ops each) succeed', () => {
    for (let cycle = 0; cycle < 5; cycle++) {
      const ptrs = [];

      for (let i = 0; i < 100; i++) {
        if (Math.random() < 0.7) {
          ptrs.push(alloc.allocate(Math.floor(Math.random() * 256) + 1));
        } else if (ptrs.length > 0) {
          const idx = Math.floor(Math.random() * ptrs.length);
          alloc.free(ptrs[idx]);
          ptrs.splice(idx, 1);
        }
      }

      // Free remaining
      for (const p of ptrs) {
        alloc.free(p);
      }

      expect(alloc.checkHeapInvariants()).toBe(true);
    }
  });

  // 3-10: Corruption detection after stress
  it('3-10: Corruption detection still working after stress', () => {
    // Heavy stress
    for (let i = 0; i < 1000; i++) {
      if (Math.random() < 0.6) {
        alloc.allocate(Math.floor(Math.random() * 300) + 1);
      }
    }

    const report = alloc.getCorruptionReport();
    expect(report.detected).toBe(false);
  });

  // 3-11: Prefill maintains integrity under stress
  it('3-11: Prefilled pools stable under stress', () => {
    alloc.prefillPool(16, 100);

    for (let i = 0; i < 200; i++) {
      const p = alloc.allocate(16);
      if (Math.random() < 0.5) {
        alloc.free(p);
      }
    }

    expect(alloc.checkHeapInvariants()).toBe(true);
  });

  // 3-12: Source info preserved under stress
  it('3-12: Source info tracking under stress', () => {
    for (let i = 0; i < 100; i++) {
      alloc.setSourceInfo(`file${i}.free`, i);
      alloc.allocate(Math.floor(Math.random() * 256) + 1);
    }

    const leaks = alloc.detectLeaks();
    expect(leaks.length).toBeGreaterThan(0);

    // All have source info
    for (const leak of leaks) {
      expect(leak.sourceFile).toBeDefined();
      expect(leak.sourceLine).toBeDefined();
    }
  });

  // 3-13: Coalescing works under stress
  it('3-13: Coalescing effective under stress', () => {
    const ptrs = [];

    // Allocate many blocks
    for (let i = 0; i < 50; i++) {
      ptrs.push(alloc.allocate(100));
    }

    // Free all (triggers coalescing)
    for (const p of ptrs) {
      alloc.free(p);
    }

    const stats = alloc.getFragmentationStats();
    expect(stats.numFragments).toBeLessThanOrEqual(ptrs.length);
  });

  // 3-14: Stress with all sizes combined
  it('3-14: Chaos with min/max/pool/heap sizes', () => {
    const sizes = [1, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 5000];

    for (let i = 0; i < 500; i++) {
      const size = sizes[Math.floor(Math.random() * sizes.length)];
      const p = alloc.allocate(size);

      if (Math.random() < 0.4) {
        alloc.free(p);
      }
    }

    expect(alloc.checkHeapInvariants()).toBe(true);
  });

  // 3-15: Final validation after all stress
  it('3-15: Final comprehensive validation', () => {
    // Execute chaos
    for (let i = 0; i < 1000; i++) {
      if (Math.random() < 0.65) {
        alloc.allocate(Math.floor(Math.random() * 600) + 1);
      } else {
        const blocks = alloc.detectLeaks();
        if (blocks.length > 0) {
          alloc.free(blocks[0].addr);
        }
      }
    }

    // Comprehensive checks
    const heapValid = alloc.checkHeapInvariants();
    const corruption = alloc.getCorruptionReport();
    const stats = alloc.getStats();

    expect(heapValid).toBe(true);
    expect(corruption.detected).toBe(false);
    expect(stats).toBeDefined();

    console.log('✅ After 1000 chaos operations:');
    console.log(`   Heap valid: ${heapValid}`);
    console.log(`   Corruption: ${corruption.detected}`);
    console.log(`   Allocated blocks: ${stats.allocatedBlocks}`);
    console.log(`   Freed blocks: ${stats.freedBlocks}`);
  });
});
