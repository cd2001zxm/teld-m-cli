/**
 * Created by chendong on 2018/10/25.
 */
const CryptoJS = require('crypto-js')

export function dESEncrypt(val){

  const _a="UQInaE9V";
  const _b="siudqUQoprVNjiA7";
  var key = CryptoJS.enc.Utf8.parse(_a);
  var iv = CryptoJS.enc.Utf8.parse(_b);
  var encryptResult = CryptoJS.DES.encrypt(val,key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  return CryptoJS.enc.Base64.stringify(encryptResult.ciphertext);
}

export function dESEncryptForSP(val){

  const _a="IJL9qaZ7";
  const _b="t9TEPqji86aMVuUE";
  var key = CryptoJS.enc.Utf8.parse(_a);
  var iv = CryptoJS.enc.Utf8.parse(_b);
  var encryptResult = CryptoJS.DES.encrypt(val,key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  return CryptoJS.enc.Base64.stringify(encryptResult.ciphertext);
}
