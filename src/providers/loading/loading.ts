import { Injectable } from '@angular/core';
import { LoadingController, Loading } from 'ionic-angular';
import { Environment } from '../../environment/environment';

@Injectable()
export class LoadingProvider {
  private loading: Loading;
  constructor(private loadingCtrl: LoadingController) { }

  // Show the loading indicator.
  public show(): void {
    if (!this.loading) {
      let options = Environment.loading;
      this.loading = this.loadingCtrl.create(options);
      this.loading.present();
    }
  }

  // Hide the loading indicator.
  public hide(): void {
    if (this.loading) {
      this.loading.dismiss();
      this.loading = null;
    }
  }

}
