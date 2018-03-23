import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Platform } from 'ionic-angular';
import { Subject } from 'rxjs/Subject';
import { Network } from '@ionic-native/network';
import { ToastProvider, TranslateProvider } from '../';

@Injectable()
export class NetworkProvider {
  private onlineSubscription: Subscription;
  private offlineSubscription: Subscription;
  private connected: boolean;
  public subject: Subject<boolean> = new Subject<boolean>();

  constructor(private platform: Platform,
    private network: Network,
    private toast: ToastProvider,
    private translate: TranslateProvider) {
    // Subscribe to network changes.
    this.platform.ready().then(() => {
      this.subject = new Subject<boolean>();
      let self = this;
      setTimeout(() => {
        self.onlineSubscription = self.network.onConnect().subscribe(() => {
          self.connected = true;
          self.toast.hide();
          self.subject.next(true);
        });
        self.offlineSubscription = self.network.onDisconnect().subscribe(() => {
          self.connected = false;
          self.toast.show(self.translate.get('network.offline'));
          self.subject.next(false);
        });
      }, 1000);
      if (this.network.type == 'none') {
        this.connected = false;
      } else {
        this.connected = true;
      }
    }).catch(() => { });
  }

  // Check if network is online or offline.
  public online(): boolean {
    return this.connected;
  }

}
