import { haraka256256, haraka512256Keyed } from "./haraka copy"; // Assuming your Haraka implementation is in haraka.ts
import { verusclhasher } from "./verus_clhasher"; // Assuming your VerusCLHasher implementation is in verusclhasher.ts

enum SolutionVersion {
  HASH2 = 0, // Assuming this is the value for SOLUTION_VERUSHHASH_V2
  HASH2B = 1, // This is an assumption, needs confirmation
  HASH2B1 = 2, // This is the value for SOLUTION_VERUSHHASH_V2_1
}

class CVerusHashV2 {
  private curBuf: Uint8Array;
  private result: Uint8Array;
  private curPos: number;
  private solutionVersion: SolutionVersion;
  private vclh: verusclhasher; // Declare vclh with the correct type

  constructor(solutionVersion: SolutionVersion = SolutionVersion.HASH2) {
    this.curBuf = new Uint8Array(64);
    this.result = new Uint8Array(64);
    this.curPos = 0;
    this.solutionVersion = solutionVersion;
    this.vclh = new verusclhasher(); // Initialize vclh here
  }

  public Hash(data: Uint8Array): Uint8Array {
    const buf = new Uint8Array(128);
    let bufPtr = 0;
    let nextOffset = 64;
    let pos = 0;

    buf.fill(0, bufPtr, bufPtr + 32);

    while (pos < data.length) {
      const remaining = data.length - pos;
      if (remaining >= 32) {
        buf.set(data.subarray(pos, pos + 32), bufPtr + 32);
      } else {
        buf.set(data.subarray(pos, data.length), bufPtr + 32);
        buf.fill(0, bufPtr + 32 + remaining, bufPtr + 64);
      }

      let hash: Uint8Array;
      if (this.solutionVersion === SolutionVersion.HASH2) {
        hash = haraka512256Keyed(Array.from(buf.subarray(bufPtr, bufPtr + 64)), new Uint8Array());
      } else {
        // For HASH2B and HASH2B1, use finalize2b logic
        const tempHash = new Uint8Array(32);
        this.finalize2b(tempHash); // Assuming finalize2b updates tempHash
        hash = tempHash;
      }

      buf.set(hash, bufPtr + nextOffset);
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

        if (this.solutionVersion === SolutionVersion.HASH2) {
          this.result.set(haraka512256Keyed(Array.from(this.curBuf), new Uint8Array()), 0);
        } else {
          // For HASH2B and HASH2B1, use finalize2b logic
          const tempHash = new Uint8Array(32);
          this.finalize2b(tempHash); // Assuming finalize2b updates tempHash
          this.result.set(tempHash, 0);
        }

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

  private genNewCLKey(seedBytes32: Uint8Array): Uint8Array {
    const key = new Uint8Array(this.vclh.keySizeInBytes); // Assuming vclh.keySizeInBytes is defined
    const pdesc = this.vclh.pdesc; // Assuming vclh.pdesc is defined
    // skip keygen if it is the current key
    if (!uint8ArrayEquals(pdesc.seed, seedBytes32)) {
      // generate a new key by chain hashing with Haraka256 from the last curbuf
      const n256blks = this.vclh.keySizeInBytes >> 5;
      const nbytesExtra = this.vclh.keySizeInBytes & 0x1f;
      let pkey = key.subarray(this.vclh.keySizeInBytes);
      let psrc = seedBytes32;
      for (let i = 0; i < n256blks; i++) {
        const hash = haraka256256(Array.from(psrc));
        pkey.set(hash);
        psrc = pkey;
        pkey = pkey.subarray(32);
      }
      if (nbytesExtra) {
        const buf = new Uint8Array(haraka256256(Array.from(psrc)));
        pkey.set(buf.subarray(0, nbytesExtra));
      }
      pdesc.seed = seedBytes32.slice();
    }
    key.set(key.subarray(this.vclh.keySizeInBytes));
    return key;
  }

  private intermediateTo128Offset(intermediate: number): number {
    // the mask is where we wrap
    const mask = this.vclh.keyMask >> 4;
    return intermediate & mask;
  }

  private finalize2b(hash: Uint8Array): void {
    // fill buffer to the end with the beginning of it to prevent any foreknowledge of
    // bits that may contain zero
    this.FillExtra(this.curBuf.subarray(0, 32)); // Assuming FillExtra is implemented

    const key = this.genNewCLKey(this.curBuf);

    const intermediate = this.vclh.hash(this.curBuf, key); // Assuming vclh has a method named hash

    this.FillExtra(new Uint8Array(intermediate));

    // get the final hash with a mutated dynamic key for each hash result
    const offset = this.intermediateTo128Offset(intermediate);
    const keyedHash = haraka512256Keyed(Array.from(this.curBuf), key.subarray(offset));
    hash.set(keyedHash, 0);
  }

  public Finalize(hash: Uint8Array): void {
    switch (this.solutionVersion) {
      case SolutionVersion.HASH2:
        if (this.curPos > 0) {
          this.curBuf.fill(0, 32 + this.curPos, 64);
          // Use haraka512256Keyed with an empty key for HASH2
          hash.set(haraka512256Keyed(Array.from(this.curBuf), new Uint8Array()), 0);
        } else {
          hash.set(this.curBuf.subarray(0, 32), 0);
        }
        break;
      case SolutionVersion.HASH2B:
      case SolutionVersion.HASH2B1:
        this.finalize2b(hash);
        break;
    }
  }

  private FillExtra(data: Uint8Array): void {
    let pos = this.curPos;
    let left = 32 - pos;
    let dataPos = 0;
    do {
      const len = Math.min(left, data.length - dataPos);
      this.curBuf.set(data.subarray(dataPos, dataPos + len), 32 + pos);
      pos += len;
      left -= len;
      dataPos += len;
    } while (left > 0);
  }
}

function uint8ArrayEquals(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i])
      return false;
  }
  return true
}



let reverseBuffer = function (buff: string | any[] | Buffer) {
  var reversed = Buffer.alloc(buff.length);
  for (var i = buff.length - 1; i >= 0; i--)
    reversed[buff.length - i - 1] = buff[i];
  return reversed;
};

let reverseHex = function (hex: string) {
  return reverseBuffer(Buffer.from(hex, 'hex')).toString('hex');
};

function uint8ArrayToHex(arr: Uint8Array): string {
  return Array.from(arr, byte => byte.toString(16).padStart(2, '0')).join('');
}

const hasher = new CVerusHashV2(SolutionVersion.HASH2B1);
const data = Buffer.from('Test', 'utf8')
const hash = hasher.Hash(data);
const hash2 = uint8ArrayToHex(hash);

console.log(reverseHex(hash2));