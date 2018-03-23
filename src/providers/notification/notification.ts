import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';
import { FCM } from '@ionic-native/fcm';
import { AuthProvider, FirestoreProvider, ToastProvider, TranslateProvider } from '../';
import { User } from '../../models';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Headers, RequestOptions } from '@angular/http';
import { Environment } from '../../environment/environment';

@Injectable()
export class NotificationProvider {
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
      this.fcm.getToken().then((token: string) => {
        this.firestore.setPushToken(this.auth.getUserData().userId, token);

        this.fcm.onTokenRefresh().subscribe((token: string) => {
          this.firestore.setPushToken(this.auth.getUserData().userId, token);
        });
        //Listener when push notification is tapped.
        this.fcm.onNotification().subscribe(data => {
          if (data.wasTapped) {
            //Notification was received when app is minimized and tapped by the user.
            this.toast.show(this.translate.get('notification.opened') + data.message + this.translate.get('notification.by') + data.sender + '.');
          } else {
            //Notification was received while the app is opened or in foreground. In case the user needs to be notified.
            this.toast.show(data.sender + this.translate.get('notification.sent') + data.message);
          }
        });
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

  // Send a push notification given the pushToken, and the message.
  // Change the title, body, and data according to your requirements.
  public sendPush(pushToken: string, message: string): Promise<any> {
    return new Promise((resolve, reject) => {
      let postParams = {
        'notification': {
          'title': 'Firestarter',
          'body': this.auth.getUserData().firstName + ' ' + this.auth.getUserData().lastName + ': ' + message,
          'sound': 'default',
          'click_action': 'FCM_PLUGIN_ACTIVITY',
          'icon': 'fcm_push_icon'
        },
        'data': {
          'sender': this.auth.getUserData().firstName + ' ' + this.auth.getUserData().lastName,
          'message': message
        },
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

}
