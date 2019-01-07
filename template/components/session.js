/**
 * Created by chendong on 2019/1/3.
 */
function isWeb() {
  if (typeof XMLHttpRequest !== 'undefined') {
    // 浏览器
    return true

  } else if (typeof process !== 'undefined') {
    // node平台
    return false
  }
  return true
}

/**
 * 后端判断是否登录
 * @param content asyncData参数上下文
 * @return {*|boolean}
 */
export function isLogin(content) {
  if(process.client){
    const {readCookie} = require('@@/plugins/utils/cookie')
    let islogin = (readCookie("teldb") && readCookie("teldc") && readCookie("teldc")=="0")
    return islogin
  }else{
    const cookie = require('cookie')
    let cookies = cookie.parse(content.req.headers.cookie || '');
    //如果有身份
    let islogin = (cookies["telda"] && cookies["teldb"] && cookies["teldc"]=="0")
    return islogin

  }
}

/**
 * 检查是否登录并跳转用户中心
 * @param that vue实例
 */
// export function checkAuthAndRedirect(that) {
//   if(!that.$utils.cookie.readCookie("teldb")){
//     let teldConfig = require('@@/plugins/teld.config')
//     that.$utils.common.ClearSessionCookies()
//     let oldUrl = "?redirect_uri="+ encodeURIComponent(window.location.href);
//     window.location.href=teldConfig.getUserCenterUrl() +oldUrl;
//     return;
//   }
// }

export function checkClient(that) {

  let locations = location.pathname.split("/")
  let keyapp = locations[1]

  if(that.$utils.common.isMobile()){
    if(locations[2].startsWith("p")){
      window.location.href = location.protocol+"//"+location.host+"/"+keyapp+"/m000001"
      return
    }
  }else{
    if(locations[2].startsWith("m")){
      window.location.href = location.protocol+"//"+location.host+"/"+keyapp+"/p000001"
      return
    }
  }
}
