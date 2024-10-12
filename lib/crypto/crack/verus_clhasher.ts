import { aes2, mix2 } from './haraka copy';
interface verusclhash_descr {
  seed: Uint8Array;
  // ... any other properties from verusclhash_descr if needed
}

export class verusclhasher {
  keySizeInBytes: number;
  keyMask: number;
  pdesc: verusclhash_descr;

  constructor() {
    this.keySizeInBytes = 1024 * 8 + (40 * 16); // From VERUSKEYSIZE in verus_clhash.h
    this.keyMask = (1 << 20) - 1; // Example: Adjust as needed
    this.pdesc = { seed: new Uint8Array(32) }; // Initialize pdesc appropriately
  }

  public hash(buf: Uint8Array, key: Uint8Array): number {
    const pbufCopy = [
      this.xor128(buf.subarray(0, 16), buf.subarray(32, 48)),
      this.xor128(buf.subarray(16, 32), buf.subarray(48, 64)),
      buf.subarray(32, 48),
      buf.subarray(48, 64),
    ];

    let acc = this.load128(key, (this.keyMask + 2) * 16);

    for (let i = 0; i < 32; i++) {
      const selector = this.convert128ToNumber(acc);

      const prandIdx = (selector >> 5) & this.keyMask;
      const prandexIdx = (selector >> 32) & this.keyMask;

      let prand = this.load128(key, prandIdx * 16);
      let prandex = this.load128(key, prandexIdx * 16);

      const pbuf = pbufCopy[selector & 3];

      switch (selector & 0x1c) {
        case 0: {
          const temp1 = prandex;
          const temp2 = (selector & 1) ? pbuf[pbuf.length - 1] : pbuf[1];
          const add1 = this.xor128(temp1, new Uint8Array([temp2])); // Wrap temp2 in a Uint8Array
          const clprod1 = this.clmul(add1, add1);
          acc = this.xor128(clprod1, acc);

          const tempa1 = this.mulhrs(acc, temp1);
          const tempa2 = this.xor128(tempa1, temp1);

          const temp12 = prand;
          prand = this.xor128(tempa2, temp12);

          const temp22 = this.load128(key, (selector & 1) ? (pbuf.length - 1) * 16 : pbuf[1] * 16);
          const add12 = this.xor128(temp12, temp22);
          const clprod12 = this.clmul(add12, add12);
          acc = this.xor128(clprod12, acc);

          const tempb1 = this.mulhrs(acc, temp12);
          const tempb2 = this.xor128(tempb1, temp12);
          prandex = this.xor128(tempb2, prandex);
          break;
        }
        case 4: {
          const temp1 = prand;
          const temp2 = pbufCopy[selector & 3]; // Access the Uint8Array within pbufCopy
          const add1 = this.xor128(temp1, temp2); // Pass the Uint8Array to xor128
          const clprod1 = this.clmul(add1, add1);
          acc = this.xor128(clprod1, acc);
          const clprod2 = this.clmul(new Uint8Array(temp2), new Uint8Array(temp2));
          acc = this.xor128(clprod2, acc);

          const tempa1 = this.mulhrs(acc, temp1);
          const tempa2 = this.xor128(tempa1, temp1);

          const temp12 = prandex;
          prandex = this.xor128(tempa2, temp12);

          const temp22 = (selector & 1) ? pbuf[pbuf.length - 1] : pbuf[1];
          const add12 = this.xor128(temp12, new Uint8Array([temp22])); // Wrap temp22 in a Uint8Array
          acc = this.xor128(add12, acc);

          const tempb1 = this.mulhrs(acc, temp12);
          prand = this.xor128(tempb1, temp12);
          break;
        }
        case 8: {
          const temp1 = prandex;
          const temp2 = pbufCopy[selector & 3]; // Access the Uint8Array within pbufCopy
          const add1 = this.xor128(temp1, temp2); // Pass the Uint8Array to xor128
          acc = this.xor128(add1, acc);

          const tempa1 = this.mulhrs(acc, temp1);
          const tempa2 = this.xor128(tempa1, temp1);

          const temp12 = prand;
          prand = this.xor128(tempa2, temp12);

          const temp22 = (selector & 1) ? pbuf[pbuf.length - 1] : pbuf[1];
          const add12 = this.xor128(temp12, new Uint8Array([temp22])); // Wrap temp22 in a Uint8Array
          const clprod12 = this.clmul(add12, add12);
          acc = this.xor128(clprod12, acc);
          const clprod22 = this.clmul(new Uint8Array([temp22]), new Uint8Array([temp22]));
          acc = this.xor128(clprod22, acc);

          const tempb1 = this.mulhrs(acc, temp12);
          const tempb2 = this.xor128(tempb1, temp12);
          prandex = this.xor128(tempb2, prandex);
          break;
        }
        case 0xc: {
          const temp1 = prand;
          const temp2 = (selector & 1) ? pbuf[pbuf.length - 1] : pbuf[1];
          const add1 = this.xor128(temp1, new Uint8Array([temp2])); // Wrap temp2 in a Uint8Array
        
          // cannot be zero here
          const divisor = selector;
        
          acc = this.xor128(add1, acc);
        
          const dividend = this.convert128ToNumber(acc);
          const modulo = dividend % divisor;
          acc = this.xor128(new Uint8Array([modulo]), acc); // Wrap modulo in a Uint8Array
        
          const tempa1 = this.mulhrs(acc, temp1);
          const tempa2 = this.xor128(tempa1, temp1);
        
          if (dividend & 1) {
            const temp12 = prandex;
            prandex = this.xor128(tempa2, temp12);
          
            const temp22 = pbufCopy[selector & 3]; 
            const add12 = this.xor128(temp12, temp22); 
            const clprod12 = this.clmul(add12, add12);
            acc = this.xor128(clprod12, acc);
            const clprod22 = this.clmul(temp22, temp22);  // Directly use temp22
            acc = this.xor128(clprod22, acc);
          
            const tempb1 = this.mulhrs(acc, temp12);
            const tempb2 = this.xor128(tempb1, temp12);
            prand = this.xor128(tempb2, prand);
          } else {
            prand = this.xor128(prandex, prand);
            prandex = this.xor128(tempa2, prandex);
            acc = this.xor128(new Uint8Array(pbuf), acc); // Convert pbuf to Uint8Array if needed
          }
          break;
        }
        case 0x10: {
          let temp1 = (selector & 1) ? pbuf[pbuf.length - 1] : pbuf[1];
          let temp2 = pbuf;
        
          aes2(new Uint8Array([temp1]), new Uint8Array(temp2), 0, prand); // Call aes2 directly
          mix2(new Uint8Array([temp1]), temp2); // Wrap temp1 in Uint8Array
        
          aes2(new Uint8Array([temp1]), temp2, 4, prand);
          mix2(new Uint8Array([temp1]), temp2);
        
          aes2(new Uint8Array([temp1]), temp2, 8, prand);
          mix2(new Uint8Array([temp1]), temp2);
        
          acc = this.xor128(new Uint8Array(temp2), this.xor128(new Uint8Array([temp1]), acc)); // Convert temp1 and temp2 if needed
        
          const tempa1 = prand;
          const tempa2 = this.mulhrs(acc, tempa1); // Use existing mulhrs
        
          prand = prandex;
          prandex = this.xor128(tempa1, tempa2); // Use existing xor128
          break;
        }
        case 0x14: {
          const buftmp = (selector & 1) ? pbuf[pbuf.length - 1] : pbuf[1];
        
          let rounds = selector >> 61; // loop randomly between 1 and 8 times
          let rc = prand;
          let aesroundoffset = 0;
          let onekey;
        
          do {
            if (selector & (0x10000000 << rounds)) {
              const temp2 = (rounds & 1) ? pbuf : buftmp;
              const add1 = this.xor128(rc, typeof temp2 === 'number' ? new Uint8Array([temp2]) : new Uint8Array(temp2)); // Convert temp2 to Uint8Array if needed
              rc = this.load128(key, (rc[0] + 1) * 16);
              const clprod1 = this.clmul(add1, add1);
              acc = this.xor128(clprod1, acc);
            } else {
              onekey = rc;
              rc = this.load128(key, (rc[0] + 1) * 16);
              let temp2 = (rounds & 1) ? buftmp : pbuf;
              // Call aes2 and mix2 directly
              aes2(onekey, temp2 instanceof Uint8Array ? temp2 : new Uint8Array([temp2]), aesroundoffset, rc); // Assuming rc is the round key source
              aesroundoffset += 4;
              mix2(onekey, temp2 instanceof Uint8Array ? temp2 : new Uint8Array([temp2]));
              acc = this.xor128(onekey, acc);
              acc = this.xor128(new Uint8Array([temp2 as number]), acc); // Ensure temp2 is treated as a number and wrapped in a Uint8Array
            }
          } while (rounds--);
        
          const tempa1 = prand;
          const tempa2 = this.mulhrs(acc, tempa1);
          const tempa3 = this.xor128(tempa1, tempa2);
        
          const tempa4 = prandex;
          prandex = this.xor128(tempa3, tempa4);
          prand = this.xor128(tempa4, tempa1);
          break;
        }
        case 0x18: {
          const buftmp = (selector & 1) ? pbuf[pbuf.length - 1] : pbuf[1];

          let rounds = selector >> 61; // loop randomly between 1 and 8 times
          let rc = prand;
          let onekey;

          do {
            if (selector & (0x10000000 << rounds)) {
              const temp2 = (rounds & 1) ? pbuf : buftmp;
              onekey = this.xor128(rc, temp2 instanceof Uint8Array ? temp2 : new Uint8Array([temp2]));
              rc = this.load128(key, (rc[0] + 1) * 16);
              // cannot be zero here, may be negative
              const divisor = selector;
              const dividend = this.convert128ToNumber(onekey);
              const modulo = dividend % divisor;
              acc = this.xor128(new Uint8Array([modulo]), acc); // Wrap modulo in a Uint8Array
            } else {
              let temp2 = (rounds & 1) ? buftmp : pbuf;
              const add1 = this.xor128(rc, temp2 instanceof Uint8Array ? temp2 : new Uint8Array([temp2])); // Convert temp2 to Uint8Array if needed
              rc = this.load128(key, (rc[0] + 1) * 16);
              onekey = this.clmul(add1, add1);
              const clprod2 = this.mulhrs(acc, onekey);
              acc = this.xor128(clprod2, acc);
            }
          } while (rounds--);

          const tempa3 = prandex;

          prandex = this.xor128(onekey, prandex);
          prand = this.xor128(tempa3, acc);
          break;
        }
        case 0x1c: {
          const temp1 = pbuf;
          const temp2 = prandex;
          const add1 = this.xor128(new Uint8Array(temp1), temp2); // Convert temp1 to Uint8Array if needed
          const clprod1 = this.clmul(add1, add1);
          acc = this.xor128(clprod1,acc);

          const tempa1 = this.mulhrs(acc, temp2);
          const tempa2 = this.xor128(tempa1, temp2);

          const tempa3 = prand;
          prand = tempa2;

          acc = this.xor128(tempa3, acc);
          const temp4 = (selector & 1) ? pbuf[pbuf.length - 1] : pbuf[1];
          acc = this.xor128(new Uint8Array([temp4]), acc); // Wrap temp4 in a Uint8Array
          const tempb1 = this.mulhrs(acc, tempa3);
          prandex = this.xor128(tempb1, tempa3);
          break;
        }
      }
    }

    acc = this.xor128(acc, this.lazyLengthHash(1024, 64));
    return this.convert128ToNumber(this.precompReduction64(acc)); // Convert to number here
  }

  // Helper functions for bitwise operations and data manipulation
  private xor128(a: Uint8Array, b: Uint8Array): Uint8Array {
    const result = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      result[i] = a[i] ^ b[i];
    }
    return result;
  }

  private load128(key: Uint8Array, offset: number): Uint8Array {
    const result = new Uint8Array(16);
    result.set(key.subarray(offset, offset + 16));
    return result;
  }

  private convert128ToNumber(a: Uint8Array): number {
    let result = 0;
    for (let i = 0; i < 16; i++) {
      result |= a[i] << (i * 8);
    }
    return result;
  }

  private clmul(a: Uint8Array, b: Uint8Array): Uint8Array {
    const result = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      for (let j = 0; j < 16; j++) {
        result[i] ^= (a[i] & b[j]) << j;
      }
    }
    return result;
  }

  private lazyLengthHash(keylength: number, length: number): Uint8Array {
    const lengthVector = new Uint8Array(16);
    lengthVector.set([keylength, length], 0);

    const clprod1 = this.clmul(lengthVector, lengthVector);
    return clprod1;
  }

  private precompReduction64(a: Uint8Array): Uint8Array {
    // Create a constant for the irreducible polynomial (64, 4, 3, 1, 0)
    const C = new Uint8Array([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 3, 1, 0]);
    const Q2 = this.clmul(a, C);  // Perform carry-less multiplication of a and C
    const Q3 = this.shiftRight128(Q2, 8); // Shift Q2 right by 8 bits
    const Q4 = this.xor128(Q2, Q3);   // XOR Q2 and Q3
    const final = this.xor128(Q4, a); // XOR Q4 and a

    return final;
  }
  
  private shiftRight128(a: Uint8Array, shift: number): Uint8Array {
    const result = new Uint8Array(16);
    for (let i = 0; i < 16 - shift; i++) {
      result[i] = a[i + shift];
    }
    return result;
  }

  private mulhrs(a: Uint8Array, b: Uint8Array): Uint8Array {
    const result = new Uint8Array(16);
    for (let i = 0; i < 16; i += 2) {
      const a16 = (a[i] << 8) | a[i + 1]; // Combine two 8-bit values into a 16-bit value
      const b16 = (b[i] << 8) | b[i + 1];
      const product32 = a16 * b16; // Perform 16-bit multiplication
      const high16 = (product32 >> 16) & 0xFFFF; // Extract the high 16 bits
      result[i] = (high16 >> 8) & 0xFF; // Split the high 16 bits back into two 8-bit values
      result[i + 1] = high16 & 0xFF;
    }
    return result;
  }
}