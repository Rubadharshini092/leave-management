import { Router } from 'express';
import { getLeaves, createLeave, updateLeaveStatus, deleteLeave } from '../controllers/leaveController.js';
const router = Router();
router.get('/', getLeaves);
router.post('/', createLeave);
router.patch('/:id/status', updateLeaveStatus);
router.delete('/:id', deleteLeave);
export default router;
