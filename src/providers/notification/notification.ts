import { Injectable } from '@angular/core';
import { Platform, App } from 'ionic-angular';
import { FCM } from '@ionic-native/fcm';
import { AuthProvider, FirestoreProvider, ToastProvider, TranslateProvider } from '../';
import { User } from '../../models';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Headers, RequestOptions } from '@angular/http';
import { Environment } from '../../environment/environment';
import { Subscription } from 'rxjs/Subscription';

@Injectable()
export class NotificationProvider {
  private subscriptions: Subscription[];
  private app: App;
  constructor(private platform: Platform,
    private fcm: FCM,
    private auth: AuthProvider,
    private firestore: FirestoreProvider,
    private toast: ToastProvider,
    private translate: TranslateProvider,
    private http: HttpClient) { }

  // Called after user is logged in to set the pushToken on Firestore.
  public init(): void {
    if (this.platform.is('cordova')) {
      if (this.subscriptions) {
        for (let i = 0; i < this.subscriptions.length; i++) {
          this.subscriptions[i].unsubscribe();
        }
      } else {
        this.subscriptions = [];
      }
      this.fcm.getToken().then((token: string) => {
        this.firestore.setPushToken(this.auth.getUserData().userId, token);

        let sub = this.fcm.onTokenRefresh().subscribe((token: string) => {
          this.firestore.setPushToken(this.auth.getUserData().userId, token);
        });
        this.subscriptions.push(sub);
        // Deeplink when push notification is tapped.
        let subscription = this.fcm.onNotification().subscribe(data => {
          if (data.wasTapped) {
            // Notification was received when app is minimized and tapped by the user.
            if (data.partnerId) {
              // Open the conversation
              this.app.getActiveNavs()[0].popToRoot().then(() => {
                this.app.getActiveNavs()[0].parent.select(0);
                this.app.getRootNavs()[0].push('ChatPage', { userId: data.partnerId });
              });
            }
            if (data.groupId) {
              // Open the group conversation
              this.app.getRootNavs()[0].popToRoot().then(() => {
                this.app.getActiveNavs()[0].parent.select(1);
                this.app.getRootNavs()[0].push('GroupPage', { groupId: data.groupId });
              });
            }
            if (data.newContact) {
              // View user contacts
              this.app.getRootNavs()[0].popToRoot().then(() => {
                this.app.getActiveNavs()[0].parent.select(2);
              });
            }
            if (data.newRequest) {
              // View pending user requests
              this.app.getRootNavs()[0].popToRoot().then(() => {
                this.app.getActiveNavs()[0].parent.select(2);
                this.app.getRootNavs()[0].push('RequestsPage');
              });
            }
          } else {
            //Notification was received while the app is opened or in foreground. In case the user needs to be notified.
          }
        });
        this.subscriptions.push(subscription);
      }).catch(err => {
        console.log('Error Saving Token: ', JSON.stringify(err));
      });
    } else {
      console.error('Cordova not found. Please deploy on actual device or simulator.');
    }
  }

  // Called when the user logged out to clear the pushToken on Firestore.
  public destroy(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.platform.is('cordova')) {
        this.firestore.removePushToken(this.auth.getUserData().userId);
        resolve();
      } else {
        reject();
      }
    });
  }

  // Send a push notification given the pushToken, title, data, and the message.
  public sendPush(pushToken: string, title: string, message: string, data: {}): Promise<any> {
    return new Promise((resolve, reject) => {
      let postParams = {
        'notification': {
          'title': title,
          'body': message,
          'sound': 'default',
          'click_action': 'FCM_PLUGIN_ACTIVITY',
          'icon': 'fcm_push_icon'
        },
        'data': data,
        'to': pushToken,
        'priority': 'high',
        'restricted_package_name': ''
      };
      let headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': 'key=' + Environment.gcmKey
      });
      let options = { headers: headers };

      this.http.post('https://fcm.googleapis.com/fcm/send', postParams, options).subscribe(response => {
        resolve(response);
      }, err => {
        reject(err);
      });
    });
  }

  // Set the app to have access to navigation views for Push Notifications Deeplink.
  public setApp(app: App): void {
    this.app = app;
  }
}
