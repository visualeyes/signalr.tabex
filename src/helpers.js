
function toString(obj) {
  return Object.prototype.toString.call(obj);
}

const nativeIsArray = Array.isArray;

const isArray = nativeIsArray || function(obj) {
  return toString.call(obj) === '[object Array]';
};

export default {
  toString,
  isArray,
};
