import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TranslateModule } from '@ngx-translate/core';
import { UpdateProfilePage } from './update-profile';
import { IonicImageLoader } from 'ionic-image-loader';

@NgModule({
  declarations: [
    UpdateProfilePage,
  ],
  imports: [
    IonicPageModule.forChild(UpdateProfilePage),
    TranslateModule.forChild(),
    IonicImageLoader
  ],
})
export class UpdateProfilePageModule { }
