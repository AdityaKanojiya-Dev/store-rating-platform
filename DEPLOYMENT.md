# Deployment Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   node setup.js
   ```

2. **Set up PostgreSQL database:**
   ```bash
   createdb store_rating_platform
   psql -d store_rating_platform -f server/database/schema.sql
   ```

3. **Update database credentials in `server/.env`**

4. **Start the application:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Default Admin Login
- Email: admin@storeplatform.com
- Password: admin123!

## Production Deployment

### Environment Variables
Update `server/.env` with production values:
- Strong JWT secret
- Production database credentials
- Set NODE_ENV=production

### Database
- Use a production PostgreSQL instance
- Run the schema.sql file
- Set up proper database backups

### Security
- Use HTTPS in production
- Set up proper CORS origins
- Use environment-specific JWT secrets
- Enable rate limiting
- Set up monitoring and logging

### Frontend Build
```bash
cd client
npm run build
```

The built files will be in the `client/build` directory.

