function FileService() {

  this.constructUrlBase = function (prefix) {
    let url;
    let location = window.location;
    const paths = location.pathname.split("/");
    while (paths.length > 0) {
      if (paths[0] === "") {
        paths.shift();
      } else {
        break;
      }
    }
    let applicationName = paths[0];
    prefix = prefix || "";
    url = `${location.protocol}//${location.host}/${prefix}${applicationName}`;
    return url;
  }

  this.createRequest = function (url, method, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.onload = function () {
      if (xhr.status != 200) {
        callback(`Error ${xhr.status}: ${xhr.statusText}`);
      } else {
        callback(undefined, xhr.response);
      }
    };
    xhr.onerror = function () {
      callback("Request failed");
    };
    return xhr;
  }

  this.getFile = function (url, callback) {
    url = this.constructUrlBase() + "/" + url;
    this.createRequest(url, "GET", callback).send();
  };

  this.getFolderContentAsJSON = function (url, callback) {
    url = this.constructUrlBase("directory-summary/") + "/" + url;
    this.createRequest(url, "GET", callback).send();
  }
}

export default FileService;
