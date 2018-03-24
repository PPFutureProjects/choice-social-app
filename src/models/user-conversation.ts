export class UserConversation {
  public object: {};
  constructor(
    public conversationId: string,
    public messagesRead: number
  ) {
    this.object = {
      conversationId: conversationId,
      messagesRead: messagesRead
    };
  }
}
