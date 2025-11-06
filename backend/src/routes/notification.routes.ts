import { Router } from 'express';
import {
  getAllNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendTestNotification,
  sendSystemAlert,
} from '../controllers/notification.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getAllNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markAsRead);
router.patch('/mark-all-read', markAllAsRead);
router.delete('/:id', deleteNotification);
router.post('/test', sendTestNotification);
router.post('/system-alert', authorize('ADMIN'), sendSystemAlert);

export default router;

