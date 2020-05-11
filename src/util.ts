export function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function dataURLtoUint8(dataurl: string) {
  var arr = dataurl.split(","),
    mime = arr[0].match(/:(.*?);/)![1],
    bstr = atob(arr[1]),
    n = bstr.length,
    u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return u8arr;
}
export function readableFileSize(bytes: number) {
  var thresh = 1000;
  if (Math.abs(bytes) < thresh) {
    return bytes + " B";
  }
  var units = ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
  var u = -1;
  do {
    bytes /= thresh;
    ++u;
  } while (Math.abs(bytes) >= thresh && u < units.length - 1);
  return bytes.toFixed(1) + " " + units[u];
}

export function waterfall(list: any) {
  // malformed argument
  list = Array.prototype.slice.call(list);
  if (
    !Array.isArray(list) || // not an array
    typeof list.reduce !== "function" || // update your javascript engine
    list.length < 1 // empty array
  ) {
    return Promise.reject("Array with reduce function is needed.");
  }

  if (list.length == 1) {
    if (typeof list[0] != "function")
      return Promise.reject(
        "First element of the array should be a function, got " + typeof list[0]
      );
    return Promise.resolve(list[0]());
  }

  return list.reduce(function (l, r) {
    // first round
    // execute function and return promise
    var isFirst = l == list[0];
    if (isFirst) {
      if (typeof l != "function")
        return Promise.reject("List elements should be function to call.");

      var lret = l();
      if (!isPromise(lret))
        return Promise.reject("Function return value should be a promise.");
      else return lret.then(r);
    }

    // other rounds
    // l is a promise now
    // priviousPromiseList.then(nextFunction)
    else {
      if (!isPromise(l))
        Promise.reject("Function return value should be a promise.");
      else return l.then(r);
    }
  });
}
function isPromise(obj: any) {
  return obj && typeof obj.then === "function";
}
