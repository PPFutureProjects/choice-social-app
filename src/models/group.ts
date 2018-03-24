import { Message } from './';

export class Group {
  public object: {};
  constructor(
    public groupId: string,
    public title: string,
    public photo: string,
    public members: string[], //userIds of members of the group
    public messages: any[], //based on Message Model
    public participants: string[] //userIds on users who has sent atleast one message
  ) {
    this.object = {
      groupId: groupId,
      title: title,
      photo: photo,
      members: members,
      messages: messages,
      participants: participants
    };
  }
}
