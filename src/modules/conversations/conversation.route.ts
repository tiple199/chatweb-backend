import express from 'express';
import { accessChat, createGroup, createPoll, votePoll } from './conversation.controller';
import { checkValidJWT } from '../../middlewares/jwt.middleware';

const router = express.Router();

// Sử dụng đúng tên middleware của bạn để bảo vệ route[cite: 8]
router.use(checkValidJWT);

router.post('/', accessChat); 
router.post('/group', createGroup); 
router.post('/poll', createPoll);
router.post('/poll/vote', votePoll);

export default router;