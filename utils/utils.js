/**
 * Return path to file relative to the `loader` folder
 *
 * @param {string} file
 * @return {string}
 */
function getUrl(file) {
  let pathSegments = window.location.pathname.split("/");
  let loaderPath = pathSegments.pop();
  if (!loaderPath) {
    loaderPath = pathSegments.pop();
  }

  return `${loaderPath}/${file}`;
}

function hash(arr) {
  const crypto = require("opendsu").loadApi("crypto");
  let hsh = crypto.sha256(encodeURI(arr.join("/")));
  return hsh;
}

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function generateRandom(length) {
  let charactersSet = characters;
  let result = '';
  const charactersLength = charactersSet.length;
  for (let i = 0; i < length; i++) {
    result += charactersSet.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function goToLandingPage() {
  window.location.replace("./");
};

function encrypt(key, data) {
  try {
    if (typeof require !== 'undefined') {
      const crypto = require("opendsu").loadAPI("crypto");
      const encryptionKey = crypto.deriveEncryptionKey(key);
      const encryptedCredentials = crypto.encrypt(data, encryptionKey);
      return encryptedCredentials.toString("hex");
    }
  } catch (e) {
    throw e;
  }
}

function decrypt(key, encryptedData) {
  if(typeof encryptedData === "string"){
    encryptedData = $$.Buffer.from(encryptedData, "hex");
  }
  try {
    if (typeof require !== 'undefined') {
      const crypto = require("opendsu").loadAPI("crypto");
      const encryptionKey = crypto.deriveEncryptionKey(key);
      const decryptData = crypto.decrypt(encryptedData, encryptionKey);
      return decryptData.toString();
    }
  } catch (e) {
    throw e
  }
}

function createXMLHttpRequest(url, method, callback) {
  let xhr = new XMLHttpRequest();
  xhr.open(method, url);
  xhr.onload = function () {
    if (xhr.status != 200) {
      callback({errorStatus: xhr.status});
    } else {
      callback(undefined, xhr.response);
    }
  };
  xhr.onerror = function () {
    callback("Request failed");
  };
  return xhr;
}


function getCookie(cookieName) {
  const name = cookieName + "=";
  let res;
  try {
    const cookiesArr = decodeURIComponent(document.cookie).split('; ');
    cookiesArr.forEach(val => {
      if (val.indexOf(name) === 0) res = val.substring(name.length);
    })
  } catch (e) {
    console.log("error on get cookie ", e);
  }
  return res
}

export {
  getUrl,
  hash,
  generateRandom,
  goToLandingPage,
  encrypt,
  decrypt,
  createXMLHttpRequest,
  getCookie
}
