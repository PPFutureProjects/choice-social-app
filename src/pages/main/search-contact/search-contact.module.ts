import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SearchContactPage } from './search-contact';
import { TranslateModule } from '@ngx-translate/core';
import { IonicImageLoader } from 'ionic-image-loader';
import { PipesModule } from '../../../pipes/pipes.module';

@NgModule({
  declarations: [
    SearchContactPage,
  ],
  imports: [
    IonicPageModule.forChild(SearchContactPage),
    TranslateModule.forChild(),
    IonicImageLoader,
    PipesModule
  ],
})
export class SearchContactPageModule { }
