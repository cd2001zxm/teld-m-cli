/**
 * Created by chendong on 2018/9/14.
 */
import axios from 'axios'
import {setMaxDigits,RSAKeyPair,encryptedString} from './crypt/rsa'
import {EncryptInterface,cajess,dcajess} from './crypt/aes'
import {dESEncrypt,dESEncryptForSP} from './crypt/des'
import {readCookie,eraseCookie,createCookie} from './cookie'
import {saveGlobelData,getGlobelData,removeGlobelData,randomUrl,randomNum,isInApp,getAppVersion,ClearSessionCookies,getDevice,isInSP,_getQueryString} from './common'
import {getServiceUrl,getUserCenterUrl} from '../teld.config'
import qs from 'qs'

/***
 * 全局常量
 * @type {number}
 */
const SESSION_TIME_OUT = 1000*1000
const DEFALULT_AJAX_PARAM= {
  url:null,
  method:"post",
  data:null,
  sucCallbackFunc:null,
  errCallbackFunc:null,
  withCredentials:false,
  showError:true,
  istrace:true,
  tokenRetry:0,
  unsafeRetry:0,
  timeout:120000,
  isAnonymous:false,
  dataEncrypt:null,
  errorRetry:true,
  isRefreshTokenCb:false
}


//axios全局设置

//前端不默认超时时间
//axios.defaults.timeout = 180000

//默认提交类型
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

//失败重试次数
axios.defaults.retry = 3;

//重试请求的时间间隔
axios.defaults.retryDelay = 1000;

axios.interceptors.response.use(
  function axiosSuccessInterceptor(respose) {

    let options = respose.config
    let retData = respose.data

    //成功未必有返回值
    if(retData == null || retData == ""){
      if (options.sucCallbackFunc) {
        options.sucCallbackFunc(retData,respose.config);
      }
      return respose;
    }

    //异常处理，兼容不同的数据格式
    if(retData.hasOwnProperty("ErrorCode") || (retData.hasOwnProperty("errcode") && retData.errcode!="" && retData.errcode != null)){

      var ErrorCode = retData.hasOwnProperty("ErrorCode")?retData.ErrorCode:retData.errcode;
      var ErrorInfo = retData.hasOwnProperty("ErrorInfo")?retData.ErrorInfo:retData.errmsg;

      //session过期
      if(isInApp() && (ErrorCode =="TTP-SG-1013"  ||
        ErrorCode == "TTP-SG-1011" ||
        ErrorCode =="TTP-Security-0002" ||
        ErrorCode =="TTP-SG-2003")){
        window.Teld.gotoLogin();
        return respose;
      }

      //无效的Http请求上下文
      if(ErrorCode == "TTP-SG-1001"){
        goToLoginPage()
        return respose;
      }

      //session过期
      if(ErrorCode =="TTP-SG-1013"){
        if(window.handleTokenTimeout){
          var htt = window.handleTokenTimeout.call(null)
          if(htt==false)return respose;
        }else
          goToLoginPage()
        return respose;
      }

      let backoff = new Promise(function(resolve) {
        setTimeout(function() {
          resolve();
        }, options.retryDelay || 1);
      });

      //Token过期
      if((ErrorCode == "TTP-SG-1011" || ErrorCode =="TTP-Security-0002") ){

        //校验IP不一致
        if(ErrorInfo && ErrorInfo.indexOf("IP不一致")!=-1){

          //app内嵌h5的场合，调用app跳登陆
          if(isInApp()) {
            goToAppLogin();
            return respose
          }
          //ExceptionReport(this.url,this.data,xhr.responseText);
          //跳转到登陆页面
          gotoLoginConfirm("IP不一致需要重新跳转登陆")

          return respose;
        }

        if(readCookie("teldb")){

          options.tokenRetry++

          if(options.tokenRetry >= 3){
            gotoLoginConfirm("失败重试大于3次")
            return respose;
          }


          //if(options.errorRetry){

          //刷新失败跳到登录页面，成功了retry一次
          //由于有定时刷新token，不再进行队列处理
          refreshToken(options.isa).then(function () {
            //return sequence(window.refreshTokenTask, option => _commonGetData(option))
            //return _commonGetData(options)
            //
            return backoff.then(function() {
              return axios(options);
            });
          })


          //}

          return respose;
        }
        else
          goToLoginPage();
        return respose;
      }

      //时间戳不整合
      if(ErrorCode =="TTP-SG-2003" ){

        options.__retryCount = options.__retryCount || 0;

        if(options.__retryCount >= options.retry) {
          return respose;
        }

        options.__retryCount += 1;

        return backoff.then(function() {
          return axios(options);
        });

      }

    }


    //正常
    if (options.sucCallbackFunc) {
      //对结果进行
      if(options.dataEncrypt){
        var encrypt = EncryptInterface[options.dataEncrypt];
        retData.data = encrypt.decode(retData.data)
      }
      options.sucCallbackFunc(retData);
    }

    if(window.BatchID){
      //上报全链路
      var TimeSpan = (new Date()).getTime() - startTime
      //uploadTrace(data["Teld-RequestID"],TimeSpan,"OK",beginTime,ServiceId)
    }

    return respose;

  },
  function axiosRetryInterceptor(err) {

    let config = err.config;

    // If config does not exist or the retry option is not set, reject
    if(!config || !config.retry) return Promise.reject(err);


    if(window.BatchID){
      //上报全链路
      var TimeSpan = (new Date()).getTime() - startTime
      //uploadTrace(data["Teld-RequestID"],TimeSpan,"Error",config.beginTime,config.ServiceId)
    }

    let retData = err.response.data

    let ErrorCode,ErrorInfo

    try {
      ErrorCode = retData.hasOwnProperty("ErrorCode")?retData.ErrorCode:retData.errcode
      ErrorInfo = retData.hasOwnProperty("ErrorInfo")?retData.ErrorInfo:retData.errmsg
    }catch (e){
      //非控制内异常，上报异常日志返回
      //return ExceptionReport(config.url,config.data,err,ErrorCode);
    }

    //时间戳不整合
    if(ErrorCode =="TTP-SG-2003" ){

      config.__retryCount = config.__retryCount || 0;

      if(config.__retryCount >= config.retry) {
        //超出重试最大次数
        //TODO:
        // Reject with the error
        return Promise.reject();
      }


      config.__retryCount += 1;


      let backoff = new Promise(function(resolve) {
        setTimeout(function() {
          resolve();
        }, config.retryDelay || 1);
      });


      return backoff.then(function() {
        return axios(config);
      });

    }


    if (config.errCallbackFunc) {
      config.errCallbackFunc(err);
    }

    if(config.showError==false){}else{
      console.error(retData.ErrorInfo)
      //NotifyErrorInfo(_errmsg)
    }

    return Promise.resolve()
  });

/**
 * 消息提示
 * @param msg
 * @constructor
 */
// function NotifyErrorInfo(msg) {
//   alert(msg)
// }


function gotoLoginConfirm() {
  if(isInSP())return console.error("token异常，不该存在该提示，请联系陈栋")
  window.setTimeout(function () {
    if(readCookie("telda")){
      getDataAsync({
        url:getServiceUrl("UserAPI-WEBUI-Logout"),
        data:{
          logoutInfo: JSON.stringify({
            "AccessToken":readCookie("telda"),
            "TELDSID":readCookie("TELDSID")
          })
        },
        sucCallbackFunc:function (data) {
          ClearSessionCookies()
          var uri = window.location.href;

          var oldUrl = "?redirect_uri="+ encodeURIComponent(uri);
          window.location.href=getUserCenterUrl() +oldUrl;
        }
      })

    }else{
      ClearSessionCookies()
      var uri = window.location.href;
      if(window.isSaas)uri=window.location.protocol+"//"+window.p_context.SubApplication+window.domain
      var oldUrl = "?redirect_uri="+ encodeURIComponent(uri);
      window.location.href=window.UserCenterUrl +oldUrl;
    }
  },500)
}


function getCurDateFormat() {
  return (new Date()).format("yyyy-MM-dd hh:mm:ss")
}

//***********************************请求队列******************************************************

async function sequence(tasks, fn) {
  return tasks.reduce(
    (promise, task) => promise.then(() => fn(task)),
    Promise.resolve()
  )
}

//***********************************SG相关参数设置******************************************************

// function AndroidTokenTimeout() {
//   window.teld.updateRefreshToken()
// }
//
// function IOSTokenTimeout() {
//   var action = '//jsoc///{"action":"askForToken"}';
//   var iframe = document.createElement("iframe")
//   iframe.id="IOSNotifyFrame"
//   iframe.src = action;
//   iframe.width=0
//   iframe.height=0
//   document.body.appendChild(iframe)
//
// }
//
// function sendToken(accessToken,refreshToken){
//
//   //teldc必有
//   if(readCookie("teldc")=="1") createCookie("teldk",accessToken,15*24*3600)
//   else createCookie("telda",accessToken,15*24*3600)
//
//   createCookie("teldb",refreshToken,15*24*3600)
//   if(document.getElementById("IOSNotifyFrame"))document.getElementById("IOSNotifyFrame").remove()
// }
//
// function askForDeviceInfo() {
//   var action = '//jsoc///{"action":"askForDeviceInfo"}';
//   var iframe = document.createElement("iframe")
//   iframe.id="IOSDeviceInfoFrame"
//   iframe.src = action;
//   iframe.width=0
//   iframe.height=0
//   alert("askForDeviceInfo")
// }
//
// window.sendDeviceInfo = function(deviceInfo) {
//   window.deviceInfo=deviceInfo;
//   if(document.getElementById("IOSDeviceInfoFrame"))document.getElementById("IOSDeviceInfoFrame").remove()
//   createCookie("DeviceInfoForIframe",window.encodeURIComponent(deviceInfo),15*24*3600)
// }



function AndroidTokenTimeout() {
  window.teld.updateRefreshToken();
}

function IOSTokenTimeout() {
  var action = '//jsoc///{"action":"askForToken"}';
  var iframe = document.createElement("iframe");
  iframe.id = "IOSNotifyFrame";
  iframe.src = action;
  document.documentElement.appendChild(iframe);
  setTimeout(function () {
    document.documentElement.removeChild(iframe)
  }, 0)
}

function askForDeviceInfo() {
  var action = '//jsoc///{"action":"askForDeviceInfo"}';
  var iframe = document.createElement("iframe");
  iframe.id = "IOSDeviceInfoFrame";
  iframe.src = action;
  document.documentElement.appendChild(iframe);
  setTimeout(function () {
    document.documentElement.removeChild(iframe)
  }, 0)
}

function iosJSOC() {
  var iframe = document.createElement('iframe');
  iframe.src = '//JSOC///{\"action\":\"login\",\"params\":\"\"}';
  iframe.style.display = 'none';
  document.documentElement.appendChild(iframe);
  setTimeout(function () {
    document.documentElement.removeChild(iframe)
  }, 0)
}

function goToAppLogin() {

  //跳登陆前清理cookie
  //_wrpClearSessionCookies();

  if (getDevice() == "android") {
    window.teld.goToLogin();
  } else {
    var src = 'http://JSOC///{\"action\":\"login\",\"params\":\"\"}';
    iosJSOC(src);
  }
};

async function _appMutual() {

  var promise = void 0;

  if(window.navigator.userAgent.indexOf("TeldIosWebView") !=-1){

    promise = new Promise((resolve,reject)=>{
      //IOS获取设备信息
      window.sendDeviceInfo = function(deviceInfo) {
        resolve(deviceInfo);
      }
      askForDeviceInfo();
    })
  }

  if(window.navigator.userAgent.indexOf("TeldAndroidWebView") !=-1){
    promise = new Promise((resolve,reject)=>{
      window.deviceInfo = window.teld.askForDeviceInfo()
      resolve(deviceInfo);
    })
  }

  return promise
}

/**
 * app内运行的sg参数设置
 * @param data
 * @param time
 * @param istrace
 * @private
 */
async function _appSgParamSetting(data,time,istrace) {

  // var isa = getTokenType()=="1"?true:false
  //
  // let dtime = Math.round(new Date().getTime()/1000)
  //
  // //需要时间校准
  // var ttt = getGlobelData("teldTTT")?getGlobelData("teldTTT"):0;
  // if(time){
  //
  //   ttt = time - dtime;
  //   saveGlobelData("teldTTT",ttt)
  // }
  //
  // dtime = dtime + new Number(ttt)
  //
  // data["X-Token"] = isa?readCookie("teldk"):getAccesstoken()
  // //时间戳明文
  // data["ATS"]=dtime
  // //时间戳密文
  // data["AVER"]=dESEncrypt(dtime+"")
  // //来源设备IP
  // data["ASDI"]=readCookie("deviceID")
  // //来源
  // data["ARS"]="APP"
  // //城市名称
  // data["ACOI"]=readCookie("ta_cityName")
  // //定位城市
  // data["ACOL"]=readCookie("ta_cityCode")
  var deviceInfo = await _appMutual(data, time, istrace);

  //无身份的时候，app返回为空
  if(!deviceInfo || deviceInfo == "")return window.alert("和app交互失败")

  var dInfo = deviceInfo.split(",")

  var isa = readCookie("teldc")=="1"?true:false

  data["X-Token"] = isa?readCookie("teldk"):readCookie("telda")
  //时间戳明文
  data["ATS"]=dInfo[1]
  //时间戳密文
  data["AVER"]=dInfo[2]
  //来源设备IP
  data["ASDI"]=dInfo[0]
  //来源
  data["ARS"]="APP"
  //城市名称
  data["ACOI"]=dInfo[4]
  //定位城市
  data["ACOL"]=dInfo[3]

  if(window.BatchID && istrace){
    data["Teld-RequestID"]=(new Date()).getTime()+""+randomNum(10)
  }

  return data;
}

function _spSgParamSetting(data,time,istrace) {

  var isa = getTokenType()=="1"?true:false

  let dtime = Math.round(new Date().getTime()/1000)

  //需要时间校准
  var ttt = getGlobelData("teldTTT")?getGlobelData("teldTTT"):0;
  if(time){

    ttt = time - dtime;
    saveGlobelData("teldTTT",ttt)
  }

  dtime = dtime + new Number(ttt)

  data["X-Token"] = isa?readCookie("teldk"):getAccesstoken()
  //时间戳明文
  data["STS"]=dtime
  //时间戳密文
  data["SVER"]=dESEncryptForSP(dtime+"")
  //来源设备IP
  data["SSDI"]=getIP()
  //来源
  data["SRS"]="SP"
  //城市名称
  data["SCOI"]=""
  //定位城市
  data["SCOL"]=""

  return data
}

/**
 * web端运行的sg参数设置
 * @param data
 * @param time
 * @param istrace
 * @private
 */
async function _webSgParamSetting(data,time,istrace) {

  var __c ="010001";
  var __d ="C2D84A72668932EBE5CC2BADB5DE288E59AD587775C1E45F33F6CC9DAB376C793AFF12050C0648D5C3016F685B9F4FA2460A59B6B07793808B4E68A883CA2830FD7895C66F68F64A829DB99DEDE978EC2E04711184A872C1F43956B1B72CFA803C1D677BAE386209368B3F3ED7A8CB06BEC64B0D0369EE62A49E6B417FC55959"
  setMaxDigits(129); //131 => n的十六进制位数/2+3

  var key = new RSAKeyPair(__c, '', __d); //10001 => e的十六进制

  var ip = getIP()

  var dtime = Math.round(new Date().getTime()/1000)

  //test
  //dtime = dtime - 120

  //需要时间校准
  var ttt = getGlobelData("teldTTT")?getGlobelData("teldTTT"):0;
  if(time){

    ttt = time - dtime;
    saveGlobelData("teldTTT",ttt)
  }

  dtime = dtime + new Number(ttt)


  var dt = encryptedString(key, dtime+"");

  var isa = (!getTokenType() || getTokenType()=="1")?true:false;

  data["X-Token"] = isa?readCookie("teldk"):getAccesstoken()
  //时间戳明文
  data["WTS"]=dtime
  //时间戳密文
  data["WVER"]=dt
  //来源设备IP
  data["WSDI"]=ip
  //来源
  data["WRS"]="WEB"
  //城市名称
  data["WCOI"]=""
  //定位城市
  data["WCOL"]=""
  //发送时的客户端时间
  data["ClientTime"] = getCurDateFormat()
  //客户端存储的时间差
  data["DiffentTime"] = ttt


  //请求批次号
  if(window.BatchID && istrace){
    data["Teld-RequestID"]=(new Date()).getTime()+""+randomNum(10)
  }

  return data
}



/**
 * sg请求参数设置
 * @param data
 * @param time
 * @param istrace
 * @returns {*}
 * @private
 */
async function  sgParamSetting(data,time,istrace) {

  if(isInSP())return _spSgParamSetting(data,time,istrace)
  if(!isInApp())return _webSgParamSetting(data,time,istrace);
  return  _appSgParamSetting(data,time,istrace);

  // var type = getTokenType()
  // if(!type){
  //   //第一次匿名登陆(没有telda也没有teldc)也会走这里
  //   if(!readCookie("telda"))
  //     _webSgParamSetting(data,time,istrace);
  // }
  // //匿名走web
  // else if(type=="1"){
  //   _webSgParamSetting(data,time,istrace);
  // }else{
  //   _appSgParamSetting(data,time,istrace);
  // }

}




//****************************************返回登陆&&匿名登陆&&token刷新*************************************************

function getIP() {
  if(isInSP() && _getQueryString("DeviceId",window.location.href)){
    createCookie("teldz",_getQueryString("DeviceId",window.location.href),8)
  }
  return readCookie("teldz");
}

export function goToLoginPage(){

  if(isInSP()) return console.error("刷新token异常，不该存在该提示，请联系陈栋")

  if(isInApp()) return window.Teld.gotoLogin()
  //清理缓存
  ClearSessionCookies();

  let oldUrl = "?redirect_uri="+ encodeURIComponent(window.location.href);
  window.location.href=getUserCenterUrl() +oldUrl;

}

function getAccesstoken(){
  return readCookie("telda")
}

function getRefreshToken() {
  return readCookie("teldb")
}

function getTokenType() {
  return readCookie("teldc")
}

/***
 * 匿名登陆
 */
async function aLogin() {

  let param = JSON.stringify({"DeviceType":"WEB","ReqSource":100,"ClientIP":getIP()})
  if(isInSP()){
    param = JSON.stringify({"DeviceType":"SP","ReqSource":100,"DeviceId":getIP()})
  }
  return await _refreshToken(param,getServiceUrl("UserAPI-WEBUI-ASLogin"),"loginInfo",true)
}

function TeldDecodeUrl(url) {
  url = decodeURIComponent(url)
  url = url.split('codedStringTeld')
  url = url.join('.')
  return url
}
/**
 * 刷新Token
 * @param func 刷新Token后，回调函数
 */
export async function refreshToken(isa) {

  if(isInApp()) {

    return _refreshAppToken();

    // if(getAppVersion()>3)return _refreshAppToken();
    //
    // //app3.8版本，非匿名
    // if(getTokenType()=="0")return _refreshAppToken();

    //app3.8版本，刷新匿名token时，走web
  }

  var refresh = getRefreshToken();
  if(!refresh){
    //非匿名情况下，返回登陆页面
    if(!isa)return goToLoginPage();

    //匿名情况下,匿名登陆
    aLogin();

    //匿名刷新失败，do nothing
    if(!readCookie("teldb"))return;

  }

  var rToken = refresh.split(".").reverse().join(".")

  var param = JSON.stringify({"DeviceType":"WEB","ReqSource":100,"RefreshToken":rToken,"ClientIP":getIP()})
  var url = !isa?getServiceUrl("UserAPI-WEBUI-SRefreshToken"):getServiceUrl("UserAPI-WEBUI-ASRefreshToken")
  if(isInSP()){
    if(rToken.indexOf(".")==-1){
      rToken = TeldDecodeUrl(rToken)
    }
    param = JSON.stringify({"DeviceType":"SP","ReqSource":100,"RefreshToken":rToken,"DeviceId":getIP()})

  }
  return await _refreshToken(param,url,"refreshToken",isa)
}


//function _refreshAppToken() {

  // if(window.navigator.userAgent.indexOf("TeldIosWebView") !=-1){
  //   IOSTokenTimeout()
  //   return
  // }
  // if(window.navigator.userAgent.indexOf("TeldAndroidWebView") !=-1){
  //   AndroidTokenTimeout()
  //   return
  // }
//}

async function _refreshAppToken(isa) {

  if (window.navigator.userAgent.indexOf("TeldIosWebView") != -1) {

    return new Promise((resolve,reject)=>{
      //app回调方法
      window.sendToken = function (accessToken, refreshToken) {

        //teldc必有
        if (readCookie("teldc") == "1")
          _createCookie("teldk", accessToken, 15 * 24 * 3600);
        else
          _createCookie("telda", accessToken, 15 * 24 * 3600);

        _createCookie("teldb", refreshToken, 15 * 24 * 3600);

        resolve();
      }
      IOSTokenTimeout();
    })
  }
  if (window.navigator.userAgent.indexOf("TeldAndroidWebView") != -1) {

    return new Promise((resolve,reject)=>{
      AndroidTokenTimeout();
      resolve();
    })
  }

}



async function _refreshToken(param,url,paremkey,isa) {

  var uts = Math.round(new Date().getTime()/1000)+""
  var uver = cajess(uts).substring(0,16)
  var paramAfterEdit = cajess(param,uts+"000000",uver)

  var data = {}
  data[paremkey] = JSON.stringify({
    Data:paramAfterEdit,
    UTS:uts,
    UVER:uver,
    UUID:(new Date()).getTime()+""+randomNum(10)
  })

  sgParamSetting(data);

  return new Promise((resolve,reject)=>{
    axios({
      url: randomUrl(url),
      rawRul:url,
      method: "post",
      timeout:10000,
      data: qs.stringify(data)
    }).then(respose => {
      let rdata = respose.data

      if(rdata && rdata.state=="1"){

        var decryptData = dcajess(rdata.data)
        var realData = dcajess(decryptData.Data,decryptData.UTS+"000000",decryptData.UVER)

        if(realData.TokenType == 1){
          createCookie("teldk",realData.AccessToken,realData.ExpiresIn*1000);
          if(paremkey=="loginInfo") createCookie("teldz",(isInSP()?readCookie("teldz"):realData.ClientIP),60000*1000);
          else createCookie("teldz",readCookie("teldz"),60000*1000);
        }else{
          createCookie("telda",realData.AccessToken,realData.ExpiresIn);
          createCookie("teldz",readCookie("teldz"),60000*1000);

        }
        createCookie("teldb",realData.RefreshToken,60000*1000);
        createCookie("teldc",realData.TokenType,60000*1000);
      }else{

        //返回到登录页面
        if(window.handleTokenTimeout){
          var htt = window.handleTokenTimeout.call(null)
          if(htt==false)return
        }else
        if(!isa)
          goToLoginPage()
      }

      resolve("refrshok")
    })
  })

}


//****************************************ajax发送***************************************************
// window.refreshTokenTask = []
// window.tokenRefreshing = false
/**
 *
 * @param option
 * @private
 */
async function _commonGetData(option){

  let options = Object.assign({},DEFALULT_AJAX_PARAM, option);

  // /**
  //  * 如果目前正在刷新token，新进请求加入队列，等待token刷新完毕后执行
  //  */
  // if(options.isRefreshTokenCb==false && tokenRefreshing){
  //   window.refreshTokenTask.push(Object.assign({},options,{isRefreshTokenCb:true}))
  //   return
  // }

  //处理匿名的SG请求
  var isa = options.isAnonymous || false;

  var type = readCookie("teldc")

  //没有teldc就认为是匿名，需要匿名登陆
  if (type == "1" || type==null) {
    isa = true;
  }

  //匿名
  if(type == 1 && !readCookie("teldk") && readCookie("teldb")){
    await refreshToken(true)
  }
  if(type == 0 && !readCookie("telda") && readCookie("teldb")){
    await refreshToken(false)
  }

  if(isa){
    /***
     * teldc不存在:第一次登陆，未有历史信息
     * teldk不存在，需要重新匿名登陆
     */
    if(!getTokenType()){

      //匿名登陆
      await aLogin()
    }

    if(!readCookie("teldk") && getTokenType() && getRefreshToken() && getTokenType()=="1"){
      //匿名刷新
      await refreshToken(true)
    }

  }

  let url = randomUrl(options.url);
  let startTime = (new Date()).getTime()
  let beginTime = (new Date()).format("yyyy-MM-dd hh:mm:ss.S")
  let ServiceId = _getQueryString("SID",url)

  let data = options.data?options.data:{}

  if(options.dataEncrypt){
    var encrypt = EncryptInterface[options.dataEncrypt];
    data = encrypt.encode(data)
  }

  data = await sgParamSetting(data,null,options.istrace);

  let axiosConfig = Object.assign(options,{
    method: 'post',
    rawUrl:options.url,//记录原始的url
    data: qs.stringify(data),
    isa:isa
  })

  return new Promise((resolve,reject)=>{
    axios(axiosConfig).then(respose=>{
      resolve({data:respose.data})
    })
  })


}


/**
 * 匿名请求
 * @param url
 * @param type
 * @param data
 * @param sucCallbackFunc
 * @param errCallbackFunc
 * @param scope
 * @param withCredentials
 * @param showError
 * @param istrace
 * @param timeout
 * @returns {*}
 */
export function queryDataAsync(dap) {

  dap.isAnonymous = true
  return _commonGetData(dap)
}

function waitFor(ms) {
  return new Promise(resolve => setTimeout(resolve, ms || 0))
}

/**
 * 非匿名请求
 * @url                         请求的地址
 * example: 'http://www.baidu.com?keyword=name'
 * @type                      请求方式
 * example:'post' 或 'get'
 * @data                      发送给服务器的数据
 * example:{'name':'tom','age':20}
 * @sucCallbackFunc     执行成功后的回调函数
 * example:function(data, textStatus){}
 * @comCallbackFunc   请求完成后的回调函数
 * example:function(xmlHttpRequest, textStatus){}
 * @errCallbackFunc     请求失败后的回调函数
 * example:function(xmlHttpRequest, textStatus, errorThrown){}
 */
export async function getDataAsync(dap) {

  dap.isAnonymous = false

  return _commonGetData(dap)
}



/**
 * AES加密匿名接口
 * @param url
 * @param type
 * @param data
 * @param sucCallbackFunc
 * @param errCallbackFunc
 * @param scope
 * @param withCredentials
 * @param showError
 * @param istrace
 * @param timeout
 * @return {*}
 */
export async function queryDataAsyncAes(url, type, data, sucCallbackFunc,errCallbackFunc,scope,withCredentials,showError,istrace,timeout) {

  dap.isAnonymous = true
  dap.dataEncrypt = "AES"
  return _commonGetData(dap)

}

/**
 * AES加密非匿名接口
 * @param url
 * @param type
 * @param data
 * @param sucCallbackFunc
 * @param errCallbackFunc
 * @param scope
 * @param withCredentials
 * @param showError
 * @param istrace
 * @param timeout
 * @return {*}
 */
export function getDataAsyncAes(dap) {

  dap.isAnonymous = false
  dap.dataEncrypt = "AES"
  return _commonGetData(dap)

}

function autoRefreshToken(isa) {

  window.setInterval(function () {
      refreshToken(getTokenType()=="0"?false:true)
  },60000)
}

//主动刷新token
if(!isInApp() && !isInSP()){
  var tokenInterval = window.setInterval(function () {
    if(getTokenType()){
      autoRefreshToken()
      window.clearInterval(tokenInterval)
    }
  },60000)
}


export async function getUserInfo() {

  var url = getServiceUrl("WRPFrame-GetCurrentUser")
  var retData = "";
  var dap = {
    url: url,
    sucCallbackFunc:function (result){
      retData = result
    }
  }

  return await _commonGetData(dap)

}

