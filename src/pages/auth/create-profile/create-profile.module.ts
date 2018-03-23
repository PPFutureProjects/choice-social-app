import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TranslateModule } from '@ngx-translate/core';
import { CreateProfilePage } from './create-profile';
import { IonicImageLoader } from 'ionic-image-loader';

@NgModule({
  declarations: [
    CreateProfilePage,
  ],
  imports: [
    IonicPageModule.forChild(CreateProfilePage),
    TranslateModule.forChild(),
    IonicImageLoader
  ],
})
export class CreateProfilePageModule { }
