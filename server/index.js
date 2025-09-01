import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const JWT_SECRET = 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const db = new sqlite3.Database('./calendar.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  console.log('Initializing database tables...');
  
  // Create tables sequentially to ensure proper order
  db.serialize(() => {
    // Drop and recreate users table to ensure correct schema
    db.run(`DROP TABLE IF EXISTS users`, (err) => {
      if (err) {
        console.error('Error dropping users table:', err);
      } else {
        console.log('Users table dropped successfully');
        
        // Users table
        db.run(`CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user',
          name TEXT NOT NULL,
          can_edit BOOLEAN DEFAULT 0,
          can_add BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
          if (err) {
            console.error('Error creating users table:', err);
          } else {
            console.log('Users table created/verified');
            
            // Insert default super admin user
            const defaultPassword = bcrypt.hashSync('admin123', 10);
            db.run(`INSERT INTO users (username, email, password, role, name, can_edit, can_add) 
                    VALUES ('superadmin', 'superadmin@auntrack.com', ?, 'super_admin', 'Super Administrator', 1, 1)`, 
                    [defaultPassword], (err) => {
              if (err) {
                console.error('Error inserting default user:', err);
              } else {
                console.log('Default user created/verified');
              }
            });
          }
        });
      }
    });

    // Categories table
    db.run(`CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      color TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating categories table:', err);
      } else {
        console.log('Categories table created/verified');
        
        // Insert default categories
        db.run(`INSERT OR IGNORE INTO categories (name, color) VALUES ('HR Events', '#fb923c')`, (err) => {
          if (err) console.error('Error inserting HR Events category:', err);
        });
        db.run(`INSERT OR IGNORE INTO categories (name, color) VALUES ('Automotive', '#facc15')`, (err) => {
          if (err) console.error('Error inserting Automotive category:', err);
        });
      }
    });

    // Events table
    db.run(`CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      start_date DATETIME NOT NULL,
      end_date DATETIME NOT NULL,
      color TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
    )`, (err) => {
      if (err) {
        console.error('Error creating events table:', err);
      } else {
        console.log('Events table created/verified');
        
        // Insert sample events only if they don't exist
        setTimeout(() => {
          // Check if events already exist before inserting
          db.get(`SELECT COUNT(*) as count FROM events`, (err, result) => {
            if (err) {
              console.error('Error checking events count:', err);
              return;
            }
            
            // Only insert sample events if no events exist
            if (result.count === 0) {
              db.run(`INSERT INTO events (title, category_id, start_date, end_date, color, description) 
                      SELECT 'HR Awards', id, '2025-08-01 00:00:00', '2025-08-02 23:59:59', '#fb923c', 'Annual HR Awards Ceremony' 
                      FROM categories WHERE name = 'HR Events'`, (err) => {
                if (err) console.error('Error inserting HR Awards event:', err);
              });
              
              db.run(`INSERT INTO events (title, category_id, start_date, end_date, color, description) 
                      SELECT 'TownHall', id, '2025-08-04 00:00:00', '2025-08-04 23:59:59', '#fb923c', 'Monthly Town Hall Meeting' 
                      FROM categories WHERE name = 'HR Events'`, (err) => {
                if (err) console.error('Error inserting TownHall event:', err);
              });
              
              db.run(`INSERT INTO events (title, category_id, start_date, end_date, color, description) 
                      SELECT 'Marathon Run', id, '2025-08-01 00:00:00', '2025-08-06 23:59:59', '#facc15', 'Annual Marathon Event' 
                      FROM categories WHERE name = 'Automotive'`, (err) => {
                if (err) console.error('Error inserting Marathon Run event:', err);
              });
            }
          });
        }, 1000);
      }
    });
  });
  
  console.log('Database initialization complete');
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Routes

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username/Email and password are required' });
  }

  // Check if input is email or username
  const isEmail = username.includes('@');
  const query = isEmail ? 'SELECT * FROM users WHERE email = ?' : 'SELECT * FROM users WHERE username = ?';

  db.get(query, [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        role: user.role,
        can_edit: user.can_edit,
        can_add: user.can_add
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.name,
        can_edit: user.can_edit === 1,
        can_add: user.can_add === 1
      }
    });
  });
});

// Get all categories
app.get('/api/categories', authenticateToken, (req, res) => {
  db.all('SELECT * FROM categories ORDER BY name', (err, categories) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(categories);
  });
});

// Create category
app.post('/api/categories', authenticateToken, (req, res) => {
  console.log('Category creation request received:', req.body);
  const { name, color } = req.body;
  
  if (!name || !color) {
    console.log('Validation failed: missing name or color');
    return res.status(400).json({ error: 'Name and color are required' });
  }
  
  console.log('Inserting category into database:', { name, color });
  db.run('INSERT INTO categories (name, color) VALUES (?, ?)', [name, color], function(err) {
    if (err) {
      console.error('Database error inserting category:', err);
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Category name already exists' });
      }
      return res.status(500).json({ error: 'Database error' });
    }
    
    console.log('Category inserted with ID:', this.lastID);
    db.get('SELECT * FROM categories WHERE id = ?', [this.lastID], (err, category) => {
      if (err) {
        console.error('Database error retrieving category:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      console.log('Category retrieved successfully:', category);
      res.status(201).json(category);
    });
  });
});

// Update category
app.put('/api/categories/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, color } = req.body;
  
  if (!name && !color) {
    return res.status(400).json({ error: 'At least name or color must be provided' });
  }
  
  let query = 'UPDATE categories SET ';
  let params = [];
  
  if (name) {
    query += 'name = ?';
    params.push(name);
  }
  
  if (color) {
    if (name) query += ', ';
    query += 'color = ?';
    params.push(color);
  }
  
  query += ' WHERE id = ?';
  params.push(id);
  
  db.run(query, params, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Return the updated category
    db.get('SELECT * FROM categories WHERE id = ?', [id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(row);
    });
  });
});

// Delete category
app.delete('/api/categories/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM categories WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully' });
  });
});

// Get all events
app.get('/api/events', authenticateToken, (req, res) => {
  db.all(`
    SELECT e.*, c.name as category_name, c.color as color 
    FROM events e 
    JOIN categories c ON e.category_id = c.id 
    ORDER BY e.start_date
  `, (err, events) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(events);
  });
});

// Create event
app.post('/api/events', authenticateToken, (req, res) => {
  const { title, category_id, start_date, end_date, color, description } = req.body;
  
  db.run(
    'INSERT INTO events (title, category_id, start_date, end_date, color, description) VALUES (?, ?, ?, ?, ?, ?)',
    [title, category_id, start_date, end_date, color, description],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      db.get(`
        SELECT e.*, c.name as category_name, c.color as color 
        FROM events e 
        JOIN categories c ON e.category_id = c.id 
        WHERE e.id = ?
      `, [this.lastID], (err, event) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json(event);
      });
    }
  );
});

// Update event
app.put('/api/events/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, category_id, start_date, end_date, color, description } = req.body;
  
  // First get the current event to preserve unchanged fields
  db.get('SELECT * FROM events WHERE id = ?', [id], (err, currentEvent) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!currentEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Use provided values or keep current values
    const updatedEvent = {
      title: title !== undefined ? title : currentEvent.title,
      category_id: category_id !== undefined ? category_id : currentEvent.category_id,
      start_date: start_date !== undefined ? start_date : currentEvent.start_date,
      end_date: end_date !== undefined ? end_date : currentEvent.end_date,
      color: color !== undefined ? color : currentEvent.color,
      description: description !== undefined ? description : currentEvent.description
    };
    
    db.run(
      'UPDATE events SET title = ?, category_id = ?, start_date = ?, end_date = ?, color = ?, description = ? WHERE id = ?',
      [updatedEvent.title, updatedEvent.category_id, updatedEvent.start_date, updatedEvent.end_date, updatedEvent.color, updatedEvent.description, id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Event not found' });
        }
        
        db.get(`
          SELECT e.*, c.name as category_name, c.color as color 
          FROM events e 
          JOIN categories c ON e.category_id = c.id 
          WHERE e.id = ?
        `, [id], (err, event) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.json(event);
        });
      }
    );
  });
});

// Delete event
app.delete('/api/events/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM events WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ message: 'Event deleted successfully' });
  });
});

// User Management Endpoints

// Get all users (admin only)
app.get('/api/users', authenticateToken, (req, res) => {
  // Check if user is admin or super_admin
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  db.all('SELECT id, username, email, name, role, can_edit, can_add, created_at FROM users ORDER BY created_at DESC', (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(users);
  });
});

// Create new user (admin only)
app.post('/api/users', authenticateToken, (req, res) => {
  // Check if user is admin or super_admin
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const { username, email, password, name, role, can_edit, can_add } = req.body;
  
  if (!username || !email || !password || !name) {
    return res.status(400).json({ error: 'Username, email, password, and name are required' });
  }
  
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  db.run(
    'INSERT INTO users (username, email, password, name, role, can_edit, can_add) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [username, email, hashedPassword, name, role || 'user', can_edit ? 1 : 0, can_add ? 1 : 0],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Username or email already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
      }
      
      db.get('SELECT id, username, email, name, role, can_edit, can_add, created_at FROM users WHERE id = ?', [this.lastID], (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json(user);
      });
    }
  );
});

// Update user (admin only)
app.put('/api/users/:id', authenticateToken, (req, res) => {
  // Check if user is admin or super_admin
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const { id } = req.params;
  const { username, email, password, name, role, can_edit, can_add } = req.body;
  
  // First get the current user to preserve unchanged fields
  db.get('SELECT * FROM users WHERE id = ?', [id], (err, currentUser) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Use provided values or keep current values
    const updatedUser = {
      username: username !== undefined ? username : currentUser.username,
      email: email !== undefined ? email : currentUser.email,
      password: password ? bcrypt.hashSync(password, 10) : currentUser.password,
      name: name !== undefined ? name : currentUser.name,
      role: role !== undefined ? role : currentUser.role,
      can_edit: can_edit !== undefined ? (can_edit ? 1 : 0) : currentUser.can_edit,
      can_add: can_add !== undefined ? (can_add ? 1 : 0) : currentUser.can_add
    };
    
    db.run(
      'UPDATE users SET username = ?, email = ?, password = ?, name = ?, role = ?, can_edit = ?, can_add = ? WHERE id = ?',
      [updatedUser.username, updatedUser.email, updatedUser.password, updatedUser.name, updatedUser.role, updatedUser.can_edit, updatedUser.can_add, id],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username or email already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        db.get('SELECT id, username, email, name, role, can_edit, can_add, created_at FROM users WHERE id = ?', [id], (err, user) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.json(user);
        });
      }
    );
  });
});

// Delete user (admin only)
app.delete('/api/users/:id', authenticateToken, (req, res) => {
  // Check if user is admin or super_admin
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const { id } = req.params;
  
  // Prevent deletion of super_admin users
  db.get('SELECT role FROM users WHERE id = ?', [id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.role === 'super_admin') {
      return res.status(403).json({ error: 'Cannot delete super admin users' });
    }
    
    db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ message: 'User deleted successfully' });
    });
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
