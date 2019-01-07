/**
 * Created by chendong on 2018/9/14.
 */
export function readCookie(n) {
  for (var t, r = n + "=", u = document.cookie.split(";"), i = 0; i < u.length; i++) {
    for (t = u[i]; t.charAt(0) == " ";)t = t.substring(1, t.length);
    if (t.indexOf(r) == 0)return t.substring(r.length, t.length)
  }
  return null
}

export function eraseCookie(n) {
  createCookie(n, "", -1)
}

/**
 *
 */
export function createCookie(n,t,i) {
  var r, u;
  i ? (r = new Date, r.setTime(r.getTime() + i * 864e5), u = "; expires=" + r.toGMTString()) : u = "";
  var tempList = document.domain.split(".");
  var domain;
  var len = tempList.length;
  if(len == 1){
    document.cookie = n + "=" + t + u + "; path=/";
  }else{
    domain = function (domain) {
      var ares = domain.split(':')[0].split('.')
      ares.shift()
      ares.unshift('')
      return ares.join('.')
    }(document.domain);
    document.cookie = n + "=" + t + u + "; path=/;domain="+domain;
  }
}




