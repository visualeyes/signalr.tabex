
let lastData = null;

export default {
  getLastSentData() {
    console.log('Getting last data: ', lastData);
    return lastData;
  },

  clearLastData() {
    lastData = null;
  },

  log(msg) {

  },

  send(data) {
    lastData = data;
  }
}
