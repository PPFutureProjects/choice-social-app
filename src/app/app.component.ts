import { Component, ViewChild } from '@angular/core';
import { Nav, Platform, MenuController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { Storage } from '@ionic/storage';
import { AuthProvider, TranslateProvider, AlertProvider, FirestoreProvider, NetworkProvider, NotificationProvider } from '../providers';
import { TranslateService } from '@ngx-translate/core';
import { Environment } from '../environment/environment';
import { ImageLoaderConfig } from 'ionic-image-loader';
import { Device } from '@ionic-native/device';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;
  rootPage: any;
  pages: Array<{ title: string, component: any }>;
  private iPhoneX: boolean;

  constructor(private platform: Platform,
    private statusBar: StatusBar,
    private storage: Storage,
    private auth: AuthProvider,
    private translate: TranslateProvider,
    private alert: AlertProvider,
    private firestore: FirestoreProvider,
    private network: NetworkProvider,
    private notification: NotificationProvider,
    private translateService: TranslateService,
    private imageLoader: ImageLoaderConfig,
    private menuCtrl: MenuController,
    private device: Device) {
    this.initializeApp();

    this.pages = [
      { title: 'Home', component: 'HomePage' },
      { title: 'Page', component: 'BlankPage' }
    ];

  }

  initializeApp() {
    // Set ImageLoader configurations.
    this.imageLoader.spinnerEnabled = false;
    this.imageLoader.fallbackAsPlaceholder = true;
    this.imageLoader.useImg = true;
    this.imageLoader.setFallbackUrl('assets/images/profile.png');

    this.platform.ready().then(() => {
      // Check if device is on iPhoneX and adjust the scss accordingly.
      if (this.device.model.indexOf('iPhone10') > -1) {
        this.iPhoneX = true;
      } else {
        this.iPhoneX = false;
      }
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      this.statusBar.styleDefault();
      // Set language of the app.
      this.translateService.setDefaultLang(Environment.language);
      this.translateService.use(Environment.language);
      this.translateService.getTranslation(Environment.language).subscribe(translations => {
        this.translate.setTranslations(translations);
        // LoaderPage is responsible for loading the relevant pages depending on the state of the user.
        this.rootPage = 'LoaderPage';
      });
    }).catch(() => {
      // User is deploying the app on Browser.
      this.translateService.setDefaultLang(Environment.language);
      this.translateService.use(Environment.language);
      this.translateService.getTranslation(Environment.language).subscribe(translations => {
        this.translate.setTranslations(translations);
        // LoaderPage is responsible for loading the relevant pages depending on the state of the user.
        this.rootPage = 'LoaderPage';
      });
    });
  }

  openPage(page) {
    this.nav.setRoot(page.component);
  }

  private logout(): void {
    this.alert.showConfirm(this.translate.get('auth.menu.logout.title'), this.translate.get('auth.menu.logout.text'), this.translate.get('auth.menu.logout.button.cancel'), this.translate.get('auth.menu.logout.button.logout')).then(confirm => {
      if (confirm) {
        this.auth.logout().then(() => {
          this.menuCtrl.close();
          this.notification.destroy();
          this.nav.setRoot('LoginPage');
        }).catch(() => { });
      }
    }).catch(() => { });
  }
}
