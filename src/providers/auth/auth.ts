import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';
import { AngularFireAuth } from 'angularfire2/auth';
import { Subscription } from 'rxjs/Subscription';
import { Facebook, FacebookLoginResponse } from '@ionic-native/facebook';
import { GooglePlus } from '@ionic-native/google-plus';
import { TwitterConnect, TwitterConnectResponse } from '@ionic-native/twitter-connect';
import { TranslateProvider, FirestoreProvider } from '../../providers';
import firebase from 'firebase';
import { Environment } from '../../environment/environment';
import { User } from '../../models';

@Injectable()
export class AuthProvider {
  private fbSubscription: Subscription;
  private fsSubscription: Subscription;
  private user: User;
  constructor(private afAuth: AngularFireAuth,
    private platform: Platform,
    private facebook: Facebook,
    private googlePlus: GooglePlus,
    private twitterConnect: TwitterConnect,
    private translate: TranslateProvider,
    private firestore: FirestoreProvider) { }

  // Get the userData from Firestore of the logged in user on Firebase.
  public getUserData(): User {
    return this.user;
  }

  // Get the authenticated user on Firebase and update the userData variable.
  public getUser(): Promise<firebase.User> {
    return new Promise((resolve, reject) => {
      if (this.fbSubscription) {
        this.fbSubscription.unsubscribe();
      }
      this.fbSubscription = this.afAuth.authState.subscribe((user: firebase.User) => {
        // User is logged in on Firebase.
        if (user) {
          this.firestore.get('users/' + user.uid).then(ref => {
            if (this.fsSubscription) {
              this.fsSubscription.unsubscribe();
            }
            // Update userData variable from Firestore.
            this.fsSubscription = ref.valueChanges().subscribe((user: User) => {
              this.user = user;
            });
          }).catch(() => {
            reject();
          });
        }
        resolve(user);
      });
    });
  }

  // Change password of the logged in user on Firebase.
  public changePassword(password: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.afAuth.auth.currentUser.updatePassword(password).then(res => {
        resolve(res);
      }).catch(err => {
        reject(err);
      });
    });
  }

  // Login to Firebase using email and password combination.
  public loginWithEmail(email: string, password: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.afAuth.auth.signInWithEmailAndPassword(email, password).then(res => {
        resolve(res);
      }).catch(err => {
        reject(err);
      });
    });
  }

  // Register an account on Firebase with email and password combination.
  public registerWithEmail(email: string, password: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.afAuth.auth.createUserWithEmailAndPassword(email, password).then(res => {
        resolve(res);
      }).catch(err => {
        reject(err);
      });
    });
  }

  // Login on Firebase using Facebook.
  public loginWithFacebook(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.platform.is('cordova')) {
        this.facebook.login(['public_profile', 'user_friends', 'email']).then((res: FacebookLoginResponse) => {
          let credential = firebase.auth.FacebookAuthProvider.credential(res.authResponse.accessToken);
          this.afAuth.auth.signInWithCredential(credential).then(res => {
            resolve(res);
          }).catch(err => {
            reject(this.translate.get(err.code));
          });
        }).catch(err => {
          //User cancelled, don't show any error.
          reject();
        });
      } else {
        let error = "Cordova not found. Please deploy on actual device or simulator.";
        reject(error);
      }
    });
  }

  // Login on Firebase using Google.
  public loginWithGoogle(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.platform.is('cordova')) {
        this.googlePlus.login({
          'webClientId': Environment.googleWebClientId
        }).then(res => {
          let credential = firebase.auth.GoogleAuthProvider.credential(res.idToken, res.accessToken);
          this.afAuth.auth.signInWithCredential(credential).then(res => {
            resolve(res);
          }).catch(err => {
            reject(this.translate.get(err.code));
          });
        }).catch(err => {
          //User cancelled, don't show any error.
          reject();
        });
      } else {
        let error = "Cordova not found. Please deploy on actual device or simulator.";
        reject(error);
      }
    });
  }

  // Login on Firebase using Twitter.
  public loginWithTwitter(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.platform.is('cordova')) {
        this.twitterConnect.login().then((res: TwitterConnectResponse) => {
          let credential = firebase.auth.TwitterAuthProvider.credential(res.token, res.secret);
          this.afAuth.auth.signInWithCredential(credential).then(res => {
            resolve(res);
          }).catch(err => {
            reject(this.translate.get(err.code));
          });
        }).catch(err => {
          //User cancelled, don't show any error.
          reject();
        });
      } else {
        let error = "Cordova not found. Please deploy on actual device or simulator.";
        reject(error);
      }
    });
  }

  // Log the user out from Firebase.
  public logout(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.afAuth.auth.signOut().then(() => {
        this.facebook.logout();
        this.googlePlus.logout();
        this.twitterConnect.logout();
        resolve();
      }).catch(() => {
        reject();
      });
    });
  }

}
