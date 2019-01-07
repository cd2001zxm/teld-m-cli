<template>
  <t-pcLayout v-bind:isLogin="isLogin" v-on:logout="logout">
    <el-container style="background: #fff;" slot="Content">
      <el-main>
        <t-Banner2 v-bind:bannerData="bannerData" v-bind:isLogin="isLogin" appName="企业大客户系统"></t-Banner2>
        <el-carousel indicator-position="none" style="width: 100%" height="360px" :autoplay="false">
          <el-carousel-item>
            <img src="https://gw.alipayobjects.com/os/f/cms/images/jc8tdalh/49bb1a2d-61ce-416d-b3c6-c7b11d81144f.jpeg" border="0">
          </el-carousel-item>
        </el-carousel>
        <div style="margin: 20px 350px;background: #fff;" class="container-box">
          <div style="margin: 20px 350px;background: #fff;">

          </div>
        </div>
      </el-main>
    </el-container>
  </t-pcLayout>

</template>
<style src="../../../../styles/test7.less"></style>
<script>

  import {isLogin,checkClient} from '@@/components/session'
  export default {
    asyncData (content) {
      let il = isLogin(content)
      return {isLogin:il}
    },
    layout:'pc',
    data() {
      return {
        form: {
          name: '',
          region: '',
          date1: '',
          date2: '',
          delivery: false,
          type: [],
          resource: '',
          desc: ''
        },
        bannerData:[
          {pageName:"首页",isActive:true,needAuth:false,pageUrl:"/ecms/p000001"},
          {pageName:"财务中心",isActive:false,needAuth:true,pageUrl:"/ecms/p000002"},
          {pageName:"系统设置",isActive:false,needAuth:true,pageUrl:"/ecms/p000003"},
        ]
      }
    },
    mounted () {
      checkClient(this)
    },
    methods: {
      onSubmit() {
        console.log('submit!');
      },
      logout(){
        //window.location.reload()
        this.isLogin = false
      }
    }
  }
</script>
