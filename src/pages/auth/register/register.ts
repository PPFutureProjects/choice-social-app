import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, MenuController } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators, ValidatorFn } from '@angular/forms';
import { Keyboard } from '@ionic-native/keyboard';
import { AuthProvider, LoadingProvider, ToastProvider, TranslateProvider, NetworkProvider } from '../../../providers';

@IonicPage()
@Component({
  selector: 'page-register',
  templateUrl: 'register.html',
})
export class RegisterPage {
  private registerForm: FormGroup;
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
    this.registerForm = formBuilder.group({
      email: ['', this.emailValidator],
      password: ['', this.passwordValidator],
      confirmPassword: ['', this.passwordValidator]
    });
  }

  keyDownFunction(event) {
    // User pressed return on keypad, proceed with registration.
    if (event.keyCode == 13) {
      this.keyboard.close();
      this.register();
    }
  }

  ionViewDidLoad() {
    this.menuCtrl.enable(false);
  }

  private register(): void {
    // Register with Email and Password.
    if (!this.registerForm.valid || this.registerForm.value['password'] != this.registerForm.value['confirmPassword']) {
      this.hasError = true;
    } else {
      this.loading.show();
      this.auth.registerWithEmail(this.registerForm.value['email'], this.registerForm.value['password']).then(res => {
        this.loading.hide();
        this.navCtrl.setRoot('LoaderPage');
        this.loading.hide();
      }).catch(err => {
        this.toast.show(this.translate.get(err.code));
        this.loading.hide();
      });
    }
  }

  private registerWithFacebook(): void {
    // Register with Facebook.
    this.loading.show();
    this.auth.loginWithFacebook().then(res => {
      this.loading.hide();
      this.navCtrl.setRoot('LoaderPage');
    }).catch(err => {
      this.toast.show(err);
      this.loading.hide();
    });
  }

  private registerWithGoogle(): void {
    // Register with Google.
    this.loading.show();
    this.auth.loginWithGoogle().then(res => {
      this.loading.hide();
      this.navCtrl.setRoot('LoaderPage');
    }).catch(err => {
      this.toast.show(err);
      this.loading.hide();
    });
  }

  private registerWithTwitter(): void {
    // Register with Twitter.
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
