import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ActionSheetController, AlertController, ModalController, Platform } from 'ionic-angular';
import { Subscription } from 'rxjs/Subscription';
import { User, Group } from '../../../models';
import { FirestoreProvider, AuthProvider, LoadingProvider, TranslateProvider, NetworkProvider, StorageProvider, AlertProvider } from '../../../providers';
import { Device } from '@ionic-native/device';

@IonicPage()
@Component({
  selector: 'page-group-members',
  templateUrl: 'group-members.html',
})
export class GroupMembersPage {
  private iPhoneX: boolean;
  private group: Group;
  private subscriptions: Subscription[];
  private users: User[];
  private groupId: string;
  private searchUser: string;
  private excludedIds: string[];

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
    }).catch(() => { });

    this.subscriptions = [];
    this.excludedIds = [];

    this.groupId = this.navParams.get('groupId');
    this.loading.show();
    // Subscribe to group on Firestore and sync.
    this.firestore.get('groups/' + this.groupId).then(ref => {
      let subscription = ref.valueChanges().subscribe((group: Group) => {
        if (group) {
          this.group = group;
          // Sync the members of the group.
          this.setUsers();
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

  // Subscribe to the members of the group.
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

  private remove(user: User): void {
    // Confirm if the user wants to remove this member from the group.
    this.alert.showConfirm(this.translate.get('group.alert.remove.title'),
      this.translate.get('group.alert.remove.text') + ' <b>' + user.firstName + ' ' + user.lastName + '</b>?',
      this.translate.get('group.alert.remove.button.cancel'),
      this.translate.get('group.alert.remove.button.remove')).then(confirm => {
        if (confirm) {
          // Remove the userGroup reference on Firestore.
          this.firestore.get('users/' + user.userId + '/groups/' + this.groupId).then(ref => {
            ref.delete();
          });
          // Update group members on Firestore.
          this.group.members.splice(this.group.members.indexOf(user.userId), 1);
          this.firestore.get('groups/' + this.groupId).then(ref => {
            ref.update({
              members: this.group.members
            }).then(() => { }).catch(() => { });
          }).catch(() => { });
        }
      }).catch(() => { });
  }

}
