import { AngularFirestoreCollection } from 'angularfire2/firestore';
import { UserConversation } from './user-conversation';
import { UserGroup } from './user-group';
export class User {
  public object: {};
  constructor(
    public userId: string,
    public email: string,
    public firstName: string,
    public lastName: string,
    public photo: string,
    public username: string,
    public bio: string,
    public contacts: string[], //userIds of contacts
    public requestsSent: string[], //userIds whom you sent a contact request
    public requestsReceived: string[], //userIds who sent you a contact request
    public conversations: AngularFirestoreCollection<UserConversation>,
    public groups: AngularFirestoreCollection<UserGroup>,
    public pushToken: string,
    public notifications: boolean
  ) {
    this.object = {
      userId: userId,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      photo: this.photo,
      username: this.username,
      bio: this.bio,
      requestsSent: this.requestsSent,
      requestsReceived: this.requestsReceived,
      pushToken: this.pushToken,
      notifications: this.notifications
    };
  }
}
