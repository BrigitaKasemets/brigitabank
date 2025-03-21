// Add to server/config/keys.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const privateKeyPath = path.join(__dirname, 'keys', 'private.pem');
const publicKeyPath = path.join(__dirname, 'keys', 'public.pem');

// Read keys if they exist
let privateKey, publicKey;
try {
  privateKey = fs.readFileSync(privateKeyPath, 'utf8');
  publicKey = fs.readFileSync(publicKeyPath, 'utf8');
} catch (err) {
  console.error('No keys found, generating new keys...');
  const keys = generateNewKeys();
  privateKey = keys.privateKey;
  publicKey = keys.publicKey;
}

// Export keys
module.exports.privateKey = privateKey;
module.exports.publicKey = publicKey;

// Generate JWKS from public key
module.exports.getJwks = () => {
  try {
    // Parse the public key
    const pemHeader = '-----BEGIN PUBLIC KEY-----';
    const pemFooter = '-----END PUBLIC KEY-----';
    const pemContents = publicKey
        .replace(pemHeader, '')
        .replace(pemFooter, '')
        .replace(/\s/g, '');

    // Create modulus and exponent components
    const publicKeyObject = crypto.createPublicKey({
      key: publicKey,
      format: 'pem'
    });

    const keyData = publicKeyObject.export({ format: 'jwk' });

    // Create a key ID if it doesn't exist
    const kid = uuidv4();

    // Return JWKS format
    return {
      keys: [
        {
          kty: "RSA",
          kid: kid,
          use: "sig",
          alg: "RS256",
          n: keyData.n,
          e: keyData.e
        }
      ]
    };
  } catch (error) {
    console.error('Error generating JWKS:', error);
    return { keys: [] };
  }
};