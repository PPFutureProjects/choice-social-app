import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { NewGroupPage } from './new-group';
import { TranslateModule } from '@ngx-translate/core';
import { IonicImageLoader } from 'ionic-image-loader';
import { PipesModule } from '../../../pipes/pipes.module';

@NgModule({
  declarations: [
    NewGroupPage,
  ],
  imports: [
    IonicPageModule.forChild(NewGroupPage),
    TranslateModule.forChild(),
    IonicImageLoader,
    PipesModule
  ],
})
export class NewGroupPageModule { }
