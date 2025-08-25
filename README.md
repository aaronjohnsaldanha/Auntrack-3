# Calendar Management Web App with SQLite Database

A modern calendar management application built with React, TypeScript, and SQLite database for persistent data storage.

## Features

- ✅ **User Authentication**: JWT-based authentication with super admin role
- ✅ **Event Management**: Create, edit, delete, and drag-drop events
- ✅ **Category Management**: Organize events by categories with custom colors
- ✅ **Multi-day Events**: Support for events spanning multiple days
- ✅ **Persistent Storage**: All data stored in SQLite database
- ✅ **Real-time Updates**: Immediate UI updates with database persistence
- ✅ **Responsive Design**: Modern UI with Tailwind CSS

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router DOM** for navigation
- **Lucide React** for icons
- **date-fns** for date manipulation

### Backend
- **Express.js** server
- **SQLite3** database
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** for cross-origin requests

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Categories Table
```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Events Table
```sql
CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category_id INTEGER NOT NULL,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  color TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
);
```

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd auntrack-calendar
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   # Start both frontend and backend
   npm run dev:full
   
   # Or start them separately:
   npm run server  # Backend on http://localhost:3001
   npm run dev     # Frontend on http://localhost:5173
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## Default Credentials

- **Username**: `superadmin`
- **Password**: `admin123`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category
- `DELETE /api/categories/:id` - Delete category

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create new event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

## Database File

The SQLite database file (`calendar.db`) will be automatically created in the project root when you first start the server. This file contains:

- Default super admin user
- Sample categories (HR Events, Automotive)
- Sample events for demonstration

## Data Persistence

- **All data is stored in SQLite database**
- **No localStorage dependency** (except for JWT tokens)
- **Data survives server restarts**
- **Automatic database initialization** with sample data

## Development

### Project Structure
```
├── src/
│   ├── components/          # React components
│   ├── contexts/           # React contexts
│   ├── services/           # API services
│   └── ...
├── server/
│   └── index.js           # Express server
├── calendar.db            # SQLite database (auto-generated)
└── package.json
```

### Adding New Features

1. **Database Changes**: Update the `initializeDatabase()` function in `server/index.js`
2. **API Endpoints**: Add new routes in `server/index.js`
3. **Frontend Services**: Update `src/services/api.ts`
4. **UI Components**: Create/modify components in `src/components/`

## Production Deployment

For production deployment:

1. **Environment Variables**: Set proper JWT_SECRET
2. **Database**: Consider using PostgreSQL or MySQL for production
3. **Security**: Implement proper CORS settings
4. **HTTPS**: Use SSL certificates
5. **PM2**: Use PM2 for process management

## Troubleshooting

### Common Issues

1. **Port already in use**: Change ports in `server/index.js` and `vite.config.ts`
2. **Database errors**: Delete `calendar.db` and restart server
3. **CORS errors**: Check CORS settings in `server/index.js`
4. **Authentication issues**: Clear browser localStorage and re-login

### Database Reset

To reset the database:
```bash
# Stop the server
# Delete the database file
rm calendar.db
# Restart the server
npm run server
```

## License

This project is licensed under the MIT License.
