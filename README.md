# BrigitaBank

BrigitaBank is a comprehensive online banking application that supports account management and interbank transactions via integration with a central bank.

## Features
- **User Authentication:** Register and login functionality.
- **Account Management:** Create and view accounts in different currencies.
- **Transaction Management:** Internal and external transfers.
- **Bank-to-Bank Transaction Protocol:** Secure communication using JWT and RSA signatures.
- **Central Bank Integration:** Supports interbank transfers via a central bank.
- **REST API with Swagger Documentation:** Interactive API documentation.
- **Responsive UI:** User-friendly interface for smooth interaction.

## Technology Stack
- **Backend:** Node.js, Express
- **Database:** SQLite with Sequelize ORM
- **Authentication:** JWT (JSON Web Tokens)
- **Security:** RSA key pairs for transaction signing
- **API Documentation:** Swagger/OpenAPI

## Getting Started

### Prerequisites
- **Node.js:** v14 or later
- **npm:** Comes with Node.js

### Installation
1. Clone the repository:
```bash
    git clone https://github.com/BrigitaKasemets/brigitabank.git
    cd brigitabank/server
```
2. Install dependencies:
```bash
    npm install
```
3. Create a `.env` file from the `.env.example` file.

4. Generate RSA keys for signing transactions:
```bash
    node ./server/utils/generateKeys.js
```
5. Initialize the database:
```bash
    npm run init-db
```
6. Start the application:
```bash
    npm run dev
```
7. Register with the central bank:
   - Log in.
   - Navigate to the **Banks** section.
   - Click "Register with Central Bank".
   - Your bank prefix and account numbers will be automatically updated.

8. Run the account prefix migration script:
```bash
    cd server
    node utils/accountPrefixMigration.js
```

9. Open your browser and navigate to:
```
    http://localhost:3001
```

## Central Bank Integration
This bank application works with an external central bank for interoperability:
- **Bank Registration:** Register your bank with the central bank to obtain a unique bank prefix.
- **Account Numbers:** All accounts automatically use your bank's prefix (e.g., `abc12345...`).
- **B2B Transactions:** Send/receive money to/from other banks in the network.
- **JWKS Endpoint:** Your RSA public keys are available at `/transactions/jwks`.
- **Key Management:** Refresh your keys from the **Banks** section when needed.

## API Documentation
The API documentation is available at the `/api-docs` endpoint:
```
    http://localhost:3001/api-docs
```

## Demo Accounts
After running the initialization script, the following demo account will be available:

**Regular User:**
- Username: `user@brigitabank.com`
- Password: `user123`

The account will have sample EUR and USD accounts created automatically.

## Security Notes
- RSA key pairs are used for signing and verifying interbank transactions.
- All B2B transactions use JWT with RS256 signatures.
- Bank registration information is stored in the `.env` file.
- Account numbers are prefixed with your bank's unique identifier.

## Testing Interbank Transfers
To test interbank transfers, you'll need:
- Your bank registered with the central bank.
- At least one other bank registered with the central bank.
- Valid account numbers for both banks.

The system automatically validates all transactions through the central bank API.

