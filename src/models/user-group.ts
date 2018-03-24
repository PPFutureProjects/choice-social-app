export class UserGroup {
  public object: {};
  constructor(
    public groupId: string,
    public messagesRead: number
  ) {
    this.object = {
      groupId: groupId,
      messagesRead: messagesRead
    };
  }
}
