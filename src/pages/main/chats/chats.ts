import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, App, ModalController, Platform } from 'ionic-angular';
import { FirestoreProvider, AuthProvider, TranslateProvider, NetworkProvider } from '../../../providers';
import { Subscription } from 'rxjs/Subscription';
import { Conversation, User, Message } from '../../../models';
import { Device } from '@ionic-native/device';

@IonicPage()
@Component({
  selector: 'page-chats',
  templateUrl: 'chats.html',
})
export class ChatsPage {
  private android: boolean;
  private subscriptions: Subscription[];
  private conversations: any[];
  private searchUser: string;
  private userConversations: Map<string, any>;
  private partners: Map<string, User>;

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
    this.userConversations = new Map<string, any>();
    this.partners = new Map<string, User>();

    // Subscribe to user conversations.
    let subscription = this.firestore.getUserConversations(this.auth.getUserData().userId).snapshotChanges().subscribe(conversations => {
      for (let i = 0; i < conversations.length; i++) {
        // Get the partnerId, and conversationId of conversations.
        let partnerId = conversations[i].payload.doc.id;
        let conversationId = conversations[i].payload.doc.data().conversationId;
        // Subscribe and sync the user conversation Map.
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
        // Subscribe to partner.
        this.firestore.get('users/' + partnerId).then(ref => {
          let subscription = ref.valueChanges().subscribe((user: User) => {
            this.partners.set(conversationId, user);
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

  // Add or update conversation data to sync with Firestore.
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

  // Open NewConversationPage
  private compose(): void {
    let modal = this.modalCtrl.create('NewConversationPage');
    modal.present();
    modal.onDidDismiss(data => {
      if (data) {
        // Open the chat with the user selected on ChatPage.
        if (data.userId) {
          this.app.getRootNavs()[0].push('ChatPage', { userId: data.userId });
        } else if (data.viewContacts) {
          // View contacts when user has no contacts yet, and selected the button on ChatPage.
          this.navCtrl.parent.select(2);
        }
      }
    });
  }

  // Get the last message given the messages list.
  private getLastMessage(messages: Message[]): string {
    let message = messages[messages.length - 1];
    // Photo Message
    if (message.type == 1) {
      if (message.sender == this.auth.getUserData().userId) {
        return this.translate.get('chats.message.sent.photo');
      } else {
        return this.translate.get('chats.message.received.photo');
      }
    } else {
      // Text Message
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

  // Get the number of unread messages given the conversationId, and messages list.
  private getUnreadMessages(conversationId: string, messages: Message[]): number {
    if (!this.userConversations.get(conversationId))
      return null;
    else {
      let unread = messages.length - this.userConversations.get(conversationId).messagesRead;
      if (unread > 0) {
        return unread;
      } else {
        return null;
      }
    }
  }

  // Open the chat with the user given the conversationId.
  private chat(conversationId: string): void {
    if (this.network.online())
      this.app.getRootNavs()[0].push('ChatPage', { userId: this.partners.get(conversationId).userId });
  }

}
