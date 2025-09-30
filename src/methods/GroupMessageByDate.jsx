import moment from 'moment';

export default function groupMessagesByDate(messages) {

     const groups = {};
     messages.forEach((msg) => {
          const date = moment(msg.DATE).startOf("day");
          let label;
          if (date.isSame(moment(), "day")) label = "Today";
          else if (date.isSame(moment().subtract(1, "day"), "day")) label = "Yesterday";
          else label = date.format("MMMM D, YYYY");
          if (!groups[label]) groups[label] = [];
          groups[label].push(msg);
     });
     return Object.entries(groups).map(([date, msgs]) => ({ date, messages: msgs }));

}