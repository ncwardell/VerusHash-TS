import { haraka256256, haraka512256 } from "./haraka"; // Assuming your Haraka implementation is in haraka.ts


export class CVerusHashV2 {
  private curBuf: Uint8Array;
  private result: Uint8Array;
  private curPos: number;

  constructor() {
    this.curBuf = new Uint8Array(64);
    this.result = new Uint8Array(64);
    this.curPos = 0;
  }

  public Hash(data: Uint8Array): Uint8Array {
    const buf = new Uint8Array(128);
    let bufPtr = 0;
    let nextOffset = 64;
    let pos = 0;

    // put our last result or zero at beginning of buffer each time
    buf.fill(0, bufPtr, bufPtr + 32);

    // digest up to 32 bytes at a time
    while (pos < data.length) {
      const remaining = data.length - pos;
      if (remaining >= 32) {
        buf.set(data.subarray(pos, pos + 32), bufPtr + 32);
      } else {
        buf.set(data.subarray(pos, data.length), bufPtr + 32);
        buf.fill(0, bufPtr + 32 + remaining, bufPtr + 64);
      }
      buf.set(haraka512256(Array.from(buf.subarray(bufPtr, bufPtr + 64))), bufPtr + nextOffset);
      bufPtr += nextOffset;
      nextOffset *= -1;
      pos += 32;
    }
    return buf.slice(bufPtr, bufPtr + 32);
  }

  public Write(data: Uint8Array): CVerusHashV2 {
    let pos = 0;
    while (pos < data.length) {
      const room = 32 - this.curPos;
      const remaining = data.length - pos;

      if (remaining >= room) {
        this.curBuf.set(data.subarray(pos, pos + room), 32 + this.curPos);
        this.result.set(haraka512256(Array.from(this.curBuf)), 0);
        [this.curBuf, this.result] = [this.result, this.curBuf];
        pos += room;
        this.curPos = 0;
      } else {
        this.curBuf.set(data.subarray(pos, data.length), 32 + this.curPos);
        this.curPos += remaining;
        pos = data.length;
      }
    }
    return this;
  }

}

let reverseBuffer = function (buff: string | any[] | Buffer) {
  var reversed = Buffer.alloc(buff.length);
  for (var i = buff.length - 1; i >= 0; i--)
    reversed[buff.length - i - 1] = buff[i];
  return reversed;
};

export let reverseHex = function (hex: string) {
  return reverseBuffer(Buffer.from(hex, 'hex')).toString('hex');
};

export function uint8ArrayToHex(arr: Uint8Array): string {
  return Array.from(arr, byte => byte.toString(16).padStart(2, '0')).join('');
}

