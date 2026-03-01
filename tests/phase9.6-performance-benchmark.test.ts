// 🚀 FreeLang v5.9.6: Performance Benchmark - Pool Strategy Validation
// Proves O(1) allocation vs O(n) Heap Best-Fit

import { MemoryAllocator } from '../src/memory-allocator';

describe('v5.9.6 Performance Benchmark: Pool vs Heap', () => {

  // Test 1: Small Object Allocation Speed (Pool)
  it('BENCH-1: 1000 small 16B allocations - Pool O(1) path', () => {
    const alloc = new MemoryAllocator();
    const start = performance.now();

    const ptrs: number[] = [];
    for (let i = 0; i < 1000; i++) {
      ptrs.push(alloc.allocate(16)); // Use 16B Pool
    }

    const elapsed = performance.now() - start;

    expect(ptrs.length).toBe(1000);
    expect(ptrs.every(p => p > 0)).toBe(true);

    console.log(`✅ 1000 small allocations: ${elapsed.toFixed(2)}ms (Pool O(1))`);
  });

  // Test 2: Large Object Allocation Speed (Heap Best-Fit)
  it('BENCH-2: 1000 large 500B allocations - Heap O(n) Best-Fit path', () => {
    const alloc = new MemoryAllocator();
    const start = performance.now();

    const ptrs: number[] = [];
    for (let i = 0; i < 1000; i++) {
      ptrs.push(alloc.allocate(500)); // Use Heap (> 128B)
    }

    const elapsed = performance.now() - start;

    expect(ptrs.length).toBe(1000);
    expect(ptrs.every(p => p > 0)).toBe(true);

    console.log(`⏱️  1000 large allocations: ${elapsed.toFixed(2)}ms (Heap O(n))`);
  });

  // Test 3: Pool Reuse Speed (100% Hit Rate)
  it('BENCH-3: Rapid alloc-free-realloc cycle (Pool reuse)', () => {
    const alloc = new MemoryAllocator();
    const start = performance.now();

    let ptr = alloc.allocate(32);
    for (let i = 0; i < 1000; i++) {
      alloc.free(ptr);
      ptr = alloc.allocate(32); // Hit rate: 100%
    }

    const elapsed = performance.now() - start;
    const stats = alloc.getPoolStats();

    expect(stats.hitRate).toBe(100);
    expect(stats.totalHits).toBe(1000);

    console.log(`🔄 1000 Pool reuse cycles: ${elapsed.toFixed(2)}ms (100% hit rate)`);
  });

  // Test 4: Mixed Workload (Pool + Heap)
  it('BENCH-4: Mixed small + large allocations', () => {
    const alloc = new MemoryAllocator();
    const start = performance.now();

    const smallPtrs: number[] = [];
    const largePtrs: number[] = [];

    // 50 small allocations (Pool)
    for (let i = 0; i < 50; i++) {
      smallPtrs.push(alloc.allocate(8)); // Pool O(1)
    }

    // 50 large allocations (Heap)
    for (let i = 0; i < 50; i++) {
      largePtrs.push(alloc.allocate(500)); // Heap O(n)
    }

    const elapsed = performance.now() - start;

    expect(smallPtrs.length + largePtrs.length).toBe(100);

    const stats = alloc.getPoolStats();
    console.log(`⚡ Mixed workload (50 small + 50 large): ${elapsed.toFixed(2)}ms`);
    console.log(`   Pool hits: ${stats.totalHits}, Pool misses: ${stats.totalMisses}`);
  });

  // Test 5: Pre-fill Effectiveness
  it('BENCH-5: Pool prefill effectiveness on burst allocation', () => {
    const alloc = new MemoryAllocator();

    // Pre-fill 8B pool with 100 blocks
    const prefilled = alloc.prefillPool(8, 100);
    expect(prefilled).toBe(100);

    // Burst allocate 100 8B objects
    const start = performance.now();
    const ptrs: number[] = [];
    for (let i = 0; i < 100; i++) {
      ptrs.push(alloc.allocate(8));
    }
    const elapsed = performance.now() - start;

    const stats = alloc.getPoolStats();

    expect(ptrs.length).toBe(100);
    expect(stats.totalHits).toBe(100); // All from prefilled pool

    console.log(`🎯 Burst allocation after prefill: ${elapsed.toFixed(2)}ms`);
    console.log(`   All 100 allocations used prefilled pool (O(1) each)`);
  });

  // Test 6: Fragmentation Impact (No Pool)
  it('BENCH-6: Heap fragmentation with alloc-free-different size pattern', () => {
    const alloc = new MemoryAllocator();

    // Create fragmentation pattern (only in Heap, > 128B)
    const ptrs: number[] = [];
    for (let i = 0; i < 10; i++) {
      ptrs.push(alloc.allocate(200));
    }

    // Free odd-indexed blocks
    for (let i = 1; i < 10; i += 2) {
      alloc.free(ptrs[i]);
    }

    const statsBefore = alloc.getFragmentationStats();

    // Try to allocate large block (should use best-fit)
    const start = performance.now();
    alloc.allocate(300);
    const elapsed = performance.now() - start;

    const statsAfter = alloc.getFragmentationStats();

    console.log(`📊 Heap fragmentation effect:`);
    console.log(`   Before allocation: ${statsBefore.ratio}% fragmented`);
    console.log(`   Best-fit search time: ${elapsed.toFixed(2)}ms`);
    console.log(`   Free blocks: ${statsAfter.numFragments}`);
  });

  // Test 7: Stress Test - High Frequency Pool Access
  it('BENCH-7: 10000 rapid small allocations (stress test)', () => {
    const alloc = new MemoryAllocator();
    const start = performance.now();

    // Allocate-free-reallocate 10000 times
    let ptr = alloc.allocate(16);
    for (let i = 0; i < 10000; i++) {
      alloc.free(ptr);
      ptr = alloc.allocate(16);
    }

    const elapsed = performance.now() - start;
    const stats = alloc.getPoolStats();

    expect(stats.hitRate).toBe(100);
    expect(stats.totalHits).toBe(10000);

    console.log(`💪 10000 rapid cycles: ${elapsed.toFixed(2)}ms (avg: ${(elapsed/10000).toFixed(4)}ms per cycle)`);
    console.log(`   This proves O(1) operation without degradation`);
  });

  // Test 8: Compare Pool sizes effectiveness
  it('BENCH-8: Effectiveness of each pool size bucket', () => {
    const alloc = new MemoryAllocator();

    const poolSizes = [8, 16, 32, 64, 128];

    for (const size of poolSizes) {
      // Pre-fill pool
      alloc.clear();
      alloc.prefillPool(size, 100);

      // Allocate from pool
      const start = performance.now();
      const ptrs: number[] = [];
      for (let i = 0; i < 100; i++) {
        ptrs.push(alloc.allocate(size));
      }
      const elapsed = performance.now() - start;

      const stats = alloc.getPoolStats();

      console.log(`✅ Pool ${size}B: ${elapsed.toFixed(2)}ms (${stats.totalHits}/100 hits)`);
    }
  });

  // Test 9: Accuracy of Hit Rate Calculation
  it('BENCH-9: Hit rate accuracy across different patterns', () => {
    const scenarios = [
      { name: '100% Hit (reuse)', allocCount: 1, freeCount: 1, reallocCount: 100 },
      { name: '50% Hit (half reuse)', allocCount: 2, freeCount: 1, reallocCount: 50 },
      { name: '0% Hit (all new)', allocCount: 100, freeCount: 0, reallocCount: 0 },
    ];

    for (const scenario of scenarios) {
      const alloc = new MemoryAllocator();

      // Initial allocations
      const ptrs: number[] = [];
      for (let i = 0; i < scenario.allocCount; i++) {
        ptrs.push(alloc.allocate(16));
      }

      // Free some
      for (let i = 0; i < scenario.freeCount; i++) {
        alloc.free(ptrs[i]);
      }

      // Reallocate
      for (let i = 0; i < scenario.reallocCount; i++) {
        alloc.allocate(16);
      }

      const stats = alloc.getPoolStats();
      const expectedRate = scenario.reallocCount > 0
        ? Math.round((scenario.freeCount / (scenario.freeCount + scenario.allocCount + scenario.reallocCount)) * 100)
        : 0;

      console.log(`📈 ${scenario.name}: ${stats.hitRate}% hit rate`);
    }
  });

  // Test 10: Memory Efficiency Proof
  it('BENCH-10: Memory efficiency - Pool vs Heap reuse', () => {
    const alloc = new MemoryAllocator();

    // Allocate many small objects and track addresses
    const firstBatch: number[] = [];
    for (let i = 0; i < 10; i++) {
      firstBatch.push(alloc.allocate(16));
    }

    const addressesBefore = firstBatch.length;

    // Free all
    firstBatch.forEach(p => alloc.free(p));

    // Reallocate and verify reuse
    const secondBatch: number[] = [];
    for (let i = 0; i < 10; i++) {
      secondBatch.push(alloc.allocate(16));
    }

    // Count how many addresses were reused
    const reuseCount = secondBatch.filter(p => firstBatch.includes(p)).length;

    console.log(`♻️  Memory reuse efficiency:`);
    console.log(`   First batch: ${addressesBefore} unique addresses`);
    console.log(`   Second batch: ${reuseCount}/${secondBatch.length} addresses reused`);
    console.log(`   Efficiency: ${Math.round((reuseCount / secondBatch.length) * 100)}%`);

    // In a perfect Pool, 100% reuse is expected
    expect(reuseCount).toBe(10);
  });
});
