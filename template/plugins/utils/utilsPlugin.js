/**
 * Created by chendong on 2018/9/14.
 */
const sgApi = require('./sgApi')
const cookie = require('./cookie')
const common = require('./common')


const utils = {
  sgApi,cookie,common
}
const plugin = {
  install (Vue) {
    Vue.prototype.$utils = utils
    Vue.utils = utils
  },
  $utils: utils
}

export default plugin
export const install = plugin.install
