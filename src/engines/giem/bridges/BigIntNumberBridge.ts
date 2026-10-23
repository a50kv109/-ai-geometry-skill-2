// src/engines/giem/bridges/BigIntNumberBridge.ts
// Conservative BigInt to Number safety bridge for GIEM v0.1

export interface NumberBridgeResult {
  success: boolean;
  value?: number;
  error?: string;
}

export class BigIntNumberBridge {
  private static readonly MIN_SAFE = BigInt(Number.MIN_SAFE_INTEGER);
  private static readonly MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);

  /**
   * Safely converts a BigInt to Number if within IEEE 754 safe integer range.
   * Rejects values outside range to prevent silent precision loss.
   */
  public static safeConvert(val: bigint): NumberBridgeResult {
    if (val < this.MIN_SAFE || val > this.MAX_SAFE) {
      return {
        success: false,
        error: `NUMERIC_RANGE_EXCEEDED: Value ${val.toString()} exceeds safe integer bounds [${this.MIN_SAFE.toString()}, ${this.MAX_SAFE.toString()}]`,
      };
    }
    return {
      success: true,
      value: Number(val),
    };
  }

  /**
   * Validates coordinate bounds for geometry kernel consumption (e.g. [-1000000, 1000000]).
   */
  public static validateCoordinateBounds(val: bigint, maxCoord: bigint = 1000000n): NumberBridgeResult {
    const absVal = val < 0n ? -val : val;
    if (absVal > maxCoord) {
      return {
        success: false,
        error: `NUMERIC_RANGE_EXCEEDED: Coordinate ${val.toString()} exceeds geo-kernel safe operating limit [${-maxCoord}, ${maxCoord}]`,
      };
    }
    return this.safeConvert(val);
  }
}
