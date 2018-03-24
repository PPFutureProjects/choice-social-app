import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController, App, Platform } from 'ionic-angular';
import { FirestoreProvider, AuthProvider, TranslateProvider, NetworkProvider } from '../../../providers';
import { Subscription } from 'rxjs/Subscription';
import { Group, User, Message } from '../../../models';
import { Device } from '@ionic-native/device';

@IonicPage()
@Component({
  selector: 'page-groups',
  templateUrl: 'groups.html',
})
export class GroupsPage {
  private android: boolean;
  private subscriptions: Subscription[];
  private groups: any[];
  private searchGroup: string;
  private userGroups: Map<string, any>;

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private app: App,
    private modalCtrl: ModalController,
    private firestore: FirestoreProvider,
    private auth: AuthProvider,
    private translate: TranslateProvider,
    private network: NetworkProvider,
    private platform: Platform,
    private device: Device) {
  }

  ionViewDidLoad() {
    this.platform.ready().then(() => {
      // Check if device is running on android and adjust the scss accordingly.
      if (this.device.platform == 'Android') {
        this.android = true;
      } else {
        this.android = false;
      }
    }).catch(() => { });

    this.subscriptions = [];
    this.userGroups = new Map<string, any>();

    // Subscribe to userGroups on Firestore and sync.
    let subscription = this.firestore.getUserGroups(this.auth.getUserData().userId).snapshotChanges().subscribe(groups => {
      for (let i = 0; i < groups.length; i++) {
        let groupId = groups[i].payload.doc.id;
        // Subscribe to userGroup.
        let subscription = this.firestore.getUserGroup(this.auth.getUserData().userId, groupId).valueChanges().subscribe(userGroup => {
          this.userGroups.set(groupId, userGroup);
        });
        this.subscriptions.push(subscription);
        // Subscribe to group.
        this.firestore.get('groups/' + groupId).then(ref => {
          let subscription = ref.valueChanges().subscribe((group: Group) => {
            // Check if current user is still a member of the group, if not delete the group.
            if (group) {
              if (group.members.indexOf(this.auth.getUserData().userId) > -1) {
                this.addOrUpdateGroup(group);
              } else {
                this.deleteGroupById(groupId);
                this.userGroups.delete(groupId);
                if (this.groups && this.groups.length == 0) {
                  this.groups = null;
                }
              }
            } else {
              // Check if group is already deleted from Firestore, if deleted, delete the group.
              this.deleteGroupById(groupId);
              this.userGroups.delete(groupId);
              if (this.groups && this.groups.length == 0) {
                this.groups = null;
              }
            }
          });
          this.subscriptions.push(subscription);
        });
      }
    });
    this.subscriptions.push(subscription);
  }

  ionViewWillUnload() {
    // Clear the subscriptions.
    if (this.subscriptions) {
      for (let i = 0; i < this.subscriptions.length; i++) {
        this.subscriptions[i].unsubscribe();
      }
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

  // Open NewGroupPage
  private compose(): void {
    let modal = this.modalCtrl.create('NewGroupPage');
    modal.present();
    modal.onDidDismiss(data => {
      if (data) {
        if (data.members) {
          this.app.getRootNavs()[0].push('GroupPage', { members: data.members });
        }
      }
    });
  }

  // Get the last message given the messages list.
  private getLastMessage(messages: Message[]): string {
    let message = messages[messages.length - 1];
    //Photo Message
    if (message.type == 1) {
      if (message.sender == this.auth.getUserData().userId) {
        return this.translate.get('chats.message.sent.photo');
      } else {
        return this.translate.get('chats.message.received.photo');
      }
    } else {
      if (message.sender == this.auth.getUserData().userId) {
        return this.translate.get('chats.message.you') + message.message;
      } else {
        return message.message;
      }
    }
  }

  // Get the last date of the message given the messages list.
  private getLastMessageDate(messages: Message[]): Date {
    let message = messages[messages.length - 1];
    return message.date;
  }

  // Get the number of unread messages given the groupId, and messages list.
  private getUnreadMessages(groupId: string, messages: Message[]): number {
    if (!this.userGroups.get(groupId)) {
      return null;
    }
    else {
      let unread = messages.length - this.userGroups.get(groupId).messagesRead;
      if (unread > 0) {
        return unread;
      } else {
        return null;
      }
    }
  }

  // Open the group chat.
  private chat(group: Group): void {
    if (this.network.online())
      this.app.getRootNavs()[0].push('GroupPage', { groupId: group.groupId, members: group.members });
  }

}
