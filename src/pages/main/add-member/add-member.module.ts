import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AddMemberPage } from './add-member';
import { IonicImageLoader } from 'ionic-image-loader';
import { PipesModule } from '../../../pipes/pipes.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    AddMemberPage,
  ],
  imports: [
    IonicPageModule.forChild(AddMemberPage),
    TranslateModule.forChild(),
    IonicImageLoader,
    PipesModule
  ],
})
export class AddMemberPageModule { }
