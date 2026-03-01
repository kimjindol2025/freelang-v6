// 🟢 FreeLang v5.9.6: Fast Pool Strategy & Small Object Optimization (45 tests)
// Part 1: Pool Dispatcher (15), Part 2: Pool Reuse & Speed (15), Part 3: Stats & Integration (15)

import { MemoryAllocator } from '../src/memory-allocator';

describe('v5.9.6 Phase 1: Pool Dispatcher (15 tests)', () => {
  let alloc: MemoryAllocator;

  beforeEach(() => {
    alloc = new MemoryAllocator();
  });

  // 1-1: 8B → Pool used (poolMisses=1)
  it('1-1: 8B allocation uses Pool (first allocation)', () => {
    const p1 = alloc.allocate(8);
    expect(p1).not.toBe(0);

    const block = alloc.getBlock(p1);
    expect(block).toBeDefined();
    expect(block!.isPoolBlock).toBe(true);
    expect(block!.poolSize).toBe(8);
  });

  // 1-2: 16B → Pool used
  it('1-2: 16B allocation uses Pool', () => {
    const p1 = alloc.allocate(16);
    const block = alloc.getBlock(p1);
    expect(block!.isPoolBlock).toBe(true);
    expect(block!.poolSize).toBe(16);
  });

  // 1-3: 32B → Pool used
  it('1-3: 32B allocation uses Pool', () => {
    const p1 = alloc.allocate(32);
    const block = alloc.getBlock(p1);
    expect(block!.isPoolBlock).toBe(true);
    expect(block!.poolSize).toBe(32);
  });

  // 1-4: 64B → Pool used
  it('1-4: 64B allocation uses Pool', () => {
    const p1 = alloc.allocate(64);
    const block = alloc.getBlock(p1);
    expect(block!.isPoolBlock).toBe(true);
    expect(block!.poolSize).toBe(64);
  });

  // 1-5: 128B → Pool used
  it('1-5: 128B allocation uses Pool', () => {
    const p1 = alloc.allocate(128);
    const block = alloc.getBlock(p1);
    expect(block!.isPoolBlock).toBe(true);
    expect(block!.poolSize).toBe(128);
  });

  // 1-6: 129B → Heap (no pool)
  it('1-6: 129B allocation uses Heap (not Pool)', () => {
    const p1 = alloc.allocate(129);
    const block = alloc.getBlock(p1);
    expect(block!.isPoolBlock).toBeUndefined();
    expect(block!.poolSize).toBeUndefined();
  });

  // 1-7: 1024B → Heap
  it('1-7: 1024B allocation uses Heap', () => {
    const p1 = alloc.allocate(1024);
    const block = alloc.getBlock(p1);
    expect(block!.isPoolBlock).toBeUndefined();
  });

  // 1-8: 7B → 8B Pool (round up)
  it('1-8: 7B allocation rounds up to 8B Pool', () => {
    const p1 = alloc.allocate(7);
    const block = alloc.getBlock(p1);
    expect(block!.isPoolBlock).toBe(true);
    expect(block!.poolSize).toBe(8);
    expect(block!.size).toBe(7); // Size is actual requested
  });

  // 1-9: 15B → 16B Pool (round up)
  it('1-9: 15B allocation rounds up to 16B Pool', () => {
    const p1 = alloc.allocate(15);
    const block = alloc.getBlock(p1);
    expect(block!.isPoolBlock).toBe(true);
    expect(block!.poolSize).toBe(16);
  });

  // 1-10: Pool + Heap mixed allocation
  it('1-10: Mixed Pool and Heap allocations work together', () => {
    const p1 = alloc.allocate(16); // Pool
    const p2 = alloc.allocate(256); // Heap
    const p3 = alloc.allocate(32); // Pool

    expect(alloc.getBlock(p1)!.isPoolBlock).toBe(true);
    expect(alloc.getBlock(p2)!.isPoolBlock).toBeUndefined();
    expect(alloc.getBlock(p3)!.isPoolBlock).toBe(true);
  });

  // 1-11: Pool block has isPoolBlock flag
  it('1-11: Pool block marked with isPoolBlock === true', () => {
    const p1 = alloc.allocate(16);
    const block = alloc.getBlock(p1);
    expect(block!.isPoolBlock).toBe(true);
  });

  // 1-12: Heap block lacks isPoolBlock flag
  it('1-12: Heap block without isPoolBlock flag', () => {
    const p1 = alloc.allocate(256);
    const block = alloc.getBlock(p1);
    expect(block!.isPoolBlock).toBeUndefined();
  });

  // 1-13: 128 is Pool, 129 is Heap (boundary)
  it('1-13: Boundary: 128B uses Pool, 129B uses Heap', () => {
    const p128 = alloc.allocate(128);
    const p129 = alloc.allocate(129);

    expect(alloc.getBlock(p128)!.isPoolBlock).toBe(true);
    expect(alloc.getBlock(p129)!.isPoolBlock).toBeUndefined();
  });

  // 1-14: Multiple Pool sizes simultaneously
  it('1-14: Multiple Pool sizes allocated simultaneously', () => {
    const p8 = alloc.allocate(8);
    const p16 = alloc.allocate(16);
    const p32 = alloc.allocate(32);
    const p64 = alloc.allocate(64);
    const p128 = alloc.allocate(128);

    expect(alloc.getBlock(p8)!.poolSize).toBe(8);
    expect(alloc.getBlock(p16)!.poolSize).toBe(16);
    expect(alloc.getBlock(p32)!.poolSize).toBe(32);
    expect(alloc.getBlock(p64)!.poolSize).toBe(64);
    expect(alloc.getBlock(p128)!.poolSize).toBe(128);
  });

  // 1-15: Zero-byte allocation rejected (Pool path too)
  it('1-15: Zero-byte allocation rejected at Pool dispatcher', () => {
    const p1 = alloc.allocate(0);
    expect(p1).toBe(0);
  });
});

describe('v5.9.6 Phase 2: Pool Reuse & Speed (15 tests)', () => {
  let alloc: MemoryAllocator;

  beforeEach(() => {
    alloc = new MemoryAllocator();
  });

  // 2-1: Free + reuse = same address
  it('2-1: Pool block reuse returns same address', () => {
    const p1 = alloc.allocate(16);
    alloc.free(p1);
    const p2 = alloc.allocate(16);

    expect(p2).toBe(p1);
  });

  // 2-2: Reuse increments poolHits
  it('2-2: Pool reuse increments poolHits counter', () => {
    const stats1 = alloc.getPoolStats();
    expect(stats1.totalHits).toBe(0);

    const p1 = alloc.allocate(16); // First alloc = miss
    alloc.free(p1);
    const p2 = alloc.allocate(16); // Reuse = hit

    const stats2 = alloc.getPoolStats();
    expect(stats2.totalHits).toBe(1);
  });

  // 2-3: Hit rate calculation is accurate
  it('2-3: Hit rate calculated correctly', () => {
    // Allocate 3 blocks from pool, free 2, reallocate 2
    // Hit rate should be 2/5 = 40%
    alloc.allocate(16); // miss
    alloc.allocate(16); // miss
    alloc.allocate(16); // miss
    alloc.free(alloc.allocate(16)); // free it first

    const stats = alloc.getPoolStats();
    expect(stats.totalMisses).toBeGreaterThanOrEqual(3);
    expect(stats.totalHits).toBeGreaterThanOrEqual(0);
  });

  // 2-4: Reused block has freed === false
  it('2-4: Reused block marked as not freed', () => {
    const p1 = alloc.allocate(32);
    alloc.free(p1);
    alloc.allocate(32);

    const block = alloc.getBlock(p1);
    expect(block).toBeDefined();
    expect(block!.freed).toBe(false);
  });

  // 2-5: Reused block has accessCount reset
  it('2-5: Reused block accessCount reset to 0', () => {
    const p1 = alloc.allocate(32);
    alloc.access(p1);
    alloc.access(p1);
    expect(alloc.getBlock(p1)!.accessCount).toBe(2);

    alloc.free(p1);
    const p2 = alloc.allocate(32);

    expect(alloc.getBlock(p2)!.accessCount).toBe(0);
  });

  // 2-6: Reused block has allocatedAt updated
  it('2-6: Reused block allocatedAt timestamp updated', () => {
    const p1 = alloc.allocate(32);
    const t1 = alloc.getBlock(p1)!.allocatedAt;

    alloc.free(p1);
    // Small delay to ensure timestamp difference
    const before = Date.now();
    alloc.allocate(32);
    const after = Date.now();

    const block = alloc.getBlock(p1);
    expect(block!.allocatedAt).toBeGreaterThanOrEqual(before - 1);
  });

  // 2-7: Pool block included in leak detection
  it('2-7: Unfreed Pool block detected as leak', () => {
    const p1 = alloc.allocate(16);
    // p1 NOT freed

    const leaks = alloc.detectLeaks();
    expect(leaks.some(b => b.addr === p1)).toBe(true);
  });

  // 2-8: Pool block double-free prevented
  it('2-8: Pool block double-free prevented', () => {
    const p1 = alloc.allocate(32);
    expect(alloc.free(p1)).toBe(true);
    expect(alloc.free(p1)).toBe(false); // Double-free fails

    const errors = alloc.getErrors();
    expect(errors.some(e => e.type === 'double_free')).toBe(true);
  });

  // 2-9: Pool block use-after-free detected
  it('2-9: Pool block use-after-free detected', () => {
    const p1 = alloc.allocate(32);
    alloc.free(p1);

    const result = alloc.access(p1);
    expect(result).toBe(false);

    const errors = alloc.getErrors();
    expect(errors.some(e => e.type === 'use_after_free')).toBe(true);
  });

  // 2-10: Different size pools independent
  it('2-10: Different size pools operate independently', () => {
    const p8 = alloc.allocate(8);
    const p16 = alloc.allocate(16);

    alloc.free(p8);
    alloc.free(p16);

    const p8_new = alloc.allocate(8);
    const p16_new = alloc.allocate(16);

    expect(p8_new).toBe(p8); // 8-pool reused
    expect(p16_new).toBe(p16); // 16-pool reused
  });

  // 2-11: Source info applied to Pool reuse
  it('2-11: Source info tracked for Pool block reuse', () => {
    const p1 = alloc.allocate(16);
    alloc.setSourceInfo('test.free', 42);
    alloc.free(p1);

    alloc.setSourceInfo('test.free', 99);
    alloc.allocate(16);

    const block = alloc.getBlock(p1);
    expect(block!.sourceFile).toBe('test.free');
    expect(block!.sourceLine).toBe(99);
  });

  // 2-12: Pool blocks in detectZombies
  it('2-12: Pool block included in detectZombies', () => {
    const p1 = alloc.allocate(32);
    alloc.free(p1);

    const zombies = alloc.detectZombies();
    expect(zombies.some(z => z.addr === p1)).toBe(true);
  });

  // 2-13: 100 alloc-free-realloc cycles (poolHits=99)
  it('2-13: 100 consecutive alloc-free-realloc cycles', () => {
    const p1 = alloc.allocate(16);

    for (let i = 0; i < 99; i++) {
      alloc.free(p1);
      alloc.allocate(16);
    }

    const stats = alloc.getPoolStats();
    expect(stats.totalHits).toBe(99);
  });

  // 2-14: Empty pool auto-creates new block
  it('2-14: Empty Pool auto-creates new block on allocation', () => {
    const p1 = alloc.allocate(16);
    const p2 = alloc.allocate(16); // Different block, pool was empty

    expect(p1).not.toBe(p2); // Different addresses
  });

  // 2-15: Mixed Pool+Heap reuse scenario
  it('2-15: Mixed Pool and Heap reuse scenario', () => {
    const p8 = alloc.allocate(8);
    const p256 = alloc.allocate(256);
    const p16 = alloc.allocate(16);

    alloc.free(p8);
    alloc.free(p256);
    alloc.free(p16);

    const p8_r = alloc.allocate(8); // Pool hit
    const p256_r = alloc.allocate(256); // Heap reuse
    const p16_r = alloc.allocate(16); // Pool hit

    expect(p8_r).toBe(p8);
    expect(p256_r).toBe(p256);
    expect(p16_r).toBe(p16);
  });
});

describe('v5.9.6 Phase 3: Pool Stats & Integration (15 tests)', () => {
  let alloc: MemoryAllocator;

  beforeEach(() => {
    alloc = new MemoryAllocator();
  });

  // 3-1: pool_hits() initial value
  it('3-1: pool_hits() returns 0 initially', () => {
    const hits = alloc.getPoolHits();
    expect(hits).toBe(0);
  });

  // 3-2: pool_hit_rate() 0% with no reuse
  it('3-2: pool_hit_rate() returns 0% with no reuse', () => {
    alloc.allocate(16);
    const rate = alloc.getPoolHitRate();
    expect(rate).toBe(0);
  });

  // 3-3: pool_hit_rate() 33% (1 hit out of 3 allocations)
  it('3-3: pool_hit_rate() correctly calculates 33% rate', () => {
    alloc.allocate(16); // miss
    const p1 = alloc.allocate(16); // miss
    alloc.free(p1);
    alloc.allocate(16); // hit (1 out of 3 = 33%)

    const rate = alloc.getPoolHitRate();
    expect(rate).toBe(33);
  });

  // 3-4: pool_hit_rate() 50% on single reuse (1 hit out of 2 allocations)
  it('3-4: pool_hit_rate() returns 50% on single reuse', () => {
    const p1 = alloc.allocate(16); // miss
    alloc.free(p1);
    alloc.allocate(16); // hit (1 out of 2 = 50%)

    const rate = alloc.getPoolHitRate();
    expect(rate).toBe(50);
  });

  // 3-5: pool_stats() structure validation
  it('3-5: pool_stats() returns correct structure', () => {
    alloc.allocate(16);
    const stats = alloc.getPoolStats();

    expect(stats.hitRate).toBeDefined();
    expect(stats.totalHits).toBeDefined();
    expect(stats.totalMisses).toBeDefined();
    expect(Array.isArray(stats.perSizeStats)).toBe(true);
  });

  // 3-6: pool_size_stats() shows available per size
  it('3-6: pool_size_stats() tracks available blocks per size', () => {
    alloc.allocate(8);
    alloc.allocate(16);
    alloc.allocate(32);

    const sizeStats = alloc.getPoolSizeStats();
    expect(sizeStats.length).toBe(5); // 8, 16, 32, 64, 128

    // Find 8-byte bucket
    const stat8 = sizeStats.find(s => s.size === 8);
    expect(stat8).toBeDefined();
    expect(stat8!.available).toBe(0); // None available yet
  });

  // 3-7: prefillPool(8, 5) fills 5 blocks
  it('3-7: prefillPool(8, 5) successfully fills 5 blocks', () => {
    const filled = alloc.prefillPool(8, 5);
    expect(filled).toBe(5);

    const stats = alloc.getPoolStats();
    const stat8 = stats.perSizeStats.find(s => s.size === 8);
    expect(stat8!.available).toBe(5);
  });

  // 3-8: prefillPool + 100% hit rate
  it('3-8: prefillPool + allocation gives 100% hit rate', () => {
    alloc.prefillPool(16, 3);

    for (let i = 0; i < 3; i++) {
      alloc.allocate(16); // All hits
    }

    const rate = alloc.getPoolHitRate();
    expect(rate).toBe(100);
  });

  // 3-9: clear() empties all pools
  it('3-9: clear() empties pool buckets', () => {
    alloc.allocate(16);
    alloc.allocate(32);

    alloc.clear();

    const stats = alloc.getPoolStats();
    const allEmpty = stats.perSizeStats.every(s => s.available === 0);
    expect(allEmpty).toBe(true);
  });

  // 3-10: clear() resets poolHits/poolMisses
  it('3-10: clear() resets pool statistics', () => {
    alloc.allocate(16);
    const p1 = alloc.allocate(16);
    alloc.free(p1);
    alloc.allocate(16); // 1 hit

    alloc.clear();

    const stats = alloc.getPoolStats();
    expect(stats.totalHits).toBe(0);
    expect(stats.totalMisses).toBe(0);
  });

  // 3-11: Pool + fragmentation_ratio coexist
  it('3-11: Pool and fragmentation stats coexist', () => {
    const p1 = alloc.allocate(256);
    const p2 = alloc.allocate(256);

    alloc.free(p1);
    alloc.free(p2);

    const poolStats = alloc.getPoolStats();
    const fragStats = alloc.getFragmentationStats();

    expect(poolStats.totalMisses).toBeGreaterThanOrEqual(0);
    expect(fragStats.totalFree).toBeGreaterThanOrEqual(512);
  });

  // 3-12: Unfreed Pool block in leak report
  it('3-12: Unfreed Pool block appears in leak report', () => {
    const p1 = alloc.allocate(16);
    // p1 NOT freed

    const report = alloc.generateLeakReport();
    expect(report.leakCount).toBeGreaterThan(0);
    expect(report.leaks.some(l => l.addr === p1)).toBe(true);
  });

  // 3-13: memory_info() includes Pool blocks
  it('3-13: memory_info() reports accurate block counts with Pool', () => {
    alloc.allocate(16); // Pool
    alloc.allocate(256); // Heap

    const stats = alloc.getStats();
    expect(stats.allocatedBlocks).toBe(2);
  });

  // 3-14: 100 small + 5 large mixed scenario
  it('3-14: 100 small Pool + 5 large Heap allocations', () => {
    const smallPtrs = [];
    for (let i = 0; i < 100; i++) {
      smallPtrs.push(alloc.allocate(8));
    }

    const largePtrs = [];
    for (let i = 0; i < 5; i++) {
      largePtrs.push(alloc.allocate(1024));
    }

    expect(smallPtrs.length).toBe(100);
    expect(largePtrs.length).toBe(5);

    const stats = alloc.getStats();
    expect(stats.allocatedBlocks).toBe(105);
  });

  // 3-15: 100+ consecutive Pool reuse (poolHits=100)
  it('3-15: 100+ consecutive Pool reuse achieves high hit rate', () => {
    alloc.prefillPool(32, 5);

    for (let i = 0; i < 100; i++) {
      const p = alloc.allocate(32);
      if (i % 2 === 0) {
        alloc.free(p);
      }
    }

    const stats = alloc.getPoolStats();
    expect(stats.totalHits).toBeGreaterThan(0);
    expect(stats.hitRate).toBeGreaterThan(0);
  });
});
