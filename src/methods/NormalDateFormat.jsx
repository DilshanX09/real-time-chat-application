import { format } from 'date-fns';

const formatDate = (datetime) => {
     return format(datetime, 'h:mm a');
}

export default formatDate;


// import { format, isToday, isYesterday } from 'date-fns';

// const formatDateForList = (datetime) => {
//      if (isToday(datetime)) {
//           return format(datetime, 'h:mm a');
//      }
//      if (isYesterday(datetime)) {
//           return 'Yesterday';
//      }
//      return format(datetime, 'dd/MM/yy');
// };

// export default formatDateForList;