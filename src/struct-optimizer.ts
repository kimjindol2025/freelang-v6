// FreeLang v5.9.3: Struct Packing Optimizer
// 멤버 재배치를 통한 패딩 최소화

export interface StructField {
  name: string;
  type: string;
  originalOrder: number;
}

export interface OptimizedField extends StructField {
  size: number;
  align: number;
  offset: number;
  padding: number;
}

export interface StructOptimization {
  originalSize: number;
  optimizedSize: number;
  savings: number;
  fields: OptimizedField[];
  reordered: boolean;
}

export class StructOptimizer {
  /**
   * Get size of a type string
   */
  private static getTypeSize(type: string): number {
    const t = type.toLowerCase().trim();
    const sizeMap: Record<string, number> = {
      "i32": 4,
      "i64": 8,
      "f32": 4,
      "f64": 8,
      "bool": 1,
      "byte": 1,
      "char": 1,
      "string": 16,
      "any": 8,
      "ptr": 4,
      "null": 0,
    };
    return sizeMap[t] || 8;
  }

  /**
   * Get alignment requirement of a type
   */
  private static getTypeAlign(type: string): number {
    const t = type.toLowerCase().trim();
    const alignMap: Record<string, number> = {
      "i32": 4,
      "i64": 8,
      "f32": 4,
      "f64": 8,
      "bool": 1,
      "byte": 1,
      "char": 1,
      "string": 4,
      "any": 4,
      "ptr": 4,
      "null": 1,
    };
    return alignMap[t] || 4;
  }

  /**
   * Align offset to next boundary
   */
  private static alignOffset(offset: number, alignment: number): number {
    if (alignment <= 1) return offset;
    const remainder = offset % alignment;
    return remainder === 0 ? offset : offset + (alignment - remainder);
  }

  /**
   * Calculate layout for field sequence
   */
  private static calculateLayout(
    fields: StructField[]
  ): { totalSize: number; optimized: OptimizedField[] } {
    const optimized: OptimizedField[] = [];
    let offset = 0;
    let maxAlign = 1;

    for (const field of fields) {
      const size = this.getTypeSize(field.type);
      const align = this.getTypeAlign(field.type);

      // Calculate padding before this field
      const alignedOffset = this.alignOffset(offset, align);
      const padding = alignedOffset - offset;

      optimized.push({
        ...field,
        size,
        align,
        offset: alignedOffset,
        padding,
      });

      offset = alignedOffset + size;
      maxAlign = Math.max(maxAlign, align);
    }

    // Tail padding to align structure size
    const tailPadding = this.alignOffset(offset, maxAlign) - offset;
    if (optimized.length > 0) {
      optimized[optimized.length - 1].padding += tailPadding;
    }

    const totalSize = this.alignOffset(offset, maxAlign);

    return { totalSize, optimized };
  }

  /**
   * Optimize struct by reordering fields (greedy: largest alignment first)
   */
  static optimize(fields: StructField[]): StructOptimization {
    // Calculate original layout (order-preserving)
    const originalLayout = this.calculateLayout(fields);
    const originalSize = originalLayout.totalSize;

    // Sort fields by alignment requirement (descending) then size (descending)
    const sortedFields = [...fields].sort((a, b) => {
      const alignA = this.getTypeAlign(a.type);
      const alignB = this.getTypeAlign(b.type);
      const sizeA = this.getTypeSize(a.type);
      const sizeB = this.getTypeSize(b.type);

      // Primary: alignment (descending)
      if (alignA !== alignB) return alignB - alignA;
      // Secondary: size (descending)
      return sizeB - sizeA;
    });

    // Calculate optimized layout
    const optimizedLayout = this.calculateLayout(sortedFields);
    const optimizedSize = optimizedLayout.totalSize;

    const reordered = fields.some(
      (f, i) => f.name !== sortedFields[i].name
    );

    return {
      originalSize,
      optimizedSize,
      savings: originalSize - optimizedSize,
      fields: optimizedLayout.optimized,
      reordered,
    };
  }

  /**
   * Calculate total padding waste in a struct
   */
  static calculatePaddingWaste(fields: StructField[]): number {
    const layout = this.calculateLayout(fields);
    return layout.optimized.reduce((sum, f) => sum + f.padding, 0);
  }

  /**
   * Get padding efficiency percentage
   */
  static getPaddingEfficiency(fields: StructField[]): number {
    const layout = this.calculateLayout(fields);
    const totalSize = layout.totalSize;
    const dataSize = layout.optimized.reduce((sum, f) => sum + f.size, 0);
    return totalSize > 0 ? Math.round((dataSize / totalSize) * 100) : 0;
  }

  /**
   * Format field info for debugging
   */
  static formatFieldInfo(field: OptimizedField): string {
    return `${field.name}(${field.type}): @${field.offset} [${field.size}B] +${field.padding}B pad`;
  }

  /**
   * Generate optimization report
   */
  static generateReport(fields: StructField[]): string {
    const opt = this.optimize(fields);
    const lines: string[] = [];

    lines.push("=== Struct Packing Report (v5.9.3) ===");
    lines.push(`Original Size: ${opt.originalSize}B`);
    lines.push(`Optimized Size: ${opt.optimizedSize}B`);
    lines.push(`Savings: ${opt.savings}B (${Math.round((opt.savings / opt.originalSize) * 100)}%)`);
    lines.push(`Reordered: ${opt.reordered ? "YES" : "NO"}`);
    lines.push("");
    lines.push("Field Layout:");

    for (const field of opt.fields) {
      lines.push(`  ${this.formatFieldInfo(field)}`);
    }

    return lines.join("\n");
  }
}
