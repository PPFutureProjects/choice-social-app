import { Component, NgZone } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Storage } from '@ionic/storage';
import { AuthProvider, FirestoreProvider } from '../../providers';
import firebase from 'firebase';

@IonicPage()
@Component({
  selector: 'page-loader',
  templateUrl: 'loader.html',
})
export class LoaderPage {

  constructor(private navCtrl: NavController,
    private navParams: NavParams,
    private splashScreen: SplashScreen,
    private storage: Storage,
    private auth: AuthProvider,
    private firestore: FirestoreProvider,
    private zone: NgZone) {
  }

  ionViewWillEnter() {
    // Show the splashScreen while the page to show to the user is still loading.
    this.splashScreen.show();
    this.storage.get('introShown').then((introShown: boolean) => {
      // Check if user is loading the app for the very first time and show the IntroPage.
      if (introShown) {
        // Check if user is authenticated on Firebase or not.
        this.auth.getUser().then((user: firebase.User) => {
          if (!user) {
            // User is not authenticated, proceed to LoginPage.
            this.navCtrl.setRoot('LoginPage');
            this.splashScreen.hide();
          } else {
            // Check if userData is already created on Firestore.
            this.firestore.exists('users/' + user.uid).then(exists => {
              // No data yet, proceed to CreateProfilePage.
              if (!exists) {
                this.navCtrl.setRoot('CreateProfilePage');
                this.splashScreen.hide();
              } else {
                // Data exists, proceed to TabsPage.
                this.zone.run(() => {
                  this.navCtrl.setRoot('TabsPage');
                });
                this.splashScreen.hide();
              }
            }).catch(() => { });
          }
        }).catch(() => { });
      } else {
        // User is loading the app for the very first time, show IntroPage.
        this.navCtrl.setRoot('IntroPage');
        this.splashScreen.hide();
        this.storage.set('introShown', true);
      }
    }).catch(() => { });
  }

}
