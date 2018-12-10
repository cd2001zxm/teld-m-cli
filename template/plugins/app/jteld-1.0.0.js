let jteld;

!function (e, n) {
  jteld = n(e)
}(window,function (e) {

  function __type_original(obj) {
    return Object.prototype.toString.call(obj);
  }

  function getAppDevice() {
    if (window.navigator.userAgent.indexOf('TeldIosWebView') !== -1) return 'Ios'
    else if (window.navigator.userAgent.indexOf('TeldAndroidWebView') !== -1) return 'Android'
    else return ''
  }

  function isFunction(fn) {
    return __type_original(fn) === '[object Function]';
  }

  function isObject(obj) {
    return __type_original(obj) === '[object Object]';
  }

  function formatData(data, state, errmsg) {
    var result = new Object()
    result['state'] = state || '1'
    result['data'] = data || null
    result['errcode'] = state == '1' ? '' : '30010'
    result['errmsg'] = errmsg || ''
    return result
  }

  function setupWebViewJavascriptBridge(callback) {
    if(!getAppDevice()) return alert('此功能只支持在特来电app中使用')
    if (e.WebViewJavascriptBridge) {
      return callback(WebViewJavascriptBridge);
    }
    if (e.WVJBCallbacks) {
      return e.WVJBCallbacks.push(callback);
    }
    e.WVJBCallbacks = [callback];
    var WVJBIframe = document.createElement('iframe');
    WVJBIframe.style.display = 'none';
    WVJBIframe.src = 'teld://__bridge_loaded__';
    document.documentElement.appendChild(WVJBIframe);
    setTimeout(function () {
      document.documentElement.removeChild(WVJBIframe)
    }, 0)
  }

  /*************** JS调原生 **************/
  function callHandler(name, data, opt) {
    setupWebViewJavascriptBridge(function (bridge) {
      bridge.callHandler(name, data, function (response) {
        opt && callBack(opt, response)
      });
    })
  }

  function callBack(req, res) {
    if (res && (typeof res == "string")){
      res = JSON.parse(res);
    }


    if (isObject(res)) {
      if (res.state == '1') {
        isFunction(req.success) && req.success(res)
      } else {
        isFunction(req.fail) && req.fail(res)
      }
    }
    isFunction(req.complete) && req.complete(res)
  }

  /*************** 原生调JS **************/
  // 需要H5提前注册事件
  function registerHandler(name, registerBack) {
    setupWebViewJavascriptBridge(function (bridge) {
      // 注册获取分享内容事件
      bridge.registerHandler(name, function (data, responseCallback) {
        var responseData = void 0
        try {
          if (isFunction(registerBack)) {
            var resData = registerBack(data)
            responseData = formatData(resData)
          } else {
            responseData = formatData(null, '0', '未注册相关方法')
          }
        } catch (e) {
          responseData = formatData(null, '0', e)
        }
        responseCallback(responseData);
      });
    })
  }

  if (!e.Teld) {
    var Teld = {
      //webview返回处理
      goBack: function (call) {
        registerHandler('teldWebviewGoBack', call)
      },

      //关闭webview
      close: function (opts) {
        callHandler('teldWebviewClose', null, opts)
      },
      //打开新的webview加载url
      loadUrl:function (opts) {
        callHandler('teldWebviewLoadUrl',{
            "url":opts.url,
            "share":opts.share
          },
          opts)
      },
      //隐藏/展示Webview的分享按钮
      shareEnable: function (opts) {
        callHandler('teldWebviewShareEnable', {
          shareEnable: opts.share
        }, opts)
      },
      //设置webview title
      setTitle: function (opts) {
        callHandler('teldWebviewSetTitle', {
          title: opts.title
        }, opts)
      },
      //跳转到App原生页面
      goNativePage:function (opts) {
        callHandler("teldGoNativePage",{
          nativePage:opts.page,
          params:opts.params
        },opts)
      },
      //发起分享
      share:function (opts) {
        callHandler("teldShare",{
          title:opts.title,
          desc:opts.desc,
          image:opts.image,//IOS 图片得是https开头
          url:opts.url  //安卓 url 得加上协议头
        },opts)
      },
      //获取h5分享的内容
      getShareContent: function (call) {
        registerHandler("teldGetShareContent", call)
      },
      //获取支付方式
      getPayType: function (opts) {
        callHandler('teldGetPayType', null, opts)
      },
      //发起支付(plus)
      goPay: function (opts) {
        callHandler('teldGoPay', {
          payType: opts.payType,
          respValue: opts.respValue,
          extraData: {
            PayCenterBillID: opts.extraData.PayCenterBillID,
          }
        }, opts)
      },
      //回到app登陆页面
      gotoLogin:function () {

      },
      //获取设备信息
      getDeviceInfo:function () {

      },
      //刷新token
      refreshToken:function () {

      }
    }
    e.Teld = Teld
  }

  return Teld
})

export {
  jteld
}
