import express from 'express';
import { sendMessage, getHistory, searchMessages } from './message.controller';
import { checkValidJWT } from '../../middlewares/jwt.middleware';
import { attachmentUpload } from '../../config/multer';

const router = express.Router();

router.use(checkValidJWT);

// Sử dụng attachmentUpload để parse file bằng memory storage
router.post('/', attachmentUpload.single('file'), sendMessage);

router.get('/search', searchMessages);
router.get('/:conversationId', getHistory);

export default router;