const jwt = require('jsonwebtoken');
const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const jwksClient = require('jwks-rsa');
const keys = require('../config/keys');

// JWT creation
exports.createJWT = (payload) => {
  try {
    // Use the key from the keys module instead of reading from file
    return jwt.sign(payload, keys.privateKey, {
      algorithm: 'RS256',
      expiresIn: '1h'
    });
  } catch (err) {
    console.error('JWT signing error:', err);
    return null;
  }
};

// JWT dekodeerimine (ilma allkirja kontrollimata)
exports.decodeJWT = (token) => {
  try {
    // Dekodeeri JWT ilma allkirja kontrollimata
    return jwt.decode(token);
  } catch (err) {
    console.error('JWT dekodeerimise viga:', err.message);
    return null;
  }
};

// JWT allkirja valideerimine
exports.verifyJWT = async (token, jwksUrl) => {
  try {
    // Testimisrežiimis valideerimine alati õnnestub
    if (process.env.TEST_MODE === 'true') {
      return true;
    }

    // Hangi JWKS allikapangast
    const response = await fetch(jwksUrl);
    if (!response.ok) {
      console.error('JWKS hankimise viga:', response.statusText);
      return false;
    }

    const jwks = await response.json();

    // Ekstrakti header JWT-st
    const header = jwt.decode(token, { complete: true })?.header;
    if (!header || !header.kid) {
      console.error('JWT header puudub või vigane');
      return false;
    }

    // Leia avalik võti JWKS-st
    const key = jwks.keys.find(k => k.kid === header.kid);
    if (!key) {
      console.error('Avalikku võtit ei leitud');
      return false;
    }

    const client = jwksClient({
      jwksUri: jwksUrl
    });

    const signingKey = await client.getSigningKey(header.kid);
    const publicKey = signingKey.getPublicKey();

    // Valideeri JWT allkiri
    jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    return true;
  } catch (err) {
    console.error('JWT valideerimise viga:', err.message);
    return false;
  }
};