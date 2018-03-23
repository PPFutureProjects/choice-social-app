import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { LoaderPage } from './loader';

@NgModule({
  declarations: [
    LoaderPage,
  ],
  imports: [
    IonicPageModule.forChild(LoaderPage),
  ],
})
export class LoaderPageModule {}
