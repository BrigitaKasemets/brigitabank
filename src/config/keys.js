const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// Võtmete tee
const keysDir = path.join(__dirname, 'keys');
const privateKeyPath = path.join(keysDir, 'private.pem');
const publicKeyPath = path.join(keysDir, 'public.pem');

// ⬇️ DEFINEERIME puuduva funktsiooni
function generateNewKeys() {
  // Veendu, et 'keys' kaust eksisteerib
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
  }

  // Genereeri RSA võti
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  // Salvesta võtmed failidesse
  fs.writeFileSync(privateKeyPath, privateKey);
  fs.writeFileSync(publicKeyPath, publicKey);

  return { privateKey, publicKey };
}

// Loe võtmed, kui olemas
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

// Ekspordi võtmed
module.exports.privateKey = privateKey;
module.exports.publicKey = publicKey;

// JWKS genereerimine
module.exports.getJwks = () => {
  try {
    const publicKeyObject = crypto.createPublicKey({
      key: publicKey,
      format: 'pem'
    });

    const keyData = publicKeyObject.export({ format: 'jwk' });

    const kid = uuidv4();

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
