import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';
import { Subscription } from 'rxjs/Subscription';
import { User } from '../../../models';
import { FirestoreProvider, AuthProvider, LoadingProvider, NetworkProvider, NotificationProvider, TranslateProvider } from '../../../providers';

@IonicPage()
@Component({
  selector: 'page-view-profile',
  templateUrl: 'view-profile.html',
})
export class ViewProfilePage {
  private user: User;
  private currentUser: User;
  private subscriptions: Subscription[];
  private contacts: User[];
  private userId: string;

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private viewCtrl: ViewController,
    private firestore: FirestoreProvider,
    private auth: AuthProvider,
    private loading: LoadingProvider,
    private network: NetworkProvider,
    private notification: NotificationProvider,
    private translate: TranslateProvider) {
  }

  ionViewDidLoad() {
    this.subscriptions = [];
    if (!this.userId) {
      this.userId = this.navParams.get('userId');
    }
    // Subscribe to the logged in user on Firestore and sync.
    this.firestore.get('users/' + this.auth.getUserData().userId).then(ref => {
      let subscription = ref.valueChanges().subscribe((user: User) => {
        this.currentUser = user;
      });
      this.subscriptions.push(subscription);
    }).catch(() => { });

    this.loading.show();
    // Subscribe to the user to view on Firestore and sync.
    this.firestore.get('users/' + this.userId).then(ref => {
      let subscription = ref.valueChanges().subscribe((user: User) => {
        this.user = user;
        // Subscribe to the user to view's contacts on Firestore and sync.
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
    }).catch(() => {
      this.loading.hide();
    });
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

  // Change the user to view and reload the page.
  private setUser(userId: string): void {

    this.userId = userId;
 
    this.contacts = [];
 
    this.ionViewDidLoad();
 
 }

  // Return the status of the request between the logged in user and the user viewed.
  private getRequestStatus(user: User): number {
    //0 -> Can be requested | 1 -> Request is pending | 2 -> Sent a contact request | 3 -> Is a contact | -1 -> User is the currentUser
    if (this.currentUser) {
      if (this.currentUser.contacts && this.currentUser.contacts.indexOf(user.userId) > -1) {
        return 3;
      } else {
        if (user.requestsReceived && user.requestsReceived.indexOf(this.currentUser.userId) > -1) {
          return 1;
        } else if (user.requestsSent && user.requestsSent.indexOf(this.currentUser.userId) > -1) {
          return 2;
        } else if (user.userId == this.currentUser.userId) {
          return -1;
        } else {
          return 0;
        }
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

  // Open a chat with the user being viewed.
  private message(userId: string): void {
    this.viewCtrl.dismiss(userId);
  }
}
