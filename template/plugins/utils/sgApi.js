/**
 * Created by chendong on 2018/9/14.
 */
import axios from 'axios'
import {setMaxDigits,RSAKeyPair,encryptedString} from './crypt/rsa'
import {EncryptInterface,cajess,dcajess} from './crypt/aes'
import {readCookie,eraseCookie,createCookie} from './cookie'
import {saveGlobelData,getGlobelData,removeGlobelData,randomUrl,randomNum,isInApp,getAppVersion,ClearSessionCookies} from './common'
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


//*************************************axios全局设置****************************************************
//number of milliseconds
//axios.defaults.timeout = 180000
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

//请求发送前，加入sg相关信息
axios.defaults.transformRequest=[function (data, headers) {
  // Do whatever you want to transform the data
  return data;
}]

//失败重试次数
axios.defaults.retry = 3;

//请求的间隙
axios.defaults.retryDelay = 1000;

// axios.defaults.paramsSerializer = function(params) {
//   return qs.stringify(params)
// }

// axios.interceptors.request.use(function (config) {
//   return config;
// }, function (error) {
//   return Promise.reject(error);
// });

axios.interceptors.response.use(
  function axiosSuccessInterceptor(respose) {

    let options = respose.config
    let retData = respose.data

    //成功未必有返回值
    if(retData == null || retData == ""){
      if (options.sucCallbackFunc) {
        options.sucCallbackFunc(retData,respose.config);
      }
      return respose
    }

    //异常
    if(retData.hasOwnProperty("ErrorCode") || (retData.hasOwnProperty("errcode") && retData.errcode!="" && retData.errcode != null)){


      var ErrorCode = retData.hasOwnProperty("ErrorCode")?retData.ErrorCode:retData.errcode;
      var ErrorInfo = retData.hasOwnProperty("ErrorInfo")?retData.ErrorInfo:retData.errmsg;

      //session过期
      if(isInApp() && (ErrorCode =="TTP-SG-1013"  ||
        ErrorCode == "TTP-SG-1011" ||
        ErrorCode =="TTP-Security-0002" ||
        ErrorCode =="TTP-SG-2003")){
        window.Teld.gotoLogin();
        return respose
      }

      //无效的Http请求上下文
      if(ErrorCode == "TTP-SG-1001"){
        goToLoginPage()
        return respose
      }


      //session过期
      if(ErrorCode =="TTP-SG-1013"){
        if(window.handleTokenTimeout){
          var htt = window.handleTokenTimeout.call(null)
          if(htt==false)return respose
        }else
          goToLoginPage()
        return respose
      }


      //Token过期
      if((ErrorCode == "TTP-SG-1011" || ErrorCode =="TTP-Security-0002") ){

        //校验IP不一致
        if(ErrorInfo && ErrorInfo.indexOf("IP不一致")!=-1){

          //app内嵌h5的场合，调用app跳登陆
          if(isInApp())return goToAppLogin();
          //ExceptionReport(this.url,this.data,xhr.responseText);
          //跳转到登陆页面
          gotoLoginConfirm(window.localeMessage.localeMsg.SGIPChange)

          return respose
        }

        if(readCookie("teldb")){

          options.tokenRetry++

          if(options.tokenRetry >= 3){
            gotoLoginConfirm(window.localeMessage.localeMsg.SGRefreshTokenFalse)
            return respose
          }

          if(options.errorRetry){

            //刷新失败跳到登录页面，成功了retry一次
            //由于有定时刷新token，不再进行队列处理
            refreshToken(options.isa).then(function () {
              //return sequence(window.refreshTokenTask, option => _commonGetData(option))
              return _commonGetData(options)
            })


          }


          return respose
        }
        else
          goToLoginPage();
        return respose
      }

      //时间戳不整合
      if(ErrorCode =="TTP-SG-2003" ){

        options.__retryCount = options.__retryCount || 0;

        if(options.__retryCount >= options.retry) {
          //超出重试最大次数
          //TODO:
          // Reject with the error
          return Promise.reject(err);
        }


        options.__retryCount += 1;


        let backoff = new Promise(function(resolve) {
          setTimeout(function() {
            resolve();
          }, options.retryDelay || 1);
        });


        return backoff.then(function() {
          return axios(config);
        });

      }

    }else{

      if(isInApp() && ret.data=="stimeout"){
        goToAppLogin();return respose
      }

    }

    //正常
    if (options.sucCallbackFunc) {
      //对结果进行
      if(options.dataEncrypt){
        var encrypt = EncryptInterface[options.dataEncrypt];
        retData = encrypt.decode(retData)
      }
      options.sucCallbackFunc(retData);
    }

    if(window.BatchID){
      //上报全链路
      var TimeSpan = (new Date()).getTime() - startTime
      uploadTrace(data["Teld-RequestID"],TimeSpan,"OK",beginTime,ServiceId)
    }

    return respose

  },
  function axiosRetryInterceptor(err) {

    console.log("=========axiosRetryInterceptor ======")
    let config = err.config;

    // If config does not exist or the retry option is not set, reject
    if(!config || !config.retry) return Promise.reject(err);


    if(window.BatchID){
      //上报全链路
      var TimeSpan = (new Date()).getTime() - startTime
      uploadTrace(data["Teld-RequestID"],TimeSpan,"Error",config.beginTime,config.ServiceId)
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
        return Promise.reject(err);
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
      let _errmsg = retData.ErrorInfo
      NotifyErrorInfo(_errmsg)
    }

    return Promise.resolve()
});

/**
 * 消息提示
 * @param msg
 * @constructor
 */
function NotifyErrorInfo(msg) {
  alert(msg)
}

function _getQueryString(name,url) {
  var reg = new RegExp(name+'=([^&]*)', 'i');

  var r = (url?url: window.location.href).match(reg);
  if (r != null) {
    return r[1];
  }
  return null;
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

/**
 * app内运行的sg参数设置
 * @param data
 * @param time
 * @param istrace
 * @private
 */
function _appSgParamSetting(data,time,istrace) {

  if(window.navigator.userAgent.indexOf("TeldIosWebView") !=-1){

    askForDeviceInfo();
  }
  if(window.navigator.userAgent.indexOf("TeldAndroidWebView") !=-1){

    window.deviceInfo = window.teld.askForDeviceInfo()
  }


  //无身份的时候，app返回为空
  if(!window.deviceInfo || window.deviceInfo == "")return
  var dInfo = window.deviceInfo.split(",")

  //window.Teld.getDeviceInfo
  var isa = getTokenType()=="1"?true:false


  data["X-Token"] = isa?readCookie("teldk"):getAccesstoken()
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

  window.deviceInfo = ""
}

/**
 * web端运行的sg参数设置
 * @param data
 * @param time
 * @param istrace
 * @private
 */
function _webSgParamSetting(data,time,istrace) {

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
}


/**
 * sg请求参数设置
 * @param data
 * @param time
 * @param istrace
 * @returns {*}
 * @private
 */
function sgParamSetting(data,time,istrace) {

  if(!isInApp())return _webSgParamSetting(data,time,istrace);
  if(getAppVersion()>3) return  _appSgParamSetting(data,time,istrace);

  var type = getTokenType()
  if(!type){
    //第一次匿名登陆(没有telda也没有teldc)也会走这里
    if(!readCookie("telda"))
      _webSgParamSetting(data,time,istrace);
  }
  //匿名走web
  else if(type=="1"){
    _webSgParamSetting(data,time,istrace);
  }else{
    _appSgParamSetting(data,time,istrace);
  }

}




//****************************************返回登陆&&匿名登陆&&token刷新*************************************************

function getIP() {

  return readCookie("teldz");
}

export function goToLoginPage(){
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
  return await _refreshToken(param,getServiceUrl("UserAPI-WEBUI-ASLogin"),"loginInfo",true)
}

/**
 * 刷新Token
 * @param func 刷新Token后，回调函数
 */
async function refreshToken(isa) {

  if(isInApp()) {
    if(getAppVersion()>3)return _refreshAppToken();
    //app3.8版本，非匿名
    if(getTokenType()=="0")return _refreshAppToken();

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
  return await _refreshToken(param,url,"refreshToken",isa)
}


function _refreshAppToken() {
  window.Teld.refreshToken()
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
          if(paremkey=="loginInfo") createCookie("teldz",realData.ClientIP,60000*1000);
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
  let isa = options.isAnonymous

  if(getTokenType() &&  getTokenType()=="1"){
    isa = true;
  }

  //没有teldc就认为是匿名，需要匿名登陆
  if(!getTokenType()){
    isa = true;
  }

  /***
   * app3.8.3
   * 登陆后由于只有telda和teldb
   * 只要有telda就认为是非匿名
   */
  if(isInApp() && getAppVersion()<=3){

    if(readCookie("telda")){
      isa = false
      //同时把teldc设置成非匿名
      createCookie("teldc","0",SESSION_TIME_OUT)
      eraseCookie("teldk")
    }else{
      isa = true
      //同时把teldc设置成非匿名
      createCookie("teldc","1",SESSION_TIME_OUT)
    }
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

  sgParamSetting(data,null,options.istrace);

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
var tokenInterval = window.setInterval(function () {
  if(getTokenType()){
    autoRefreshToken()
    window.clearInterval(tokenInterval)
  }
},60000)


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
//test

// getDataAsync({
//   url:"http://sgi.wyqcd.net:7777/api/invoke?SID=CMS-GetWSTitleGroup",
//   data:{appId:""}
// })
//
// getDataAsync({
//   url:"http://sgi.wyqcd.net:7777/api/invoke?SID=CMS-GetStaInfo",
//   data:{appId:""}
// })

// getDataAsync({
//   url:"http://sgi.wyqcd.net:7777/api/invoke?SID=CSM-GetStationDivision",
//   data:{appId:""}
// })
