import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController, Platform } from 'ionic-angular';
import { TranslateProvider, FirestoreProvider, AuthProvider, AlertProvider, LoadingProvider, NetworkProvider } from '../../../providers';
import { User, Group, UserGroup } from '../../../models';
import { Subscription } from 'rxjs/Subscription';
import { Device } from '@ionic-native/device';

@IonicPage()
@Component({
  selector: 'page-add-member',
  templateUrl: 'add-member.html',
})
export class AddMemberPage {
  private android: boolean;
  private contacts: User[];
  private user: User;
  private searchUser: string;
  private subscriptions: Subscription[];
  private excludedIds: string[];
  private toAdd: string[];
  private groupId: string;
  private members: string[];

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private translate: TranslateProvider,
    private firestore: FirestoreProvider,
    private auth: AuthProvider,
    private alert: AlertProvider,
    private loading: LoadingProvider,
    private modalCtrl: ModalController,
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

    this.toAdd = [];
    this.subscriptions = [];
    this.groupId = this.navParams.get('groupId');
    // Retrieve group data from Firestore and sync.
    this.firestore.get('groups/' + this.groupId).then(ref => {
      let subscription = ref.valueChanges().subscribe((group: Group) => {
        this.members = group.members;
        this.excludedIds = [];
        // Add group members to excludedIds so they won't show up on the list using the Pipe/Filter.
        for (let i = 0; i < group.members.length; i++) {
          this.excludedIds.push(group.members[i]);
        }
        // The current user is removed from the group or group has been deleted, pop the view.
        if (this.members.indexOf(this.auth.getUserData().userId) == -1) {
          this.navCtrl.pop();
        }
      });
      this.subscriptions.push(subscription);
    });

    this.loading.show();
    // Retrieve user data from Firestore and sync.
    this.firestore.get('users/' + this.auth.getUserData().userId).then(ref => {
      let subscription = ref.valueChanges().subscribe((user: User) => {
        this.user = user;
        // Subscribe to user's contacts and sync.
        if (this.user.contacts) {
          for (let i = 0; i < this.user.contacts.length; i++) {
            this.firestore.get('users/' + this.user.contacts[i]).then(ref => {
              let subscription = ref.valueChanges().subscribe((user: User) => {
                this.addOrUpdateContact(user);
              });
              this.subscriptions.push(subscription);
            });
          }
        } else {
          this.contacts = null;
        }
        this.loading.hide();
      });
      this.subscriptions.push(subscription);
    }).catch(() => { });
  }

  ionViewWillUnload() {
    // Clear subscriptions.
    if (this.subscriptions) {
      for (let i = 0; i < this.subscriptions.length; i++) {
        this.subscriptions[i].unsubscribe();
      }
    }
  }

  // Add or update user data to sync with Firestore.
  private addOrUpdateContact(user: User): void {
    if (this.contacts) {
      let index = -1;
      for (let i = 0; i < this.contacts.length; i++) {
        if (user.userId == this.contacts[i].userId) {
          index = i;
        }
      }
      if (index > -1) {
        this.contacts[index] = user;
      }
      else {
        this.contacts.push(user);
      }
    } else {
      this.contacts = [user];
    }
  }

  // Add or remove user from the members to be added to the group.
  private toggle(userId: string): void {
    if (this.toAdd.indexOf(userId) == -1) {
      this.toAdd.push(userId);
    } else {
      this.toAdd.splice(this.toAdd.indexOf(userId), 1);
    }
  }

  // Add the selected contacts to the group.
  private done(): void {
    // Confirm if the user really want to add the contacts to the group.
    this.alert.showConfirm(this.translate.get('group.alert.add.member.title'),
      this.translate.get('group.alert.add.member.text'),
      this.translate.get('group.alert.add.button.cancel'),
      this.translate.get('group.alert.add.button.add')).then(confirm => {
        if (confirm) {
          // For each member add group data on Firestore.
          for (let i = 0; i < this.toAdd.length; i++) {
            let userId = this.toAdd[i];
            let userGroup = new UserGroup(this.groupId, 0);
            this.firestore.get('users/' + userId + '/groups/' + this.groupId).then(ref => {
              ref.set(userGroup.object);
            });
            if (this.members.indexOf(userId) == -1)
              this.members.push(userId);
          }
          // Update group data on Firestore.
          this.firestore.get('groups/' + this.groupId).then(ref => {
            ref.update({
              members: this.members
            }).then(() => { }).catch(() => { });
          }).catch(() => { });
          this.toAdd = [];
        }
      }).catch(() => { });
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
}
