# Demand-Driven Marketplace

A NestJS-based marketplace application for household items where buyers post their requirements and sellers bid to fulfill them. The platform supports both pre-owned, new, and refurbished items with a live bidding system.

## 🚀 Features

### Core Functionality

- **Multi-Role User System**: Buyers, Sellers, and Admins
- **Item Requirements**: Buyers post detailed item requirements with budgets
- **Bidding System**: Sellers bid on item requirements with product details
- **Live Bidding**: Real-time bidding sessions with lowest bid selection
- **Payment Integration**: Stripe integration for booking fees and payments
- **Email Verification**: User registration with email verification tokens

### Business Logic

- **Booking Fees**: 1% or $1 (whichever is maximum) for item requests and bids
- **48-Hour Minimum**: Item requests must be open for at least 48 hours
- **Price Decrease Only**: Bidders can only decrease their bid prices
- **Winner Selection**: Lowest bid wins when bidding session closes
- **Automatic Refunds**: Platform refunds booking fees to non-winning bidders

### Admin Features

- **User Management**: CSV-based user invitations (max 25 per day)
- **Statistics Dashboard**: User counts, active sessions, financial metrics
- **Analytics**: 30-day graphs for requests, sessions, and revenue

## 🛠️ Technology Stack

- **Backend**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Payment Processing**: Stripe API integration
- **Testing**: Jest (Unit & Integration tests)

## 📋 Prerequisites

- Node.js (v18.x or v20.x)
- PostgreSQL (v13 or higher)
- Yarn package manager
- Stripe account for payment processing

## 🔧 Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd demand-driven-marketplace
```

2. **Install dependencies**

```bash
yarn install
```

3. **Environment Configuration**
   Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=marketplace_main_db

# Application Configuration
PORT=3000
NODE_ENV=development
```

4. **Database Setup**

```bash
# Create PostgreSQL database
createdb marketplace_main_db

# The application will automatically create tables using TypeORM synchronization
```

5. **Start the application**

```bash
# Development mode
yarn start:dev

# Production mode
yarn build
yarn start:prod
```

The application will be available at `http://localhost:3000`
