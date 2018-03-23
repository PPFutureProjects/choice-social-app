import { NgModule } from '@angular/core';
import { UsersPipe } from './users';
// Add your pipes here for easy indexing.
@NgModule({
  declarations: [
    UsersPipe,
  ],
  imports: [

  ],
  exports: [
    UsersPipe,
  ]
})
export class PipesModule { }
