import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, Tabs, App } from 'ionic-angular';
import { TranslateProvider, FirestoreProvider, AuthProvider, NotificationProvider } from '../../../providers';
import { User, Conversation, Group } from '../../../models';
import { Subscription } from 'rxjs/Subscription';

@IonicPage()
@Component({
  selector: 'page-tabs',
  templateUrl: 'tabs.html',
})
export class TabsPage {
  @ViewChild("tabs") tabs: Tabs;
  tab1Root: string = 'ChatsPage';
  tab2Root: string = 'GroupsPage';
  tab3Root: string = 'ContactsPage';
  tab4Root: string = 'FeedPage';
  // tab4Root: string = 'UpdateProfilePage';

  private user: User;
  private subscriptions: Subscription[];
  private userConversations: Map<string, any>;
  private userGroups: Map<string, any>;
  private conversations: any[];
  private groups: any[];

  constructor(private navCtrl: NavController,
    private navParams: NavParams,
    private firestore: FirestoreProvider,
    private auth: AuthProvider,
    private notification: NotificationProvider,
    private app: App) { }

  ionViewDidLoad() {
    this.subscriptions = [];
    this.userConversations = new Map<string, any>();
    this.userGroups = new Map<string, any>();
    // Subscribe to current user data on Firestore and sync.
    this.firestore.get('users/' + this.auth.getUserData().userId).then(ref => {
      let subscription = ref.valueChanges().subscribe((user: User) => {
        this.user = user;
      });
      this.subscriptions.push(subscription);
      // Initialize the push notifications (set pushToken) when user logged in.
      ref.valueChanges().take(1).subscribe((user: User) => {
        if (user.notifications) {
          this.notification.init();
          this.notification.setApp(this.app);
        }
      });
    }).catch(() => { });

    //Subscribe to userConversations on Firestore and sync.
    let conversationSubscription = this.firestore.getUserConversations(this.auth.getUserData().userId).snapshotChanges().subscribe(conversations => {
      for (let i = 0; i < conversations.length; i++) {
        let partnerId = conversations[i].payload.doc.id;
        let conversationId = conversations[i].payload.doc.data().conversationId;
        let subscription = this.firestore.getUserConversation(this.auth.getUserData().userId, partnerId).valueChanges().subscribe(userConversation => {
          this.userConversations.set(conversationId, userConversation);
        });
        this.subscriptions.push(subscription);
        // Subscribe to conversation.
        this.firestore.get('conversations/' + conversationId).then(ref => {
          let subscription = ref.valueChanges().subscribe((conversation: Conversation) => {
            this.addOrUpdateConversation(conversation);
          });
          this.subscriptions.push(subscription);
        });
      }
    });
    this.subscriptions.push(conversationSubscription);

    //Subscribe to userGroups on Firestore and sync.
    let groupSubscription = this.firestore.getUserGroups(this.auth.getUserData().userId).snapshotChanges().subscribe(groups => {
      for (let i = 0; i < groups.length; i++) {
        let groupId = groups[i].payload.doc.id;
        let subscription = this.firestore.getUserGroup(this.auth.getUserData().userId, groupId).valueChanges().subscribe(userGroup => {
          this.userGroups.set(groupId, userGroup);
        });
        this.subscriptions.push(subscription);
        // Subscribe to group.
        this.firestore.get('groups/' + groupId).then(ref => {
          let subscription = ref.valueChanges().subscribe((group: Group) => {
            if (group) {
              // Check if current user is still a member of the group, if not delete the group.
              if (group.members.indexOf(this.auth.getUserData().userId) > -1) {
                this.addOrUpdateGroup(group);
              } else {
                this.deleteGroupById(groupId);
                this.userGroups.delete(groupId);
              }
            } else {
              // Check if group is already deleted from Firestore, if deleted, delete the group.
              this.deleteGroupById(groupId);
              this.userGroups.delete(groupId);
            }
          });
          this.subscriptions.push(subscription);
        });
      }
    });
    this.subscriptions.push(groupSubscription);
  }

  ionViewWillUnload() {
    // Clear subscriptions.
    if (this.subscriptions) {
      for (let i = 0; i < this.subscriptions.length; i++) {
        this.subscriptions[i].unsubscribe();
      }
      this.conversations = null;
      this.groups = null;
    }
  }

  // Add or update the conversation object.
  private addOrUpdateConversation(conversation: Conversation): void {
    if (this.conversations) {
      let index = -1;
      for (let i = 0; i < this.conversations.length; i++) {
        if (conversation.conversationId == this.conversations[i].conversationId) {
          index = i;
        }
      }
      if (index > -1) {
        this.conversations[index] = conversation;
      }
      else {
        this.conversations.push(conversation);
      }
    } else {
      this.conversations = [conversation];
    }
  }

  // Add or update the group object.
  private addOrUpdateGroup(group: Group): void {
    if (this.groups) {
      let index = -1;
      for (let i = 0; i < this.groups.length; i++) {
        if (group.groupId == this.groups[i].groupId) {
          index = i;
        }
      }
      if (index > -1) {
        this.groups[index] = group;
      }
      else {
        this.groups.push(group);
      }
    } else {
      this.groups = [group];
    }
  }

  // Delete the group given the groupId.
  private deleteGroupById(groupId: string): void {
    if (this.groups) {
      let index = -1;
      for (let i = 0; i < this.groups.length; i++) {
        if (groupId == this.groups[i].groupId) {
          index = i;
        }
      }
      if (index > -1) {
        this.groups.splice(index, 1);
      }
    }
  }

  // Get the number of user requests received.
  private getRequestsReceived(): number {
    if (this.user && this.user.requestsReceived) {
      return this.user.requestsReceived.length;
    }
    return null;
  }

  // Get the total number of unread messages (conversations).
  private getUnreadMessages(): number {
    if (this.conversations) {
      let unread = 0;
      for (let i = 0; i < this.conversations.length; i++) {
        if (this.conversations[i].messages) {
          unread += this.conversations[i].messages.length - this.userConversations.get(this.conversations[i].conversationId).messagesRead;
        }
      }
      if (unread > 0) {
        return unread;
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  // Get the total number of unread messages (groups).
  private getUnreadGroupMessages(): number {
    if (this.groups) {
      let unread = 0;
      for (let i = 0; i < this.groups.length; i++) {
        if (this.groups[i].groupId && this.userGroups.get(this.groups[i].groupId)) {
          let messagesRead: number = this.userGroups.get(this.groups[i].groupId).messagesRead;
          unread += this.groups[i].messages.length - messagesRead;
        }
      }
      if (unread > 0) {
        return unread;
      } else {
        return null;
      }
    }
    return null;
  }

}
