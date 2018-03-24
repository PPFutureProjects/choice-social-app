import { Message } from './';

export class Conversation {
  public object: {};
  constructor(
    public conversationId: string,
    public messages: any[] //based on Message Model
  ) {
    this.object = {
      conversationId: conversationId,
      messages: messages
    };
  }
}
