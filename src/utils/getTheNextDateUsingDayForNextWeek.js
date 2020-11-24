let moment = require('moment');
module.exports = (day, date) => {
  const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  let thresholdDays = parseInt(weekdays.indexOf(day) + 8);
  let nextWeekDate = moment().day(thresholdDays).format('MM-DD-YYYY') // last monday, think of it as this monday - 7 days = 1 - 7 = -6
  // console.log("The day her eis ---> ", weekdays.indexOf(day), day, nextWeekDate)
  // let todaysDate = new Date();

  // let firstDate = date.getDate() - date.getDay();
  // let first = new Date(todaysDate.setDate(firstDate));
  // console.log('The first date her eis  ---> `', first);
  // let nextWeekDate = new Date(first.getTime() + (weekdays.indexOf(day)) + 7 * 24 * 60 * 60 * 1000);
  // date.setDate(date.getDate() + (weekdays.indexOf(day) + (7 - date.getDay())) % 7);
  var dateIST = new Date(nextWeekDate);
  //date shifting for IST timezone (+5 hours and 30 minutes)
  dateIST.setHours(dateIST.getHours() + 5);
  dateIST.setMinutes(dateIST.getMinutes() + 30);
  return dateIST;
};
