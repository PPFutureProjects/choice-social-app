import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { GroupInfoPage } from './group-info';
import { TranslateModule } from '@ngx-translate/core';
import { IonicImageLoader } from 'ionic-image-loader';

@NgModule({
  declarations: [
    GroupInfoPage,
  ],
  imports: [
    IonicPageModule.forChild(GroupInfoPage),
    TranslateModule.forChild(),
    IonicImageLoader
  ],
})
export class GroupInfoPageModule { }
