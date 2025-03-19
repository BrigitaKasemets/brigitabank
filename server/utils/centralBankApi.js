const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Mock data for testing
const mockBanks = {
  'ABC': {
    prefix: 'ABC',
    name: 'Brigita Bank',
    transactionUrl: 'http://localhost:3001/api/banks/transactions',
    jwksUrl: 'http://localhost:3001/api/banks/jwks',
    apiKey: 'mock-brigita-api-key',
    status: 'active'
  },
  'XYZ': {
    prefix: 'XYZ',
    name: 'XYZ Bank',
    transactionUrl: 'http://localhost:3002/api/banks/transactions',
    jwksUrl: 'http://localhost:3002/api/banks/jwks',
    apiKey: 'mock-xyz-api-key',
    status: 'active'
  },
  'TEST': {
    prefix: 'TEST',
    name: 'Test Bank',
    transactionUrl: 'http://localhost:3003/api/banks/transactions',
    jwksUrl: 'http://localhost:3003/api/banks/jwks',
    apiKey: 'mock-test-api-key',
    status: 'active'
  }
};

// Get bank information from central bank by prefix
// In centralBankApi.js
exports.getBankByPrefix = async (prefix) => {
  try {
    const response = await fetch(`${process.env.CENTRAL_BANK_URL}/banks`, {
      headers: {
        'X-API-KEY': process.env.API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get banks: ${response.statusText}`);
    }

    const banks = await response.json();
    // Look for bank with bankPrefix or prefix property
    return banks.find(bank => (bank.bankPrefix === prefix || bank.prefix === prefix));
  } catch (err) {
    console.error('Error getting bank by prefix:', err);
    return null;
  }
};

// Register bank with central bank
exports.registerBank = async (bankData) => {
  // If in test mode, return mock response
  if (process.env.TEST_MODE === 'true') {
    console.log(`[TEST_MODE] Registering mock bank: ${bankData.name}`);
    const mockResponse = {
      ...bankData,
      apiKey: `mock-${bankData.prefix.toLowerCase()}-api-key`,
      status: 'active'
    };

    // Add to mock banks for future reference
    mockBanks[bankData.prefix] = mockResponse;

    return mockResponse;
  }

  try {
    const response = await fetch(`${process.env.CENTRAL_BANK_URL}/banks/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.CENTRAL_BANK_API_KEY
      },
      body: JSON.stringify(bankData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registration failed');
    }

    return await response.json();
  } catch (err) {
    console.error('Bank registration error:', err.message);
    throw err;
  }
};

// Get all banks from central bank
exports.getAllBanks = async () => {
  // If in test mode, return mock data
  if (process.env.TEST_MODE === 'true') {
    console.log('[TEST_MODE] Getting all mock banks');
    return Object.values(mockBanks);
  }

  try {
    const response = await fetch(`${process.env.CENTRAL_BANK_URL}/banks`, {
      headers: {
        'X-API-Key': process.env.CENTRAL_BANK_API_KEY
      }
    });

    if (!response.ok) {
      console.error(`Error getting banks: ${response.status}`);
      return [];
    }

    return await response.json();
  } catch (err) {
    console.error('Central Bank API error:', err.message);
    return [];
  }
};