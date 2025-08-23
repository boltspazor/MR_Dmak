# MongoDB Migration Guide

This document outlines the migration from PostgreSQL/Prisma to MongoDB/Mongoose for the MR Communication Tool.

## Changes Made

### 1. Database Configuration
- Replaced Prisma with Mongoose
- Updated database connection from PostgreSQL to MongoDB
- Created MongoDB models for all entities

### 2. Package Dependencies
- Removed: `@prisma/client`, `prisma`
- Added: `mongodb`, `mongoose`

### 3. Model Changes
- **User Model**: Basic user authentication with email, password, name, role
- **Group Model**: Group management with name, description, creator
- **MedicalRepresentative Model**: MR data with personal info and group association
- **Message Model**: Message content and metadata
- **MessageCampaign Model**: Campaign management and scheduling
- **MessageLog Model**: Message delivery tracking and status
- **GroupActivity Model**: Activity logging for groups

### 4. Schema Changes
- Changed from relational to document-based structure
- Replaced foreign keys with ObjectId references
- Added proper indexing for performance
- Maintained timestamps and audit fields

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Start MongoDB and Redis
```bash
docker-compose up -d
```

### 3. Environment Configuration
Create a `.env` file in the backend directory with:
```env
MONGODB_URI=mongodb://admin:password@localhost:27017/mr_communication_tool
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
PORT=5001
```

### 4. Start the Backend
```bash
cd backend
npm run dev
```

## Database Structure

### Collections
- `users` - User accounts and authentication
- `groups` - Medical representative groups
- `medical_representatives` - Individual MR records
- `messages` - Message content and templates
- `message_campaigns` - Campaign management
- `message_logs` - Message delivery tracking
- `group_activities` - Activity logging

### Key Indexes
- Email uniqueness on users
- MR ID uniqueness on medical representatives
- Phone number indexing for quick lookups
- Campaign and MR ID indexing on message logs
- Status indexing for filtering

## Migration Benefits

1. **Flexibility**: Document-based structure allows for easier schema evolution
2. **Scalability**: Better horizontal scaling capabilities
3. **Performance**: Optimized for read-heavy operations
4. **Development**: Faster development cycles with flexible schemas

## Next Steps

1. Update all service files to use MongoDB models
2. Modify controllers to work with new data structure
3. Update frontend to handle MongoDB ObjectIds
4. Test all API endpoints with new database
5. Update validation schemas if needed

## Notes

- All ObjectIds are converted to strings when sending to frontend
- Timestamps are maintained in ISO format
- Relationships are handled through ObjectId references
- Indexes are created for optimal query performance
