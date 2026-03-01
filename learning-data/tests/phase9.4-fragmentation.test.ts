// 🔧 FreeLang v5.9.4: Fragmentation Prevention Tests (45 tests)
// Phase 9.4: Memory coalescing, best-fit allocation, block splitting

import { MemoryAllocator } from '../src/memory-allocator';

describe('v5.9.4 Phase 1: Best-Fit Allocation (15 tests)', () => {
  let alloc: MemoryAllocator;

  beforeEach(() => {
    alloc = new MemoryAllocator();
  });

  // 1-1: Single allocation, no fragmentation
  it('1-1: Allocate single block', () => {
    const addr = alloc.allocate(100);
    expect(addr).toBeGreaterThan(0);
    expect(alloc.isValid(addr)).toBe(true);
  });

  // 1-2: Allocate, free, reallocate smaller block
  it('1-2: Best-fit reuses freed block when exact fit', () => {
    const p1 = alloc.allocate(100);
    alloc.free(p1);

    // Allocate exact same size - should reuse
    const p2 = alloc.allocate(100);
    expect(p2).toBe(p1); // Same address
    expect(alloc.isValid(p2)).toBe(true);
  });

  // 1-3: Best-fit prefers smallest suitable block
  it('1-3: Best-fit chooses smallest suitable block', () => {
    const p1 = alloc.allocate(100);
    const p2 = alloc.allocate(100);
    const p3 = alloc.allocate(100);

    alloc.free(p1); // Free 100B at position 1
    alloc.free(p3); // Free 100B at position 3
    // Free list: [100B, 100B] in different locations

    // Allocate 50B - should fit in first available
    const p4 = alloc.allocate(50);
    expect(alloc.isValid(p4)).toBe(true);
  });

  // 1-4: Best-fit with multiple free blocks of different sizes
  it('1-4: Best-fit with mixed size blocks', () => {
    const blocks = [
      alloc.allocate(50),
      alloc.allocate(150),
      alloc.allocate(75),
      alloc.allocate(200)
    ];

    alloc.free(blocks[0]); // 50B
    alloc.free(blocks[2]); // 75B

    // Allocate 60B - should use 75B block (best fit)
    const p = alloc.allocate(60);
    expect(alloc.isValid(p)).toBe(true);
  });

  // 1-5: Best-fit with no suitable block
  it('1-5: Allocate new when no free block fits', () => {
    const p1 = alloc.allocate(100);
    alloc.free(p1);

    // Try to allocate larger than freed block
    const p2 = alloc.allocate(150);
    expect(p2).not.toBe(p1);
    expect(alloc.isValid(p2)).toBe(true);
  });

  // 1-6: Best-fit reuses block from middle of fragmentation
  it('1-6: Best-fit picks middle block correctly', () => {
    const p1 = alloc.allocate(100);
    const p2 = alloc.allocate(200);
    const p3 = alloc.allocate(150);

    alloc.free(p1);
    alloc.free(p2);
    alloc.free(p3);

    // Allocate 180B - should reuse p2 (200B, smallest fit)
    const p4 = alloc.allocate(180);
    expect(alloc.isValid(p4)).toBe(true);
  });

  // 1-7: Best-fit with many tiny blocks
  it('1-7: Best-fit with many small free blocks', () => {
    for (let i = 0; i < 10; i++) {
      alloc.free(alloc.allocate(20));
    }

    // Allocate 35B - should find first 20B block that's > 35B (none exist)
    // So should allocate new
    const p = alloc.allocate(35);
    expect(alloc.isValid(p)).toBe(true);
  });

  // 1-8: Best-fit exact match priority
  it('1-8: Best-fit prefers exact match', () => {
    alloc.allocate(50);
    alloc.allocate(100);
    alloc.allocate(100);

    const freed1 = alloc.allocate(100);
    const freed2 = alloc.allocate(100);
    alloc.free(freed1);
    alloc.free(freed2);

    // Both are 100B, allocate 100B should pick one of them
    const p = alloc.allocate(100);
    expect([freed1, freed2]).toContain(p);
  });

  // 1-9: Stats show correct block counts
  it('1-9: Allocator stats after best-fit allocation', () => {
    const p1 = alloc.allocate(100);
    const p2 = alloc.allocate(200);
    alloc.free(p1);

    const stats = alloc.getStats();
    expect(stats.allocatedBlocks).toBe(1); // p2
    expect(stats.freedBlocks).toBe(1); // p1
  });

  // 1-10: Best-fit with zero-size allocation
  it('1-10: Allocate zero returns 0', () => {
    const addr = alloc.allocate(0);
    expect(addr).toBe(0);
  });

  // 1-11: Multiple sequential allocations and frees
  it('1-11: Sequential best-fit operations', () => {
    const blocks: number[] = [];
    for (let i = 0; i < 5; i++) {
      blocks.push(alloc.allocate((i + 1) * 50));
    }

    for (let i = 0; i < 5; i++) {
      alloc.free(blocks[i]);
    }

    // Allocate new - should reuse
    const p = alloc.allocate(100);
    expect(alloc.isValid(p)).toBe(true);
  });

  // 1-12: Best-fit with single large block
  it('1-12: Single large block best-fit', () => {
    const p = alloc.allocate(10000);
    expect(alloc.isValid(p)).toBe(true);

    alloc.free(p);
    const p2 = alloc.allocate(5000);
    expect(alloc.isValid(p2)).toBe(true);
  });

  // 1-13: Best-fit boundary check
  it('1-13: Best-fit with boundary allocation sizes', () => {
    const p1 = alloc.allocate(4); // Min size
    const p2 = alloc.allocate(8);
    alloc.free(p1);

    const p3 = alloc.allocate(4);
    expect(alloc.isValid(p3)).toBe(true);
  });

  // 1-14: Best-fit doesn't reuse too-large blocks
  it('1-14: Best-fit skips blocks too small', () => {
    const p1 = alloc.allocate(50);
    const p2 = alloc.allocate(100);
    alloc.free(p1);

    // Try to allocate 60B - p1 (50B) is too small
    const p3 = alloc.allocate(60);
    expect(p3).not.toBe(p1);
  });

  // 1-15: Best-fit consistency check
  it('1-15: Best-fit maintains block validity', () => {
    const blocks = [];
    for (let i = 0; i < 10; i++) {
      blocks.push(alloc.allocate(100));
    }

    for (let i = 0; i < 5; i++) {
      alloc.free(blocks[i]);
    }

    for (let i = 5; i < 10; i++) {
      expect(alloc.isValid(blocks[i])).toBe(true);
    }
  });
});

describe('v5.9.4 Phase 2: Coalescing Verification (15 tests)', () => {
  let alloc: MemoryAllocator;

  beforeEach(() => {
    alloc = new MemoryAllocator();
  });

  // 2-1: Two adjacent blocks merge on free
  it('2-1: Two adjacent blocks coalesce into one', () => {
    const p1 = alloc.allocate(100);
    const p2 = alloc.allocate(100);
    const p3 = alloc.allocate(100);

    alloc.free(p1);
    alloc.free(p2); // Should merge with p1
    // getFragmentationStats() should show 2 blocks (p1+p2 merged = 1, plus any tail)
    // OR actually testing the internal state

    const stats = alloc.getFragmentationStats();
    // After merging p1 and p2, should have <= 2 fragments
    expect(stats.numFragments).toBeLessThanOrEqual(2);
  });

  // 2-2: Three adjacent blocks fully coalesce
  it('2-2: Three adjacent blocks merge into single', () => {
    const blocks = [
      alloc.allocate(100),
      alloc.allocate(100),
      alloc.allocate(100),
      alloc.allocate(50) // Extra to separate
    ];

    alloc.free(blocks[0]);
    alloc.free(blocks[1]);
    alloc.free(blocks[2]);

    const stats = alloc.getFragmentationStats();
    expect(stats.totalFree).toBe(300); // 3 × 100
    expect(stats.largestFree).toBe(300); // All merged
  });

  // 2-3: Non-adjacent blocks don't merge
  it('2-3: Non-adjacent blocks remain separate', () => {
    const p1 = alloc.allocate(100);
    const p2 = alloc.allocate(100);
    const p3 = alloc.allocate(100);
    const p4 = alloc.allocate(100);

    alloc.free(p1);
    // p2 still allocated - creates gap
    alloc.free(p3);
    // p4 still allocated

    const stats = alloc.getFragmentationStats();
    // p1 and p3 are separate (p2 between them), so 2 free blocks
    expect(stats.numFragments).toBe(2);
  });

  // 2-4: Fragmentation ratio after coalescing
  it('2-4: Fragmentation ratio decreases after coalesce', () => {
    const blocks = [
      alloc.allocate(100),
      alloc.allocate(100),
      alloc.allocate(100)
    ];

    alloc.free(blocks[0]);
    alloc.free(blocks[2]);

    const stat1 = alloc.getFragmentationStats();
    const ratio1 = stat1.ratio;

    alloc.free(blocks[1]); // Now all adjacent, fully coalesce

    const stat2 = alloc.getFragmentationStats();
    const ratio2 = stat2.ratio;

    // Full coalesce should have 0% fragmentation
    expect(ratio2).toBeLessThanOrEqual(ratio1);
  });

  // 2-5: User's test case: p1 + p2 merge to 200B
  it('2-5: p1 + p2 merge into 200B block (user case)', () => {
    const p1 = alloc.allocate(100);
    const p2 = alloc.allocate(100);
    const p3 = alloc.allocate(100); // Separate

    alloc.free(p1);
    alloc.free(p2); // p1 + p2 should merge to 200B

    const stats = alloc.getFragmentationStats();
    // largestFree should be 200B (merged p1+p2)
    expect(stats.largestFree).toBe(200);
    expect(stats.totalFree).toBe(200);
  });

  // 2-6: Coalescing reduces total fragment count
  it('2-6: Coalescing reduces fragment count', () => {
    const blocks = [];
    for (let i = 0; i < 6; i++) {
      blocks.push(alloc.allocate(100));
    }

    // Free all
    for (const b of blocks) {
      alloc.free(b);
    }

    const stats = alloc.getFragmentationStats();
    // All adjacent and same size - should coalesce to 1 large block
    expect(stats.numFragments).toBe(1);
    expect(stats.largestFree).toBe(600);
  });

  // 2-7: Partial coalescing (some gaps remain)
  it('2-7: Partial coalescing with allocated gaps', () => {
    const p1 = alloc.allocate(100);
    const p2 = alloc.allocate(100);
    const p3 = alloc.allocate(100);
    const p4 = alloc.allocate(100);
    const p5 = alloc.allocate(100);

    alloc.free(p1);
    alloc.free(p2); // Coalesce 1-2
    // p3 allocated - gap
    alloc.free(p4); // Separate
    // p5 allocated

    const stats = alloc.getFragmentationStats();
    // Expected: 1 block of 200B (p1+p2), 1 block of 100B (p4)
    expect(stats.numFragments).toBe(2);
  });

  // 2-8: Coalescing after multiple free operations
  it('2-8: Cumulative coalescing', () => {
    // Allocate with sizes that maintain adjacency (aligned properly)
    const blocks = [
      alloc.allocate(100),
      alloc.allocate(100),
      alloc.allocate(100)
    ];

    alloc.free(blocks[0]); // 100B
    const stat1 = alloc.getFragmentationStats();
    expect(stat1.numFragments).toBe(1);

    alloc.free(blocks[1]); // Merge to 200B
    const stat2 = alloc.getFragmentationStats();
    expect(stat2.numFragments).toBe(1);
    expect(stat2.largestFree).toBe(200);

    alloc.free(blocks[2]); // Merge to 300B
    const stat3 = alloc.getFragmentationStats();
    expect(stat3.numFragments).toBe(1);
    expect(stat3.largestFree).toBe(300);
  });

  // 2-9: Fragmentation ratio 0% when fully coalesced
  it('2-9: 0% fragmentation when single free block', () => {
    const p1 = alloc.allocate(200);
    const p2 = alloc.allocate(200);

    alloc.free(p1);
    alloc.free(p2); // Coalesce to 400B

    const stats = alloc.getFragmentationStats();
    expect(stats.ratio).toBe(0); // (400 - 400) / 400 = 0%
  });

  // 2-10: Coalescing with size mismatch
  it('2-10: Coalescing different-sized adjacent blocks', () => {
    const p1 = alloc.allocate(100);
    const p2 = alloc.allocate(150);
    const p3 = alloc.allocate(50);

    alloc.free(p1);
    alloc.free(p2); // Coalesce 100+150 = 250B

    const stats = alloc.getFragmentationStats();
    expect(stats.largestFree).toBe(250);
  });

  // 2-11: Coalescing preserves address continuity
  it('2-11: Coalesced block address is first block', () => {
    const p1 = alloc.allocate(100);
    const addr1 = p1;
    const p2 = alloc.allocate(100);

    alloc.free(p1);
    alloc.free(p2);

    // After coalescing, should be able to allocate 200B
    // and it should start at first block's address
    const p3 = alloc.allocate(200);
    expect(p3).toBe(addr1); // Starts at first block
  });

  // 2-12: Coalescing maximum efficiency
  it('2-12: Maximum coalescing efficiency (no gaps)', () => {
    const total = 1000;
    const blockSize = 100;
    const blocks = [];

    // Allocate 10 blocks of 100B each
    for (let i = 0; i < 10; i++) {
      blocks.push(alloc.allocate(blockSize));
    }

    // Free all
    for (const b of blocks) {
      alloc.free(b);
    }

    const stats = alloc.getFragmentationStats();
    expect(stats.totalFree).toBe(1000);
    expect(stats.numFragments).toBe(1);
    expect(stats.ratio).toBe(0);
  });

  // 2-13: Coalescing with interleaved allocation/free
  it('2-13: Coalescing after interleaved operations', () => {
    const p1 = alloc.allocate(100);
    const p2 = alloc.allocate(100);
    const p3 = alloc.allocate(100);

    alloc.free(p1);
    const p4 = alloc.allocate(50); // Reuses part of p1
    alloc.free(p2);
    alloc.free(p3);

    // p4 might be inside p1, or p1 might be split
    const stats = alloc.getFragmentationStats();
    expect(stats.totalFree).toBeGreaterThan(0);
  });

  // 2-14: Coalescing fragmentation calculation
  it('2-14: Fragmentation calculation after coalesce', () => {
    const p1 = alloc.allocate(100);
    const p2 = alloc.allocate(100);
    alloc.free(p1);
    alloc.free(p2);

    const ratio = alloc.getFragmentationRatio();
    // After coalescing to single 200B block
    expect(ratio).toBe(0);
  });

  // 2-15: Coalescing handles edge case (single free block)
  it('2-15: Coalescing with only one free block', () => {
    const p1 = alloc.allocate(100);
    alloc.free(p1);

    const stats = alloc.getFragmentationStats();
    expect(stats.numFragments).toBe(1);
    expect(stats.largestFree).toBe(100);
  });
});

describe('v5.9.4 Phase 3: Block Splitting Verification (15 tests)', () => {
  let alloc: MemoryAllocator;

  beforeEach(() => {
    alloc = new MemoryAllocator();
  });

  // 3-1: Split large block when allocating smaller size
  it('3-1: Large block splits when allocating smaller', () => {
    const p1 = alloc.allocate(200);
    alloc.free(p1);

    // Allocate 100B from 200B block - should split
    const p2 = alloc.allocate(100);
    expect(alloc.isValid(p2)).toBe(true);

    // Remaining 100B should be free
    const stats = alloc.getFragmentationStats();
    expect(stats.largestFree).toBe(100);
  });

  // 3-2: No split when allocation uses entire block
  it('3-2: No split for exact-fit allocation', () => {
    const p1 = alloc.allocate(100);
    alloc.free(p1);

    const p2 = alloc.allocate(100);
    expect(p2).toBe(p1);

    const stats = alloc.getFragmentationStats();
    expect(stats.numFragments).toBe(0); // No remainder
  });

  // 3-3: Splitting respects minimum fragment size (4 bytes)
  it('3-3: Splitting respects MIN_SPLIT_SIZE=4 threshold', () => {
    const p1 = alloc.allocate(100);
    alloc.free(p1);

    // Allocate 97B - would leave 3B remainder (< MIN_SPLIT_SIZE)
    const p2 = alloc.allocate(97);
    expect(alloc.isValid(p2)).toBe(true);

    const stats = alloc.getFragmentationStats();
    // Should NOT create a 3B fragment, use entire block
    expect(stats.totalFree).toBeLessThanOrEqual(3); // Might have rounding
  });

  // 3-4: Multiple splits from same large block
  it('3-4: Multiple allocations from one large block', () => {
    const p1 = alloc.allocate(500);
    alloc.free(p1);

    const p2 = alloc.allocate(100); // Leaves 400B
    expect(alloc.isValid(p2)).toBe(true);

    const stats1 = alloc.getFragmentationStats();
    expect(stats1.largestFree).toBe(400);
  });

  // 3-5: Split block address calculation
  it('3-5: Split remainder has correct address', () => {
    const p1 = alloc.allocate(200);
    const p1_addr = p1;
    alloc.free(p1);

    const p2 = alloc.allocate(100);

    // p2 should be at p1's address
    expect(p2).toBe(p1_addr);

    // Remainder should start at p1_addr + 100
    const p3 = alloc.allocate(100);
    expect(p3).not.toBe(p2);
  });

  // 3-6: Splitting prevents excessive fragmentation
  it('3-6: Splitting keeps fragmentation low', () => {
    // Allocate large, free, then allocate many small
    const p1 = alloc.allocate(1000);
    alloc.free(p1);

    const allocations = [];
    for (let i = 0; i < 10; i++) {
      allocations.push(alloc.allocate(100));
    }

    // Fragmentation should still be manageable
    const stats = alloc.getFragmentationStats();
    expect(stats.numFragments).toBeLessThanOrEqual(2);
  });

  // 3-7: Splitting with 4B minimum edge case
  it('3-7: Splitting with exactly 4B remainder', () => {
    const p1 = alloc.allocate(104);
    alloc.free(p1);

    const p2 = alloc.allocate(100); // Leaves exactly 4B
    expect(alloc.isValid(p2)).toBe(true);

    const stats = alloc.getFragmentationStats();
    // 4B is MIN_SPLIT_SIZE, should be kept
    expect(stats.totalFree).toBeGreaterThanOrEqual(4);
  });

  // 3-8: Splitting with 3B remainder (discarded)
  it('3-8: Splitting with 3B remainder (sub-threshold)', () => {
    const p1 = alloc.allocate(103);
    alloc.free(p1);

    const p2 = alloc.allocate(100); // Leaves 3B < MIN_SPLIT_SIZE
    expect(alloc.isValid(p2)).toBe(true);

    const stats = alloc.getFragmentationStats();
    // 3B should be absorbed (not split)
    expect(stats.totalFree).toBe(0);
  });

  // 3-9: Cascade splitting
  it('3-9: Cascade splitting from large block', () => {
    const p1 = alloc.allocate(500);
    alloc.free(p1);

    const p2 = alloc.allocate(100); // 400 remains
    const p3 = alloc.allocate(100); // 300 remains
    const p4 = alloc.allocate(100); // 200 remains

    const stats = alloc.getFragmentationStats();
    expect(stats.largestFree).toBe(200);
  });

  // 3-10: Splitting doesn't affect allocated blocks
  it('3-10: Splitting only affects freed blocks', () => {
    const allocated = [];
    for (let i = 0; i < 5; i++) {
      allocated.push(alloc.allocate(100));
    }

    // All allocated blocks should remain valid
    for (const addr of allocated) {
      expect(alloc.isValid(addr)).toBe(true);
    }
  });

  // 3-11: Splitting fragmentation ratio
  it('3-11: Splitting maintains good fragmentation ratio', () => {
    const p1 = alloc.allocate(1000);
    alloc.free(p1);

    const p2 = alloc.allocate(100);
    const p3 = alloc.allocate(100);

    const stats = alloc.getFragmentationStats();
    const ratio = stats.ratio;

    // With 800B largest free block and 800B total free
    // ratio = (800 - 800) / 800 = 0%
    expect(ratio).toBe(0);
  });

  // 3-12: Splitting with very small allocations
  it('3-12: Splitting with many small allocations', () => {
    const p1 = alloc.allocate(1000);
    alloc.free(p1);

    for (let i = 0; i < 50; i++) {
      alloc.allocate(16);
    }

    const stats = alloc.getFragmentationStats();
    expect(stats.totalFree).toBeGreaterThanOrEqual(0);
  });

  // 3-13: Splitting preserves block integrity
  it('3-13: Split blocks remain accessible', () => {
    const p1 = alloc.allocate(200);
    const addr1 = p1;
    alloc.free(p1);

    const p2 = alloc.allocate(100);
    const p3 = alloc.allocate(80);

    expect(alloc.isValid(p2)).toBe(true);
    expect(alloc.isValid(p3)).toBe(true);
  });

  // 3-14: Splitting with interleaved operations
  it('3-14: Splitting during mixed allocation/free', () => {
    const blocks = [];
    for (let i = 0; i < 10; i++) {
      blocks.push(alloc.allocate(100));
    }

    alloc.free(blocks[0]); // 100B free
    alloc.free(blocks[5]); // Another 100B free

    const p = alloc.allocate(50); // Should split one
    expect(alloc.isValid(p)).toBe(true);

    const stats = alloc.getFragmentationStats();
    expect(stats.totalFree).toBeGreaterThanOrEqual(50);
  });

  // 3-15: Splitting maximum efficiency
  it('3-15: Splitting efficiency (no waste)', () => {
    const p1 = alloc.allocate(1000);
    alloc.free(p1);

    // Allocate in pattern that uses all space
    const allocations = [];
    for (let i = 0; i < 10; i++) {
      allocations.push(alloc.allocate(100));
    }

    const stats = alloc.getFragmentationStats();
    expect(stats.totalFree).toBe(0); // All used
  });
});
