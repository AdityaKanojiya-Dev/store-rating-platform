const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { userValidation, handleValidationErrors } = require('../middleware/validation');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [usersResult, storesResult, ratingsResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count FROM stores'),
      pool.query('SELECT COUNT(*) as count FROM ratings')
    ]);

    res.json({
      total_users: parseInt(usersResult.rows[0].count),
      total_stores: parseInt(storesResult.rows[0].count),
      total_ratings: parseInt(ratingsResult.rows[0].count)
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all users with filtering and sorting
router.get('/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { 
      search, 
      role, 
      sortBy = 'name', 
      sortOrder = 'asc' 
    } = req.query;

    let query = 'SELECT id, name, email, address, role, created_at FROM users WHERE 1=1';
    const queryParams = [];
    let paramCount = 0;

    if (search) {
      query += ` AND (name ILIKE $${++paramCount} OR email ILIKE $${paramCount} OR address ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    if (role) {
      query += ` AND role = $${++paramCount}`;
      queryParams.push(role);
    }

    // Validate sortBy and sortOrder
    const validSortFields = ['name', 'email', 'address', 'role', 'created_at'];
    const validSortOrders = ['asc', 'desc'];
    
    if (validSortFields.includes(sortBy) && validSortOrders.includes(sortOrder.toLowerCase())) {
      query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
    } else {
      query += ` ORDER BY name ASC`;
    }

    const result = await pool.query(query, queryParams);

    res.json({ users: result.rows });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user by ID
router.get('/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT u.*, 
             COALESCE(AVG(r.rating), 0) as average_rating,
             COUNT(r.id) as total_ratings
      FROM users u
      LEFT JOIN ratings r ON u.id = r.user_id
      WHERE u.id = $1
      GROUP BY u.id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      ...user,
      average_rating: parseFloat(user.average_rating).toFixed(1)
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new user
router.post('/users', authenticateToken, requireRole(['admin']), userValidation, handleValidationErrors, async (req, res) => {
  try {
    const { name, email, password, address, role = 'user' } = req.body;

    // Validate role
    if (!['admin', 'user', 'store_owner'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (name, email, password, address, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, address, role, created_at',
      [name, email, passwordHash, address, role]
    );

    res.status(201).json({
      message: 'User created successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user
router.put('/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, address, role } = req.body;

    // Validate role if provided
    if (role && !['admin', 'user', 'store_owner'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is already taken by another user
    if (email) {
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, id]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Email already taken by another user' });
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    if (name) {
      updateFields.push(`name = $${++paramCount}`);
      updateValues.push(name);
    }
    if (email) {
      updateFields.push(`email = $${++paramCount}`);
      updateValues.push(email);
    }
    if (address) {
      updateFields.push(`address = $${++paramCount}`);
      updateValues.push(address);
    }
    if (role) {
      updateFields.push(`role = $${++paramCount}`);
      updateValues.push(role);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateValues.push(id);
    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${++paramCount} RETURNING id, name, email, address, role, created_at`;

    const result = await pool.query(query, updateValues);

    res.json({
      message: 'User updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete user
router.delete('/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all stores with filtering and sorting
router.get('/stores', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { 
      search, 
      sortBy = 'name', 
      sortOrder = 'asc' 
    } = req.query;

    let query = `
      SELECT s.*, 
             COALESCE(AVG(r.rating), 0) as average_rating,
             COUNT(r.id) as total_ratings
      FROM stores s
      LEFT JOIN ratings r ON s.id = r.store_id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (search) {
      query += ` AND (s.name ILIKE $${++paramCount} OR s.email ILIKE $${paramCount} OR s.address ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    query += ` GROUP BY s.id`;

    // Validate sortBy and sortOrder
    const validSortFields = ['name', 'email', 'address', 'average_rating', 'created_at'];
    const validSortOrders = ['asc', 'desc'];
    
    if (validSortFields.includes(sortBy) && validSortOrders.includes(sortOrder.toLowerCase())) {
      query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
    } else {
      query += ` ORDER BY name ASC`;
    }

    const result = await pool.query(query, queryParams);
    
    res.json({
      stores: result.rows.map(store => ({
        ...store,
        average_rating: parseFloat(store.average_rating).toFixed(1)
      }))
    });
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

