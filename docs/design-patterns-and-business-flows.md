# Business Class Design Patterns

Tai lieu nay chi ve cac business class va design pattern theo dang class diagram.
Khong dua sequence diagram/business flow tung buoc vao tai lieu nay.

## 1. Singleton Pattern - Socket/Event/Mediator

Dung nhu ban hieu: `SocketServer`, `EventBus`, va `RealtimeMediator` deu duoc cai dat theo Singleton.
Moi class chi tao mot instance dung chung trong suot qua trinh server chay.

```mermaid
classDiagram
direction TB

class SocketServer {
  -static instance: SocketServer
  -io: Server
  -constructor()
  +static getInstance() SocketServer
  +init(server) Server
  +getIO() Server
  -setupAuthentication()
}

class EventBus {
  -static instance: EventBus
  -constructor()
  +static getInstance() EventBus
  +emit(event,payload)
  +on(event,listener)
}

class RealtimeMediator {
  -static instance: RealtimeMediator
  -io: Server
  -constructor()
  +static getInstance() RealtimeMediator
  +initialize()
  -handleMessageCreated(message)
  -handleTyping(socket,data)
  -handleSeen(socket,data)
}

class SocketIO {
  +to(room)
  +emit(event,payload)
  +on(event,handler)
}

SocketServer --> SocketIO : wraps
RealtimeMediator --> SocketServer : uses getIO()
RealtimeMediator --> EventBus : subscribes
RealtimeMediator --> SocketIO : broadcasts
```

## 2. Auth Module - Controller Service Model

```mermaid
classDiagram
direction TB

class AuthController {
  +registerController(req,res)
  +loginController(req,res)
  +sendOtpController(req,res)
  +forgotPasswordController(req,res)
  +resetPasswordController(req,res)
  +refreshTokenController(req,res)
  +logoutController(req,res)
}

class AuthService {
  -isEmailExists(email)
  -handleRateLimit(email,token,time,type)
  +registerService(email,password,fullName,otp)
  +loginService(email,password)
  +sendOtpService(email)
  +forgotPasswordService(email)
  +resetPasswordService(token,password)
  +refreshTokenService(refreshToken)
  +logoutService(userId,refreshToken)
}

class User {
  +fullName
  +email
  +password
  +avatar
  +isVerified
}

class AuthToken {
  +email
  +type
  +token
  +isUsed
  +expiresAt
}

class RefreshToken {
  +user
  +token
  +expiresAt
  +revoked
}

class Mailer {
  +sendOTPEmail(email,otp)
  +sendResetPasswordEmail(email,token)
}

class ShareUtils {
  +hashPassword(password)
  +comparePassword(password,hash)
  +generateToken(payload)
  +generateRefreshToken()
}

AuthController --> AuthService : uses
AuthController --> Mailer : sends
AuthService --> User : create/login/update
AuthService --> AuthToken : verify/reset token
AuthService --> RefreshToken : manage
AuthService --> ShareUtils : uses
```

## 3. User Module

```mermaid
classDiagram
direction TB

class UserController {
  +getUser(req,res)
  +updateAvatar(req,res)
  +searchUsers(req,res)
}

class User {
  +fullName
  +email
  +password
  +avatar
  +isVerified
  +createdAt
  +updatedAt
}

class MulterFile {
  +filename
  +originalname
  +mimetype
  +size
}

class FileSystem {
  +existsSync(path)
  +unlinkSync(path)
}

UserController --> User : get/update/search
UserController --> MulterFile : receives avatar
UserController --> FileSystem : delete old avatar
```

## 4. Friend Module

```mermaid
classDiagram
direction TB

class FriendController {
  +sendFriendRequest(req,res)
  +acceptFriendRequest(req,res)
  +declineFriendRequest(req,res)
  +getFriends(req,res)
  +getFriendRequests(req,res)
  +getFriendStatus(req,res)
  +cancelFriendRequest(req,res)
  +unfriend(req,res)
}

class FriendService {
  +sendFriendRequestService(requester,recipient)
  +acceptFriendRequestService(requestId)
  +declineFriendRequestService(requestId)
  +getFriendsService(userId)
  +getPendingFriendRequestsService(userId)
  +getFriendStatusService(userId,targetUserId)
  +cancelFriendRequestService(requester,recipient)
  +unfriendService(userId,friendId)
}

class Friend {
  +requester
  +recipient
  +status
}

class User {
  +fullName
  +email
  +avatar
}

class Conversation {
  +chatName
  +isGroupChat
  +users
}

class SocketIO {
  +to(room)
  +emit(event,payload)
}

FriendController --> FriendService : uses
FriendController --> SocketIO : emits
FriendService --> Friend : manage
FriendService --> Conversation : create on accept
Friend --> User : requester
Friend --> User : recipient
Conversation --> User : users
```

## 5. Conversation Module

```mermaid
classDiagram
direction TB

class ConversationController {
  +getUserConversations(req,res)
  +accessChat(req,res)
  +createGroup(req,res)
  +getPolls(req,res)
  +createPoll(req,res)
  +votePoll(req,res)
  +getNotes(req,res)
  +createNote(req,res)
  +updateNote(req,res)
  +deleteNote(req,res)
  +updateConversation(req,res)
  +getParticipants(req,res)
  +addMember(req,res)
  +removeMember(req,res)
  +markAsRead(req,res)
}

class ConversationService {
  +accessDirectChat(userId,targetUserId)
  +createGroupChat(chatName,users,creatorId)
  +removeFromGroup(chatId,userIdToRemove,requesterId)
  +addNote(chatId,content,creatorId)
  +getNotes(chatId)
  +updateNote(noteId,content)
  +deleteNote(noteId)
  +createPoll(chatId,question,optionTexts,creatorId)
  +getPolls(chatId)
  +votePoll(chatId,pollId,optionId,userId)
  +updateConversation(chatId,data,requesterId)
  +addMember(chatId,userIdToAdd,requesterId)
  +getParticipants(chatId)
}

class GetUserConversationsService {
  +getUserConversationsService(userId)
}

class Conversation {
  +chatName
  +isGroupChat
  +users
  +latestMessage
  +groupAdmins
  +polls
  +notes
}

class Poll {
  +question
  +options
  +createdBy
  +isActive
}

class PollOption {
  +text
  +voters
}

class Note {
  +content
  +createdBy
  +createdAt
}

class MessageService {
  +sendMessage(senderId,conversationId,content,type)
  +markMessagesAsRead(conversationId,userId)
}

class User {
  +fullName
  +email
  +avatar
}

class Message {
  +sender
  +content
  +conversationId
  +messageType
}

ConversationController --> ConversationService : uses
ConversationController --> GetUserConversationsService : uses
ConversationController --> MessageService : mark read
ConversationService --> Conversation : manage
ConversationService --> MessageService : create system/poll message
Conversation --> User : users/admins
Conversation --> Message : latestMessage
Conversation *-- Poll : contains
Poll *-- PollOption : contains
Conversation *-- Note : contains
```

## 6. Message Module - Controller Service Model

```mermaid
classDiagram
direction TB

class MessageController {
  +sendMessage(req,res)
  +getHistory(req,res)
  +searchMessages(req,res)
}

class MessageService {
  +sendMessage(senderId,conversationId,content,messageType,fileMeta)
  +getHistory(conversationId,page,limit)
  +searchMessages(conversationId,keyword,messageType)
  +markMessagesAsRead(conversationId,userId)
}

class Message {
  +sender
  +content
  +conversationId
  +messageType
  +fileUrl
  +fileName
  +fileSize
  +mimeType
  +readBy
}

class Conversation {
  +latestMessage
}

class EventBus {
  +emit(event,payload)
}

class User {
  +fullName
  +email
  +avatar
}

MessageController --> MessageService : uses
MessageService --> Message : create/query/update
MessageService --> Conversation : update latestMessage
MessageService --> EventBus : publish MESSAGE_CREATED
Message --> User : sender/readBy
Message --> Conversation : belongs to
```

## 7. Message Request Pipeline - Chain Of Responsibility

```mermaid
classDiagram
direction TB

class RequestHandler {
  -nextHandler: RequestHandler
  +setNext(handler) RequestHandler
  +handle(req,res,next)
}

class ConversationPermissionHandler {
  +handle(req,res,next)
}

class MessageContentValidationHandler {
  +handle(req,res,next)
}

class MessageController {
  +sendMessage(req,res)
  +getHistory(req,res)
  +searchMessages(req,res)
}

class Conversation {
  +users
}

RequestHandler <|-- ConversationPermissionHandler
RequestHandler <|-- MessageContentValidationHandler
ConversationPermissionHandler --> Conversation : validate permission
ConversationPermissionHandler --> MessageContentValidationHandler : setNext()
MessageContentValidationHandler --> MessageController : passes request
```

## 8. Realtime Message - Observer + Mediator

```mermaid
classDiagram
direction TB

class MessageService {
  +sendMessage(senderId,conversationId,content,type)
}

class EventBus {
  -static instance: EventBus
  +static getInstance() EventBus
  +emit(event,payload)
  +on(event,listener)
}

class RealtimeMediator {
  -static instance: RealtimeMediator
  -io: Server
  +static getInstance() RealtimeMediator
  +initialize()
  -handleMessageCreated(message)
}

class SocketServer {
  -static instance: SocketServer
  +static getInstance() SocketServer
  +getIO() Server
}

class SocketIO {
  +to(room)
  +emit(event,payload)
}

MessageService --> EventBus : emit MESSAGE_CREATED
RealtimeMediator --> EventBus : observes
RealtimeMediator --> SocketServer : uses
RealtimeMediator --> SocketIO : broadcast receive_message
```

## 9. Search Module

```mermaid
classDiagram
direction TB

class SearchController {
  +search(req,res)
}

class SearchService {
  +searchService(keyword,userId,conversationId,type,senderId)
}

class User {
  +fullName
  +email
  +avatar
}

class Conversation {
  +users
}

class Message {
  +content
  +conversationId
  +messageType
}

SearchController --> SearchService : uses
SearchService --> User : search
SearchService --> Conversation : get allowed conversations
SearchService --> Message : search in allowed conversations
```

## 10. Pattern Summary

| Pattern | Class lien quan |
| --- | --- |
| Singleton | `SocketServer`, `EventBus`, `RealtimeMediator` |
| Service Layer | `AuthService`, `FriendService`, `ConversationService`, `MessageService`, `SearchService` |
| MVC / Layered Architecture | `Route -> Controller -> Service -> Model` |
| Chain of Responsibility | `RequestHandler`, `ConversationPermissionHandler`, `MessageContentValidationHandler` |
| Observer / PubSub | `MessageService -> EventBus -> RealtimeMediator` |
| Mediator | `RealtimeMediator` dieu phoi EventBus va Socket.IO |
| Active Record / Model Gateway | `User`, `Friend`, `Conversation`, `Message`, `AuthToken`, `RefreshToken` qua Mongoose Model |
