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

var _nginxsg_ = '//sgi' + domain;
if (!/^\.teld\.(cn|net)+$/i.test(domain)) _nginxsg_ += ':7777';



export function getServiceUrl(sid) {
    return _nginxsg_+"/api/invoke?SID="+sid
}

export function getUserCenterUrl() {
  return "//user" + domain
}

