import express from 'express';
import { Notification } from '../../models/index.js';

const router = express.Router();

/**
 * GET /api/career-agents/notifications
 * Get all notifications for the user
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const notifications = await Notification.findAll({
      where: { userId },
      order: [['timestamp', 'DESC']],
    });

    res.json({ success: true, notifications });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/career-agents/notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', async (req, res) => {
  try {
    const userId = req.user?.id;
    const notificationId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const notification = await Notification.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await notification.update({ read: true });

    res.json({
      success: true,
      notification,
      message: 'Notification marked as read.',
    });
  } catch (error) {
    console.error('Update notification error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/career-agents/notifications
 * Clear all notifications
 */
router.delete('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await Notification.destroy({ where: { userId } });

    res.json({
      success: true,
      message: 'All notifications cleared.',
    });
  } catch (error) {
    console.error('Clear notifications error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
