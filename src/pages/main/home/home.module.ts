import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TranslateModule } from '@ngx-translate/core';
import { HomePage } from './home';
import { IonicImageLoader } from 'ionic-image-loader';
import { PipesModule } from '../../../pipes/pipes.module';

@NgModule({
  declarations: [
    HomePage,
  ],
  imports: [
    IonicPageModule.forChild(HomePage),
    TranslateModule.forChild(),
    IonicImageLoader,
    PipesModule
  ],
})
export class HomePageModule { }
