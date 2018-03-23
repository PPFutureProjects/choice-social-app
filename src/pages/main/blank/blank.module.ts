import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TranslateModule } from '@ngx-translate/core';
import { BlankPage } from './blank';

@NgModule({
  declarations: [
    BlankPage,
  ],
  imports: [
    IonicPageModule.forChild(BlankPage),
    TranslateModule.forChild()
  ],
})
export class BlankPageModule { }
