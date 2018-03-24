import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { GroupMembersPage } from './group-members';
import { TranslateModule } from '@ngx-translate/core';
import { IonicImageLoader } from 'ionic-image-loader';
import { PipesModule } from '../../../pipes/pipes.module';

@NgModule({
  declarations: [
    GroupMembersPage,
  ],
  imports: [
    IonicPageModule.forChild(GroupMembersPage),
    TranslateModule.forChild(),
    IonicImageLoader,
    PipesModule
  ],
})
export class GroupMembersPageModule { }
