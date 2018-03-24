import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ChatPage } from './chat';
import { TranslateModule } from '@ngx-translate/core';
import { IonicImageLoader } from 'ionic-image-loader';
import { PipesModule } from '../../../pipes/pipes.module';
import { ElasticModule } from 'ng-elastic';

@NgModule({
  declarations: [
    ChatPage
  ],
  imports: [
    IonicPageModule.forChild(ChatPage),
    TranslateModule.forChild(),
    IonicImageLoader,
    PipesModule,
    ElasticModule
  ],
})
export class ChatPageModule { }
