import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, MenuController, AlertController } from 'ionic-angular';
import { AuthProvider, FirestoreProvider, NetworkProvider, TranslateProvider, LoadingProvider, ToastProvider, NotificationProvider } from '../../../providers';
import { User } from '../../../models';
import { Observable } from 'rxjs/Observable';

@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
})
export class HomePage {
  private searchUser: string;
  private users: Observable<User[]>;
  private excludedIds: string[];
  // Show only 10 users initially, and show 10 more users via infinite scroll.
  private usersToShow: number = 10;

  constructor(private navCtrl: NavController,
    private alertCtrl: AlertController,
    private navParams: NavParams,
    private auth: AuthProvider,
    private firestore: FirestoreProvider,
    private network: NetworkProvider,
    private translate: TranslateProvider,
    private loading: LoadingProvider,
    private toast: ToastProvider,
    private notification: NotificationProvider,
    private menuCtrl: MenuController) { }

  ionViewDidLoad() {
    this.menuCtrl.enable(true);
    // Get the list of users on Firestore.
    this.users = this.firestore.getUsers().valueChanges();
    // Add logged in user to excludedIds so they won't show up on the list of users.
    this.excludedIds = [this.auth.getUserData().userId];
    // Set pushToken if the user has enabled push notifications.
    if (this.auth.getUserData().notifications) {
      this.notification.init();
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

  // Popup to send a push notification to a user.
  private sendPushNotification(user: User): void {
    if (this.network.online()) {
      // Check if user is accepting push notifications or not.
      if (user.notifications && user.pushToken) {
        // Show a popup for the user to enter a message to be sent as push notification.
        let alert = this.alertCtrl.create({
          title: user.firstName + ' ' + user.lastName,
          subTitle: this.translate.get('home.send.text'),
          inputs: [
            {
              name: 'message',
              placeholder: this.translate.get('home.send.message'),
              type: 'text'
            }
          ],
          buttons: [
            {
              text: this.translate.get('home.send.button.cancel'),
              role: 'cancel',
              handler: data => { }
            },
            {
              text: this.translate.get('home.send.button.send'),
              handler: data => {
                // Send push notification to user.
                if (data.message) {
                  if (user.pushToken) {
                    this.loading.show();
                    this.notification.sendPush(user.pushToken, data.message).then(response => {
                      this.loading.hide();
                      this.toast.show(this.translate.get('home.send.sent'));
                    }).catch(err => {
                      this.loading.hide();
                      this.toast.show(this.translate.get('home.send.error') + JSON.stringify(err));
                    });
                  }
                } else {
                  return false;
                }
              }
            }
          ]
        });
        alert.present();
      } else {
        // User has disabled push notifications.
        this.toast.show(this.translate.get('home.send.disabled'));
      }
    }
  }

}
