// Mocking node-fetch for CommonJS compatibility
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Keskpanga matkimine testimiseks
const TEST_MODE = process.env.TEST_MODE === 'true';

// Testimiseks mõeldud pankade andmed
const mockBanks = {
  'ABC': {
    prefix: 'ABC',
    name: 'Alpha Bank',
    transactionUrl: 'http://localhost:3000/transactions/b2b',
    jwksUrl: 'http://localhost:3000/transactions/jwks',
    apiKey: 'abc-api-key',
  },
  'XYZ': {
    prefix: 'XYZ',
    name: 'XYZ Bank',
    transactionUrl: 'http://localhost:3001/transactions/b2b',
    jwksUrl: 'http://localhost:3001/transactions/jwks',
    apiKey: 'xyz-api-key',
  },
};

// Panga info hankimine prefiksi järgi
exports.getBankByPrefix = async (prefix) => {
  try {
    // Testimisrežiimis kasuta mock andmeid
    if (TEST_MODE) {
      return mockBanks[prefix] || null;
    }

    // Päris režiimis küsi keskpangast
    const response = await fetch(`${process.env.CENTRAL_BANK_URL}/banks/${prefix}`, {
      headers: {
        'X-API-Key': process.env.CENTRAL_BANK_API_KEY
      }
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (err) {
    console.error('Keskpanga API viga:', err.message);
    return null;
  }
};

// Panga registreerimine keskpangas
exports.registerBank = async (bankData) => {
  try {
    // Testimisrežiimis imiteeri edukat registreerimist
    if (TEST_MODE) {
      return {
        success: true,
        apiKey: 'mock-api-key-' + Math.random().toString(36).substring(2, 10)
      };
    }

    // Päris režiimis registreeri keskpangas
    const response = await fetch(`${process.env.CENTRAL_BANK_URL}/banks/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bankData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || 'Registreerimine ebaõnnestus');
    }

    return await response.json();
  } catch (err) {
    console.error('Panga registreerimise viga:', err.message);
    throw err;
  }
};