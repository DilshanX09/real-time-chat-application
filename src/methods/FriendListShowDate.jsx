import { format, isToday, isYesterday } from 'date-fns';

const formatDateForList = (datetime) => {
     if (isToday(datetime)) {
          return format(datetime, 'h:mm a');
     }
     if (isYesterday(datetime)) {
          return 'Yesterday';
     }
     return format(datetime, 'dd/MM/yy');
};

export default formatDateForList;