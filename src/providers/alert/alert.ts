import { Injectable } from '@angular/core';
import { AlertController, Alert } from 'ionic-angular';

@Injectable()
export class AlertProvider {
  private alert: Alert;
  constructor(private alertCtrl: AlertController) { }

  // Show a pop up alert.
  public showAlert(title: string, subTitle: string, button: string): Promise<any> {
    return new Promise(resolve => {
      this.alert = this.alertCtrl.create({
        title: title,
        subTitle: subTitle,
        buttons: [{
          text: button,
          role: 'cancel',
          handler: () => {
            resolve();
          }
        }]
      });
      this.alert.present();
    });
  }

  // Show a confirmation pop up, returns a boolean if the user has confirmed or canceled.
  public showConfirm(title: string, subTitle: string, cancelButton: string, okButton: string): Promise<boolean> {
    return new Promise(resolve => {
      this.alert = this.alertCtrl.create({
        title: title,
        subTitle: subTitle,
        buttons: [
          {
            text: cancelButton,
            role: 'cancel',
            handler: () => {
              resolve(false);
            },
          },
          {
            text: okButton,
            handler: () => {
              resolve(true);
            },
          }]
      });
      this.alert.present();
    });
  }

}
