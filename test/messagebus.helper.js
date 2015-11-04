
let lastEmit = null;

export default {
  getLastEmit() {
    console.log('Getting last emit: ', lastEmit);
    return lastEmit;
  },

  clearLastEmit() {
    lastEmit = null;
  },

  emit(name, data, toSelf) {
    lastEmit = {
      name: name,
      data: data,
      toSelf: toSelf
    }
  },

  on(name, callback) {

  }
}
