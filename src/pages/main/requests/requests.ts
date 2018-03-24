import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController } from 'ionic-angular';
import { TranslateProvider, FirestoreProvider, AuthProvider, LoadingProvider, NetworkProvider, NotificationProvider } from '../../../providers';
import { User } from '../../../models';
import { Subscription } from 'rxjs/Subscription';

@IonicPage()
@Component({
  selector: 'page-requests',
  templateUrl: 'requests.html',
})
export class RequestsPage {
  private received: User[];
  private sent: User[];
  private user: User;
  private subscriptions: Subscription[];

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private modalCtrl: ModalController,
    private translate: TranslateProvider,
    private firestore: FirestoreProvider,
    private auth: AuthProvider,
    private loading: LoadingProvider,
    private network: NetworkProvider,
    private notification: NotificationProvider) {
  }

  ionViewWillEnter() {
    this.subscriptions = [];
    // Subscribe to user on Firestore and sync.
    this.firestore.get('users/' + this.auth.getUserData().userId).then(ref => {
      let subscription = ref.valueChanges().subscribe((user: User) => {
        this.user = user;
        // Get requestsReceived.
        if (this.user.requestsReceived) {
          for (let i = 0; i < this.user.requestsReceived.length; i++) {
            // Sync to user data for those users who sent a contact request
            this.firestore.get('users/' + this.user.requestsReceived[i]).then(ref => {
              let subscription = ref.valueChanges().subscribe((user: User) => {
                if (this.user.requestsReceived && this.user.requestsReceived.indexOf(user.userId) > -1) {
                  this.addOrUpdateReceived(user);
                }
              });
              this.subscriptions.push(subscription);
            });
          }
        } else {
          this.received = null;
        }
        if (this.user.requestsSent) {
          for (let i = 0; i < this.user.requestsSent.length; i++) {
            // Sync to user data for those users who received a contact request
            this.firestore.get('users/' + this.user.requestsSent[i]).then(ref => {
              let subscription = ref.valueChanges().subscribe((user: User) => {
                if (this.user.requestsSent && this.user.requestsSent.indexOf(user.userId) > -1) {
                  this.addOrUpdateSent(user);
                }
              });
              this.subscriptions.push(subscription);
            });
          }
        } else {
          this.sent = null;
        }
        if (!this.user.requestsReceived && !this.user.requestsSent) {
          this.navCtrl.pop();
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

  // Add or update user data to sync with Firestore.
  private addOrUpdateReceived(user: User): void {
    if (this.received) {
      let index = -1;
      for (let i = 0; i < this.received.length; i++) {
        if (user.userId == this.received[i].userId) {
          index = i;
        }
      }
      if (index > -1) {
        this.received[index] = user;
      }
      else {
        this.received.push(user);
      }
    } else {
      this.received = [user];
    }
  }

  // Add or update user data to sync with Firestore.
  private addOrUpdateSent(user: User): void {
    if (this.sent) {
      let index = -1;
      for (let i = 0; i < this.sent.length; i++) {
        if (user.userId == this.sent[i].userId) {
          index = i;
        }
      }
      if (index > -1) {
        this.sent[index] = user;
      }
      else {
        this.sent.push(user);
      }
    } else {
      this.sent = [user];
    }
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

  // Cancel a pending request.
  private cancelRequest(userId: string): void {
    this.loading.show();
    this.firestore.cancelRequest(this.auth.getUserData().userId, userId).then(() => {
      this.loading.hide();
    }).catch(() => {
      this.loading.hide();
    });
  }

  // Reject a pending request.
  private rejectRequest(userId: string): void {
    this.loading.show();
    this.firestore.cancelRequest(userId, this.auth.getUserData().userId).then(() => {
      this.loading.hide();
    }).catch(() => {
      this.loading.hide();
    });
  }

  // Accept a pending request.
  private acceptRequest(user: User): void {
    this.loading.show();
    this.firestore.acceptRequest(user.userId, this.auth.getUserData().userId).then(() => {
      // Send a push notification to user.
      if (user.notifications) {
        this.notification.sendPush(user.pushToken, this.auth.getUserData().firstName + ' ' + this.auth.getUserData().lastName, this.translate.get('push.contact.accepted'), { newContact: true });
      }
      this.loading.hide();
    }).catch(() => {
      this.loading.hide();
    });
  }
}
