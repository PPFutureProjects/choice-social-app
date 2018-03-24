import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, MenuController, AlertController, ActionSheetController, App, Platform } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators, ValidatorFn } from '@angular/forms';
import { AuthProvider, AlertProvider, TranslateProvider, FirestoreProvider, LoadingProvider, ToastProvider, NetworkProvider, StorageProvider, NotificationProvider } from '../../../providers';
import { Keyboard } from '@ionic-native/keyboard';
import { Camera } from '@ionic-native/camera';
import { Device } from '@ionic-native/device';
import { Subscription } from 'rxjs/Subscription';
import { User } from '../../../models';
import firebase from 'firebase';

@IonicPage()
@Component({
  selector: 'page-update-profile',
  templateUrl: 'update-profile.html',
})
export class UpdateProfilePage {
  private android: boolean;
  private profileForm: FormGroup;
  private user: User;
  private userId: string;
  private hasError: boolean;
  private hasPassword: boolean;
  private hasPushToken: boolean;
  private subscription: Subscription;
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
    private app: App,
    private navParams: NavParams,
    private menuCtrl: MenuController,
    private alertCtrl: AlertController,
    private actionSheetCtrl: ActionSheetController,
    private formBuilder: FormBuilder,
    private auth: AuthProvider,
    private alert: AlertProvider,
    private translate: TranslateProvider,
    private firestore: FirestoreProvider,
    private loading: LoadingProvider,
    private toast: ToastProvider,
    private network: NetworkProvider,
    private storage: StorageProvider,
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
    // User pressed return on keypad, proceed with updating profile.
    if (event.keyCode == 13) {
      this.keyboard.close();
      this.updateProfile();
    }
  }

  onInput(username: string) {
    // Check if the username entered on the form is still available.
    this.uniqueUsername = true;
    if (this.profileForm.controls.username.valid && !this.profileForm.controls.username.hasError('required')) {
      this.firestore.getUserByUsername('@' + username.toLowerCase()).then((user: User) => {
        if (user && (this.userId != user.userId)) {
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
    // Set placeholder photo, while the user data is loading.
    this.user = new User('', '', '', '', 'assets/images/profile.png', '', '', [], [], [], null, null, '', true);

    this.auth.getUser().then((user: firebase.User) => {
      // Check if user is logged in using email and password and show the change password button.
      this.userId = user.uid;
      if (user.providerData[0].providerId == 'password') {
        this.hasPassword = true;
      }
      // Get userData from Firestore and update the form accordingly.
      this.firestore.get('users/' + this.userId).then(ref => {
        this.subscription = ref.valueChanges().subscribe((user: User) => {
          this.user = user;
          this.hasPushToken = user.notifications;
          this.profileForm.setValue({
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username.substring(1, user.username.length),
            email: user.email,
            bio: user.bio
          });
          this.uniqueUsername = true;
        });
      }).catch(() => { });
    }).catch(() => { });
  }

  ionViewWillUnload() {
    // Unsubscribe to Subscription.
    if (this.subscription)
      this.subscription.unsubscribe();
    // Delete the photo uploaded from storage to preserve Firebase storage space since it's no longer going to be used.
    if (this.auth.getUserData().photo != this.user.photo)
      this.storage.delete(this.user.userId, this.user.photo);
  }

  private changePassword(): void {
    // Allow user to change their password.
    let alert = this.alertCtrl.create({
      title: this.translate.get('auth.profile.password.title'),
      inputs: [
        {
          name: 'old',
          placeholder: this.translate.get('auth.profile.password.old'),
          type: 'password'
        },
        {
          name: 'new',
          placeholder: this.translate.get('auth.profile.password.new'),
          type: 'password'
        },
        {
          name: 'verify',
          placeholder: this.translate.get('auth.profile.password.verify'),
          type: 'password'
        }
      ],
      buttons: [
        {
          text: this.translate.get('auth.profile.password.button.cancel'),
          role: 'cancel',
          handler: data => { }
        },
        {
          text: this.translate.get('auth.profile.password.button.save'),
          handler: data => {
            // Check if the user has filled all the fields.
            if (data.old && data.new && data.verify) {
              this.loading.show();
              this.auth.getUser().then((user: firebase.User) => {
                this.auth.loginWithEmail(user.email, data.old).then(res => {
                  if (data.new == data.verify) {
                    this.auth.changePassword(data.new).then(res => {
                      this.loading.hide();
                      this.toast.show(this.translate.get('auth.profile.password.update'));
                    }).catch(err => {
                      this.loading.hide();
                      this.toast.show(this.translate.get('auth.profile.password.error'));
                    });
                  } else {
                    this.loading.hide();
                    this.toast.show(this.translate.get('auth.profile.password.mismatch'));
                  }
                }).catch(err => {
                  this.loading.hide();
                  this.toast.show(this.translate.get('auth.profile.password.invalid'));
                });
              }).catch(() => { });
            } else {
              return false;
            }
          }
        }
      ]
    });
    alert.present();
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
                // Delete the previous temporary photo uploaded to preserve Firebase storage space.
                if (this.auth.getUserData().photo != this.user.photo) {
                  this.storage.delete(this.user.userId, this.user.photo);
                  this.user.photo = url;
                } else {
                  this.user.photo = url;
                }
              }).catch(() => { });
            }
          },
          {
            text: this.translate.get('auth.profile.photo.gallery'),
            handler: () => {
              this.storage.upload(this.userId, this.storage.profilePhoto, this.camera.PictureSourceType.PHOTOLIBRARY).then((url: string) => {
                // Delete the previous temporary photo uploaded to preserve Firebase storage space.
                if (this.auth.getUserData().photo != this.user.photo) {
                  this.storage.delete(this.user.userId, this.user.photo);
                  this.user.photo = url;
                } else {
                  this.user.photo = url;
                }
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

  private updateProfile(): void {
    // Check if profileForm is valid and username is unique and proceed with updating the profile.
    if (!this.profileForm.valid || !this.uniqueUsername) {
      this.hasError = true;
    } else {
      if (this.uniqueUsername) {
        this.loading.show();
        // Delete previous user photo to preserve Firebase storage space, since it's going to be updated to this.user.photo.
        if (this.auth.getUserData().photo != this.user.photo)
          this.storage.delete(this.auth.getUserData().userId, this.auth.getUserData().photo);
        // Update userData on Firestore.
        this.firestore.get('users/' + this.userId).then(ref => {
          // Formatting the first and last names to capitalized.
          let firstName = this.profileForm.value['firstName'].charAt(0).toUpperCase() + this.profileForm.value['firstName'].slice(1).toLowerCase();
          let lastName = this.profileForm.value['lastName'].charAt(0).toUpperCase() + this.profileForm.value['lastName'].slice(1).toLowerCase();
          let pushToken: string;
          let user = new User(this.userId, this.profileForm.value['email'].toLowerCase(), firstName, lastName, this.user.photo, '@' + this.profileForm.value['username'].toLowerCase(), this.profileForm.value['bio'], this.user.contacts, this.user.requestsSent, this.user.requestsReceived, this.user.conversations, this.user.groups, '', this.hasPushToken);
          ref.update({
            userId: user.userId,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            photo: user.photo,
            username: user.username,
            bio: user.bio,
            notifications: this.hasPushToken
          }).then(() => {
            // Initialize pushToken to receive push notifications if the user enabled them, otherwise clear pushToken.
            if (this.hasPushToken) {
              this.notification.init();
            } else {
              this.notification.destroy();
            }
            this.loading.hide();
            this.toast.show(this.translate.get('auth.profile.updated'));
          }).catch(() => { });
        }).catch(() => { });
      }
    }
  }

  private logout(): void {
    this.alert.showConfirm(this.translate.get('auth.menu.logout.title'), this.translate.get('auth.menu.logout.text'), this.translate.get('auth.menu.logout.button.cancel'), this.translate.get('auth.menu.logout.button.logout')).then(confirm => {
      if (confirm) {
        this.auth.logout().then(() => {
          this.menuCtrl.close();
          this.notification.destroy();
          this.app.getRootNavs()[0].setRoot('LoginPage');
        }).catch(() => { });
      }
    }).catch(() => { });
  }
}
