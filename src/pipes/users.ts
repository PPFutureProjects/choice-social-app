import { Injectable, Pipe, PipeTransform } from '@angular/core';
import { User } from '../models';
import { AuthProvider } from '../providers';

@Pipe({
  name: 'usersFilter',
  pure: false
})
@Injectable()
export class UsersPipe implements PipeTransform {
  // Accepts an array of userIds to filter out users, and a search string to search for a user based on their first, last, and username.
  transform(users: User[], data: [[string], string]): any {
    let excludedIds = data[0];
    let search = data[1];
    if (!users) {
      return;
    } else if (!excludedIds) {
      return users;
    } else if (excludedIds && !search) {
      return users.filter((user: User) => excludedIds.indexOf(user.userId) == -1);
    } else {
      search = search.toLowerCase();
      return users.filter((user: User) => (excludedIds.indexOf(user.userId) == -1 &&
        (
          user.firstName.toLowerCase().indexOf(search) > -1 ||
          user.lastName.toLowerCase().indexOf(search) > -1 ||
          user.username.toLowerCase().indexOf(search) > -1
        )));
    }
  }
}
