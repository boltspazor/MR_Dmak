# 🚀 MR Communication Tool

A comprehensive web application for managing Medical Representatives (MRs), groups, and communication campaigns with WhatsApp integration.

## ✨ Features

### 🔐 Authentication & User Management
- User registration and login
- JWT-based authentication
- Role-based access control
- Secure password handling

### 👥 Group Management
- Create, edit, and delete groups
- Group statistics and analytics
- Export group data (JSON/CSV)
- Group activity tracking

### 👨‍⚕️ Medical Representatives (MRs)
- Add, edit, and delete MRs
- Bulk upload via Excel files
- Download Excel templates
- Search and filter MRs
- Group assignment

### 💬 Message Campaigns
- Send bulk messages to groups
- Image attachments support
- Message scheduling
- Campaign status tracking
- WhatsApp integration

### 📊 Reports & Analytics
- Dashboard with key metrics
- Campaign performance reports
- Export reports (JSON/CSV)
- Real-time statistics

### 🔗 WhatsApp Integration
- Webhook handling
- Message delivery status
- Automatic status updates

## 🏗️ Architecture

### Backend
- **Node.js** with **Express.js**
- **TypeScript** for type safety
- **Prisma ORM** for database operations
- **PostgreSQL** database
- **Redis** for caching and queues
- **BullMQ** for job processing
- **JWT** for authentication

### Frontend
- **React 18** with **TypeScript**
- **Vite** for fast development
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Hook Form** for forms
- **Axios** for API communication

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 12+
- Redis 6+
- npm or yarn

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MR_Project
   ```

2. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Environment Configuration**
   Create `.env` file in the backend directory:
   ```env
   # Database
   DATABASE_URL="postgresql://postgres:password@localhost:5432/mr_communication"
   
   # Redis
   REDIS_URL="redis://localhost:6379"
   
   # JWT
   JWT_SECRET="your-super-secret-jwt-key"
   JWT_EXPIRES_IN="7d"
   
   # Server
   PORT=5001
   NODE_ENV="development"
   
   # WhatsApp API
   WHATSAPP_ACCESS_TOKEN="your-whatsapp-access-token"
   WHATSAPP_PHONE_NUMBER_ID="your-phone-number-id"
   WHATSAPP_VERIFY_TOKEN="your-verify-token"
   
   # Frontend URL (for CORS)
   FRONTEND_URL="http://localhost:5173"
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Optional: Run migrations
   npm run db:migrate
   ```

5. **Start the backend**
   ```bash
   # Development mode
   npm run dev
   
   # Production build
   npm run build
   npm start
   ```

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Environment Configuration**
   Create `.env` file in the frontend directory:
   ```env
   VITE_API_URL=http://localhost:5001/api
   ```

3. **Start the frontend**
   ```bash
   npm run dev
   ```

### Docker Setup (Alternative)

1. **Start services with Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **Access the application**
   - Backend: http://localhost:5001
   - Frontend: http://localhost:5173
   - Database: localhost:5432
   - Redis: localhost:6379

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### Groups
- `GET /api/groups` - List all groups
- `POST /api/groups` - Create group
- `GET /api/groups/:id` - Get group details
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group
- `GET /api/groups/:id/stats` - Group statistics
- `GET /api/groups/:id/export` - Export group data

### Medical Representatives
- `GET /api/mrs` - List all MRs
- `POST /api/mrs` - Create MR
- `PUT /api/mrs/:id` - Update MR
- `DELETE /api/mrs/:id` - Delete MR
- `POST /api/mrs/bulk-upload` - Bulk upload
- `GET /api/mrs/template` - Download template

### Messages
- `POST /api/messages/send` - Send message
- `POST /api/messages/upload-image` - Upload image
- `GET /api/messages/campaigns` - List campaigns
- `GET /api/messages/campaigns/stats` - Campaign statistics
- `GET /api/messages/campaign/:id/report` - Campaign report

### Reports
- `GET /api/reports/dashboard` - Dashboard statistics
- `GET /api/reports/campaign/:id` - Detailed campaign report
- `GET /api/reports/campaign/:id/export` - Export campaign report

### Webhooks
- `GET /api/webhook` - WhatsApp verification
- `POST /api/webhook` - WhatsApp events

## 🗄️ Database Schema

### Core Models
- **User** - Application users
- **Group** - MR groups
- **MedicalRepresentative** - MR details
- **Message** - Message content
- **MessageCampaign** - Campaign instances
- **MessageLog** - Delivery tracking
- **GroupActivity** - Group history

### Key Relationships
- Users can create multiple groups
- Groups contain multiple MRs
- Messages are sent to groups
- Campaigns track message delivery
- Logs record delivery status

## 🔧 Development

### Backend Development
```bash
cd backend

# Install dependencies
npm install

# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Database operations
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema changes
npm run db:migrate     # Run migrations
npm run db:studio      # Open Prisma Studio
```

### Frontend Development
```bash
cd frontend

# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Quality
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Tailwind CSS** for consistent styling

## 🧪 Testing

### Backend Testing
```bash
cd backend

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Frontend Testing
```bash
cd frontend

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🚀 Deployment

### Backend Deployment
1. Build the application: `npm run build`
2. Set production environment variables
3. Use PM2 or similar process manager
4. Configure reverse proxy (Nginx/Apache)

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy `dist` folder to web server
3. Configure environment variables
4. Set up CDN for static assets

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Or build individual images
docker build -t mr-backend ./backend
docker build -t mr-frontend ./frontend
```

## 🔒 Security Features

- **JWT Authentication** with secure token handling
- **Password Hashing** using bcrypt
- **CORS Protection** for cross-origin requests
- **Rate Limiting** to prevent abuse
- **Input Validation** with Joi schemas
- **SQL Injection Protection** via Prisma ORM
- **XSS Protection** with proper encoding

## 📊 Performance Features

- **Redis Caching** for frequently accessed data
- **Database Indexing** for fast queries
- **Pagination** for large datasets
- **Lazy Loading** for images and content
- **Optimized Queries** with Prisma
- **Background Job Processing** with BullMQ

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🔄 Changelog

### v1.0.0
- Initial release
- Core CRUD operations
- WhatsApp integration
- Dashboard and reporting
- User authentication
- Group management
- Message campaigns

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by real-world MR management needs
- Community contributions welcome

---

**Made with ❤️ for the medical community**
