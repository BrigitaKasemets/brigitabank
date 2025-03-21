// services/centralBankService.js
const axios = require('axios');

class CentralBankService {
    constructor() {
        this.baseURL = process.env.CENTRAL_BANK_URL;
        this.apiKey = process.env.CENTRAL_BANK_API_KEY;
    }

    async getBanks() {
        try {
            const response = await axios.get(`${this.baseURL}/banks`, {
                headers: { 'X-API-KEY': this.apiKey }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching banks from central bank:', error);
            throw error;
        }
    }

    async getBankByPrefix(prefix) {
        try {
            const response = await axios.get(`${this.baseURL}/banks/${prefix}`, {
                headers: { 'X-API-KEY': this.apiKey }
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching bank with prefix ${prefix}:`, error);
            throw error;
        }
    }

    async registerBank(bankName, callbackUrl) {
        try {
            const response = await axios.post(`${this.baseURL}/register`, {
                bank_name: bankName,
                callback_url: callbackUrl
            }, {
                headers: { 'X-API-KEY': this.apiKey }
            });

            return response.data.prefix;
        } catch (error) {
            console.error('Failed to register with central bank:', error);
            throw new Error(`Failed to register with central bank: ${error.message}`);
        }
    }
}

module.exports = new CentralBankService();
