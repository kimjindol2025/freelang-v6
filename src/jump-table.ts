// Jump Table Optimization Module
// Purpose: Fast lookup and caching of jump offsets and loop contexts

export class JumpTable {
  private addrToLoopIdx: Map<number, number> = new Map();
  private lastLookedupAddr: number = -1;
  private lastLookedupIdx: number = -1;

  constructor(private loopContexts: any[]) {}

  /**
   * Fast lookup of loop context by address with caching
   * O(1) on cache hit, O(n) only on cache miss
   */
  findLoopByAddr(addr: number): { idx: number; context: any } | null {
    // Cache hit
    if (addr === this.lastLookedupAddr) {
      const idx = this.lastLookedupIdx;
      return idx >= 0 ? { idx, context: this.loopContexts[idx] } : null;
    }

    // Check map cache
    if (this.addrToLoopIdx.has(addr)) {
      const idx = this.addrToLoopIdx.get(addr)!;
      this.lastLookedupAddr = addr;
      this.lastLookedupIdx = idx;
      return { idx, context: this.loopContexts[idx] };
    }

    // Linear search (only on first miss)
    for (let i = 0; i < this.loopContexts.length; i++) {
      if (this.loopContexts[i].addr === addr) {
        this.addrToLoopIdx.set(addr, i);
        this.lastLookedupAddr = addr;
        this.lastLookedupIdx = i;
        return { idx: i, context: this.loopContexts[i] };
      }
    }

    // Not found
    this.lastLookedupAddr = addr;
    this.lastLookedupIdx = -1;
    return null;
  }

  /**
   * Get the most recent loop context (top of stack)
   */
  getTopLoop(): { idx: number; context: any } | null {
    if (this.loopContexts.length === 0) return null;
    const idx = this.loopContexts.length - 1;
    return { idx, context: this.loopContexts[idx] };
  }

  /**
   * Invalidate cache when stack changes
   */
  invalidateCache() {
    this.addrToLoopIdx.clear();
    this.lastLookedupAddr = -1;
    this.lastLookedupIdx = -1;
  }

  /**
   * Check if address is a known loop start
   */
  isLoopAddr(addr: number): boolean {
    return this.addrToLoopIdx.has(addr) ||
           this.loopContexts.some(ctx => ctx.addr === addr);
  }
}

/**
 * Offset calculation helper - pre-compute jump offsets
 */
export class OffsetCalculator {
  private offsetCache: Map<number, number> = new Map();

  /**
   * Calculate forward offset (positive = forward, negative = backward)
   */
  calculateOffset(from: number, to: number): number {
    const key = (from << 16) | (to & 0xFFFF); // Combine two 16-bit values
    if (this.offsetCache.has(key)) {
      return this.offsetCache.get(key)!;
    }
    const offset = to - from;
    this.offsetCache.set(key, offset);
    return offset;
  }

  /**
   * Classify jump type
   */
  classifyJump(offset: number): 'loop-back' | 'forward-exit' | 'local' {
    if (offset < 0) return 'loop-back';
    if (offset > 100) return 'forward-exit'; // Arbitrary threshold
    return 'local';
  }

  clearCache() {
    this.offsetCache.clear();
  }
}
