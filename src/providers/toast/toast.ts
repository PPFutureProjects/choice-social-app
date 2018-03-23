import { Injectable } from '@angular/core';
import { ToastController, Toast } from 'ionic-angular';
import { Environment } from '../../environment/environment';

@Injectable()
export class ToastProvider {
  private toast: Toast;
  constructor(private toastCtrl: ToastController) { }

  // Show a toast message given the message.
  public show(message: string): void {
    if (!this.toast) {
      let options = Environment.toast;
      this.toast = this.toastCtrl.create(options);
      this.toast.setMessage(message);
      this.toast.setDuration(Environment.toastDuration);
      this.toast.present();
      this.toast.onDidDismiss(() => {
        this.toast = null;
      });
    }
  }

  // Hide the shown toast message.
  public hide(): void {
    if (this.toast)
      this.toast.dismiss();
  }

}
