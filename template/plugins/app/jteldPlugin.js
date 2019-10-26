/**
 * Created by chendong on 2018/9/7.
 */
const jteld = require('./jteld-1.0.0.js')

const plugin = {
  install (Vue) {
    Vue.prototype.$jteld = jteld.jteld
    Vue.jteld = jteld.jteld
  },
  $jteld: jteld.jteld
}

export default plugin
export const install = plugin.install
