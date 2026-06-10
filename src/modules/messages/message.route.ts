import express from 'express';
import { sendMessage, getHistory, searchMessages } from './message.controller';
import { checkValidJWT } from '../../middlewares/jwt.middleware';
import { uploadLocal } from '../../config/multer';
import { ConversationPermissionHandler } from '../../middlewares/pipeline/PermissionHandler';
import { MessageContentValidationHandler } from '../../middlewares/pipeline/ContentValidationHandler';

const router = express.Router();

router.use(checkValidJWT);

const permissionHandler = new ConversationPermissionHandler();
const contentValidationHandler = new MessageContentValidationHandler();

// Tạo chuỗi (Chain) cho sendMessage: Permission -> Validation -> Controller
const sendMessagePipeline = permissionHandler;
sendMessagePipeline.setNext(contentValidationHandler);

// Sử dụng uploadLocal để parse file
router.post('/', uploadLocal.single('file'), (req, res, next) => sendMessagePipeline.handle(req as any, res, next), sendMessage);

// Tạo chuỗi (Chain) cho getHistory/searchMessages: Permission -> Controller
const basicPipeline = new ConversationPermissionHandler(); // Instance mới tránh xung đột next

router.get('/search', (req, res, next) => basicPipeline.handle(req as any, res, next), searchMessages);
router.get('/:conversationId', (req, res, next) => basicPipeline.handle(req as any, res, next), getHistory);

export default router;