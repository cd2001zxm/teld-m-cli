<template>
  <el-container>
    <el-header height="30px" style="padding: 0">
      <div class="banner-floor-1" >
        <div style="margin: 0 350px">
          <div class="accounts">
            <div class="banner-item">
              <el-dropdown type="primary" :show-timeout="200" v-show="isLogin">
                <span class="el-dropdown-link link"><i class="el-icon-arrow-down el-icon--right"></i></span>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item>修改密码</el-dropdown-item>
                  <el-dropdown-item>修改用户信息</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
              <a class="link" v-show="!isLogin" href="javascript:void(0)" @click="login()">登录</a>
              <a class="link" v-show="!isLogin" href="javascript:void(0)" @click="regist()">注册</a>
              <a class="link" v-show="isLogin" href="javascript:void(0)" @click="logout()">退出</a>
            </div>
            <!--<div class="nav-gap">|</div>-->
            <!--<div class="banner-item"><a class="link">个人中心</a></div>-->
            <div class="nav-gap">|</div>
            <div class="banner-item"><a class="link">帮助中心</a></div>


          </div>
        </div>
      </div>

    </el-header>

    <el-container style="background-color: #eeefef;width: auto;min-height: 745px;">
        <el-main style="padding: 0;overflow: hidden"><slot name="Content"></slot></el-main>
    </el-container>
    <el-footer style="" class="spFooterWrap" height="133px">
        <ul class="mpFooterLinks">
          <li><a href="https://www.teld.cn/Product/product" target="_blank" seed="mpFooterLinks-linkT19" smartracker="on">产品与服务</a></li>
          <li><a href="https://www.teld.cn/ContactUs/ContactUs" target="_blank" seed="mpFooterLinks-linkT20" smartracker="on">联系我们</a></li>
          <li><a href="https://www.teld.cn/JoinUs/JoinUs" target="_blank" seed="mpFooterLinks-linkT21" smartracker="on">加入我们</a></li>
          <li><a href="https://www.teld.cn/Partners/ParTners" target="_blank" seed="mpFooterLinks-linkT22" smartracker="on">合作伙伴</a></li>
          <li><a href="https://www.teld.cn/Helpinfo/helpinfo" target="_blank" seed="mpFooterLinks-linkT23" smartracker="on">帮助</a></li>
          <li><a href="https://www.teld.cn/FeedBack/FeedBack" target="_blank" seed="mpFooterLinks-linkT24" smartracker="on">意见反馈</a></li>
          <li><a href="https://www.teld.cn/About/About" target="_blank" seed="mpFooterLinks-linkT25" smartracker="on">关于特来电</a></li>
        </ul>
        <span class="mpCopyRight">Copyright © 2015 - 2018 青岛特来电新能源有限公司 鲁ICP备14031144号-3</span>
        <span class="mpCopyRight"><img src="/police.png" style="padding-right: 5px">鲁公网安备 37021202000852号</span>
    </el-footer>
  </el-container>
</template>

<style>
  html,body{
    background-color: #eeefef !important;
    background-image: none !important;
  //min-width: 1002px;
  }
  ol, ul {
    list-style: none;
  }


  .menu-icon-wrapper {
    width: 14px;
    height: 14px;
    left: 26px;
    top: 9px;
    position: absolute;
  }



  .menu-link {
    position: relative;
    font-size: 14px;
    color: #1D1D1D;
    display: block;
    height: 40px;
    line-height: 40px;
    padding-left: 53px;
    box-sizing: border-box;
    overflow: hidden;
  }
  .heightLight {
    border-left: 3px solid #04A4FF;
    color: #108EE9;
    text-indent: -3px;
    background: #F2FAFF;
  }
  .menu-item-level-1 {
    color: #989898;
    cursor: default;
    border-top: 1px solid #e9e9e9;
  }

  .menu-item-level-2 {
    cursor: pointer;
    font-size: 12px;
  }

  .menu-icon {
    position: relative;
  }

  .menu-link:hover {
    color: #108EE9;
  }
  .menu-item-level-1:hover {
    color: #989898;
  }
  .menu-leaf:hover, .menu-can-toggled:hover {
    color: #108ee9;
    text-decoration: none;
    background-color: #F2FAFF;
  }

  .container-box {
    margin: 24px auto 0;
    width: 1200px;
    min-height: 280px;
    background: #fff;
    padding-bottom: 10px;
  }

  .col-left-wrapper {
    width: 160px;
    background: #fff;
    float: left;
    border-right: 1px solid #e9e9e9;
  }

  .col-right-wrapper {
    margin-left: 159px;
    border-left: 1px solid #e9e9e9;
  }

  .slide-menu-title {
    height: 50px;
    line-height: 50px;
    font-size: 14px;
    margin-left: 52px;
    color: #B4B4B4;
  }

  .doraemon-pagetitle {
    padding-left: 24px;
    border-bottom: 1px solid #eee;
    font: normal 16px/50px PingFang SC!important;
    color: #a9a9a9;
    margin: 0;
  }

  .m-page-content {
    padding: 24px 24px 24px 24px;
  }

  .spFooterWrap {
    margin: 0 auto;
    background: #4a4a4a;
    color: #fff;
    font-size: 12px;
    line-height: 2.4;
    -ms-box-sizing: border-box;
    -o-box-sizing: border-box;
    box-sizing: border-box;
    background-color: #eeefef
  }
  .mpCopyRight, .mpFooterLinks {
    display: block;
    text-align: center;
    line-height: 2.4;
    font-size: 12px;
    color: #B7B7B7;
  }
  .spFooterWrap ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .mpFooterLinks li {
    display: inline-block;
  }
  .mpFooterLinks li a {
    display: inline-block;
    color: #B7B7B7;
  }
  .mpFooterLinks li a:hover {
    text-decoration: underline;
  }
  .mpFooterLinks li + li:before {
    content: '|';
    display: inline-block;
    padding: 0 12px;
  }

  .mpFooterWrap:before {
    content: '';
    display: block;
    height: 1px;
    width: 1200px;
    background-color: #ddd;
    margin: 20px auto;
  }


  .el-main{
    padding: 0;
  }
  .logo {
    margin-top: 8px;
    float: left;
  }
   .logo img {
    width: 202px;
    height: 56px;
  }
  .accounts {
    float: right;
    font-size: 12px;
    padding: 0 3px 0 11px;
  }

  .accounts .link, .accounts .link:visited, .accounts .label {
    position: relative;
    z-index: 2;
    display: inline-block;
    *display: inline;
    zoom: 1;
    color: #b0b0b0;
    line-height: 16px;
    height: 30px;
    overflow: hidden;
    padding: 6px 10px 5px;
    font-size: 12px!important;
  }

  .accounts .link:hover{
    color:#fff;
    cursor: pointer;
  }

  .banner-floor-1 {
    height: 30px;
    background-color: #3a3a3a;
  }
  .banner-floor-2 {
    height: 72px;
    line-height: 72px;
    background-color: #fff;
  }

  .heightLight {
    border-left: 3px solid #04A4FF;
    color: #108EE9;
    text-indent: -3px;
    background: #F2FAFF;
  }

  .banner-item {
    float: left;
    position: relative;
    margin-right: -4px;
    display: inline;
    margin-top: 1px;
  }
  .nav-gap {
    margin-top: 5px;
    color: #fff;
    float: left;
  }

  .mi-nav-item {
    min-width: auto;
    height: 72px;
    padding: 0;
    margin: 0;
    position: relative;
    float: left;
    display: inline;
    text-align: center;
  }
  .mi-nav-item .mi-nav-item-current a,
  .mi-nav-item .mi-nav-item-hover a,
  .mi-nav-item .mi-nav-item-current a:hover {
    font-weight: 400;
    position: relative;
  }
  .mi-nav-item .mi-nav-item-current > a.ent-uri-placeholder,
  .mi-nav-item:hover > a.ent-uri-placeholder {
    color: #19ACF7;
  }
  .minav-item.mi-nav-item-current > a:after,
  .mi-nav-item:hover > a:after {
    content: '';
    display: block;
    position: absolute;
    left: 0;    right: 0;
    height: 2px;
    bottom: 0;
    z-index: 11;
    background-color: #19ACF7;
  }
  .mi-nav-item a, .enterprise-portal .mi-nav-item a:visited {
    color: #444;
    text-decoration: none;
    padding: 32px;
    display: block;
    text-align: center;
    width: auto;
    font-size: 16px;
    line-height: 1;
    font-family: Microsoft YaHei,Helvetica Neue,Tahoma,sans-serif;
    font-weight: 400;
    -webkit-font-smoothing: antialiased;
  }
  .nav-item-active {
    border-bottom: 2px solid #19ACF7;
  }

  .nav-item-active a {
    color: #19ACF7;
  }
</style>
<script>

  export default {

    data(){
        //if(!isLogin) return {userName:"获取中...",isLogin:false}
        return {userName:"获取中..."}
    },
    props:{
      isLogin:{
        type: Boolean,
        required: true
      }

    },
    async mounted(){

      //let cookie = this.$utils.cookie

      if(this.$utils.common.isLogin()) {
        //this.isLogin = true
        var userinfo = await this.$utils.common.getSession()


        var username = userinfo.CurUserForWebUI.UserName ? userinfo.CurUserForWebUI.UserName :
          (userinfo.CurUserForWebUI.Mobile ? userinfo.CurUserForWebUI.Mobile :
            (userinfo.CurUserForWebUI.EMail ? userinfo.CurUserForWebUI.EMail : ""))
        this.userName = username
      }
      //}else{
        //this.isLogin = false
      //}
    },
    methods: {
      login:function () {
        this.$utils.sgApi.goToLoginPage();
      },
      regist:function () {
        let {getUserCenterUrl} = require('@@/plugins/teld.config')
        let url = getUserCenterUrl() +"/newsignin"
        window.location.href = url;
      },
      logout:function () {
        this.$utils.common.ClearSessionCookies();
        //window.location.reload()
        this.$emit("logout")
      },
    }
  }
</script>
