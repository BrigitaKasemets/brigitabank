const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Look for keys in config/keys directory
const keysDir = path.join(__dirname, 'keys');
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir);
}

// Match the file extensions used in generateKeys.js
const privateKeyPath = path.join(keysDir, 'private.pem');
const publicKeyPath = path.join(keysDir, 'public.pem');

// Generate new keys if they don't exist
if (!fs.existsSync(privateKeyPath) || !fs.existsSync(publicKeyPath)) {
  console.log('Genereeritakse uued RSA võtmed...');
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  fs.writeFileSync(privateKeyPath, privateKey);
  fs.writeFileSync(publicKeyPath, publicKey);
  console.log('Võtmed genereeritud!');
}

// Read keys
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

module.exports = {
  privateKey,
  publicKey,
  // JWKS format public key function
  getJwks: () => {
    // Extract PEM format public key
    const pemHeader = '-----BEGIN PUBLIC KEY-----';
    const pemFooter = '-----END PUBLIC KEY-----';
    const pemContents = publicKey.substring(
        pemHeader.length,
        publicKey.length - pemFooter.length - 1
    ).replace(/\n/g, '');

    // JWKS format
    return {
      keys: [
        {
          kty: 'RSA',
          kid: '1', // Key ID
          use: 'sig',
          alg: 'RS256',
          n: Buffer.from(pemContents, 'base64').toString('base64url'), // Modulus
          e: 'AQAB' // Exponent (65537 standard)
        }
      ]
    };
  }
};