module.exports = (day, date) => {
  const weekdays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  date.setDate(date.getDate() + (weekdays.indexOf(day) + (7 - date.getDay())) % 7);
  return date;
};
