import { Injectable, Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'chatsFilter',
  pure: false
})
@Injectable()
export class ChatsPipe implements PipeTransform {
  // Accepts an array of conversations to filter out based on user's firstName, lastName, or username.
  // Additionally, the conversation list is sorted from the most recently active.
  transform(conversations: any[], data: string): any {
    let search = data;
    if (!conversations) {
      return;
    } else if (!search) {
      let sorted = conversations.sort(function(a, b) {
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
      let sorted = conversations.sort(function(a, b) {
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
      return sorted.filter((conversation: any) =>
        conversation.partner.firstName.toLowerCase().indexOf(search) > -1 ||
        conversation.partner.lastName.toLowerCase().indexOf(search) > -1 ||
        conversation.partner.username.toLowerCase().indexOf(search) > -1);
    }
  }
}
