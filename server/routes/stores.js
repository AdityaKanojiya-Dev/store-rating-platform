
const express = require('express');
const pool = require('../config/database');
const { storeValidation, handleValidationErrors } = require('../middleware/validation');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all stores owned by the current store owner
router.get('/my-stores', authenticateToken, requireRole(['store_owner']), async (req, res) => {
  try {
    const ownerId = req.user.id;
    const result = await pool.query(
      `SELECT s.*, 
              COALESCE(AVG(r.rating), 0) as average_rating,
              COUNT(r.id) as total_ratings
         FROM stores s
    LEFT JOIN ratings r ON s.id = r.store_id
        WHERE s.owner_id = $1
     GROUP BY s.id`,
      [ownerId]
    );
    res.json({
      stores: result.rows.map(store => ({
        ...store,
        average_rating: parseFloat(store.average_rating).toFixed(1)
      }))
    });
  } catch (error) {
    console.error('Get my stores error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all stores (public endpoint)
router.get('/', async (req, res) => {
  try {
    const { search, sortBy = 'name', sortOrder = 'asc' } = req.query;
    
    let query = `
      SELECT s.*, 
             COALESCE(AVG(r.rating), 0) as average_rating,
             COUNT(r.id) as total_ratings
      FROM stores s
      LEFT JOIN ratings r ON s.id = r.store_id
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (search) {
      query += ` WHERE (s.name ILIKE $${++paramCount} OR s.address ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    query += ` GROUP BY s.id`;

    // Validate sortBy and sortOrder
    const validSortFields = ['name', 'address', 'average_rating', 'created_at'];
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

// Get store by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT s.*, 
             COALESCE(AVG(r.rating), 0) as average_rating,
             COUNT(r.id) as total_ratings
      FROM stores s
      LEFT JOIN ratings r ON s.id = r.store_id
      WHERE s.id = $1
      GROUP BY s.id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const store = result.rows[0];
    res.json({
      ...store,
      average_rating: parseFloat(store.average_rating).toFixed(1)
    });
  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new store (admin only)
router.post('/', authenticateToken, requireRole(['admin']), storeValidation, handleValidationErrors, async (req, res) => {
  try {
    const { name, email, address, ownerId } = req.body;

    // Check if store email already exists
    const existingStore = await pool.query(
      'SELECT id FROM stores WHERE email = $1',
      [email]
    );

    if (existingStore.rows.length > 0) {
      return res.status(400).json({ message: 'Store with this email already exists' });
    }

    // If ownerId is provided, verify the user exists and is a store owner
    if (ownerId) {
      const ownerResult = await pool.query(
        'SELECT id, role FROM users WHERE id = $1',
        [ownerId]
      );

      if (ownerResult.rows.length === 0) {
        return res.status(400).json({ message: 'Owner not found' });
      }

      if (ownerResult.rows[0].role !== 'store_owner') {
        return res.status(400).json({ message: 'User must be a store owner' });
      }
    }

    const result = await pool.query(
      'INSERT INTO stores (name, email, address, owner_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, address, ownerId || null]
    );

    res.status(201).json({
      message: 'Store created successfully',
      store: result.rows[0]
    });
  } catch (error) {
    console.error('Create store error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update store (admin only)
router.put('/:id', authenticateToken, requireRole(['admin']), storeValidation, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, address, ownerId } = req.body;

    // Check if store exists
    const existingStore = await pool.query(
      'SELECT id FROM stores WHERE id = $1',
      [id]
    );

    if (existingStore.rows.length === 0) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Check if email is already taken by another store
    const emailCheck = await pool.query(
      'SELECT id FROM stores WHERE email = $1 AND id != $2',
      [email, id]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Store with this email already exists' });
    }

    // If ownerId is provided, verify the user exists and is a store owner
    if (ownerId) {
      const ownerResult = await pool.query(
        'SELECT id, role FROM users WHERE id = $1',
        [ownerId]
      );

      if (ownerResult.rows.length === 0) {
        return res.status(400).json({ message: 'Owner not found' });
      }

      if (ownerResult.rows[0].role !== 'store_owner') {
        return res.status(400).json({ message: 'User must be a store owner' });
      }
    }

    const result = await pool.query(
      'UPDATE stores SET name = $1, email = $2, address = $3, owner_id = $4 WHERE id = $5 RETURNING *',
      [name, email, address, ownerId || null, id]
    );

    res.json({
      message: 'Store updated successfully',
      store: result.rows[0]
    });
  } catch (error) {
    console.error('Update store error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete store (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM stores WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Store not found' });
    }

    res.json({ message: 'Store deleted successfully' });
  } catch (error) {
    console.error('Delete store error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

