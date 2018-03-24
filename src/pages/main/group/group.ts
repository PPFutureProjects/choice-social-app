import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, NavController, NavParams, Content, Platform, ActionSheetController, ModalController } from 'ionic-angular';
import { TranslateProvider, FirestoreProvider, AuthProvider, StorageProvider, LoadingProvider, NetworkProvider, NotificationProvider } from '../../../providers';
import { Group, Message, User, UserGroup } from '../../../models';
import { Subscription } from 'rxjs/Subscription';
import { Device } from '@ionic-native/device';
import { Keyboard } from '@ionic-native/keyboard';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { PhotoViewer } from '@ionic-native/photo-viewer';

@IonicPage()
@Component({
  selector: 'page-group',
  templateUrl: 'group.html',
})
export class GroupPage {
  private android: boolean;
  private iPhoneX: boolean;
  @ViewChild(Content) content: Content;
  @ViewChild('messageBox') messageBox: ElementRef;
  private subscriptions: Subscription[];

  private memberIds: string[];
  private title: string;
  private members: Map<string, User>;
  private pushTokens: Map<string, string>;

  private groupId: string;
  private group: Group;

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
    private photoViewer: PhotoViewer,
    private network: NetworkProvider,
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
    this.members = new Map<string, User>();
    this.pushTokens = new Map<string, string>();

    this.memberIds = this.navParams.get('members');

    this.title = '';
    for (let i = 0; i < this.memberIds.length; i++) {
      let userId = this.memberIds[i];
      this.firestore.get('users/' + userId).then(ref => {
        let subscription = ref.valueChanges().subscribe((user: User) => {
          // Set the user to the members Map.
          this.members.set(userId, user);
          // Set the pushToken to the pushTokens Map.
          if (user.notifications) {
            this.pushTokens.set(userId, user.pushToken);
          }
          // Set the default group title to the member's firstNames.
          if (i + 1 < this.memberIds.length)
            this.title += user.firstName + ', ';
          else
            this.title += user.firstName;
        });
        this.subscriptions.push(subscription);
      }).catch(() => { });
    }

    if (!this.groupId) {
      this.groupId = this.navParams.get('groupId');
    }

    if (this.groupId) {
      this.loading.show();
      // Subscribe to the group and sync the data from Firestore.
      this.firestore.get('groups/' + this.groupId).then(ref => {
        let subscription = ref.valueChanges().subscribe((group: Group) => {
          if (group) {
            this.group = group;
            this.title = this.group.title;
            if (this.group.messages) {
              // Update the start index of the slice filter.
              this.from = this.group.messages.length - this.messagesToShow;
              if (this.from < 1) {
                this.from = 0;
              }
              this.scrollBottom();
              // Subscribe to participants, participants are those who have sent atleast one message to the group.
              // members Map is used to keep track of participants.
              for (let i = 0; i < this.group.participants.length; i++) {
                if (!this.members.get(this.group.participants[i])) {
                  this.firestore.get('users/' + this.group.participants[i]).then(ref => {
                    let subscription = ref.valueChanges().subscribe((user: User) => {
                      this.members.set(this.group.messages[i].sender, user);
                    });
                    this.subscriptions.push(subscription);
                  }).catch(() => { });
                }
              }
              // Subscribe to all members of the group, and keep track of their pushTokens using pushTokens map.
              // This is used for Push Notifications.
              for (let i = 0; i < this.group.members.length; i++) {
                if (!this.pushTokens.get(this.group.members[i])) {
                  this.firestore.get('users/' + this.group.members[i]).then(ref => {
                    let subscription = ref.valueChanges().subscribe((user: User) => {
                      if (user.notifications) {
                        this.pushTokens.set(this.group.members[i], user.pushToken);
                      }
                    });
                    this.subscriptions.push(subscription);
                  }).catch(() => { });
                }
              }
              // Check if user is a member of the group, and update messagesRead.
              if (this.group.members.indexOf(this.auth.getUserData().userId) > -1) {
                this.firestore.get('users/' + this.auth.getUserData().userId + '/groups/' + this.groupId).then(ref => {
                  ref.update({
                    messagesRead: this.group.messages.length
                  });
                });
              } else {
                // User is not part of the group they may have been kicked or left the group, pop this view.
                this.navCtrl.pop();
              }
            }
          } else {
            // Group doesn't exist, means the group is deleted, pop the view.
            this.navCtrl.pop();
          }
          this.loading.hide();
        });
        this.subscriptions.push(subscription);
      }).catch(() => {
        this.loading.hide();
      });
    }
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
    if (this.messagesToShow + this.numOfMessages <= this.group.messages.length) {
      for (let i = 0; i < this.numOfMessages; i++) {
        this.toggleDates.unshift(false);
      }
      this.messagesToShow += this.numOfMessages;
      // Update the start index of the slice filter.
      this.from = this.group.messages.length - this.messagesToShow;
      if (this.from < 1) {
        this.from = 0;
      }
    } else {
      for (let i = 0; i < this.group.messages.length - this.messagesToShow; i++) {
        this.toggleDates.unshift(false);
      }
      this.messagesToShow = this.group.messages.length;
      // Update the start index of the slice filter.
      this.from = this.group.messages.length - this.messagesToShow;
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
                if (!this.groupId) {
                  // Create a new group.
                  let group = new Group(null, this.title, null, this.memberIds, [message], [this.auth.getUserData().userId]);
                  this.firestore.getGroups().add(group.object).then(ref => {
                    let groupId = ref.id;
                    ref.update({
                      groupId: groupId
                    });
                    // For each members, update user groups and send push notification on Firestore.
                    for (let i = 0; i < this.memberIds.length; i++) {
                      let userId = this.memberIds[i];
                      let userGroup;
                      if (i == 0) {
                        userGroup = new UserGroup(groupId, 1);
                      } else {
                        userGroup = new UserGroup(groupId, 0);
                      }
                      this.firestore.get('users/' + userId + '/groups/' + groupId).then(ref => {
                        ref.set(userGroup.object);
                      });
                      // Send push notifications to the members of the group (except the current user).
                      if (this.pushTokens.get(userId) && userId != this.auth.getUserData().userId) {
                        this.notification.sendPush(this.pushTokens.get(userId), this.title, this.auth.getUserData().firstName + ' ' + this.translate.get('push.message.photo'), { groupId: groupId });
                      }
                    }
                    this.groupId = groupId;
                    this.ionViewDidLoad();
                  }).catch(() => { });
                } else {
                  // Send the photo message.
                  this.group.messages.push(message);
                  // Update the participants to keep track of users who sent atleast one message.
                  if (this.group.participants.indexOf(this.auth.getUserData().userId) == -1) {
                    this.group.participants.push(this.auth.getUserData().userId);
                  }
                  this.firestore.get('groups/' + this.groupId).then(ref => {
                    ref.update({
                      messages: this.group.messages,
                      participants: this.group.participants
                    }).then(() => {
                      // Send push notifications to the members of the group (except the current user).
                      for (let i = 0; i < this.group.members.length; i++) {
                        let userId = this.group.members[i];
                        if (this.pushTokens.get(userId) && userId != this.auth.getUserData().userId) {
                          this.notification.sendPush(this.pushTokens.get(userId), this.group.title, this.auth.getUserData().firstName + ' ' + this.translate.get('push.message.photo'), { groupId: this.groupId });
                        }
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
                if (!this.groupId) {
                  // Create a new group.
                  let group = new Group(null, this.title, null, this.memberIds, [message], [this.auth.getUserData().userId]);
                  this.firestore.getGroups().add(group.object).then(ref => {
                    let groupId = ref.id;
                    ref.update({
                      groupId: groupId
                    });
                    // For each members, update user groups and send push notification on Firestore.
                    for (let i = 0; i < this.memberIds.length; i++) {
                      let userId = this.memberIds[i];
                      let userGroup;
                      if (i == 0) {
                        userGroup = new UserGroup(groupId, 1);
                      } else {
                        userGroup = new UserGroup(groupId, 0);
                      }
                      this.firestore.get('users/' + userId + '/groups/' + groupId).then(ref => {
                        ref.set(userGroup.object);
                      });
                      // Send push notifications to the members of the group (except the current user).
                      if (this.pushTokens.get(userId) && userId != this.auth.getUserData().userId) {
                        this.notification.sendPush(this.pushTokens.get(userId), this.title, this.auth.getUserData().firstName + ' ' + this.translate.get('push.message.photo'), { groupId: groupId });
                      }
                    }
                    this.groupId = groupId;
                    this.ionViewDidLoad();
                  }).catch(() => { });
                } else {
                  // Send the photo message.
                  this.group.messages.push(message);
                  // Update the participants to keep track of users who sent atleast one message.
                  if (this.group.participants.indexOf(this.auth.getUserData().userId) == -1) {
                    this.group.participants.push(this.auth.getUserData().userId);
                  }
                  this.firestore.get('groups/' + this.groupId).then(ref => {
                    ref.update({
                      messages: this.group.messages,
                      participants: this.group.participants
                    }).then(() => {
                      // Send push notifications to the members of the group (except the current user).
                      for (let i = 0; i < this.group.members.length; i++) {
                        let userId = this.group.members[i];
                        if (this.pushTokens.get(userId) && userId != this.auth.getUserData().userId) {
                          this.notification.sendPush(this.pushTokens.get(userId), this.group.title, this.auth.getUserData().firstName + ' ' + this.translate.get('push.message.photo'), { groupId: this.groupId });
                        }
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
      if (!this.groupId) {
        let group = new Group(null, this.title, null, this.memberIds, [message], [this.auth.getUserData().userId]);
        // Create a new group.
        this.firestore.getGroups().add(group.object).then(ref => {
          let groupId = ref.id;
          ref.update({
            groupId: groupId
          });
          // For each members, update user groups and send push notification on Firestore.
          for (let i = 0; i < this.memberIds.length; i++) {
            let userId = this.memberIds[i];
            let userGroup;
            if (i == 0) {
              userGroup = new UserGroup(groupId, 1);
            } else {
              userGroup = new UserGroup(groupId, 0);
            }
            this.firestore.get('users/' + userId + '/groups/' + groupId).then(ref => {
              ref.set(userGroup.object);
            });
            // Send push notifications to the members of the group (except the current user).
            if (this.pushTokens.get(userId) && userId != this.auth.getUserData().userId) {
              this.notification.sendPush(this.pushTokens.get(userId), this.title, this.auth.getUserData().firstName + ': ' + text, { groupId: groupId });
            }
          }
          this.groupId = groupId;
          this.ionViewDidLoad();
        }).catch(() => { });
      } else {
        // Send the text message.
        this.group.messages.push(message);
        // Update the participants to keep track of users who sent atleast one message.
        if (this.group.participants.indexOf(this.auth.getUserData().userId) == -1) {
          this.group.participants.push(this.auth.getUserData().userId);
        }
        this.firestore.get('groups/' + this.groupId).then(ref => {
          ref.update({
            messages: this.group.messages,
            participants: this.group.participants
          }).then(() => {
            // Send push notifications to the members of the group (except the current user).
            for (let i = 0; i < this.group.members.length; i++) {
              let userId = this.group.members[i];
              if (this.pushTokens.get(userId) && userId != this.auth.getUserData().userId) {
                this.notification.sendPush(this.pushTokens.get(userId), this.group.title, this.auth.getUserData().firstName + ': ' + text, { groupId: this.groupId });
              }
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
      if (userId) {
        this.navCtrl.push('ChatPage', { userId: userId });
      }
    });
  }

  // View Group given the groupId.
  private viewGroup(groupId: string): void {
    let modal = this.modalCtrl.create('GroupInfoPage', { groupId: groupId });
    modal.present();
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
