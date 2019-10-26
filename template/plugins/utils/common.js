/**
 * Created by chendong on 2018/9/14.
 */
import {readCookie,eraseCookie,createCookie} from './cookie'
import {goToLoginPage,getUserInfo} from './sgApi'

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
    createCookie(key,value)
}

export function getGlobelData(key) {
  if(_storageTest(window.sessionStorage))
    return window.sessionStorage.getItem(key)
  return readCookie(key)
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

  var clientWidth = document.documentElement.clientWidth || document.body.clientWidth
  return clientWidth > 1024?false:true

}

export function isLogin() {
  if(readCookie("teldb") && readCookie("teldc") && readCookie("teldc")=="0")
    return true;
  return false;
}

export function ClearSessionCookies() {
  eraseCookie("TELDSID")
  eraseCookie("telda")
  eraseCookie("teldb")
  eraseCookie("teldc")
  eraseCookie("teldd")
  eraseCookie("teldk");
  eraseCookie("teldz")
  eraseCookie("TELDSID")
  removeGlobelData("toc_ui")
}

export async function getSession() {

  if(!isLogin()){
    ClearSessionCookies()
    goToLoginPage();
    return null
  }

  var val = getGlobelData("toc_ui")
  if(val)return JSON.parse(val);

  //获取session信息
  var userinfo = await getUserInfo()
  userinfo = userinfo.data
  saveGlobelData("toc_ui",JSON.stringify(userinfo))

  return userinfo;
}

export function getOrigin() {
  return location.protocol +"//"+ location.host
}

export function getBaseLinkUrl(subUrl) {
  return getOrigin()+subUrl
}

export function LoadGaoDeMap(cb) {
  if (!window.AMap) {
    var url = `https://webapi.amap.com/maps?v=1.4.15&key=db9741b828f4ac811937b1793ce4b950&plugin=AMap.ToolBar&callback=MapInit`;
    var jsapi = window.document.createElement('script');
    jsapi.charset = 'utf-8';
    jsapi.src = url

    window.document.head.appendChild(jsapi);
    window.MapInit = function () {
      cb()
    }
  } else {
    cb()
  }
}

export function getDevice() {
  var ua = navigator.userAgent.toLowerCase();
  if (ua.match(/MicroMessenger/i) == 'micromessenger') {
    return "wx";
  } else if (/iphone|ipad|ipod/.test(ua)) {
    return "ios";
  } else if (/android/.test(ua)) {
    return "android";
  }
}

export function _getQueryString(name,url) {
  var reg = new RegExp(name+'=([^&]*)', 'i');

  var r = (url?url: window.location.href).match(reg);
  if (r != null) {
    return r[1];
  }
  return null;
}

export function isInSP() {

  if(readCookie("issp")=="sp")return true
  var sp1 = _getQueryString("sp1",window.location.href)
  if(sp1){
    createCookie("issp","sp",8)
    return true;
  }
  return false;
}
