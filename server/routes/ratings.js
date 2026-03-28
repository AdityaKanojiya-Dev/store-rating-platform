const express = require('express');
const pool = require('../config/database');
const { ratingValidation, handleValidationErrors } = require('../middleware/validation');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Submit or update rating
router.post('/:storeId', authenticateToken, ratingValidation, handleValidationErrors, async (req, res) => {
  try {
    const { storeId } = req.params;
    const { rating } = req.body;
    const userId = req.user.id;

    // Only regular users can submit ratings
    if (req.user.role !== 'user') {
      return res.status(403).json({ 
        message: 'Only regular users can submit ratings. Store owners and administrators cannot rate stores.' 
      });
    }

    // Check if store exists
    const storeResult = await pool.query(
      'SELECT id FROM stores WHERE id = $1',
      [storeId]
    );

    if (storeResult.rows.length === 0) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Check if user already rated this store
    const existingRating = await pool.query(
      'SELECT id FROM ratings WHERE user_id = $1 AND store_id = $2',
      [userId, storeId]
    );

    if (existingRating.rows.length > 0) {
      // Update existing rating
      const result = await pool.query(
        'UPDATE ratings SET rating = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND store_id = $3 RETURNING *',
        [rating, userId, storeId]
      );

      res.json({
        message: 'Rating updated successfully',
        rating: result.rows[0]
      });
    } else {
      // Create new rating
      const result = await pool.query(
        'INSERT INTO ratings (user_id, store_id, rating) VALUES ($1, $2, $3) RETURNING *',
        [userId, storeId, rating]
      );

      res.status(201).json({
        message: 'Rating submitted successfully',
        rating: result.rows[0]
      });
    }
  } catch (error) {
    console.error('Submit rating error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user's rating for a specific store
router.get('/:storeId/my-rating', authenticateToken, async (req, res) => {
  try {
    const { storeId } = req.params;
    const userId = req.user.id;

    // Only regular users can have ratings
    if (req.user.role !== 'user') {
      return res.json({ rating: null });
    }

    const result = await pool.query(
      'SELECT * FROM ratings WHERE user_id = $1 AND store_id = $2',
      [userId, storeId]
    );

    if (result.rows.length === 0) {
      return res.json({ rating: null });
    }

    res.json({ rating: result.rows[0] });
  } catch (error) {
    console.error('Get user rating error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all ratings for a store (store owner only)
router.get('/store/:storeId', authenticateToken, requireRole(['admin', 'store_owner']), async (req, res) => {
  try {
    const { storeId } = req.params;
    const userId = req.user.id;

    // Check if store exists
    const storeResult = await pool.query(
      'SELECT id, owner_id FROM stores WHERE id = $1',
      [storeId]
    );

    if (storeResult.rows.length === 0) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // If user is store owner, check if they own this store
    if (req.user.role === 'store_owner' && storeResult.rows[0].owner_id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { sortBy = 'created_at', sortOrder = 'desc' } = req.query;

    let query = `
      SELECT r.*, u.name as user_name, u.email as user_email
      FROM ratings r
      JOIN users u ON r.user_id = u.id
      WHERE r.store_id = $1
    `;

    const validSortFields = ['created_at', 'rating', 'user_name'];
    const validSortOrders = ['asc', 'desc'];
    
    if (validSortFields.includes(sortBy) && validSortOrders.includes(sortOrder.toLowerCase())) {
      query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
    } else {
      query += ` ORDER BY created_at DESC`;
    }

    const result = await pool.query(query, [storeId]);

    // Get average rating
    const avgResult = await pool.query(
      'SELECT AVG(rating) as average_rating, COUNT(*) as total_ratings FROM ratings WHERE store_id = $1',
      [storeId]
    );

    res.json({
      ratings: result.rows,
      average_rating: parseFloat(avgResult.rows[0].average_rating || 0).toFixed(1),
      total_ratings: parseInt(avgResult.rows[0].total_ratings)
    });
  } catch (error) {
    console.error('Get store ratings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete rating
router.delete('/:storeId', authenticateToken, async (req, res) => {
  try {
    const { storeId } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      'DELETE FROM ratings WHERE user_id = $1 AND store_id = $2 RETURNING *',
      [userId, storeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    res.json({ message: 'Rating deleted successfully' });
  } catch (error) {
    console.error('Delete rating error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

