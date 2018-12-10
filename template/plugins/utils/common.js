/**
 * Created by chendong on 2018/9/14.
 */
import ck from './cookie'

function _storageTest(storage){

  if(!!storage){
    try {
      storage.setItem("key", "value");
      storage.removeItem("key");
      return true;
    } catch(e){
      return false;
    }
  }else{
    return false;
  }
}

export function saveGlobelData(key,value) {
  if(_storageTest(window.sessionStorage))
    window.sessionStorage.setItem(key,value)
  else
    ck.createCookie(key,value)
}

export function getGlobelData(key) {
  if(_storageTest(window.sessionStorage))
    return window.sessionStorage.getItem(key)
  return ck.readCookie(key)
}

export function removeGlobelData(key) {
  if(_storageTest(window.sessionStorage))
    window.sessionStorage.removeItem(key)
  else
    ck.eraseCookie(key)
}

/**
 * 给url添加随机数
 * @param url
 * @returns {*}
 */
export function randomUrl(url) {
  if (url.indexOf("?") >= 0) {
    url = url + "&r=" + Math.random();
  } else {
    url = url + "?r=" + Math.random();
  }
  return url;
}

/**
 * 获取一定长度的随机数
 * @param n
 * @returns {string}
 */
export function randomNum(n) {
  var rnd = "";
  for (var i = 0; i < n; i++) {
    rnd += Math.floor(Math.random() * 10);
  }
  return rnd;
}

/**
 * 增加日期格式化方法
 * @param fmt
 * @returns {*}
 */
Date.prototype.format = function(fmt) {
  var o = {
    "M+" : this.getMonth()+1,                 //月份
    "d+" : this.getDate(),                    //日
    "h+" : this.getHours(),                   //小时
    "m+" : this.getMinutes(),                 //分
    "s+" : this.getSeconds(),                 //秒
    "q+" : Math.floor((this.getMonth()+3)/3), //季度
    "S"  : this.getMilliseconds()             //毫秒
  };
  if(/(y+)/.test(fmt)) {
    fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
  }
  for(var k in o) {
    if(new RegExp("("+ k +")").test(fmt)){
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
    }
  }
  return fmt;
}

/**
 * 判断是否在特来电app中
 * @returns {boolean}
 */
export function isInApp() {
  return window.navigator.userAgent.indexOf("TeldIosWebView") !=-1
    || window.navigator.userAgent.indexOf("TeldAndroidWebView") !=-1
}

/**
 * 获取特来电app的版本
 * @return 返回版本号的首位
 */
export function getAppVersion() {
  var version = readCookie("ta_appVersion")
  var mask = parseInt(version.split(".")[0])
  return mask;
}

/**
 * 判断是否在手机中
 * @return {boolean}
 */
export function isMobile() {
  var ua = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|phone|micromessenger|dingtalk/i.test(ua))
    return true
  return false

}
