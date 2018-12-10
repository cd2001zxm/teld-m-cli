/**
 * Created by chendong on 2018/9/15.
 */
//自动分析域名后缀
const domain = function (domain) {
  var ares = domain.split(':')[0].split('.')
  ares.shift()
  ares.unshift('')
  return ares.join('.')
}(document.domain);


export default {
  newTokenRefreshUrl:"//userapisg"+domain+"/api/invoke?SID=UserAPI-WEBUI-SRefreshToken",
  ATokenRefreshUrl :"//userapisg"+domain+"/api/invoke?SID=UserAPI-WEBUI-ASRefreshToken",
  aLoginUrl : "//userapisg"+domain+"/api/invoke?SID=UserAPI-WEBUI-ASLogin",

}
