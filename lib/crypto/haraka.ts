const ROUNDS = 5
const AES_ROUNDS = 2

// AES S-box
const S = [
    [0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76],
    [0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0],
    [0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15],
    [0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75],
    [0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84],
    [0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf],
    [0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8],
    [0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2],
    [0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73],
    [0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb],
    [0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79],
    [0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08],
    [0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a],
    [0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e],
    [0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf],
    [0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16]
]

// round constants
const RC = [
    BigInt('0x0684704ce620c00ab2c5fef075817b9d'),
    BigInt('0x8b66b4e188f3a06b640f6ba42f08f717'),
    BigInt('0x3402de2d53f28498cf029d609f029114'),
    BigInt('0x0ed6eae62e7b4f08bbf3bcaffd5b4f79'),
    BigInt('0xcbcfb0cb4872448b79eecd1cbe397044'),
    BigInt('0x7eeacdee6e9032b78d5335ed2b8a057b'),
    BigInt('0x67c28f435e2e7cd0e2412761da4fef1b'),
    BigInt('0x2924d9b0afcacc07675ffde21fc70b3b'),
    BigInt('0xab4d63f1e6867fe9ecdb8fcab9d465ee'),
    BigInt('0x1c30bf84d4b7cd645b2a404fad037e33'),
    BigInt('0xb2cc0bb9941723bf69028b2e8df69800'),
    BigInt('0xfa0478a6de6f55724aaa9ec85c9d2d8a'),
    BigInt('0xdfb49f2b6b772a120efa4f2e29129fd4'),
    BigInt('0x1ea10344f449a23632d611aebb6a12ee'),
    BigInt('0xaf0449884b0500845f9600c99ca8eca6'),
    BigInt('0x21025ed89d199c4f78a2c7e327e593ec'),
    BigInt('0xbf3aaaf8a759c9b7b9282ecd82d40173'),
    BigInt('0x6260700d6186b01737f2efd910307d6b'),
    BigInt('0x5aca45c22130044381c29153f6fc9ac6'),
    BigInt('0x9223973c226b68bb2caf92e836d1943a'),
    BigInt('0xd3bf9238225886eb6cbab958e51071b4'),
    BigInt('0xdb863ce5aef0c677933dfddd24e1128d'),
    BigInt('0xbb606268ffeba09c83e48de3cb2212b1'),
    BigInt('0x734bd3dce2e4d19c2db91a4ec72bf77d'),
    BigInt('0x43bb47c361301b434b1415c42cb3924e'),
    BigInt('0xdba775a8e707eff603b231dd16eb6899'),
    BigInt('0x6df3614b3c7559778e5e23027eca472c'),
    BigInt('0xcda75a17d6de7d776d1be5b9b88617f9'),
    BigInt('0xec6b43f06ba8e9aa9d6c069da946ee5d'),
    BigInt('0xcb1e6950f957332ba25311593bf327c1'),
    BigInt('0x2cee0c7500da619ce4ed0353600ed0d9'),
    BigInt('0xf0b1a5a196e90cab80bbbabc63a4a350'),
    BigInt('0xae3db1025e962988ab0dde30938dca39'),
    BigInt('0x17bb8f38d554a40b8814f3a82e75b442'),
    BigInt('0x34bb8a5b5f427fd7aeb6b779360a16f6'),
    BigInt('0x26f65241cbe5543843ce5918ffbaafde'),
    BigInt('0x4ce99a54b9f3026aa2ca9cf7839ec978'),
    BigInt('0xae51a51a1bdff7be40c06e2822901235'),
    BigInt('0xa0c1613cba7ed22bc173bc0f48a659cf'),
    BigInt('0x756acc03022882884ad6bdfde9c59da1')
]

/**
 * Multiply by 2 over GF(2^128)
 */
function xtime(x: number) {
    return ((x << 1) ^ (x & 0x80 ? 0x1b : 0)) & 0xff;
}

/**
 * XOR two lists element-wise
 */
function xor(x: number[], y: number[]): number[] {
    return x.map((value, index) => value ^ y[index]);
}

/**
 * Apply a single S-box
 */
function sbox(x: number) {
    return S[x >> 4][x & 0x0f]
}

/**
 * AES SubBytes
 */
function subbytes(s: any[]) {
    return s.map((x: any) => sbox(x))
}

/**
 * AES ShiftRows
 */
function shiftrows(s: any[]) {
    return [
        s[0], s[5], s[10], s[15],
        s[4], s[9], s[14], s[3],
        s[8], s[13], s[2], s[7],
        s[12], s[1], s[6], s[11]
    ]
}

/**
 * AES MixColumns
 */
function mixcolumns(s: number[]): number[] {
    const v = new Array(16);
    for (let i = 0; i < 4; ++i) {
        const a = s[4 * i];
        const b = s[4 * i + 1];
        const c = s[4 * i + 2];
        const d = s[4 * i + 3];

        const aX = xtime(a);
        const bX = xtime(b);
        const cX = xtime(c);
        const dX = xtime(d);

        v[4 * i] = aX ^ bX ^ b ^ c ^ d;
        v[4 * i + 1] = a ^ bX ^ cX ^ c ^ d;
        v[4 * i + 2] = a ^ b ^ cX ^ dX ^ d;
        v[4 * i + 3] = aX ^ a ^ b ^ c ^ dX;
    }
    return v;
}

/**
 * AES single regular round
 */
function aesenc(s: number[], rk: number[]): number[] {
    s = xor(mixcolumns(shiftrows(subbytes(s))), rk.reverse());
    return s;
}

/**
 * Linear mixing for Haraka-256/256
 */
export function MIX2(s: any[][]): any[][] {
    // Helper function to interleave two arrays
    function interleave(arr1: any[], arr2: any[]): any[] {
        const result: any[] = [];
        for (let i = 0; i < arr1.length; i += 4) {
            result.push(...arr1.slice(i, i + 4), ...arr2.slice(i, i + 4));
        }
        return result;
    }
    // Interleave the two state arrays
    return [
        interleave(s[0].slice(0, 8), s[1].slice(0, 8)),
        interleave(s[0].slice(8, 16), s[1].slice(8, 16))
    ];
}

/**
 * Linear mixing for Haraka-512/256
 */
function MIX4(s: number[][]): number[][] {
    // Define the order in which rows are mixed for each output array
    const rowOrder = [
        [0, 2, 1, 3], // Order for the first output array
        [2, 0, 3, 1], // Order for the second output array
        [2, 0, 3, 1], // Order for the third output array
        [0, 2, 1, 3]  // Order for the fourth output array
    ];

    // Define the column ranges for each output array
    const columnRanges = [
        [12, 16], // Columns 12 to 15 for the first output array
        [0, 4],   // Columns 0 to 3 for the second output array
        [4, 8],   // Columns 4 to 7 for the third output array
        [8, 12]   // Columns 8 to 11 for the fourth output array
    ];

    // Function to generate mixed rows based on rowOrder and columnRanges
    function mixRows(order: number[], range: number[]): number[] {
        const result: number[] = [];
        for (const rowIndex of order) {
            result.push(...s[rowIndex].slice(range[0], range[1]));
        }
        return result;
    }

    // Return the mixed state arrays
    return rowOrder.map((order, index) => mixRows(order, columnRanges[index]));
}

/**
 * AES for Haraka-256/256
 */
function AES2(s1: number[], s2: number[], r: number, rc: BigInt[]): void {
    const roundKey1 = convRC(rc[r]);
    const roundKey2 = convRC(rc[r + 1]);

    s1 = aesenc(s1, roundKey1);
    s2 = aesenc(s2, roundKey2);
}

/**
 * AES for Haraka-512/256
 */
function AES4(s1: number[], s2: number[], s3: number[], s4: number[], r: number, rc: BigInt[]): void {
    const roundKey1 = convRC(rc[r]);
    const roundKey2 = convRC(rc[r + 1]);
    const roundKey3 = convRC(rc[r + 2]);
    const roundKey4 = convRC(rc[r + 3]);

    s1 = aesenc(s1, roundKey1);
    s2 = aesenc(s2, roundKey2);
    s3 = aesenc(s3, roundKey3);
    s4 = aesenc(s4, roundKey4);
}

/**
 * Convert RC (round constants) to 16 words state
 */
function convRC(rc: BigInt): number[] {
    const rcstr = rc.toString(16).padStart(32, '0');
    return Array.from({ length: 16 }, (_, i) => parseInt(rcstr.slice(i * 2, i * 2 + 2), 16));
}

/**
 * Haraka-512/256
 */
export function haraka512(msg: number[]): number[] {
    let s = initState(msg, 4);

    // Apply round functions
    for (let t = 0; t < ROUNDS; ++t) {
        for (let m = 0; m < AES_ROUNDS; ++m) {
            for (let i = 0; i < 4; ++i) {
                s[i] = aesenc(s[i], convRC(RC[4 * t * AES_ROUNDS + 4 * m + i]));
            }
        }
        s = MIX4(s);
    }

    // Apply feed-forward
    applyFeedForward(s, msg, 4);

    // Truncation
    return truncateState(s, [
        8, 9, 10, 11, 12, 13, 14, 15,
        24, 25, 26, 27, 28, 29, 30, 31,
        32, 33, 34, 35, 36, 37, 38, 39,
        48, 49, 50, 51, 52, 53, 54, 55
    ]);
}

/**
 * Haraka-256/256
 */
export function haraka256(msg: number[]): number[] {
    let s = initState(msg, 2);

    // Apply round functions
    for (let t = 0; t < ROUNDS; ++t) {
        for (let m = 0; m < AES_ROUNDS; ++m) {
            for (let i = 0; i < 2; ++i) {
                s[i] = aesenc(s[i], convRC(RC[2 * t * AES_ROUNDS + 2 * m + i]));
            }
        }
        s = MIX2(s);
    }

    // Apply feed-forward
    applyFeedForward(s, msg, 2);

    // Truncation
    return truncateState(s, [
        0, 1, 2, 3, 4, 5, 6, 7,
        8, 9, 10, 11, 12, 13, 14, 15,
        16, 17, 18, 19, 20, 21, 22, 23,
        24, 25, 26, 27, 28, 29, 30, 31
    ]);
}

export function haraka512_keyed(msg: number[], rc: bigint[]): number[] {
    let s = initState(msg, 4);

    // Apply round functions (using provided rc)
    for (let t = 0; t < ROUNDS; ++t) {
        for (let m = 0; m < AES_ROUNDS; ++m) {
            AES4(s[0], s[1], s[2], s[3], 4 * t * AES_ROUNDS + 4 * m, rc);
        }
        s = MIX4(s);
    }

    // Note: Feed-forward step is commented out in the C code for haraka512_keyed
    // applyFeedForward(s, msg, 4); 

    return truncateState(s, [
        8, 9, 10, 11, 12, 13, 14, 15,
        24, 25, 26, 27, 28, 29, 30, 31,
        32, 33, 34, 35, 36, 37, 38, 39,
        48, 49, 50, 51, 52, 53, 54, 55
    ]);
}

export function haraka256_keyed(msg: number[], rc: bigint[]): number[] {
    let s = initState(msg, 2);

    // Apply round functions (using provided rc)
    for (let t = 0; t < ROUNDS; ++t) {
        for (let m = 0; m < AES_ROUNDS; ++m) {
            AES2(s[0], s[1], 2 * t * AES_ROUNDS + 2 * m, rc);
        }
        s = MIX2(s);
    }

    // Note: Feed-forward step is present in the C code for haraka256_keyed
    applyFeedForward(s, msg, 2);

    return truncateState(s, [
        0, 1, 2, 3, 4, 5, 6, 7,
        8, 9, 10, 11, 12, 13, 14, 15,
        16, 17, 18, 19, 20, 21, 22, 23,
        24, 25, 26, 27, 28, 29, 30, 31
    ]);
}

//-----------------------------------------------------------------

// Helper function to initialize state
function initState(msg: number[], size: number): number[][] {
    const state: number[][] = [];
    for (let i = 0; i < size; i++) {
        state.push(msg.slice(i * 16, (i + 1) * 16));
    }
    return state;
}

// Helper function for feed-forward
function applyFeedForward(state: number[][], msg: number[], size: number): void {
    for (let i = 0; i < size; ++i) {
        state[i] = xor(
            state[i],
            msg.slice(16 * i, 16 * (i + 1))
        );
    }
}

// Helper function for truncation
function truncateState(state: number[][], indices: number[]): number[] {
    return indices.map(index => state[Math.floor(index / 16)][index % 16]);
}


