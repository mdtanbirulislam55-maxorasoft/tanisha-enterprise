# Tanisha Enterprise - Business Management Software

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-green.svg)
![React](https://img.shields.io/badge/react-18-blue.svg)

A complete, production-ready business management software for Tanisha Enterprise, developed by MaxoraSoft and prepared by Eng Tanbir Rifat.

## 🌟 Features

- **Multi-language Support**: Bengali (primary) and English
- **Role-based Access Control**: Admin, Accountant, Stock Manager, Sales, Viewer
- **Complete Business Modules**: Accounts, Stock, Purchase, Sales, Reports
- **Real-time Dashboard**: KPIs, Charts, Trends
- **Advanced Reporting**: Export to CSV/PDF
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **RESTful API**: Fully documented with OpenAPI/Swagger
- **Unit Tested**: Core calculation functions with Jest

## 🏗️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **ORM**: Prisma
- **Authentication**: JWT with bcrypt
- **Validation**: Joi/Zod
- **Testing**: Jest
- **API Docs**: OpenAPI/Swagger

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context
- **Routing**: React Router 6
- **Icons**: Lucide React
- **Charts**: Recharts
- **i18n**: react-i18next

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- PostgreSQL 15 or higher
- npm or yarn

### Option 1: Using Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd tanisha-enterprise

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# Database Admin: http://localhost:8080