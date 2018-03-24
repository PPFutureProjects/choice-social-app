import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { NewConversationPage } from './new-conversation';
import { TranslateModule } from '@ngx-translate/core';
import { IonicImageLoader } from 'ionic-image-loader';
import { PipesModule } from '../../../pipes/pipes.module';

@NgModule({
  declarations: [
    NewConversationPage,
  ],
  imports: [
    IonicPageModule.forChild(NewConversationPage),
    TranslateModule.forChild(),
    IonicImageLoader,
    PipesModule
  ],
})
export class NewConversationPageModule { }
