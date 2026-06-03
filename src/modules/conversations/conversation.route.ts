import { Express } from 'express';
import { accessChat, createGroup, createPoll, votePoll, getUserConversations, updateConversation, getParticipants, addMember, removeMember } from './conversation.controller';
import { checkValidJWT } from '../../middlewares/jwt.middleware';

const conversationRoute = (app: Express) => {
  // Get all conversations for the current user
  app.get('/api/conversations', checkValidJWT, getUserConversations);
  
  // Access or create a direct 1-to-1 chat
  app.post('/api/conversations', checkValidJWT, accessChat);
  
  // Create a group chat
  app.post('/api/conversations/group', checkValidJWT, createGroup);
  
  // Create a poll in a conversation
  app.post('/api/conversations/poll', checkValidJWT, createPoll);
  
  // Vote on a poll
  app.post('/api/conversations/poll/vote', checkValidJWT, votePoll);

  // Update conversation details (e.g. rename group)
  app.put('/api/conversations/:id', checkValidJWT, updateConversation);

  // Get participants of a conversation
  app.get('/api/conversations/:conversationId/participants', checkValidJWT, getParticipants);

  // Add a member to group
  app.post('/api/conversations/:conversationId/participants', checkValidJWT, addMember);

  // Remove a member from group
  app.delete('/api/conversations/:conversationId/participants/:userId', checkValidJWT, removeMember);
};

export default conversationRoute;
