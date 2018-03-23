import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, MenuController } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators, ValidatorFn } from '@angular/forms';
import { Keyboard } from '@ionic-native/keyboard';
import { AuthProvider, LoadingProvider, ToastProvider, TranslateProvider, NetworkProvider } from '../../../providers';

@IonicPage()
@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage {
  private loginForm: FormGroup;
  private hasError: boolean;
  private emailValidator: ValidatorFn = Validators.compose([
    Validators.required,
    Validators.email
  ]);
  private passwordValidator: ValidatorFn = Validators.compose([
    Validators.required,
    Validators.minLength(4)
  ]);

  constructor(private navCtrl: NavController,
    private navParams: NavParams,
    private formBuilder: FormBuilder,
    private keyboard: Keyboard,
    private auth: AuthProvider,
    private loading: LoadingProvider,
    private toast: ToastProvider,
    private translate: TranslateProvider,
    private network: NetworkProvider,
    private menuCtrl: MenuController) {
    this.loginForm = formBuilder.group({
      email: ['', this.emailValidator],
      password: ['', this.passwordValidator]
    });
  }

  keyDownFunction(event) {
    // User pressed return on keypad, proceed with logging in.
    if (event.keyCode == 13) {
      this.keyboard.close();
      this.login();
    }
  }

  ionViewDidLoad() {
    this.menuCtrl.enable(false);
  }

  private login(): void {
    // Login using Email and Password.
    if (!this.loginForm.valid) {
      this.hasError = true;
    } else {
      this.loading.show();
      this.auth.loginWithEmail(this.loginForm.value['email'], this.loginForm.value['password']).then(res => {
        this.loading.hide();
        this.navCtrl.setRoot('LoaderPage');
      }).catch(err => {
        this.toast.show(this.translate.get(err.code));
        this.loading.hide();
      });
    }
  }

  private loginWithFacebook(): void {
    // Login using Facebook.
    this.loading.show();
    this.auth.loginWithFacebook().then(res => {
      this.loading.hide();
      this.navCtrl.setRoot('LoaderPage');
    }).catch(err => {
      this.toast.show(err);
      this.loading.hide();
    });
  }

  private loginWithGoogle(): void {
    // Login using Google.
    this.loading.show();
    this.auth.loginWithGoogle().then(res => {
      this.loading.hide();
      this.navCtrl.setRoot('LoaderPage');
    }).catch(err => {
      this.toast.show(err);
      this.loading.hide();
    });
  }

  private loginWithTwitter(): void {
    // Login using Twitter.
    this.loading.show();
    this.auth.loginWithTwitter().then(res => {
      this.loading.hide();
      this.navCtrl.setRoot('LoaderPage');
    }).catch(err => {
      this.toast.show(err);
      this.loading.hide();
    });
  }

}
