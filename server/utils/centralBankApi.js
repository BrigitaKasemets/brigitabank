const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Get bank information from central bank by prefix
exports.getBankByPrefix = async (prefix) => {
  try {
    const url = `${process.env.CENTRAL_BANK_URL}/banks/${prefix}`;
    console.log(`Getting bank with prefix: ${prefix} from central bank`);
    console.log(`Request URL: ${url}`);
    console.log(`Using API Key: ${process.env.API_KEY ? '***' + process.env.API_KEY.substring(process.env.API_KEY.length - 4) : 'MISSING'}`);

    const response = await fetch(url, {
      headers: {
        'X-API-KEY': process.env.API_KEY
      }
    });

    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response body: ${errorText}`);
      throw new Error(`Failed to get bank: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Bank data received:`, data);
    return data;
  } catch (err) {
    console.error('Error getting bank by prefix:', err);
    throw err;
  }
};

// Get all banks from central bank
exports.getAllBanks = async () => {
  try {
    console.log('Getting all banks from central bank');
    const response = await fetch(`${process.env.CENTRAL_BANK_URL}/banks`, {
      headers: {
        'X-API-KEY': process.env.API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get banks: ${response.statusText}`);
    }

    return await response.json();
  } catch (err) {
    console.error('Central Bank API error:', err.message);
    throw err;
  }
};

// Register or update bank with central bank
exports.registerBank = async (bankData) => {
  try {
    console.log('Registering with central bank:', bankData);
    const response = await fetch(`${process.env.CENTRAL_BANK_URL}/banks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.API_KEY
      },
      body: JSON.stringify(bankData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Registration failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (err) {
    console.error('Bank registration error:', err.message);
    throw err;
  }
};