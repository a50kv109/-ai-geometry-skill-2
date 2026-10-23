// src/engines/giem/utils/gcd.ts
// BigInt Greatest Common Divisor utility

export function bigintGcd(x: bigint, y: bigint): bigint {
  let a = x < 0n ? -x : x;
  let b = y < 0n ? -y : y;
  while (b !== 0n) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

export function bigintGcdThree(x: bigint, y: bigint, z: bigint): bigint {
  return bigintGcd(bigintGcd(x, y), z);
}
