import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController, Platform } from 'ionic-angular';
import { TranslateProvider, FirestoreProvider, AuthProvider, LoadingProvider, NetworkProvider, NotificationProvider } from '../../../providers';
import { User } from '../../../models';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { Device } from '@ionic-native/device';

@IonicPage()
@Component({
  selector: 'page-search-contact',
  templateUrl: 'search-contact.html',
})
export class SearchContactPage {
  private android: boolean;
  private searchUser: string;
  private users: User[];
  private user: User;
  private excludedIds: string[];
  // Show only 10 users initially, and show 10 more users via infinite scroll.
  private usersToShow: number = 10;
  private subscriptions: Subscription[];

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private modalCtrl: ModalController,
    private translate: TranslateProvider,
    private firestore: FirestoreProvider,
    private loading: LoadingProvider,
    private auth: AuthProvider,
    private network: NetworkProvider,
    private notification: NotificationProvider,
    private platform: Platform,
    private device: Device) {
  }

  ionViewWillEnter() {
    this.platform.ready().then(() => {
      // Check if device is running on android and adjust the scss accordingly.
      if (this.device.platform == 'Android') {
        this.android = true;
      } else {
        this.android = false;
      }
    }).catch(() => { });

    this.subscriptions = [];

    // Subscribe to all users on Firestore and sync.
    let subscription = this.firestore.getUsers().valueChanges().subscribe((users: User[]) => {
      this.users = users;
    });
    this.subscriptions.push(subscription);
    // Subscribe to current user.
    this.firestore.get('users/' + this.auth.getUserData().userId).then(ref => {
      let subscription = ref.valueChanges().subscribe((user: User) => {
        this.user = user;
        // Set excludedIds. Do not show current user and user's contacts.
        this.excludedIds = [this.user.userId];
        if (this.user.contacts) {
          for (let i = 0; i < this.user.contacts.length; i++) {
            this.excludedIds.push(this.user.contacts[i]);
          }
        }
      });
      this.subscriptions.push(subscription);
    }).catch(() => { });
  }

  ionViewWillUnload() {
    // Unsubscribe to Subscriptions.
    if (this.subscriptions) {
      for (let i = 0; i < this.subscriptions.length; i++) {
        this.subscriptions[i].unsubscribe();
      }
    }
  }

  // Called when infinite scroll is triggered.
  doInfinite(): Promise<any> {
    return new Promise(resolve => {
      setTimeout(() => {
        // Show 10 more users on the list.
        this.usersToShow += 10;
        resolve();
      }, 500);
    })
  }

  // View Profile of the user given the userId.
  private viewProfile(userId: string): void {
    let modal = this.modalCtrl.create('ViewProfilePage', { userId: userId });
    modal.present();
    modal.onDidDismiss((userId: string) => {
      if (userId) {

      }
    });
  }

  // Return the status of the request between the logged in user and the user viewed.
  private getRequestStatus(user: User): number {
    //0 -> Can be requested | 1 -> Request is pending | 2 -> Sent a contact request
    if (user) {
      if (user.requestsReceived && user.requestsReceived.indexOf(this.auth.getUserData().userId) > -1) {
        return 1;
      } else if (user.requestsSent && user.requestsSent.indexOf(this.auth.getUserData().userId) > -1) {
        return 2;
      } else {
        return 0;
      }
    }
    return 0;
  }

  // Send a contact request to the user.
  private sendRequest(user: User): void {
    this.loading.show();
    this.firestore.sendRequest(this.auth.getUserData().userId, user.userId).then(() => {
      // Send a push notification to the user.
      if (user.notifications) {
        this.notification.sendPush(user.pushToken, this.auth.getUserData().firstName + ' ' + this.auth.getUserData().lastName, this.translate.get('push.contact.sent'), { newRequest: true });
      }
      this.loading.hide();
    }).catch(() => {
      this.loading.hide();
    });
  }

  // Cancel a pending contact request to the user.
  private cancelRequest(userId: string): void {
    this.loading.show();
    this.firestore.cancelRequest(this.auth.getUserData().userId, userId).then(() => {
      this.loading.hide();
    }).catch(() => {
      this.loading.hide();
    });
  }

  // Reject a contact request received.
  private rejectRequest(userId: string): void {
    this.loading.show();
    this.firestore.cancelRequest(userId, this.auth.getUserData().userId).then(() => {
      this.loading.hide();
    }).catch(() => {
      this.loading.hide();
    });
  }

  // Accept the contact request received.
  private acceptRequest(user: User): void {
    this.loading.show();
    this.firestore.acceptRequest(user.userId, this.auth.getUserData().userId).then(() => {
      // Send a push notification to the user.
      if (user.notifications) {
        this.notification.sendPush(user.pushToken, this.auth.getUserData().firstName + ' ' + this.auth.getUserData().lastName, this.translate.get('push.contact.accepted'), { newContact: true });
      }
      this.loading.hide();
    }).catch(() => {
      this.loading.hide();
    });
  }
}
