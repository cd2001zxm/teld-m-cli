/**
 * Created by chendong on 2018/9/14.
 */
import CryptoJS from 'crypto-js'
import {randomNum} from '../common'

window.__a="7fb498553e3c462988c3b9573692bd5f"
window.__b="98d71fe589499967"
window.__e="ErYu78ijuVaM7Y0UqwvpO738uNC9ALF7"
window.__f="Ol9mqvZ6ijnytr7O"
const __e="dGVsZDIwMThzaWdua2V5"

export function cajess(endData,a,b) {
  window._a="6fb498553e3c462988c3b9573692bd5f";
  window._b="98d71fe589499968";
  var key = a?CryptoJS.enc.Utf8.parse(a):CryptoJS.enc.Utf8.parse(window.__a);
  var iv = b?CryptoJS.enc.Utf8.parse(b):CryptoJS.enc.Utf8.parse(window.__b);
  var encryptResult = CryptoJS.AES.encrypt(endData,key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  return CryptoJS.enc.Base64.stringify(encryptResult.ciphertext);
}

export function dcajess(endData,a,b) {
  window._a="6fb498553e3c462988c3b9573692bd5f";
  window._b="98d71fe589499968";
  var key = a?CryptoJS.enc.Utf8.parse(a):CryptoJS.enc.Utf8.parse(window.__a);
  var iv = b?CryptoJS.enc.Utf8.parse(b):CryptoJS.enc.Utf8.parse(window.__b);
  var baseResult=CryptoJS.enc.Base64.parse(endData);
  var ciphertext=CryptoJS.enc.Base64.stringify(baseResult);
  var decryptResult = CryptoJS.AES.decrypt(ciphertext,key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  var resData=CryptoJS.enc.Utf8.stringify(decryptResult);
  return JSON.parse(resData)
}
function _cajess(endData,a,b) {
  window._e="6fb498553e3c462988c3b9573692bd5f";
  window._f="98d71fe589499968";
  var key = a?CryptoJS.enc.Utf8.parse(a):CryptoJS.enc.Utf8.parse(window.__e);
  var iv = b?CryptoJS.enc.Utf8.parse(b):CryptoJS.enc.Utf8.parse(window.__f);
  var encryptResult = CryptoJS.AES.encrypt(endData,key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  return CryptoJS.enc.Base64.stringify(encryptResult.ciphertext);
}

function _dcajess(endData,a,b) {
  window._e="6fb498553e3c462988c3b9573692bd5f";
  window._f="98d71fe589499968";
  var key = a?CryptoJS.enc.Utf8.parse(a):CryptoJS.enc.Utf8.parse(window.__e);
  var iv = b?CryptoJS.enc.Utf8.parse(b):CryptoJS.enc.Utf8.parse(window.__f);
  var baseResult=CryptoJS.enc.Base64.parse(endData);
  var ciphertext=CryptoJS.enc.Base64.stringify(baseResult);
  var decryptResult = CryptoJS.AES.decrypt(ciphertext,key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  var resData=CryptoJS.enc.Utf8.stringify(decryptResult);
  return JSON.parse(resData)
}

//for bussinis
function b_cajess(param) {

  var uts = Math.round(new Date().getTime()/1000)+""
  var uver = _cajess(uts).substring(0,16)
  var paramAfterEdit = _cajess(param,uts+"000000",uver)
  return JSON.stringify({
    Data:paramAfterEdit,
    UTS:uts,
    UVER:uver,
    UUID:(new Date()).getTime()+""+randomNum(10)
  })
}


function b_dcajess(result) {
  var decryptData = _dcajess(result.data)
  var realData = _dcajess(decryptData.Data,decryptData.UTS+"000000",decryptData.UVER)
  return realData
}

function AesEncode(param) {
  var ret = {}
  var paramkey = param.paramName
  var paramData = param.paremData
  if(Array.isArray(paramkey)){
    for(var i=0;i<paramkey.length;i++){
      ret[paramkey[i]] = b_cajess(paramData[i])
    }
  }else{
    ret[paramkey] = b_cajess(paramData)
  }
  return ret;
}

function AesDecode(result) {
  if(!result || result.hasOwnProperty("data")==false || !result.data)return null;
  return b_dcajess(result)
}

export const EncryptInterface = {
  "AES":{
    "encode":AesEncode,
    "decode":AesDecode
  }
}
