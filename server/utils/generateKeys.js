const fs = require('fs');
try {
    const privateKey = fs.readFileSync('./config/keys/private.key', 'utf8');
    console.log('Private key exists:', privateKey.length > 0);
} catch (err) {
    console.error('Error reading private key:', err.message);
}

const path = require('path');
const crypto = require('crypto');

// Create keys directory if it doesn't exist
const keysDir = path.join(__dirname, '../config/keys');
if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
}

// Generate RSA key pair
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
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

// Write keys to files
fs.writeFileSync(path.join(keysDir, 'private.pem'), privateKey);
fs.writeFileSync(path.join(keysDir, 'public.pem'), publicKey);

console.log('RSA key pair generated successfully');