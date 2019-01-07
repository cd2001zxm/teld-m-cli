/**
 * Created by chendong on 2018/11/5.
 */

export async function init(that) {

  let {getServiceUrl} = require('@@/plugins/teld.config')
  let userInfo = await that.$utils.common.getSession()

  let sgApi = that.$utils.sgApi

  if(!userInfo.CurUserForWebUI.BusiCustID){
    if(that.$utils.common.isMobile())
      that.$vux.alert.show({
        title: '',
        content: '未获取到当前用户所属的企业信息！'
      })
      else
    that.$alert("未获取到当前用户所属的企业信息！");
    return;
  }

  var postData ={
    "BusUnitID":userInfo.CurUserForWebUI.BusiCustID,
    "ComapnyID":userInfo.CurUserForWebUI.CompanyId
  }

  sgApi.getDataAsync({
      url: getServiceUrl("ASC-GetBusUnitCountInfo"),
      data: postData,
      sucCallbackFunc:function (result) {

        if(result.state==1){
          that.form.balance=result.data.balance
        }else{
          //ECMSCommon.windowMsg("获取余额失败",1);
          //that.form.balance=3000
          that.$alert("获取余额失败")
        }
      }
    }
  )
}

export function jump() {
  let utils = this.$utils.common
  //如果是手机端跳转到对应的手机页面
  //如果不是手机端，跳转到对应的pc页面

}
