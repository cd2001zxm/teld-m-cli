import Vue from 'vue'
import { BusPlugin, TransferDom, WechatPlugin, DatetimePlugin, LoadingPlugin, ToastPlugin, AlertPlugin, ConfirmPlugin  } from 'vux'
//import alipayPlugin from './app/alipayPlugin'
import jteldPlugin from './app/jteldPlugin'
import utilsPlugin from './utils/utilsPlugin'

Vue.use(DatetimePlugin)
Vue.use(LoadingPlugin)
Vue.use(ToastPlugin)
Vue.use(AlertPlugin)
Vue.use(ConfirmPlugin)
Vue.use(WechatPlugin)
Vue.use(BusPlugin)
Vue.use(utilsPlugin)
Vue.directive('transfer-dom', TransferDom)

//支付宝目前是小程序
// if(alipayPlugin.isAlipay){
//   Vue.use(alipayPlugin)
// }

Vue.use(jteldPlugin)

console.dir(Vue.utils)


