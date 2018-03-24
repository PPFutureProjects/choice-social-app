import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, App, ModalController, Platform } from 'ionic-angular';
import { TranslateProvider, FirestoreProvider, AuthProvider, NetworkProvider } from '../../../providers';
import { User } from '../../../models';
import { Subscription } from 'rxjs/Subscription';
import { Device } from '@ionic-native/device';

@IonicPage()
@Component({
  selector: 'page-contacts',
  templateUrl: 'contacts.html',
})
export class ContactsPage {
  private android: boolean;
  private contacts: User[];
  private user: User;
  private searchUser: string;
  private subscriptions: Subscription[];
  private excludedIds: string[];

  constructor(public navCtrl: NavController,
    private app: App,
    private modalCtrl: ModalController,
    private navParams: NavParams,
    private translate: TranslateProvider,
    private firestore: FirestoreProvider,
    private auth: AuthProvider,
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
    // Clear the subscriptions.
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

  // View Profile of the user given the userId.
  private viewProfile(userId: string): void {
    let modal = this.modalCtrl.create('ViewProfilePage', { userId: userId });
    modal.present();
    modal.onDidDismiss((userId: string) => {
      if (userId) {
        this.app.getRootNavs()[0].push('ChatPage', { userId: userId });
      }
    });
  }

  // Open the chat with the user given the userId.
  private chat(userId: string): void {
    this.app.getRootNavs()[0].push('ChatPage', { userId: userId });
  }

}
