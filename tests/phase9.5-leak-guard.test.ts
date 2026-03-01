// 🔴 FreeLang v5.9.5: Leak Guard & Zombie Block Tracking (45 tests)
// Part 1: Leak Detection, Part 2: Double-Free Guard, Part 3: Use-After-Free

import { MemoryAllocator } from '../src/memory-allocator';

describe('v5.9.5 Phase 1: Leak Detection (15 tests)', () => {
  let alloc: MemoryAllocator;

  beforeEach(() => {
    alloc = new MemoryAllocator();
  });

  // 1-1: No leaks when all blocks freed
  it('1-1: No leaks when all blocks freed', () => {
    const p1 = alloc.allocate(100);
    const p2 = alloc.allocate(100);

    alloc.free(p1);
    alloc.free(p2);

    const leaks = alloc.detectLeaks();
    expect(leaks.length).toBe(0);
  });

  // 1-2: Detect single leaked block
  it('1-2: Detect single leaked block', () => {
    const p1 = alloc.allocate(100);
    const p2 = alloc.allocate(100);

    alloc.free(p1);
    // p2 NOT freed - intentional leak

    const leaks = alloc.detectLeaks();
    expect(leaks.length).toBe(1);
    expect(leaks[0].addr).toBe(p2);
    expect(leaks[0].size).toBe(100);
  });

  // 1-3: Detect multiple leaked blocks
  it('1-3: Detect multiple leaked blocks', () => {
    const blocks = [];
    for (let i = 0; i < 5; i++) {
      blocks.push(alloc.allocate(50 * (i + 1)));
    }

    // Free only first and last
    alloc.free(blocks[0]);
    alloc.free(blocks[4]);

    const leaks = alloc.detectLeaks();
    expect(leaks.length).toBe(3); // blocks[1], [2], [3]
  });

  // 1-4: Leak report generation
  it('1-4: Generate leak report', () => {
    const p1 = alloc.allocate(100);
    const p2 = alloc.allocate(200);

    alloc.free(p1);
    // p2 leaked

    const report = alloc.generateLeakReport();
    expect(report.leakCount).toBe(1);
    expect(report.totalLeaked).toBe(200);
    expect(report.leaks[0].size).toBe(200);
    expect(report.leaks[0].addr).toBe(p2);
  });

  // 1-5: Leak report with source info
  it('1-5: Leak report includes source info if available', () => {
    alloc.setSourceInfo('test.free', 42);
    const p1 = alloc.allocate(100);

    const report = alloc.generateLeakReport();
    expect(report.leakCount).toBe(1);
    const leak = report.leaks[0];

    expect(leak.sourceFile).toBe('test.free');
    expect(leak.sourceLine).toBe(42);
    expect(leak.sourceInfo).toContain('test.free');
    expect(leak.sourceInfo).toContain('42');
  });

  // 1-6: Leak age tracking
  it('1-6: Track leak age in milliseconds', (done) => {
    const p1 = alloc.allocate(100);

    setTimeout(() => {
      const report = alloc.generateLeakReport();
      expect(report.leaks[0].ageMs).toBeGreaterThanOrEqual(10);
      done();
    }, 10);
  });

  // 1-7: Total leaked bytes calculation
  it('1-7: Calculate total leaked bytes correctly', () => {
    const p1 = alloc.allocate(100);
    const p2 = alloc.allocate(250);
    const p3 = alloc.allocate(150);

    alloc.free(p1);
    // p2, p3 leaked

    const report = alloc.generateLeakReport();
    expect(report.totalLeaked).toBe(400);
  });

  // 1-8: Format leak report as string
  it('1-8: Format leak report as human-readable string', () => {
    const p1 = alloc.allocate(100);

    const reportStr = alloc.formatLeakReport();
    expect(reportStr).toContain('MEMORY LEAK REPORT');
    expect(reportStr).toContain('Block #');
    expect(reportStr).toContain('100 bytes');
  });

  // 1-9: No leaks message
  it('1-9: Report shows clean heap when no leaks', () => {
    const p1 = alloc.allocate(100);
    alloc.free(p1);

    const reportStr = alloc.formatLeakReport();
    expect(reportStr).toContain('No memory leaks detected');
  });

  // 1-10: Memory leak count consistency
  it('1-10: Leak count matches detectLeaks() output', () => {
    for (let i = 0; i < 10; i++) {
      alloc.allocate(100);
    }

    // Free half
    for (let i = 0; i < 5; i++) {
      alloc.free(alloc.allocate(100));
    }

    const leaks = alloc.detectLeaks();
    const report = alloc.generateLeakReport();

    expect(report.leakCount).toBe(leaks.length);
  });

  // 1-11: Leak report timestamp
  it('1-11: Leak report includes timestamp', () => {
    const p1 = alloc.allocate(100);

    const report = alloc.generateLeakReport();
    expect(report.timestamp).toBeGreaterThan(0);
    expect(typeof report.timestamp).toBe('number');
  });

  // 1-12: Large allocation leak detection
  it('1-12: Detect leak in large allocations', () => {
    const large = alloc.allocate(10000);
    const small = alloc.allocate(100);

    alloc.free(small);
    // large leaked

    const report = alloc.generateLeakReport();
    expect(report.totalLeaked).toBe(10000);
  });

  // 1-13: Source info without line number
  it('1-13: Handle source info with file only', () => {
    alloc.setSourceInfo('myfile.free', 0);
    const p1 = alloc.allocate(100);

    const block = alloc.detectLeaks()[0];
    expect(block.sourceFile).toBe('myfile.free');
  });

  // 1-14: Multiple allocations same source
  it('1-14: Multiple leaks from same source location', () => {
    alloc.setSourceInfo('leak.free', 10);
    const p1 = alloc.allocate(100);

    alloc.setSourceInfo('leak.free', 10);
    const p2 = alloc.allocate(100);

    const report = alloc.generateLeakReport();
    expect(report.leakCount).toBe(2);
    expect(report.leaks[0].sourceLine).toBe(report.leaks[1].sourceLine);
  });

  // 1-15: Leak detection after mixed operations
  it('1-15: Leak detection after complex mixed operations', () => {
    const blocks = [];
    for (let i = 0; i < 20; i++) {
      blocks.push(alloc.allocate(50));
    }

    // Free every other block
    for (let i = 0; i < 20; i += 2) {
      alloc.free(blocks[i]);
    }

    const leaks = alloc.detectLeaks();
    expect(leaks.length).toBe(10); // 10 unfreed blocks
  });
});

describe('v5.9.5 Phase 2: Double-Free Guard & Zombie Detection (15 tests)', () => {
  let alloc: MemoryAllocator;

  beforeEach(() => {
    alloc = new MemoryAllocator();
  });

  // 2-1: Detect double-free attempt
  it('2-1: Detect double-free error', () => {
    const p1 = alloc.allocate(100);

    alloc.free(p1);
    const result = alloc.free(p1); // Try to free again

    expect(result).toBe(false); // Should fail
    const errors = alloc.getErrors();
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[errors.length - 1].type).toBe('double_free');
  });

  // 2-2: Track freed blocks as zombies
  it('2-2: Track freed blocks for zombie detection', () => {
    const p1 = alloc.allocate(100);
    const p2 = alloc.allocate(100);

    alloc.free(p1);
    alloc.free(p2);

    const zombies = alloc.detectZombies();
    expect(zombies.length).toBe(2);
    expect(zombies.map(z => z.addr)).toContain(p1);
    expect(zombies.map(z => z.addr)).toContain(p2);
  });

  // 2-3: Zombie has freed timestamp
  it('2-3: Zombie block has freedAt timestamp', () => {
    const p1 = alloc.allocate(100);
    alloc.free(p1);

    const zombies = alloc.detectZombies();
    expect(zombies[0].freedAt).toBeGreaterThan(0);
  });

  // 2-4: Multiple double-free errors
  it('2-4: Record multiple double-free attempts', () => {
    const p1 = alloc.allocate(100);
    const p2 = alloc.allocate(100);

    alloc.free(p1);
    alloc.free(p1); // Error 1
    alloc.free(p2);
    alloc.free(p2); // Error 2

    const errors = alloc.getErrors();
    const doubleFrees = errors.filter(e => e.type === 'double_free');
    expect(doubleFrees.length).toBe(2);
  });

  // 2-5: Invalid address rejection
  it('2-5: Reject invalid addresses', () => {
    const result = alloc.free(99999); // Non-existent address

    expect(result).toBe(false);
    const errors = alloc.getErrors();
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[errors.length - 1].type).toBe('invalid_address');
  });

  // 2-6: Null pointer rejection
  it('2-6: Reject null pointer free', () => {
    const result = alloc.free(0); // Null pointer

    expect(result).toBe(false);
    const errors = alloc.getErrors();
    expect(errors.some(e => e.type === 'null_pointer')).toBe(true);
  });

  // 2-7: No zombies without free
  it('2-7: No zombies when blocks allocated but not freed', () => {
    const p1 = alloc.allocate(100);

    const zombies = alloc.detectZombies();
    expect(zombies.length).toBe(0);
  });

  // 2-8: Error messages describe zombie
  it('2-8: Double-free error message is descriptive', () => {
    const p1 = alloc.allocate(100);

    alloc.free(p1);
    alloc.free(p1);

    const errors = alloc.getErrors();
    const doubleFreeFull = errors.find(e => e.type === 'double_free');

    expect(doubleFreeFull!.message).toContain('Double-free');
    expect(doubleFreeFull!.message).toContain(p1.toString());
  });

  // 2-9: Zombie list independent of leaks
  it('2-9: Zombies are separate from leak list', () => {
    const p1 = alloc.allocate(100); // Will be zombie
    const p2 = alloc.allocate(100); // Will be leak

    alloc.free(p1);

    const leaks = alloc.detectLeaks();
    const zombies = alloc.detectZombies();

    expect(leaks.length).toBe(1);
    expect(leaks[0].addr).toBe(p2);

    expect(zombies.length).toBe(1);
    expect(zombies[0].addr).toBe(p1);
  });

  // 2-10: Clear errors
  it('2-10: Can clear error log', () => {
    const p1 = alloc.allocate(100);
    alloc.free(p1);
    alloc.free(p1); // Error

    let errors = alloc.getErrors();
    expect(errors.length).toBeGreaterThan(0);

    alloc.clearErrors();
    errors = alloc.getErrors();
    expect(errors.length).toBe(0);
  });

  // 2-11: Freed block state marked correctly
  it('2-11: Freed block marked as freed', () => {
    const p1 = alloc.allocate(100);
    alloc.free(p1);

    const block = alloc.getBlock(p1);
    expect(block).toBeUndefined(); // Already freed, not in valid list
  });

  // 2-12: Zombie persistence across operations
  it('2-12: Zombies persist through other operations', () => {
    const p1 = alloc.allocate(100);
    alloc.free(p1);

    // Do other operations
    const p2 = alloc.allocate(200);
    const p3 = alloc.allocate(150);

    alloc.free(p2);

    const zombies = alloc.detectZombies();
    expect(zombies.length).toBeGreaterThanOrEqual(1); // At least p1 and/or p2
    expect(zombies.map(z => z.addr)).toContain(p1);
  });

  // 2-13: Access freed block prevention
  it('2-13: Prevent access to freed block', () => {
    const p1 = alloc.allocate(100);
    alloc.free(p1);

    const result = alloc.access(p1); // Try to access freed block
    expect(result).toBe(false);
  });

  // 2-14: Multiple error types recorded
  it('2-14: Record different error types', () => {
    const p1 = alloc.allocate(100);

    alloc.free(p1);
    alloc.free(p1);     // double_free
    alloc.free(99999);  // invalid_address
    alloc.free(0);      // null_pointer

    const errors = alloc.getErrors();
    const types = errors.map(e => e.type);

    expect(types).toContain('double_free');
    expect(types).toContain('invalid_address');
    expect(types).toContain('null_pointer');
  });

  // 2-15: Zombie count consistency
  it('2-15: Zombie count matches freed blocks', () => {
    const blocks = [];
    for (let i = 0; i < 5; i++) {
      blocks.push(alloc.allocate(100));
    }

    for (const block of blocks) {
      alloc.free(block);
    }

    const zombies = alloc.detectZombies();
    expect(zombies.length).toBe(5);
  });
});

describe('v5.9.5 Phase 3: Use-After-Free Protection (15 tests)', () => {
  let alloc: MemoryAllocator;

  beforeEach(() => {
    alloc = new MemoryAllocator();
  });

  // 3-1: Detect use-after-free access
  it('3-1: Detect use-after-free on access', () => {
    const p1 = alloc.allocate(100);
    alloc.free(p1);

    const result = alloc.access(p1); // Try to use freed block

    expect(result).toBe(false);
    const errors = alloc.getErrors();
    expect(errors.some(e => e.type === 'use_after_free')).toBe(true);
  });

  // 3-2: Valid access before free
  it('3-2: Valid access before free', () => {
    const p1 = alloc.allocate(100);

    const result1 = alloc.access(p1);
    expect(result1).toBe(true);

    alloc.free(p1);

    const result2 = alloc.access(p1);
    expect(result2).toBe(false);
  });

  // 3-3: Multiple uses before free
  it('3-3: Track multiple accesses', () => {
    const p1 = alloc.allocate(100);

    alloc.access(p1);
    alloc.access(p1);
    alloc.access(p1);

    const block = alloc.getBlock(p1);
    expect(block!.accessCount).toBe(3);
  });

  // 3-4: Access count reset on reallocation
  it('3-4: Access count on fresh allocation', () => {
    const p1 = alloc.allocate(100);
    alloc.access(p1);
    alloc.access(p1);

    alloc.free(p1);

    const p2 = alloc.allocate(50); // May reuse same memory
    const block = alloc.getBlock(p2);

    expect(block!.accessCount).toBe(0); // Fresh allocation
  });

  // 3-5: Use-after-free with null pointer
  it('3-5: Access null pointer rejected', () => {
    const result = alloc.access(0);

    expect(result).toBe(false);
    const errors = alloc.getErrors();
    expect(errors.some(e => e.type === 'null_pointer')).toBe(true);
  });

  // 3-6: Block validity check
  it('3-6: Check block validity', () => {
    const p1 = alloc.allocate(100);

    expect(alloc.isValid(p1)).toBe(true);

    alloc.free(p1);

    expect(alloc.isValid(p1)).toBe(false);
  });

  // 3-7: Invalid address not accessible
  it('3-7: Invalid address rejected on access', () => {
    const result = alloc.access(99999); // Non-existent

    expect(result).toBe(false);
  });

  // 3-8: Track freedAt time
  it('3-8: Record when block was freed', () => {
    const p1 = alloc.allocate(100);
    const beforeFree = Date.now();

    alloc.free(p1);

    const afterFree = Date.now();
    const zombies = alloc.detectZombies();

    expect(zombies[0].freedAt).toBeGreaterThanOrEqual(beforeFree);
    expect(zombies[0].freedAt).toBeLessThanOrEqual(afterFree + 10);
  });

  // 3-9: Use-after-free error message
  it('3-9: Use-after-free error is descriptive', () => {
    const p1 = alloc.allocate(100);
    alloc.free(p1);

    alloc.access(p1);

    const errors = alloc.getErrors();
    const uafError = errors.find(e => e.type === 'use_after_free');

    expect(uafError!.message).toContain('Use-after-free');
    expect(uafError!.message).toContain(p1.toString());
  });

  // 3-10: Multiple blocks different validity
  it('3-10: Track validity of multiple blocks independently', () => {
    const p1 = alloc.allocate(100);
    const p2 = alloc.allocate(100);
    const p3 = alloc.allocate(100);

    alloc.free(p2); // Only free middle

    expect(alloc.isValid(p1)).toBe(true);
    expect(alloc.isValid(p2)).toBe(false);
    expect(alloc.isValid(p3)).toBe(true);
  });

  // 3-11: Access count accuracy
  it('3-11: Access count reflects actual accesses', () => {
    const p1 = alloc.allocate(100);

    for (let i = 0; i < 10; i++) {
      alloc.access(p1);
    }

    const block = alloc.getBlock(p1);
    expect(block!.accessCount).toBe(10);
  });

  // 3-12: Heap validity after complex operations
  it('3-12: Validity checking after complex operations', () => {
    const blocks = [];
    for (let i = 0; i < 10; i++) {
      blocks.push(alloc.allocate(50));
    }

    for (let i = 0; i < 10; i += 2) {
      alloc.free(blocks[i]);
    }

    for (let i = 0; i < 10; i += 2) {
      expect(alloc.isValid(blocks[i])).toBe(false);
      expect(alloc.isValid(blocks[i + 1])).toBe(true);
    }
  });

  // 3-13: Reallocation reuses freed block
  it('3-13: Fresh allocation can reuse freed block address', () => {
    const p1 = alloc.allocate(100);
    alloc.free(p1);

    const p2 = alloc.allocate(100);

    // p2 may reuse p1's address if best-fit chooses it
    expect(alloc.isValid(p2)).toBe(true);

    // If p2 reused p1's address, isValid(p1) will return p2's validity
    // This is expected behavior for memory reuse
  });

  // 3-14: Protection against dangling pointers
  it('3-14: Dangling pointer detection', () => {
    const p1 = alloc.allocate(100);
    const p1Backup = p1; // Keep reference

    alloc.free(p1);

    // Try to use backup reference
    const result = alloc.access(p1Backup);
    expect(result).toBe(false);
  });

  // 3-15: Access count not updated after free
  it('3-15: Access count frozen after free', () => {
    const p1 = alloc.allocate(100);

    alloc.access(p1);
    alloc.access(p1);

    const block1 = alloc.getBlock(p1);
    const count1 = block1!.accessCount;

    alloc.free(p1);

    // Try to access (will fail)
    alloc.access(p1);

    // Get the freed block info
    const allBlocks = (alloc as any).blocks;
    const block2 = allBlocks.get((alloc as any).addrToId.get(p1));

    // Count should not have increased
    expect(block2.accessCount).toBe(count1);
  });
});
