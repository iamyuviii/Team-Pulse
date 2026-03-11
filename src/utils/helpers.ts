import type { Notification, Member } from '../api/mockData';

export function getTeamDisplay(member: Member): string {
  if (typeof member.team === 'object' && member.team !== null && 'name' in member.team)
    //symptoms - error page on the screen when click on the member card which has no team assigned to it
    // root cause - the code was trying to access the name property of team without checking if team is an object and has the name property
    // fix - add a check to ensure that member.team is an object, not null, and has the name property before trying to access it. if conditions fail, return 'Unassigned'
     {
    return (member.team as { name: string }).name;
  }
  return 'Unassigned';
}

export function bindNotificationHandlers(
  notifications: Notification[],
  onSelect: (id: number) => void,
): (() => void)[] {
  const handlers: (() => void)[] = [];
  for (let i = 0; i < notifications.length; i++) {
  handlers.push(function () {
    onSelect(notifications[i]?.id ?? -1);
  });
}
//symptoms - when clicking on a notification, it was always selecting the last or the default notification instead of the one that was clicked
// root cause - using of the var keyword for the loop variable i which is function-scoped which was leading to alwasy -1 value of notification
// // fix - change var to let for the loop variable i, which is block-scoped
  return handlers;
}
