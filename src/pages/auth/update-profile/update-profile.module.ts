import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TranslateModule } from '@ngx-translate/core';
import { UpdateProfilePage } from './update-profile';
import { IonicImageLoader } from 'ionic-image-loader';
import { ElasticModule } from 'ng-elastic';

@NgModule({
  declarations: [
    UpdateProfilePage,
  ],
  imports: [
    IonicPageModule.forChild(UpdateProfilePage),
    TranslateModule.forChild(),
    IonicImageLoader,
    ElasticModule
  ],
})
export class UpdateProfilePageModule { }
