/**
 * Created by wangmc on 2017/9/20.
 */

!function (e) {

  function getAppDevice() {
    if (window.navigator.userAgent.indexOf('TeldIosWebView') !== -1) return 'Ios'
    else if (window.navigator.userAgent.indexOf('TeldAndroidWebView') !== -1) return 'Android'
    else return ''
  }

  function isFunction(obj) {
    return typeof obj === "function" && typeof obj.nodeType !== "number";
  }

  function isObject(obj) {
    return obj !== null && typeof obj === 'object'
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
    // alert("callBack");
    // alert("res "+res+'type0f res '+ typeof res + "JSON.stringify(res)" +JSON.stringify(res));
    // alert("JSON.parse(res) "+JSON.parse(res)+'type0f parse res '+ typeof JSON.parse(res));
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
      teldWebviewGoBack: function (call) {
        registerHandler('teldWebviewGoBack', call)
      },

      //关闭webview
      teldWebviewClose: function (opts) {
        callHandler('teldWebviewClose', null, opts)
      },
      //打开新的webview加载url
      teldWebviewLoadUrl:function (opts) {
        callHandler('teldWebviewLoadUrl',{
            "url":opts.url,
            "share":opts.share
          },
          opts)
      },
      //隐藏/展示Webview的分享按钮
      teldWebviewShareEnable: function (opts) {
        callHandler('teldWebviewShareEnable', {
          shareEnable: opts.share
        }, opts)
      },
      //设置webview title
      teldWebviewSetTitle: function (opts) {
        callHandler('teldWebviewSetTitle', {
          title: opts.title
        }, opts)
      },
      //跳转到App原生页面
      teldGoNativePage:function (opts) {
        callHandler("teldGoNativePage",{
          nativePage:opts.page,
          params:opts.params
        },opts)
      },
      //发起分享
      teldShare:function (opts) {
        callHandler("teldShare",{
          title:opts.title,
          desc:opts.desc,
          image:opts.image,//IOS 图片得是https开头
          url:opts.url  //安卓 url 得加上协议头
        },opts)
      },
      //获取h5分享的内容
      teldGetShareContent: function (call) {
        registerHandler("teldGetShareContent", call)
      },
      //获取支付方式
      teldGetPayType: function (opts) {
        callHandler('teldGetPayType', null, opts)
      },
      //发起支付(plus)
      teldGoPay: function (opts) {
        callHandler('teldGoPay', {
          payType: opts.payType,
          respValue: opts.respValue,
          extraData: {
            PayCenterBillID: opts.extraData.PayCenterBillID,
          }
        }, opts)
      },
      teldAlipayAuth: function (opts) {
        callHandler('teldAlipayAuth', {url: opts.url}, opts)
      },
      teldSGCacheControl: function (opts) {
        callHandler('teldSGCacheControl', {
          sid: opts.sid,
          respJson: opts.respJson
        }, opts)
      },
      //存储缓存
      teldSetStorage: function (opts) {
        callHandler('teldSetStorage', {
          key: opts.key, // 缓存的唯一标识。key存本地时，App加前缀“teldjs_”
          data: opts.data, // 缓存的内容。字符串
          logoutClean: opts.logoutClean // 退出登录时，是否需要清除。1：清除；0：不清除。默认清除。
        }, opts)
      },
      //获取缓存
      teldGetStorage: function (opts) {
        callHandler('teldGetStorage', {
          key: opts.key
        }, opts)
      },
      //移除缓存
      teldRemoveStorage: function (opts) {
        callHandler('teldRemoveStorage', {
          key: opts.key
        }, opts)
      },
      //充值
      teldRecharge: function (opts) {
        callHandler('teldRecharge', {
          amount: opts.amount,
          mobile: opts.mobile,
          activityID: opts.activityID,
          promotionID: opts.promotionID
        }, opts)
      }
    }
    e.Teld = Teld
  }
}(this)
