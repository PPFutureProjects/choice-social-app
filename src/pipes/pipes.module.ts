import { NgModule } from '@angular/core';
import { UsersPipe } from './users';
import { ChatsPipe } from './chats';
import { GroupsPipe } from './groups';
import { FromNowPipe } from './from-now';
// Add your pipes here for easy indexing.
@NgModule({
  declarations: [
    UsersPipe,
    ChatsPipe,
    GroupsPipe,
    FromNowPipe
  ],
  imports: [

  ],
  exports: [
    UsersPipe,
    ChatsPipe,
    GroupsPipe,
    FromNowPipe
  ]
})
export class PipesModule { }
