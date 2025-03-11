const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Kontrolli, kas võtmed juba eksisteerivad
const keysDir = path.join(__dirname, '..', 'keys');
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir);
}

const privateKeyPath = path.join(keysDir, 'private.pem');
const publicKeyPath = path.join(keysDir, 'public.pem');

// Genereeri uued võtmed, kui neid pole
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

// Loe võtmed
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

module.exports = {
  privateKey,
  publicKey,
  // Funktsioon JWKS vormingus avaliku võtme saamiseks
  getJwks: () => {
    // Ekstrakti PEM vormingus avalik võti
    const pemHeader = '-----BEGIN PUBLIC KEY-----';
    const pemFooter = '-----END PUBLIC KEY-----';
    const pemContents = publicKey.substring(
      pemHeader.length,
      publicKey.length - pemFooter.length - 1
    ).replace(/\n/g, '');

    // JWKS formaat
    return {
      keys: [
        {
          kty: 'RSA',
          kid: '1', // Key ID
          use: 'sig', // Allkirjastamise jaoks
          alg: 'RS256',
          n: Buffer.from(pemContents, 'base64').toString('base64url'), // Modulus
          e: 'AQAB' // Exponent (65537 standardne)
        }
      ]
    };
  }
};