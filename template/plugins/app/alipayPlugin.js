/**
 * Created by chendong on 2018/9/7.
 */
const alipay = require('./alipay-3.1.1.js')

const plugin = {
  install (Vue) {
    Vue.prototype.$alipay = alipay
    Vue.alipay = alipay
  },
  $alipay: alipay
}

export default plugin
export const install = plugin.install
