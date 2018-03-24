import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, MenuController, ActionSheetController, Platform } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators, ValidatorFn } from '@angular/forms';
import { AuthProvider, TranslateProvider, FirestoreProvider, LoadingProvider, StorageProvider, NetworkProvider, NotificationProvider } from '../../../providers';
import { Keyboard } from '@ionic-native/keyboard';
import { Camera } from '@ionic-native/camera';
import { Device } from '@ionic-native/device';
import { User } from '../../../models';
import firebase from 'firebase';

@IonicPage()
@Component({
  selector: 'page-create-profile',
  templateUrl: 'create-profile.html',
})
export class CreateProfilePage {
  private android: boolean;
  private profileForm: FormGroup;
  private photo: string = 'assets/images/profile.png';
  private userId: string;
  private hasError: boolean;
  private uniqueUsername: boolean;
  private nameValidator: ValidatorFn = Validators.compose([
    Validators.required
  ]);
  private usernameValidator: ValidatorFn = Validators.compose([
    Validators.pattern('^[0-z.]{4,20}$'),
    Validators.required
  ]);
  private emailValidator: ValidatorFn = Validators.compose([
    Validators.required,
    Validators.email
  ]);
  private bioValidator: ValidatorFn = Validators.compose([
    Validators.required
  ]);

  constructor(private navCtrl: NavController,
    private navParams: NavParams,
    private menuCtrl: MenuController,
    private actionSheetCtrl: ActionSheetController,
    private formBuilder: FormBuilder,
    private auth: AuthProvider,
    private translate: TranslateProvider,
    private firestore: FirestoreProvider,
    private loading: LoadingProvider,
    private storage: StorageProvider,
    private network: NetworkProvider,
    private notification: NotificationProvider,
    private keyboard: Keyboard,
    private camera: Camera,
    private device: Device,
    private platform: Platform) {
    this.profileForm = formBuilder.group({
      firstName: ['', this.nameValidator],
      lastName: ['', this.nameValidator],
      username: ['', this.usernameValidator],
      email: ['', this.emailValidator],
      bio: ['', this.bioValidator]
    });
  }

  keyDownFunction(event) {
    // User pressed return on keypad, proceed with creating profile.
    if (event.keyCode == 13) {
      this.keyboard.close();
      this.createProfile();
    }
  }

  onInput(username: string) {
    // Check if the username entered on the form is still available.
    this.uniqueUsername = true;
    if (this.profileForm.controls.username.valid && !this.profileForm.controls.username.hasError('required')) {
      this.firestore.getUserByUsername('@' + username.toLowerCase()).then((user: User) => {
        if (user) {
          this.uniqueUsername = false;
        }
      }).catch(() => { });
    }
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
    // Disable sideMenu.
    this.menuCtrl.enable(false);
    // Fill up the form with relevant user info based on the authenticated user on Firebase.
    this.auth.getUser().then((user: firebase.User) => {
      this.userId = user.uid;
      if (user.photoURL) {
        this.photo = user.photoURL;
      }
      let firstName = '';
      let lastName = '';
      if (user.displayName) {
        firstName = user.displayName.substr(0, user.displayName.indexOf(' '));
        lastName = user.displayName.substr(user.displayName.indexOf(' ') + 1, user.displayName.length);
      }
      console.log('SET VALUE', user);
      this.profileForm.setValue({
        firstName: 'lhkjghjgfhdgfsdffdhfjgkjhj',
        lastName: '',
        username: '',
        email: user.email
      });
      console.log('Profile Form Geldi', this.profileForm)
    }).catch(() => { });
  }

  ionViewWillUnload() {
    // Check if userData exists on Firestore. If no userData exists yet, delete the photo uploaded to save Firebase storage space.
    this.firestore.exists('users/' + this.userId).then(exists => {
      if (!exists) {
        this.storage.delete(this.userId, this.photo);
      }
    }).catch(() => { });
  }

  private createProfile(): void {
    // Check if profileForm is valid and username is unique and proceed with creating the profile.
    console.log('BURAYA GELDİ', this.profileForm)
    if (!this.profileForm.valid || !this.uniqueUsername) {
      console.log('ERROR OLDU');
      this.hasError = true;
    } else {
      if (this.uniqueUsername) {
        this.loading.show();
        // Create userData on Firestore.
        this.firestore.get('users/' + this.userId).then(ref => {
          // Formatting the first and last names to capitalized.
          let firstName = this.profileForm.value['firstName'].charAt(0).toUpperCase() + this.profileForm.value['firstName'].slice(1).toLowerCase();
          let lastName = this.profileForm.value['lastName'].charAt(0).toUpperCase() + this.profileForm.value['lastName'].slice(1).toLowerCase();
          let user = new User(this.userId, this.profileForm.value['email'].toLowerCase(), firstName, lastName, this.photo, '@' + this.profileForm.value['username'].toLowerCase(), this.profileForm.value['bio'], null, null, null, null, null, '', true);
          ref.set(user.object).then(() => {
            this.notification.init();
            this.loading.hide();
            this.navCtrl.setRoot('LoaderPage');
          }).catch(() => { });
        }).catch(() => { });
      }
    }
  }

  private setPhoto(): void {
    // Allow user to upload and set their profile photo using their camera or photo gallery.
    if (this.network.online()) {
      this.actionSheetCtrl.create({
        title: this.translate.get('auth.profile.photo.title'),
        buttons: [
          {
            text: this.translate.get('auth.profile.photo.take'),
            role: 'destructive',
            handler: () => {
              this.storage.upload(this.userId, this.storage.profilePhoto, this.camera.PictureSourceType.CAMERA).then((url: string) => {
                this.storage.delete(this.userId, this.photo);
                this.photo = url;
              }).catch(() => { });
            }
          },
          {
            text: this.translate.get('auth.profile.photo.gallery'),
            handler: () => {
              this.storage.upload(this.userId, this.storage.profilePhoto, this.camera.PictureSourceType.PHOTOLIBRARY).then((url: string) => {
                this.storage.delete(this.userId, this.photo);
                this.photo = url;
              }).catch(() => { });
            }
          },
          {
            text: this.translate.get('auth.profile.photo.cancel'),
            role: 'cancel',
            handler: () => { }
          }
        ]
      }).present();
    }
  }

}
