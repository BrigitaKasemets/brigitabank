// Add this function to server/config/keys.js
const generateNewKeys = async () => {
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

  // Update module variables
  module.exports.privateKey = privateKey;
  module.exports.publicKey = publicKey;

  console.log('Võtmed genereeritud!');
  return { privateKey, publicKey };
};

// Export the function
module.exports.generateNewKeys = generateNewKeys;