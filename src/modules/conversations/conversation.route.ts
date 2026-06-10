import { Express } from 'express';
import { accessChat, createGroup, createPoll, votePoll, getUserConversations, updateConversation, getParticipants, addMember, removeMember, getPolls, getNotes, createNote, updateNote, deleteNote, markAsRead } from './conversation.controller';
import { checkValidJWT } from '../../middlewares/jwt.middleware';

const conversationRoute = (app: Express) => {
  // Get all conversations for the current user
  app.get('/api/conversations', checkValidJWT, getUserConversations);
  
  // Access or create a direct 1-to-1 chat
  app.post('/api/conversations', checkValidJWT, accessChat);
  
  // Mark all messages in a conversation as read
  app.put('/api/conversations/:conversationId/read', checkValidJWT, markAsRead);
  
  // Create a group chat
  app.post('/api/conversations/group', checkValidJWT, createGroup);
  
  // Get polls in a conversation
  app.get('/api/conversations/:conversationId/polls', checkValidJWT, getPolls);

  // Create a poll in a conversation
  app.post('/api/conversations/:conversationId/polls', checkValidJWT, createPoll);
  
  // Vote on a poll
  app.post('/api/polls/:pollId/vote', checkValidJWT, votePoll);

  // Get notes in a conversation
  app.get('/api/conversations/:conversationId/notes', checkValidJWT, getNotes);

  // Create a note in a conversation
  app.post('/api/conversations/:conversationId/notes', checkValidJWT, createNote);

  // Update a note
  app.put('/api/notes/:noteId', checkValidJWT, updateNote);

  // Delete a note
  app.delete('/api/notes/:noteId', checkValidJWT, deleteNote);

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
