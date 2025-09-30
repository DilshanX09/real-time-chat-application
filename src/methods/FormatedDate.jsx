export const formatLastSeenSriLanka = (isoDate) => {

     const date = new Date(isoDate);

     const slOptions = { timeZone: 'Asia/Colombo' };
     const slDate = new Date(date.toLocaleString('en-US', slOptions));
     const nowSL = new Date(new Date().toLocaleString('en-US', slOptions));

     const slDateOnly = new Date(slDate.getFullYear(), slDate.getMonth(), slDate.getDate());
     const nowSLDateOnly = new Date(nowSL.getFullYear(), nowSL.getMonth(), nowSL.getDate());

     const diffInDays = Math.floor((nowSLDateOnly - slDateOnly) / (1000 * 60 * 60 * 24));

     const timeString = slDate
          .toLocaleTimeString('en-US', {
               hour: 'numeric',
               minute: '2-digit',
               hour12: true,
          })
          .replace(':', '.')
          .toUpperCase();

     let dateLabel;
     if (diffInDays === 0) {
          dateLabel = 'today';
     } else if (diffInDays === 1) {
          dateLabel = 'yesterday';
     } else {
          dateLabel = slDate.toLocaleDateString('en-GB');
     }

     return ` ${dateLabel} at ${timeString}`;
};
