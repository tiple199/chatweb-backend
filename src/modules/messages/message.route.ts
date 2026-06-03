import express from 'express';
import { sendMessage, getHistory, searchMessages } from './message.controller';
import { checkValidJWT } from '../../middlewares/jwt.middleware';
import { uploadLocal } from '../../config/multer';

const router = express.Router();

router.use(checkValidJWT);

// Sử dụng uploadLocal để parse file
router.post('/', uploadLocal.single('file'), sendMessage);

router.get('/search', searchMessages);
router.get('/:conversationId', getHistory);

export default router;