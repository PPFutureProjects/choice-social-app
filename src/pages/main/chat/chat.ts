import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, NavController, NavParams, Content, Platform, ActionSheetController, ModalController } from 'ionic-angular';
import { TranslateProvider, FirestoreProvider, AuthProvider, StorageProvider, LoadingProvider, NetworkProvider, NotificationProvider } from '../../../providers';
import { Conversation, Message, User, UserConversation } from '../../../models';
import { Subscription } from 'rxjs/Subscription';
import { Device } from '@ionic-native/device';
import { Keyboard } from '@ionic-native/keyboard';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { PhotoViewer } from '@ionic-native/photo-viewer';

@IonicPage()
@Component({
  selector: 'page-chat',
  templateUrl: 'chat.html',
})
export class ChatPage {
  private android: boolean;
  private iPhoneX: boolean;
  @ViewChild(Content) content: Content;
  @ViewChild('messageBox') messageBox: ElementRef;
  private subscriptions: Subscription[];

  private partnerId: string;
  private partner: User;

  private conversationId: string;
  private conversation: Conversation;

  private message: string;
  private collapsed: string;
  private expanded: string;

  // Show only 10 messages initially, and show 10 more messages.
  private messagesToShow: number = 10;
  private numOfMessages: number = 10;
  private toggleDates: boolean[];
  private from: number;

  constructor(public navCtrl: NavController,
    private actionSheetCtrl: ActionSheetController,
    private modalCtrl: ModalController,
    public navParams: NavParams,
    private platform: Platform,
    private device: Device,
    private translate: TranslateProvider,
    private firestore: FirestoreProvider,
    private auth: AuthProvider,
    private storage: StorageProvider,
    private loading: LoadingProvider,
    private keyboard: Keyboard,
    private camera: Camera,
    private network: NetworkProvider,
    private photoViewer: PhotoViewer,
    private notification: NotificationProvider) { }

  ionViewDidLoad() {
    this.platform.ready().then(() => {
      // Check if device is on iPhoneX and adjust the scss accordingly.
      if (this.device.model.indexOf('iPhone10') > -1) {
        this.iPhoneX = true;
      } else {
        this.iPhoneX = false;
      }
      // Check if device is running on android and adjust the scss accordingly.
      if (this.device.platform == 'Android') {
        this.android = true;
      } else {
        this.android = false;
      }
    }).catch(() => { });

    this.toggleDates = [];
    this.subscriptions = [];
    this.partnerId = this.navParams.get('userId');

    // Subscribe to partner user data and sync.
    this.firestore.get('users/' + this.partnerId).then(ref => {
      let subscription = ref.valueChanges().subscribe((user: User) => {
        this.partner = user;
      });
      this.subscriptions.push(subscription);
    }).catch(() => { });

    this.loading.show();
    // Subscribe to user conversation, if a conversation already exists.
    this.firestore.get('users/' + this.partnerId + '/conversations/' + this.auth.getUserData().userId).then(ref => {
      let subscription = ref.valueChanges().subscribe((userConversation: UserConversation) => {
        if (userConversation) {
          // A conversation with this user already exists.
          this.conversationId = userConversation.conversationId;
          this.firestore.get('conversations/' + this.conversationId).then(ref => {
            // Subscribe to conversation and sync.
            let subscription = ref.valueChanges().subscribe((conversation: Conversation) => {
              this.conversation = conversation;
              // Set messagesRead
              if (this.conversation.messages) {
                this.from = this.conversation.messages.length - this.messagesToShow;
                if (this.from < 1) {
                  this.from = 0;
                }
                this.scrollBottom();
                // Update messagesRead of the user.
                this.firestore.get('users/' + this.auth.getUserData().userId + '/conversations/' + this.partnerId).then(ref => {
                  ref.update({
                    messagesRead: this.conversation.messages.length
                  });
                });
              }
            });
            this.subscriptions.push(subscription);
          });
        } else {
          // No conversation exists yet.
          this.conversationId = null;
        }
        this.loading.hide();
      });
      this.subscriptions.push(subscription);
    }).catch(() => {
      this.loading.hide();
    });
  }

  ionViewWillUnload() {
    // Clear subscriptions.
    if (this.subscriptions) {
      for (let i = 0; i < this.subscriptions.length; i++) {
        this.subscriptions[i].unsubscribe();
      }
    }
  }

  keyDownFunction(event) {
    //User pressed return on the keyboard, send the text message.
    if (event.keyCode == 13) {
      this.keyboard.close();
      this.send();
    }
  }

  onRefresh(refresher) {
    //Load more messages depending on numOfMessages.
    if (this.messagesToShow + this.numOfMessages <= this.conversation.messages.length) {
      for (let i = 0; i < this.numOfMessages; i++) {
        this.toggleDates.unshift(false);
      }
      this.messagesToShow += this.numOfMessages;
      // Update the start index of the slice filter.
      this.from = this.conversation.messages.length - this.messagesToShow;
      if (this.from < 1) {
        this.from = 0;
      }
    } else {
      for (let i = 0; i < this.conversation.messages.length - this.messagesToShow; i++) {
        this.toggleDates.unshift(false);
      }
      this.messagesToShow = this.conversation.messages.length;
      // Update the start index of the slice filter.
      this.from = this.conversation.messages.length - this.messagesToShow;
      if (this.from < 1) {
        this.from = 0;
      }
    }
    let self = this;
    setTimeout(() => {
      refresher.complete();
    }, 1000);
  }

  onBlur() {
    // Keeps track of the expanded state of the text area.
    let expanded = this.messageBox['_elementRef'].nativeElement.getElementsByClassName("text-input")[0].style.height;
    if (expanded != this.collapsed) {
      this.expanded = expanded;
    }
    if (!this.message) {
      // Collapsed the expanded text area since the message is cleared.
      let element = this.messageBox['_elementRef'].nativeElement.getElementsByClassName("text-input")[0];
      element.style.height = this.collapsed;
      this.collapsed = null;
      this.expanded = null;
    }
  }

  onFocus() {
    // Expand the text area depending on the length of the message.
    // If the text area is expanded when it lost focus, it will retain the expanded state when focused.
    let element = this.messageBox['_elementRef'].nativeElement.getElementsByClassName("text-input")[0];
    if (this.expanded) {
      element.style.height = this.expanded;
    } else {
      if (!this.collapsed) {
        this.collapsed = this.messageBox['_elementRef'].nativeElement.getElementsByClassName("text-input")[0].style.height;
      }
      element.style.height = this.collapsed;
    }

    this.scrollBottom();
  }

  // Scroll to bottom of the view.
  private scrollBottom(): void {
    let self = this;
    setTimeout(function() {
      self.content.scrollToBottom();
    }, 300);
  }

  // Send photo message either using Photo Gallery, or Camera.
  private attach(): void {
    if (this.network.online()) {
      this.actionSheetCtrl.create({
        title: this.translate.get('chats.message.photo.title'),
        buttons: [
          {
            text: this.translate.get('chats.message.photo.take'),
            role: 'destructive',
            handler: () => {
              // Take a photo and upload.
              this.storage.upload(this.auth.getUserData().userId, this.storage.photoMessage, this.camera.PictureSourceType.CAMERA).then((url: string) => {
                let message = new Message(this.auth.getUserData().userId, 1, url, new Date()).object;
                if (!this.conversationId) {
                  let conversation = new Conversation(null, [message]);
                  // Create a new conversation.
                  this.firestore.getConversations().add(conversation.object).then(ref => {
                    let conversationId = ref.id;
                    // Update user conversations on Firestore.
                    let userConversation = new UserConversation(conversationId, 1);
                    this.firestore.get('conversations/' + conversationId).then(ref => {
                      ref.update(userConversation.object).then(() => {
                        let userConversation = new UserConversation(conversationId, 0);
                        this.firestore.get('users/' + this.partnerId + '/conversations/' + this.auth.getUserData().userId).then(ref => {
                          ref.set(userConversation.object);
                        });
                        this.firestore.get('users/' + this.auth.getUserData().userId + '/conversations/' + this.partnerId).then(ref => {
                          ref.set(userConversation.object);
                        });
                        // Send push notification to the partner.
                        if (this.partner.pushToken) {
                          this.notification.sendPush(this.partner.pushToken, this.auth.getUserData().firstName + ' ' + this.auth.getUserData().lastName, this.translate.get('push.message.photo'), { partnerId: this.auth.getUserData().userId });
                        }
                      }).catch(() => { });
                    }).catch(() => { });
                  }).catch(() => { });
                } else {
                  // Send the photo message.
                  this.conversation.messages.push(message);
                  this.firestore.get('conversations/' + this.conversationId).then(ref => {
                    ref.update({
                      messages: this.conversation.messages
                    }).then(() => {
                      // Send push notification to the partner.
                      if (this.partner.pushToken) {
                        this.notification.sendPush(this.partner.pushToken, this.auth.getUserData().firstName + ' ' + this.auth.getUserData().lastName, this.translate.get('push.message.photo'), { partnerId: this.auth.getUserData().userId });
                      }
                    }).catch(() => { });
                  }).catch(() => { });
                }
              }).catch(() => { });
            }
          },
          {
            text: this.translate.get('chats.message.photo.gallery'),
            handler: () => {
              // Choose a photo from gallery and upload.
              this.storage.upload(this.auth.getUserData().userId, this.storage.photoMessage, this.camera.PictureSourceType.PHOTOLIBRARY).then((url: string) => {
                let message = new Message(this.auth.getUserData().userId, 1, url, new Date()).object;
                if (!this.conversationId) {
                  let conversation = new Conversation(null, [message]);
                  // Create a new conversation.
                  this.firestore.getConversations().add(conversation.object).then(ref => {
                    let conversationId = ref.id;
                    // Update user conversations on Firestore.
                    let userConversation = new UserConversation(conversationId, 1);
                    this.firestore.get('conversations/' + conversationId).then(ref => {
                      ref.update(userConversation.object).then(() => {
                        let userConversation = new UserConversation(conversationId, 0);
                        this.firestore.get('users/' + this.partnerId + '/conversations/' + this.auth.getUserData().userId).then(ref => {
                          ref.set(userConversation.object);
                        });
                        this.firestore.get('users/' + this.auth.getUserData().userId + '/conversations/' + this.partnerId).then(ref => {
                          ref.set(userConversation.object);
                        });
                        // Send push notification to the partner.
                        if (this.partner.pushToken) {
                          this.notification.sendPush(this.partner.pushToken, this.auth.getUserData().firstName + ' ' + this.auth.getUserData().lastName, this.translate.get('push.message.photo'), { partnerId: this.auth.getUserData().userId });
                        }
                      }).catch(() => { });
                    }).catch(() => { });
                  }).catch(() => { });
                } else {
                  // Send the photo message.
                  this.conversation.messages.push(message);
                  this.firestore.get('conversations/' + this.conversationId).then(ref => {
                    ref.update({
                      messages: this.conversation.messages
                    }).then(() => {
                      // Send push notification to the partner.
                      if (this.partner.pushToken) {
                        this.notification.sendPush(this.partner.pushToken, this.auth.getUserData().firstName + ' ' + this.auth.getUserData().lastName, this.translate.get('push.message.photo'), { partnerId: this.auth.getUserData().userId });
                      }
                    }).catch(() => { });
                  }).catch(() => { });
                }
              }).catch(() => { });
            }
          },
          {
            text: this.translate.get('chats.message.photo.cancel'),
            role: 'cancel',
            handler: () => { }
          }
        ]
      }).present();
    }
  }

  private send(): void {
    if (this.network.online() && this.message && this.message.length > 0) {
      let text = this.message;
      let message = new Message(this.auth.getUserData().userId, 0, this.message, new Date()).object;
      this.message = '';
      // Collapse the expanded text area.
      let element = this.messageBox['_elementRef'].nativeElement.getElementsByClassName("text-input")[0];
      element.style.height = this.collapsed;
      this.collapsed = null;
      this.expanded = null;
      if (!this.conversationId) {
        let conversation = new Conversation(null, [message]);
        // Create a new conversation.
        this.firestore.getConversations().add(conversation.object).then(ref => {
          let conversationId = ref.id;
          let userConversation = new UserConversation(conversationId, 1);
          // Update user conversations on Firestore.
          this.firestore.get('conversations/' + conversationId).then(ref => {
            ref.update(userConversation.object).then(() => {
              let userConversation = new UserConversation(conversationId, 0);
              this.firestore.get('users/' + this.partnerId + '/conversations/' + this.auth.getUserData().userId).then(ref => {
                ref.set(userConversation.object);
              });
              this.firestore.get('users/' + this.auth.getUserData().userId + '/conversations/' + this.partnerId).then(ref => {
                ref.set(userConversation.object);
              });
              // Send push notification to partner.
              if (this.partner.pushToken) {
                this.notification.sendPush(this.partner.pushToken, this.auth.getUserData().firstName + ' ' + this.auth.getUserData().lastName, text, { partnerId: this.auth.getUserData().userId });
              }
            }).catch(() => { });
          }).catch(() => { });
        }).catch(() => { });
      } else {
        // Send the message.
        this.conversation.messages.push(message);
        this.firestore.get('conversations/' + this.conversationId).then(ref => {
          ref.update({
            messages: this.conversation.messages
          }).then(() => {
            // Send push notification to partner.
            if (this.partner.pushToken) {
              this.notification.sendPush(this.partner.pushToken, this.auth.getUserData().firstName + ' ' + this.auth.getUserData().lastName, text, { partnerId: this.auth.getUserData().userId });
            }
          }).catch(() => { });
        }).catch(() => { });
      }
    }
  }

  // View Profile of the user given the userId.
  private viewProfile(userId: string): void {
    let modal = this.modalCtrl.create('ViewProfilePage', { userId: userId });
    modal.present();
    modal.onDidDismiss((userId: string) => {
      if (userId && userId != this.partnerId) {
        this.modalCtrl.create('ChatPage', { userId: userId }).present();
      }
    });
  }

  // Show/hide date when the message was sent.
  private toggleDate(index: number, last: boolean): void {
    if (this.toggleDates[index]) {
      this.toggleDates[index] = !this.toggleDates[index];
    } else {
      this.toggleDates[index] = true;
    }
    if (last) {
      this.scrollBottom();
    }
  }

  // Use the photoViewer to show an expanded version of the image message.
  private viewImage(url: string): void {
    if (this.network.online()) {
      this.photoViewer.show(url);
    }
  }
}
