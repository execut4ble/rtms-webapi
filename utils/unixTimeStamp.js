function unixTimeStamp() {
  return Math.floor(+new Date() / 1000);
}

module.exports = {
  unixTimeStamp,
};
