const moment = require('moment-timezone');

const currentDate = () => {
     const colomboTime = moment.tz("Asia/Colombo").format('YYYY-MM-DD HH:mm:ss');
     return `${colomboTime}`
};


module.exports = currentDate;