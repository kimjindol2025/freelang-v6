// FreeLang v5.9: Dynamic Memory Allocator (Complete Implementation)

export interface MemoryBlock {
  id: number;
  size: number;
  addr: number;
  freed: boolean;
  allocatedAt: number;
  freedAt?: number;
  accessCount: number; // Track accesses for use-after-free detection
  sourceFile?: string; // v5.9.5: File where allocated
  sourceLine?: number; // v5.9.5: Line number where allocated
  sourceInfo?: string; // v5.9.5: Human-readable source info
  poolSize?: number; // v5.9.6: Pool size if managed by pool (8/16/32/64/128)
  isPoolBlock?: boolean; // v5.9.6: Whether block is managed by pool
  canaryBefore?: number; // v5.9.7: Magic number before block (0xCANARY)
  canaryAfter?: number; // v5.9.7: Magic number after block (0xCANARY)
  frameId?: number; // v5.9.9: Frame that allocated this block
  frameDepth?: number; // v5.9.9: Recursion depth when allocated
}

// v5.9.9: Call Frame tracking for recursion & context isolation
export interface CallFrame {
  id: number;
  name: string; // Function name (e.g., "DummyRecursive")
  depth: number; // Recursion depth (0-based)
  allocations: Set<number>; // Addresses allocated in this frame
  parentFrameId?: number; // Parent frame ID
  enteredAt: number; // Timestamp when frame entered
  exitedAt?: number; // Timestamp when frame exited
}

// v6.0: Recursion panic when MAX_RECURSION_DEPTH exceeded
export interface RecursionPanic {
  depth: number; // Recursion depth that triggered panic
  frameName: string; // Function name that exceeded limit
  maxAllowed: number; // MAX_RECURSION_DEPTH (1000)
  timestamp: number; // When panic occurred
  message: string; // "Stack overflow: recursion depth exceeded"
}

export interface AllocationError {
  type: "double_free" | "use_after_free" | "invalid_address" | "null_pointer";
  addr: number;
  message: string;
}

export interface LeakInfo {
  blockId: number;
  size: number;
  addr: number;
  allocatedAt: number;
  sourceFile?: string;
  sourceLine?: number;
  sourceInfo?: string;
  ageMs: number; // Time since allocation
}

export interface LeakReport {
  totalLeaked: number;
  leakCount: number;
  leaks: LeakInfo[];
  timestamp: number;
}

export interface DanglingPointerViolation {
  addr: number;
  attemptType: "read" | "write" | "free" | "access";
  blockId?: number;
  message: string;
  timestamp: number;
}

export class MemoryAllocator {
  private blocks: Map<number, MemoryBlock> = new Map();
  private addrToId: Map<number, number> = new Map(); // Quick lookup: addr -> id
  private nextAddr: number = 100000; // Start allocation at 100000
  private nextId: number = 1;
  private freeList: MemoryBlock[] = []; // List of freed blocks for reuse
  private errors: AllocationError[] = []; // Track errors

  // v5.9.6: Pool management for small object optimization
  private static readonly POOL_SIZES = [8, 16, 32, 64, 128] as const;
  private static readonly POOL_THRESHOLD = 128;
  private pools: Map<number, MemoryBlock[]> = new Map();
  private poolHits: number = 0;
  private poolMisses: number = 0;

  // v5.9.7: Heap corruption detection (Canary values)
  private static readonly CANARY_VALUE = 0xDEADBEEF; // Magic number for corruption detection
  private corruptionDetected: boolean = false;
  private corruptedBlocks: number[] = []; // Track which blocks are corrupted

  // v5.9.8: Dangling pointer guard
  private static readonly ZAPPED_MARKER = 0xDEADBEEF; // Marker for zapped memory
  private danglingPointerViolations: DanglingPointerViolation[] = [];
  private freedAddresses: Set<number> = new Set(); // Track freed addresses
  private allocatedAddresses: Set<number> = new Set(); // Track currently allocated addresses

  // v5.9.9: Call Frame tracking for recursion & context isolation
  private frames: Map<number, CallFrame> = new Map();
  private frameStack: number[] = []; // LIFO stack of frame IDs
  private nextFrameId: number = 1;
  private maxDepthSeen: number = 0;

  // v6.0: Recursion depth guard
  static readonly MAX_RECURSION_DEPTH = 1000;
  private recursionPanics: RecursionPanic[] = [];

  constructor() {
    // Initialize pool buckets for each pool size
    for (const size of MemoryAllocator.POOL_SIZES) {
      this.pools.set(size, []);
    }
  }

  /**
   * v5.9.6: Determine which pool size fits the requested size
   * Returns null if size > POOL_THRESHOLD (use Heap)
   */
  private getPoolSize(size: number): number | null {
    for (const ps of MemoryAllocator.POOL_SIZES) {
      if (size <= ps) return ps;
    }
    return null; // Size > 128, use Heap
  }

  /**
   * Allocate size bytes of memory
   * Returns a pointer (address)
   * v5.9.6: Dispatcher between Pool (small objects) and Heap (large objects)
   */
  allocate(size: number): number {
    if (size <= 0) return 0;

    const poolSize = this.getPoolSize(size);

    // v5.9.6: Pool Path (size <= 128)
    if (poolSize !== null) {
      const pool = this.pools.get(poolSize)!;
      if (pool.length > 0) {
        // Reuse from pool - O(1)
        const block = pool.pop()!;
        block.freed = false;
        block.allocatedAt = Date.now();
        block.accessCount = 0;
        block.size = size; // Update size to actual requested size
        block.sourceFile = this.nextSourceFile;
        block.sourceLine = this.nextSourceLine;
        block.sourceInfo = this.nextSourceFile && this.nextSourceLine
          ? `${this.nextSourceFile}:${this.nextSourceLine}`
          : undefined;

        // v5.9.7: Verify canary before reuse
        this.verifyCanary(block.addr);

        // v5.9.7: Reset canary for reused block
        block.canaryBefore = MemoryAllocator.CANARY_VALUE;
        block.canaryAfter = MemoryAllocator.CANARY_VALUE;

        // Clear source info after use
        // Clear source info after use
        this.nextSourceFile = undefined;
        this.nextSourceLine = undefined;

        // v5.9.8: Track allocated address
        this.allocatedAddresses.add(block.addr);
        this.freedAddresses.delete(block.addr);

        this.poolHits++;

        // v5.9.9: Frame tracking
        const currentFrameId = this.frameStack.at(-1);
        if (currentFrameId !== undefined) {
          block.frameId = currentFrameId;
          block.frameDepth = this.frameStack.length - 1;
          this.frames.get(currentFrameId)?.allocations.add(block.addr);
        }

        return block.addr;
      }

      // Pool empty, create new pool block
      const id = this.nextId++;
      const addr = this.alignAddress(this.nextAddr);

      const block: MemoryBlock = {
        id,
        size,
        addr,
        freed: false,
        allocatedAt: Date.now(),
        accessCount: 0,
        poolSize,
        isPoolBlock: true,
        sourceFile: this.nextSourceFile,
        sourceLine: this.nextSourceLine,
        sourceInfo: this.nextSourceFile && this.nextSourceLine
          ? `${this.nextSourceFile}:${this.nextSourceLine}`
          : undefined,
        // v5.9.7: Canary values for corruption detection
        canaryBefore: MemoryAllocator.CANARY_VALUE,
        canaryAfter: MemoryAllocator.CANARY_VALUE,
      };

      // Clear source info after use
      this.nextSourceFile = undefined;
      this.nextSourceLine = undefined;

      this.blocks.set(id, block);
      this.addrToId.set(addr, id);
      this.nextAddr = addr + Math.max(poolSize, 8);

      // v5.9.8: Track allocated address
      this.allocatedAddresses.add(addr);
      this.freedAddresses.delete(addr);

      this.poolMisses++;

      // v5.9.9: Frame tracking
      const currentFrameId = this.frameStack.at(-1);
      if (currentFrameId !== undefined) {
        block.frameId = currentFrameId;
        block.frameDepth = this.frameStack.length - 1;
        this.frames.get(currentFrameId)?.allocations.add(addr);
      }

      return addr;
    }

    // v5.9.6: Heap Path (size > 128) - Use existing Best-Fit logic
    // Try to reuse freed block (Best Fit strategy)
    const bestFit = this.findBestFitBlock(size);
    if (bestFit) {
      // Split block if it's larger than needed
      const split = this.splitBlock(bestFit, size);

      const used = split.used;
      used.freed = false;
      used.allocatedAt = Date.now();
      used.accessCount = 0;
      used.sourceFile = this.nextSourceFile;
      used.sourceLine = this.nextSourceLine;
      used.sourceInfo = this.nextSourceFile && this.nextSourceLine
        ? `${this.nextSourceFile}:${this.nextSourceLine}`
        : undefined;

      // v5.9.7: Verify canary before reuse and reset
      this.verifyCanary(used.addr);
      used.canaryBefore = MemoryAllocator.CANARY_VALUE;
      used.canaryAfter = MemoryAllocator.CANARY_VALUE;

      // Clear source info after use
      this.nextSourceFile = undefined;
      this.nextSourceLine = undefined;

      this.blocks.set(used.id, used);
      this.addrToId.set(used.addr, used.id);

      // v5.9.8: Track allocated address and remove from freed set
      this.allocatedAddresses.add(used.addr);
      this.freedAddresses.delete(used.addr);

      // If there's a remainder, add it to free list
      if (split.remainder) {
        // v5.9.7: Set canary for remainder block
        split.remainder.canaryBefore = MemoryAllocator.CANARY_VALUE;
        split.remainder.canaryAfter = MemoryAllocator.CANARY_VALUE;
        this.blocks.set(split.remainder.id, split.remainder);
        this.freeList.push(split.remainder);
      }

      // v5.9.9: Frame tracking
      const currentFrameId1 = this.frameStack.at(-1);
      if (currentFrameId1 !== undefined) {
        used.frameId = currentFrameId1;
        used.frameDepth = this.frameStack.length - 1;
        this.frames.get(currentFrameId1)?.allocations.add(used.addr);
      }

      return used.addr;
    }

    // Allocate new block
    const id = this.nextId++;
    const addr = this.alignAddress(this.nextAddr);

    const block: MemoryBlock = {
      id,
      size,
      addr,
      freed: false,
      allocatedAt: Date.now(),
      accessCount: 0,
      sourceFile: this.nextSourceFile,
      sourceLine: this.nextSourceLine,
      sourceInfo: this.nextSourceFile && this.nextSourceLine
        ? `${this.nextSourceFile}:${this.nextSourceLine}`
        : undefined,
      // v5.9.7: Canary values for corruption detection
      canaryBefore: MemoryAllocator.CANARY_VALUE,
      canaryAfter: MemoryAllocator.CANARY_VALUE,
    };

    // Clear source info after use
    this.nextSourceFile = undefined;
    this.nextSourceLine = undefined;

    this.blocks.set(id, block);
    this.addrToId.set(addr, id);
    this.nextAddr = addr + Math.max(size, 8);

    // v5.9.8: Track allocated address
    this.allocatedAddresses.add(addr);
    this.freedAddresses.delete(addr);

    // v5.9.9: Frame tracking
    const currentFrameId2 = this.frameStack.at(-1);
    if (currentFrameId2 !== undefined) {
      block.frameId = currentFrameId2;
      block.frameDepth = this.frameStack.length - 1;
      this.frames.get(currentFrameId2)?.allocations.add(addr);
    }

    return addr;
  }

  /**
   * Free memory at given pointer
   * Detects double-free errors and triggers coalescing (v5.9.4)
   * v5.9.6: Pool blocks return to pool instead of freeList
   * v5.9.7: Verify canary before freeing
   */
  free(addr: number): boolean {
    if (addr === 0) {
      this.recordError("null_pointer", addr, "Cannot free NULL pointer");
      return false;
    }

    const id = this.addrToId.get(addr);
    if (!id) {
      this.recordError("invalid_address", addr, `Invalid address: ${addr}`);
      return false;
    }

    const block = this.blocks.get(id);
    if (!block) {
      this.recordError("invalid_address", addr, `Block not found for address: ${addr}`);
      return false;
    }

    if (block.freed) {
      this.recordError("double_free", addr, `Double-free detected at address: ${addr}`);
      return false;
    }

    // v5.9.7: Check for heap corruption before freeing
    this.verifyCanary(addr);
    if (this.corruptionDetected) {
      this.recordError("invalid_address", addr, `Heap corruption detected at address: ${addr}`);
      return false;
    }

    // v5.9.8: Mark address as freed (dangling pointer prevention)
    this.freedAddresses.add(addr);
    this.allocatedAddresses.delete(addr);

    // v5.9.9: Remove from frame tracking
    if (block.frameId !== undefined) {
      this.frames.get(block.frameId)?.allocations.delete(addr);
    }

    // v5.9.6: Pool path - return to pool
    if (block.isPoolBlock && block.poolSize) {
      block.freed = true;
      block.freedAt = Date.now();
      // v5.9.8: Zap pool block data
      block.canaryBefore = MemoryAllocator.ZAPPED_MARKER;
      block.canaryAfter = MemoryAllocator.ZAPPED_MARKER;
      const pool = this.pools.get(block.poolSize)!;
      pool.push(block);
      return true;
    }

    // Heap path - return to freeList with coalescing
    block.freed = true;
    block.freedAt = Date.now();
    // v5.9.8: Zap heap block data
    block.canaryBefore = MemoryAllocator.ZAPPED_MARKER;
    block.canaryAfter = MemoryAllocator.ZAPPED_MARKER;
    this.freeList.push(block);

    // v5.9.4: Trigger coalescing to reduce fragmentation
    this.coalesceBlocks();

    return true;
  }

  /**
   * Access memory (simulated)
   * Detects use-after-free errors
   * v5.9.8: Dangling pointer detection
   */
  access(addr: number): boolean {
    if (addr === 0) {
      this.recordError("null_pointer", addr, "Cannot access NULL pointer");
      return false;
    }

    // v5.9.8: Check if address is in freed set (dangling pointer)
    if (this.freedAddresses.has(addr)) {
      this.recordDanglingPointerViolation(addr, "access", "Dangling pointer access detected");
      this.recordError("use_after_free", addr, `Dangling pointer at address: ${addr}`);
      return false;
    }

    // v5.9.8: Check if address is currently allocated
    if (!this.allocatedAddresses.has(addr)) {
      this.recordDanglingPointerViolation(addr, "access", "Address not allocated");
      this.recordError("invalid_address", addr, `Invalid address: ${addr}`);
      return false;
    }

    const id = this.addrToId.get(addr);
    if (!id) {
      this.recordError("invalid_address", addr, `Invalid address: ${addr}`);
      return false;
    }

    const block = this.blocks.get(id);
    if (!block) {
      this.recordError("invalid_address", addr, `Block not found for address: ${addr}`);
      return false;
    }

    if (block.freed) {
      this.recordError("use_after_free", addr, `Use-after-free at address: ${addr} (freed at ${block.freedAt})`);
      return false;
    }

    block.accessCount++;
    return true;
  }

  /**
   * Get block info for an address
   */
  getBlock(addr: number): MemoryBlock | undefined {
    const id = this.addrToId.get(addr);
    if (!id) return undefined;

    const block = this.blocks.get(id);
    if (block && !block.freed) {
      return block;
    }
    return undefined;
  }

  /**
   * Check if address is valid (allocated and not freed)
   */
  isValid(addr: number): boolean {
    return this.getBlock(addr) !== undefined;
  }

  /**
   * Find best-fit freed block (v5.9.4: Fragmentation Prevention)
   * Searches for the smallest block that fits the requested size
   */
  private findBestFitBlock(size: number): MemoryBlock | undefined {
    let best: MemoryBlock | undefined = undefined;
    let bestFit = Infinity;

    for (const block of this.freeList) {
      if (block.size >= size && block.size < bestFit) {
        best = block;
        bestFit = block.size;
      }
    }

    if (best) {
      this.freeList = this.freeList.filter(b => b !== best);
    }

    return best;
  }

  /**
   * Coalesce adjacent free blocks (v5.9.4)
   * Merges neighboring freed blocks to reduce fragmentation
   */
  private coalesceBlocks(): void {
    if (this.freeList.length < 2) return;

    // Sort free list by address for coalescing
    const sorted = [...this.freeList].sort((a, b) => a.addr - b.addr);

    const merged: MemoryBlock[] = [];
    let current = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i];
      const currentEnd = current.addr + current.size;

      // Check if blocks are adjacent (or overlapping, which shouldn't happen)
      if (currentEnd === next.addr) {
        // Merge blocks
        current = {
          ...current,
          size: current.size + next.size,
        };
      } else {
        // Not adjacent, keep current and start new
        merged.push(current);
        current = next;
      }
    }

    merged.push(current);
    this.freeList = merged;
  }

  /**
   * Split a large block if needed (v5.9.4)
   * When allocating from a larger block, keep the remainder if it's large enough
   */
  private splitBlock(
    block: MemoryBlock,
    requestedSize: number
  ): { used: MemoryBlock; remainder?: MemoryBlock } {
    const MIN_SPLIT_SIZE = 4; // Minimum fragment size to keep
    const remainingSize = block.size - requestedSize;

    const used: MemoryBlock = {
      ...block,
      size: requestedSize,
    };

    if (remainingSize >= MIN_SPLIT_SIZE) {
      const remainder: MemoryBlock = {
        id: this.nextId++,
        size: remainingSize,
        addr: block.addr + requestedSize,
        freed: true,
        allocatedAt: Date.now(),
        accessCount: 0,
      };
      return { used, remainder };
    }

    return { used };
  }

  /**
   * Calculate fragmentation ratio (0-100%) (v5.9.4)
   */
  getFragmentationRatio(): number {
    if (this.freeList.length === 0) return 0;

    const totalFree = this.freeList.reduce((sum, b) => sum + b.size, 0);
    const largestFree = Math.max(...this.freeList.map(b => b.size));

    if (totalFree === 0) return 0;

    // Fragmentation = (total free - largest free) / total free * 100
    // 0% = perfectly coalesced, 100% = completely fragmented
    return Math.round(((totalFree - largestFree) / totalFree) * 100);
  }

  /**
   * Get fragmentation statistics (v5.9.4)
   */
  getFragmentationStats(): {
    totalFree: number;
    largestFree: number;
    numFragments: number;
    ratio: number;
  } {
    const totalFree = this.freeList.reduce((sum, b) => sum + b.size, 0);
    const largestFree =
      this.freeList.length > 0 ? Math.max(...this.freeList.map(b => b.size)) : 0;

    return {
      totalFree,
      largestFree,
      numFragments: this.freeList.length,
      ratio: this.getFragmentationRatio(),
    };
  }

  /**
   * Align address to 4-byte boundary (v5.9.2: Data Alignment)
   */
  private alignAddress(addr: number): number {
    const alignment = 4;
    const remainder = addr % alignment;
    return remainder === 0 ? addr : addr + (alignment - remainder);
  }

  /**
   * Get alignment requirement for a type (v5.9.2)
   */
  static getTypeAlignment(type: string): number {
    const t = type.toLowerCase().trim();
    const alignMap: Record<string, number> = {
      "i32": 4,
      "i64": 8,
      "f32": 4,
      "f64": 8,
      "bool": 1,
      "byte": 1,
      "char": 1,
      "string": 4,  // Pointer-like
      "any": 4,
      "ptr": 4,     // Pointer type
      "null": 1,
    };
    return alignMap[t] || 4;
  }

  /**
   * Calculate aligned offset (v5.9.2)
   * Aligns offset to the required boundary before adding field
   */
  static calculateAlignedOffset(currentOffset: number, fieldAlignment: number): number {
    if (fieldAlignment <= 1) return currentOffset;
    const remainder = currentOffset % fieldAlignment;
    return remainder === 0 ? currentOffset : currentOffset + (fieldAlignment - remainder);
  }

  /**
   * Calculate padding needed (v5.9.2)
   */
  static calculatePadding(currentOffset: number, fieldAlignment: number): number {
    const alignedOffset = this.calculateAlignedOffset(currentOffset, fieldAlignment);
    return alignedOffset - currentOffset;
  }

  /**
   * Record an error
   */
  private recordError(type: AllocationError["type"], addr: number, message: string) {
    this.errors.push({ type, addr, message });
  }

  /**
   * Get all errors
   */
  getErrors(): AllocationError[] {
    return [...this.errors];
  }

  /**
   * Clear errors
   */
  clearErrors() {
    this.errors = [];
  }

  /**
   * Get memory stats
   */
  getStats() {
    const allocated = Array.from(this.blocks.values()).filter(b => !b.freed);
    const freed = Array.from(this.blocks.values()).filter(b => b.freed);
    const totalAllocated = allocated.reduce((sum, b) => sum + b.size, 0);
    const totalFreed = freed.reduce((sum, b) => sum + b.size, 0);

    return {
      allocatedBlocks: allocated.length,
      freedBlocks: freed.length,
      totalAllocated,
      totalFreed,
      fragmentation: freed.length,
      errors: this.errors.length,
    };
  }

  /**
   * Detect memory leaks (allocated but not freed)
   */
  detectLeaks(): MemoryBlock[] {
    return Array.from(this.blocks.values()).filter(b => !b.freed);
  }

  /**
   * Generate detailed leak report (v5.9.5)
   * Includes block ID, size, address, allocation time, and source info
   */
  generateLeakReport(): LeakReport {
    const leaked = this.detectLeaks();
    const now = Date.now();

    const leaks: LeakInfo[] = leaked.map(block => ({
      blockId: block.id,
      size: block.size,
      addr: block.addr,
      allocatedAt: block.allocatedAt,
      sourceFile: block.sourceFile,
      sourceLine: block.sourceLine,
      sourceInfo: block.sourceInfo,
      ageMs: now - block.allocatedAt
    }));

    return {
      totalLeaked: leaked.reduce((sum, b) => sum + b.size, 0),
      leakCount: leaked.length,
      leaks,
      timestamp: now
    };
  }

  /**
   * Format leak report as human-readable string
   */
  formatLeakReport(): string {
    const report = this.generateLeakReport();
    const lines: string[] = [];

    lines.push("╔════════════════════════════════════════════════════════╗");
    lines.push("║        🔴 MEMORY LEAK REPORT (v5.9.5 Leak Guard)     ║");
    lines.push("╚════════════════════════════════════════════════════════╝");
    lines.push("");

    if (report.leakCount === 0) {
      lines.push("✅ No memory leaks detected! Clean heap.");
      lines.push(`   Total Allocated: ${report.totalLeaked} bytes`);
      return lines.join("\n");
    }

    lines.push(`❌ LEAK DETECTED: ${report.leakCount} block(s), ${report.totalLeaked} bytes`);
    lines.push("");

    for (const leak of report.leaks) {
      lines.push(`Block #${leak.blockId}:`);
      lines.push(`  Address: 0x${leak.addr.toString(16)}`);
      lines.push(`  Size: ${leak.size} bytes`);
      lines.push(`  Allocated at: ${new Date(leak.allocatedAt).toISOString()}`);
      lines.push(`  Age: ${leak.ageMs}ms`);

      if (leak.sourceFile || leak.sourceLine) {
        lines.push(`  Source: ${leak.sourceFile}:${leak.sourceLine}`);
      }
      if (leak.sourceInfo) {
        lines.push(`  Info: ${leak.sourceInfo}`);
      }

      lines.push("");
    }

    lines.push(`Total Leaked: ${report.totalLeaked} bytes`);
    lines.push(`Fragmentation Ratio: ${this.getFragmentationRatio()}%`);

    return lines.join("\n");
  }

  /**
   * Detect zombie blocks (double-free attempts)
   * Returns list of addresses that were already freed
   */
  detectZombies(): { addr: number; freedAt: number }[] {
    const zombies: { addr: number; freedAt: number }[] = [];

    Array.from(this.blocks.values()).forEach(block => {
      if (block.freed && block.freedAt) {
        zombies.push({
          addr: block.addr,
          freedAt: block.freedAt
        });
      }
    });

    return zombies;
  }

  /**
   * v5.9.6: Get pool statistics
   */
  getPoolStats(): {
    hitRate: number;
    totalHits: number;
    totalMisses: number;
    perSizeStats: { size: number; available: number }[];
  } {
    const total = this.poolHits + this.poolMisses;
    const hitRate = total === 0 ? 0 : Math.round((this.poolHits / total) * 100);

    const perSizeStats = [];
    for (const size of MemoryAllocator.POOL_SIZES) {
      const available = this.pools.get(size)?.length || 0;
      perSizeStats.push({ size, available });
    }

    return {
      hitRate,
      totalHits: this.poolHits,
      totalMisses: this.poolMisses,
      perSizeStats,
    };
  }

  /**
   * v5.9.6: Get pool hit count
   */
  getPoolHits(): number {
    return this.poolHits;
  }

  /**
   * v5.9.6: Get pool hit rate (0-100%)
   */
  getPoolHitRate(): number {
    const total = this.poolHits + this.poolMisses;
    return total === 0 ? 0 : Math.round((this.poolHits / total) * 100);
  }

  /**
   * v5.9.6: Get per-size pool statistics
   */
  getPoolSizeStats(): { size: number; available: number }[] {
    const stats = [];
    for (const size of MemoryAllocator.POOL_SIZES) {
      const available = this.pools.get(size)?.length || 0;
      stats.push({ size, available });
    }
    return stats;
  }

  /**
   * v5.9.7: Verify canary values for a block
   * Returns true if canary is intact, false if corrupted
   */
  private verifyCanary(addr: number): boolean {
    const id = this.addrToId.get(addr);
    if (!id) return true; // Not tracked, assume safe

    const block = this.blocks.get(id);
    if (!block) return true;

    const before = block.canaryBefore;
    const after = block.canaryAfter;

    if (before !== MemoryAllocator.CANARY_VALUE || after !== MemoryAllocator.CANARY_VALUE) {
      this.corruptionDetected = true;
      if (!this.corruptedBlocks.includes(id)) {
        this.corruptedBlocks.push(id);
      }
      return false;
    }

    return true;
  }

  /**
   * v5.9.7: Check heap invariants (full integrity scan)
   * Returns true if heap structure is valid
   */
  checkHeapInvariants(): boolean {
    // Check 1: All allocated blocks have valid canary
    for (const [, block] of this.blocks) {
      if (!block.freed) {
        if (!this.verifyCanary(block.addr)) {
          return false;
        }
      }
    }

    // Check 2: Free list pointers are all valid
    for (const freeBlock of this.freeList) {
      if (!this.blocks.has(freeBlock.id)) {
        return false;
      }
    }

    // Check 3: Pool blocks are consistent
    for (const [size, pool] of this.pools) {
      for (const block of pool) {
        if (!this.blocks.has(block.id)) {
          return false;
        }
        if (block.poolSize !== size) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * v5.9.7: Get corruption report
   */
  getCorruptionReport(): {
    detected: boolean;
    corruptedCount: number;
    corruptedBlockIds: number[];
  } {
    return {
      detected: this.corruptionDetected,
      corruptedCount: this.corruptedBlocks.length,
      corruptedBlockIds: [...this.corruptedBlocks],
    };
  }

  /**
   * v5.9.8: Record dangling pointer violation
   */
  private recordDanglingPointerViolation(
    addr: number,
    attemptType: "read" | "write" | "free" | "access",
    message: string
  ) {
    const id = this.addrToId.get(addr);
    this.danglingPointerViolations.push({
      addr,
      attemptType,
      blockId: id,
      message,
      timestamp: Date.now(),
    });
  }

  /**
   * v5.9.8: Get dangling pointer violations
   */
  getDanglingPointerViolations(): DanglingPointerViolation[] {
    return [...this.danglingPointerViolations];
  }

  /**
   * v5.9.8: Check if address is currently allocated
   */
  isAddressAllocated(addr: number): boolean {
    return this.allocatedAddresses.has(addr);
  }

  /**
   * v5.9.8: Check if address was freed (dangling)
   */
  isAddressFreed(addr: number): boolean {
    return this.freedAddresses.has(addr);
  }

  /**
   * v5.9.6: Pre-fill a pool bucket with blocks
   * Returns the number of blocks actually prefilled
   */
  prefillPool(targetSize: number, count: number): number {
    // Find which pool bucket this size goes to
    const poolSize = this.getPoolSize(targetSize);
    if (poolSize === null) {
      return 0; // Size too large for pool
    }

    const pool = this.pools.get(poolSize)!;
    let prefilled = 0;

    for (let i = 0; i < count; i++) {
      const id = this.nextId++;
      const addr = this.alignAddress(this.nextAddr);

      const block: MemoryBlock = {
        id,
        size: poolSize,
        addr,
        freed: true, // Pre-filled blocks are in "freed" state (available for allocation)
        allocatedAt: Date.now(),
        accessCount: 0,
        poolSize,
        isPoolBlock: true,
      };

      this.blocks.set(id, block);
      this.addrToId.set(addr, id);
      this.nextAddr = addr + Math.max(poolSize, 8);
      pool.push(block);
      prefilled++;
    }

    return prefilled;
  }

  /**
   * Set source information for next allocation (for tracking purposes)
   * Typically called from compiler when generating allocation code
   */
  setSourceInfo(file: string, line: number) {
    this.nextSourceFile = file;
    this.nextSourceLine = line;
  }

  // Helper property for source tracking
  private nextSourceFile?: string;
  private nextSourceLine?: number;

  /**
   * Clear all allocations (for testing)
   * v5.9.6: Also clear pool statistics
   * v5.9.7: Reset corruption detection
   * v5.9.8: Reset dangling pointer tracking
   */
  /**
   * v5.9.9: Push new call frame (function entry)
   * Returns unique frame ID
   */
  pushFrame(name: string): number {
    const frameId = this.nextFrameId++;
    const parentFrameId = this.frameStack.at(-1);
    const depth = this.frameStack.length;

    const frame: CallFrame = {
      id: frameId,
      name,
      depth,
      allocations: new Set(),
      parentFrameId,
      enteredAt: Date.now(),
    };

    // v6.0: Recursion depth guard - check before pushing
    if (this.frameStack.length >= MemoryAllocator.MAX_RECURSION_DEPTH) {
      const panic: RecursionPanic = {
        depth: this.frameStack.length + 1,
        frameName: name,
        maxAllowed: MemoryAllocator.MAX_RECURSION_DEPTH,
        timestamp: Date.now(),
        message: `Stack overflow: recursion depth ${this.frameStack.length + 1} exceeds MAX (${MemoryAllocator.MAX_RECURSION_DEPTH})`,
      };
      this.recursionPanics.push(panic);
      throw new Error(panic.message);
    }

    this.frames.set(frameId, frame);
    this.frameStack.push(frameId);
    this.maxDepthSeen = Math.max(this.maxDepthSeen, this.frameStack.length);

    return frameId;
  }

  /**
   * v5.9.9: Pop call frame (function exit)
   * Optionally auto-cleanup unreleased memory (LIFO order)
   */
  popFrame(autoCleanup: boolean = false): CallFrame | null {
    if (this.frameStack.length === 0) return null;

    const frameId = this.frameStack.pop()!;
    const frame = this.frames.get(frameId);
    if (!frame) return null;

    frame.exitedAt = Date.now();

    if (autoCleanup) {
      // LIFO: Release all allocations in this frame
      const addrsToFree = Array.from(frame.allocations);
      for (const addr of addrsToFree) {
        if (this.allocatedAddresses.has(addr)) {
          this.free(addr);
        }
      }
    }

    return frame;
  }

  /**
   * v5.9.9: Get current recursion depth (0 = global)
   */
  getCurrentDepth(): number {
    return this.frameStack.length;
  }

  /**
   * v5.9.9: Get addresses allocated in a specific frame
   */
  getFrameAllocations(frameId: number): number[] {
    const frame = this.frames.get(frameId);
    return frame ? Array.from(frame.allocations) : [];
  }

  /**
   * v5.9.9: Get unreleased blocks in a frame (or all frames if frameId undefined)
   */
  getFrameLeaks(frameId?: number): MemoryBlock[] {
    const leaks: MemoryBlock[] = [];

    if (frameId !== undefined) {
      const frame = this.frames.get(frameId);
      if (!frame) return leaks;

      for (const addr of frame.allocations) {
        const id = this.addrToId.get(addr);
        if (id) {
          const block = this.blocks.get(id);
          if (block && !block.freed) {
            leaks.push(block);
          }
        }
      }
    } else {
      // All frames
      for (const frame of this.frames.values()) {
        for (const addr of frame.allocations) {
          const id = this.addrToId.get(addr);
          if (id) {
            const block = this.blocks.get(id);
            if (block && !block.freed) {
              leaks.push(block);
            }
          }
        }
      }
    }

    return leaks;
  }

  /**
   * v5.9.9: Get frame statistics
   */
  getFrameStats(): { total: number; active: number; maxDepth: number } {
    return {
      total: this.frames.size,
      active: this.frameStack.length,
      maxDepth: this.maxDepthSeen,
    };
  }

  /**
   * v6.0: Get recursion panic records
   */
  getRecursionPanics(): RecursionPanic[] {
    return this.recursionPanics;
  }

  /**
   * v6.0: Check if recursion is safe (not at MAX_RECURSION_DEPTH)
   */
  isRecursionSafe(): boolean {
    return this.frameStack.length < MemoryAllocator.MAX_RECURSION_DEPTH;
  }

  /**
   * v6.0: Get configured maximum recursion depth
   */
  getMaxRecursionDepth(): number {
    return MemoryAllocator.MAX_RECURSION_DEPTH;
  }

  /**
   * Clear all allocations (for testing)
   * v5.9.6: Also clear pool statistics
   * v5.9.7: Reset corruption detection
   * v5.9.8: Reset dangling pointer tracking
   * v5.9.9: Reset frame tracking
   */
  clear() {
    this.blocks.clear();
    this.addrToId.clear();
    this.freeList = [];
    this.errors = [];
    this.nextAddr = 100000;
    this.nextId = 1;
    // v5.9.6: Clear pools
    for (const [, bucket] of this.pools) {
      bucket.length = 0;
    }
    this.poolHits = 0;
    this.poolMisses = 0;
    // v5.9.7: Reset corruption detection
    this.corruptionDetected = false;
    this.corruptedBlocks = [];
    // v5.9.8: Reset dangling pointer tracking
    this.danglingPointerViolations = [];
    this.freedAddresses.clear();
    this.allocatedAddresses.clear();
    // v5.9.9: Reset frame tracking
    this.frames.clear();
    this.frameStack = [];
    this.nextFrameId = 1;
    this.maxDepthSeen = 0;
    // v6.0: Reset recursion panic tracking
    this.recursionPanics = [];
  }
}
