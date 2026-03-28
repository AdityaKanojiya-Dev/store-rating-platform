# Store Rating Platform

A full-stack web application that allows users to submit ratings for stores registered on the platform. The application features role-based access control with different functionalities for System Administrators, Normal Users, and Store Owners.

## Tech Stack

- **Frontend**: React.js with Tailwind CSS
- **Backend**: Express.js with Node.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express-validator (backend), Custom validation (frontend)

## Screenshots

> _Add screenshots of your Admin Dashboard, User Dashboard, and Store Owner Dashboard here_

## Features

### System Administrator
- Add new stores, normal users, and admin users
- Dashboard with platform statistics (total users, stores, ratings)
- Manage users with filtering and sorting capabilities
- Manage stores with filtering and sorting capabilities
- View detailed user information including ratings for store owners

### Normal User
- Sign up and log in to the platform
- Update password after logging in
- View list of all registered stores
- Search stores by name and address
- Submit ratings (1-5 stars) for individual stores
- Modify previously submitted ratings

### Store Owner
- Log in to the platform
- Update password after logging in
- View list of users who have rated their store
- See average rating of their store
- View rating distribution and detailed analytics

## Database Schema

The application uses PostgreSQL with the following main tables:

- **users**: Stores user information (name, email, password_hash, address, role)
- **stores**: Stores store information (name, email, address, owner_id)
- **ratings**: Stores user ratings for stores (user_id, store_id, rating)

## Installation and Setup

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file by copying the example:
```bash
cp .env.example .env
```
Then fill in your actual values in `.env`.

4. Set up the database:
```bash
createdb store_rating_platform
psql -d store_rating_platform -f database/schema.sql
```

5. Start the server:
```bash
npm run dev
```

The backend will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will be available at `http://localhost:3000`

### Running Both Together

From the root directory, run both backend and frontend simultaneously:

```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/password` - Update password

### Stores
- `GET /api/stores` - Get all stores (public)
- `GET /api/stores/:id` - Get store by ID
- `POST /api/stores` - Create store (admin only)
- `PUT /api/stores/:id` - Update store (admin only)
- `DELETE /api/stores/:id` - Delete store (admin only)

### Ratings
- `POST /api/ratings/:storeId` - Submit/update rating
- `GET /api/ratings/:storeId/my-rating` - Get user's rating for store
- `GET /api/ratings/store/:storeId` - Get all ratings for store (store owner/admin)
- `DELETE /api/ratings/:storeId` - Delete rating

### Admin
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/users` - Get all users with filtering
- `GET /api/admin/users/:id` - Get user by ID
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/stores` - Get all stores with filtering

## Form Validations

- **Name**: Minimum 20 characters, maximum 60 characters
- **Address**: Maximum 400 characters
- **Password**: 8-16 characters, at least one uppercase letter and one special character
- **Email**: Standard email validation

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS configuration
- Security headers with Helmet
- SQL injection prevention with parameterized queries

## Default Admin Account

A default admin account is created when the database is set up:
- **Email**: admin@storeplatform.com
- **Password**: Admin123!

## Future Enhancements

- Email verification for user registration
- Password reset functionality
- Store image uploads
- Advanced analytics and reporting
- Real-time notifications

## License

This project is licensed under the MIT License.
