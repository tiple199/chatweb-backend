import { EventEmitter } from "events";

export const EVENTS = {
  MESSAGE_CREATED: "MESSAGE_CREATED",
  MESSAGE_EDITED: "MESSAGE_EDITED",
  MESSAGE_DELETED: "MESSAGE_DELETED",
  USER_ONLINE: "USER_ONLINE",
  USER_OFFLINE: "USER_OFFLINE",
  USER_TYPING: "USER_TYPING",
  FRIEND_REQUEST: "FRIEND_REQUEST",
  MESSAGE_SEEN: "MESSAGE_SEEN"
};

class EventBus extends EventEmitter {
  private static instance: EventBus;
  
  private constructor() { 
    super(); 
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }
}

export const eventBus = EventBus.getInstance();
