# Brigita Bank

A simple online banking application with features for managing accounts and performing internal and bank-to-bank transactions.

## Features

- User authentication (register, login)
- Account management (create and view accounts in different currencies)
- Transaction management (internal and external transfers)
- Bank-to-bank transaction protocol using JWT
- REST API with Swagger documentation
- Clean and responsive UI

## Technology Stack

- **Backend**: Node.js, Express
- **Database**: SQLite with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Frontend**: HTML, CSS, JavaScript, EJS templates
- **Documentation**: Swagger/OpenAPI

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/BrigitaKasemets/brigitabank.git
   cd brigitabank/server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following variables (or use the existing one):
   ```
   NODE_ENV=development
   PORT=3000
   JWT_SECRET=your_secret_key
   BANK_PREFIX=ABC
   TEST_MODE=true
   ```

4. Initialize the database with demo data:
   ```
   npm run init-db
   ```

5. Start the application:
   ```
   npm run dev
   ```

6. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## API Documentation

The API documentation is available at `/api-docs` endpoint:
```
http://localhost:3000/api-docs
```

## Demo Accounts

After running the initialization script, the following demo accounts will be available:

- **Admin User**:
  - Email: admin@brigitabank.com
  - Password: admin123

- **Regular User**:
  - Email: user@brigitabank.com
  - Password: user123