/**
 * Created by chendong on 2018/11/5.
 */
export function log(that) {
  console.trace("这是公共模块【demo】脚本")
  let sgApi = that.$utils.sgApi

  //let cookie = that.$utils.cookie
  sgApi.getDataAsync({
    url:"http://sgi.wyqcd.net:7777/api/invoke?SID=CMS-GetWSTitleGroup",
    data:{appId:""}
  },function (data) {
    console.log("================ajax返回结果================");
    console.dir(data)
    console.log("===========================================");
  })
}

export function jump() {
  let utils = this.$utils.common
  //如果是手机端跳转到对应的手机页面
  //如果不是手机端，跳转到对应的pc页面

}
