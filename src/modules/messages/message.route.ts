import express from 'express';
import { sendMessage, allMessages } from './message.controller';
import { checkValidJWT } from '../../middlewares/jwt.middleware';

const router = express.Router();

// Sử dụng đúng tên middleware của bạn để bảo vệ route[cite: 8]
router.use(checkValidJWT);

router.post('/', sendMessage);
router.get('/:chatId', allMessages);

export default router;