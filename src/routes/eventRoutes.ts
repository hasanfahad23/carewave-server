import { Router } from 'express';
import {
  getRecentEvents,
  getAllUpcomingEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getUserCreatedEvents,
  joinEvent,
  leaveEvent,
  getUserJoinedEvents
} from '../controllers/eventController';
import { verifyToken } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/recent', getRecentEvents);
router.get('/', getAllUpcomingEvents);

// Protected user-specific routes (must be before /:id)
router.get('/user/created', verifyToken, getUserCreatedEvents);
router.get('/user/joined', verifyToken, getUserJoinedEvents);

// Public single event detail
router.get('/:id', getEventById);

// Protected event mutations
router.post('/', verifyToken, createEvent);
router.put('/:id', verifyToken, updateEvent);
router.delete('/:id', verifyToken, deleteEvent);

// Protected join/leave actions
router.post('/:id/join', verifyToken, joinEvent);
router.delete('/:id/join', verifyToken, leaveEvent);

export default router;
