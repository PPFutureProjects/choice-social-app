import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { IonicStorageModule } from '@ionic/storage';
import { AngularFireModule } from 'angularfire2';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { AngularFirestoreModule } from 'angularfire2/firestore';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { IonicImageLoader } from 'ionic-image-loader';

import { MyApp } from './app.component';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Keyboard } from '@ionic-native/keyboard';
import { Facebook } from '@ionic-native/facebook';
import { GooglePlus } from '@ionic-native/google-plus';
import { TwitterConnect } from '@ionic-native/twitter-connect';
import { Camera } from '@ionic-native/camera';
import { File } from '@ionic-native/file';
import { FCM } from '@ionic-native/fcm';
import { Network } from '@ionic-native/network';
import { Device } from '@ionic-native/device';
import { PhotoViewer } from '@ionic-native/photo-viewer';

import { Environment } from '../environment/environment';
import { AuthProvider, AlertProvider, LoadingProvider, ToastProvider, TranslateProvider, FirestoreProvider, StorageProvider, NetworkProvider } from '../providers';
import { NotificationProvider } from '../providers/notification/notification';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, "./assets/i18n/", ".json");
}

@NgModule({
  declarations: [
    MyApp
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    IonicModule.forRoot(MyApp, Environment.config),
    IonicStorageModule.forRoot(),
    AngularFireModule.initializeApp(Environment.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule.enablePersistence(),
    IonicImageLoader.forRoot()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp
  ],
  providers: [
    StatusBar,
    SplashScreen,
    Keyboard,
    Facebook,
    GooglePlus,
    TwitterConnect,
    Camera,
    File,
    FCM,
    Network,
    Device,
    PhotoViewer,
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    AuthProvider,
    AlertProvider,
    LoadingProvider,
    ToastProvider,
    TranslateProvider,
    FirestoreProvider,
    StorageProvider,
    NetworkProvider,
    NotificationProvider
  ]
})
export class AppModule { }
