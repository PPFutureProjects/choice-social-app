import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ActionSheetController, AlertController, ModalController, Platform } from 'ionic-angular';
import { Subscription } from 'rxjs/Subscription';
import { User, Group } from '../../../models';
import { FirestoreProvider, AuthProvider, LoadingProvider, TranslateProvider, NetworkProvider, StorageProvider, AlertProvider } from '../../../providers';
import { Camera } from '@ionic-native/camera';
import { Device } from '@ionic-native/device';

@IonicPage()
@Component({
  selector: 'page-group-info',
  templateUrl: 'group-info.html',
})
export class GroupInfoPage {
  private android: boolean;
  private iPhoneX: boolean;
  private group: Group;
  private subscriptions: Subscription[];
  private users: User[];
  private groupId: string;

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private firestore: FirestoreProvider,
    private auth: AuthProvider,
    private loading: LoadingProvider,
    private translate: TranslateProvider,
    private network: NetworkProvider,
    private storage: StorageProvider,
    private actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private camera: Camera,
    private alert: AlertProvider,
    private platform: Platform,
    private device: Device) {
  }

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

    this.subscriptions = [];

    if (!this.groupId) {
      this.groupId = this.navParams.get('groupId');
    }

    this.loading.show();
    // Subscribe to group from Firestore and sync.
    this.firestore.get('groups/' + this.groupId).then(ref => {
      let subscription = ref.valueChanges().subscribe((group: Group) => {
        if (group) {
          this.group = group;
          this.setUsers();
          // Check if user is a member of the group, if not, pop the view.
          if (this.group.members.indexOf(this.auth.getUserData().userId) == -1) {
            this.navCtrl.pop();
          }
        } else {
          // Group is deleted, pop the view.
          this.navCtrl.pop();
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

  // Subscribe to members of the group.
  private setUsers(): void {
    this.users = [];
    for (let i = 0; i < this.group.members.length; i++) {
      let userId = this.group.members[i];
      this.firestore.get('users/' + userId).then(ref => {
        let subscription = ref.valueChanges().subscribe((user: User) => {
          this.addOrUpdateUser(user);
        });
        this.subscriptions.push(subscription);
      }).catch(() => { });
    }
  }

  // Add or update user data to sync with Firestore.
  private addOrUpdateUser(user: User): void {
    if (this.users) {
      let index = -1;
      for (let i = 0; i < this.users.length; i++) {
        if (user.userId == this.users[i].userId) {
          index = i;
        }
      }
      if (index > -1) {
        this.users[index] = user;
      }
      else {
        this.users.push(user);
      }
    } else {
      this.users = [user];
    }
  }

  private setPhoto(): void {
    // Allow member to upload and set the group photo using their camera or photo gallery.
    if (this.network.online()) {
      this.actionSheetCtrl.create({
        title: this.translate.get('group.photo.title'),
        buttons: [
          {
            text: this.translate.get('auth.profile.photo.take'),
            role: 'destructive',
            handler: () => {
              // Take a photo.
              this.storage.upload(this.groupId, this.storage.profilePhoto, this.camera.PictureSourceType.CAMERA).then((url: string) => {
                let toDelete = this.group.photo;
                this.group.photo = url;
                // Update group photo on Firestore.
                this.firestore.get('groups/' + this.groupId).then(ref => {
                  ref.update({
                    photo: url
                  });
                });
                // Delete old group photo.
                this.storage.delete(this.groupId, toDelete);
              }).catch(() => { });
            }
          },
          {
            text: this.translate.get('auth.profile.photo.gallery'),
            handler: () => {
              // Choose from photo gallery.
              this.storage.upload(this.groupId, this.storage.profilePhoto, this.camera.PictureSourceType.PHOTOLIBRARY).then((url: string) => {
                let toDelete = this.group.photo;
                this.group.photo = url;
                // Update group photo on Firestore.
                this.firestore.get('groups/' + this.groupId).then(ref => {
                  ref.update({
                    photo: url
                  });
                });
                // Delete old group photo.
                this.storage.delete(this.groupId, toDelete);
              }).catch(() => { });
            }
          },
          {
            text: this.translate.get('auth.profile.photo.cancel'),
            role: 'cancel',
            handler: () => { }
          }
        ]
      }).present();
    }
  }

  private setTitle(): void {
    // Allow user to change the group title.
    if (this.network.online()) {
      let alert = this.alertCtrl.create({
        title: this.translate.get('group.set.title'),
        inputs: [
          {
            name: 'title',
            placeholder: this.translate.get('group.set.group.title'),
            type: 'text',
            value: this.group.title
          }
        ],
        buttons: [
          {
            text: this.translate.get('auth.profile.password.button.cancel'),
            role: 'cancel',
            handler: data => { }
          },
          {
            text: this.translate.get('auth.profile.password.button.save'),
            handler: data => {
              // Check if the user has entered a group title.
              if (data.title) {
                this.loading.show();
                // Update group data on Firestore.
                this.firestore.get('groups/' + this.groupId).then(ref => {
                  ref.update({
                    title: data.title
                  }).then(() => {
                    this.loading.hide();
                  });
                });
              } else {
                return false;
              }
            }
          }
        ]
      });
      alert.present();
    }
  }

  // View Profile of the user given the userId.
  private viewProfile(userId: string): void {
    let modal = this.modalCtrl.create('ViewProfilePage', { userId: userId });
    modal.present();
    modal.onDidDismiss((userId: string) => {
      if (userId) {
        this.modalCtrl.create('ChatPage', { userId: userId }).present();
      }
    });
  }

  private leave(): void {
    // Confirm if the user wants to leave the group.
    this.alert.showConfirm(this.translate.get('group.alert.leave.title'),
      this.translate.get('group.alert.leave.text') + ' <b>' + this.group.title + '</b>?',
      this.translate.get('group.alert.leave.button.cancel'),
      this.translate.get('group.alert.leave.button.leave')).then(confirm => {
        if (confirm) {
          let userId = this.auth.getUserData().userId;
          // Remove the userGroups reference of the user.
          this.firestore.get('users/' + userId + '/groups/' + this.groupId).then(ref => {
            ref.delete();
          });
          // Update group members on Firestore.
          this.group.members.splice(this.group.members.indexOf(userId), 1);
          this.firestore.get('groups/' + this.groupId).then(ref => {
            ref.update({
              members: this.group.members
            }).then(() => { }).catch(() => { });
          }).catch(() => { });
        }
      }).catch(() => { });
  }

  private delete(): void {
    // Confirm if the user wants to delete the group.
    this.alert.showConfirm(this.translate.get('group.alert.delete.title'),
      this.translate.get('group.alert.delete.text') + ' <b>' + this.group.title + '</b>?',
      this.translate.get('group.alert.delete.button.cancel'),
      this.translate.get('group.alert.delete.button.delete')).then(confirm => {
        if (confirm) {
          // Delete all image messages on storage.
          for (let i = 0; i < this.group.messages.length; i++) {
            let message = this.group.messages[i];
            if (message.type == 1) {
              this.storage.delete(message.sender, message.message);
            }
          }
          // Remove the userGroups reference of the user.
          this.firestore.get('users/' + this.auth.getUserData().userId + '/groups/' + this.groupId).then(ref => {
            ref.delete().then(() => {
              // Delete group on Firestore.
              this.firestore.get('groups/' + this.groupId).then(ref => {
                ref.delete().then(() => {
                  this.group = null;
                });
              });
            });
          });
        }
      }).catch(() => { });
  }
}
