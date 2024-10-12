import { CVerusHashV2, uint8ArrayToHex, reverseHex } from './lib/crypto/verushash';

const hasher = new CVerusHashV2();
const data = Buffer.from('Test', 'utf8')
const hash = hasher.Hash(data);
const hash2 = uint8ArrayToHex(hash);

console.log(reverseHex(hash2));