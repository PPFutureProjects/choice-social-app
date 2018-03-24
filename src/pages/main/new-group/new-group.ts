import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, Platform } from 'ionic-angular';
import { TranslateProvider, FirestoreProvider, AuthProvider, NetworkProvider } from '../../../providers';
import { User } from '../../../models';
import { Subscription } from 'rxjs/Subscription';
import { Device } from '@ionic-native/device';

@IonicPage()
@Component({
  selector: 'page-new-group',
  templateUrl: 'new-group.html',
})
export class NewGroupPage {
  private android: boolean;
  private contacts: User[];
  private user: User;
  private searchUser: string;
  private subscriptions: Subscription[];
  private excludedIds: string[];
  private members: string[];

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private translate: TranslateProvider,
    private firestore: FirestoreProvider,
    private auth: AuthProvider,
    private viewCtrl: ViewController,
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
    this.excludedIds = [];
    this.members = [this.auth.getUserData().userId];

    // Subscribe to user data on Firestore and sync.
    this.firestore.get('users/' + this.auth.getUserData().userId).then(ref => {
      let subscription = ref.valueChanges().subscribe((user: User) => {
        this.user = user;
        // Get the user's contacts and sync.
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

  // Add or update contact data to sync with Firestore.
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

  // Add user from members to be added to the group.
  private add(userId: string): void {
    this.members.push(userId);
  }

  // Remove user from members to be added to the group.
  private remove(userId: string): void {
    this.members.splice(this.members.indexOf(userId), 1);
  }

  // Add or remove user from members to be added to the group.
  private toggle(userId: string): void {
    if (this.network.online() && this.members.indexOf(userId) > -1) {
      this.members.splice(this.members.indexOf(userId), 1);
    } else {
      this.members.push(userId);
    }
  }

  // Proceed with new group.
  private done(): void {
    this.viewCtrl.dismiss({ members: this.members }).then(() => { });
  }

}
