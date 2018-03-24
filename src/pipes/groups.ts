import { Injectable, Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'groupsFilter',
  pure: false
})
@Injectable()
export class GroupsPipe implements PipeTransform {
  // Accepts an array of groups to filter out based on group's title.
  // Additionally, the group list is sorted from the most recently active.
  transform(groups: any[], data: string): any {
    let search = data;
    if (!groups) {
      return;
    } else if (!search) {
      let sorted = groups.sort(function(a, b) {
        let date1 = new Date(a.messages[a.messages.length - 1].date);
        let date2 = new Date(b.messages[b.messages.length - 1].date);

        if (date1 > date2) {
          return 1;
        } else if (date1 < date2) {
          return -1;
        } else {
          return 0;
        }
      }).reverse();
      return sorted;
    } else {
      let sorted = groups.sort(function(a, b) {
        let date1 = new Date(a.messages[a.messages.length - 1].date);
        let date2 = new Date(b.messages[b.messages.length - 1].date);

        if (date1 > date2) {
          return 1;
        } else if (date1 < date2) {
          return -1;
        } else {
          return 0;
        }
      }).reverse();
      search = search.toLowerCase();
      return sorted.filter((group: any) =>
        group.title.toLowerCase().indexOf(search) > -1
      )
    }
  }
}
