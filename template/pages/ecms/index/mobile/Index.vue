<template>
  <div>
    <!-- main content -->
    <view-box ref="viewBox" :body-padding-top="isShowNav ? '46px' : '0'" body-padding-bottom="55px">

      <x-header
        v-if="isShowNav"
        slot="header"
        style="width:100%;position:absolute;left:0;top:0;z-index:100;background-color: #383D41;"
        :left-options="leftOptions()"
        :right-options="rightOptions()"
        :title="title"
        :transition="'vux-header-fade-in-right'"
        @on-click-more="onClickMore">
          <!--<span v-if="true" slot="overwrite-left" >-->
            <!--<x-icon type="navicon" size="35" style="fill:#fff;position:relative;top:-8px;left:-3px;"></x-icon>-->
          <!--</span>-->
      </x-header>

      <swiper :list="baseList" v-model="demo01_index" style="height: 180px"></swiper>

      <grid :cols="4" :show-lr-borders="false" :show-vertical-dividers="false">
        <grid-item link="/ecms/m000002" :label="'在线充值'" style="text-align: center">
          <x-icon slot="icon" class="icon-color" type="social-yen"></x-icon>
        </grid-item>
        <grid-item link="/ecms/m000001" :label="'退款申请'">
          <x-icon slot="icon" class="icon-color" type="nuclear"></x-icon>
        </grid-item>
        <grid-item link="/ecms/m000001" :label="'开票申请'">
          <x-icon slot="icon" class="icon-color" type="ios-book"></x-icon>
        </grid-item>
        <grid-item link="/ecms/m000001" :label="'信息变更'">
          <x-icon slot="icon" class="icon-color" type="ios-book"></x-icon>
        </grid-item>
        <grid-item link="/ecms/m000001" :label="'子账户'">
          <x-icon slot="icon" class="icon-color" type="ios-book"></x-icon>
        </grid-item>
        <grid-item link="/ecms/m000001" :label="'车辆管理'">
          <x-icon slot="icon" class="icon-color" type="ios-book"></x-icon>
        </grid-item>
        <grid-item link="/ecms/m000001" :label="'银行账户'">
          <x-icon slot="icon" class="icon-color" type="ios-book"></x-icon>
        </grid-item>
        <grid-item link="/ecms/m000001" :label="'更多'">
          <badge text="圣诞节" style="top: 10px;right: 0;position: absolute;"></badge>
          <x-icon slot="icon" class="icon-color" type="more"></x-icon>

        </grid-item>
      </grid>


    </view-box>
  </div>
</template>
<style>
  .vux-swiper-desc{
    height: auto!important;
  }
  .icon-color{
    fill: #444;
  }
</style>
<style lang="less" scoped>
  .cbox {
    text-align: center;
  }
  .cbox-inner {
    padding: 15px 0;
    width: 100%;
    height: 100%;
  }
  .demo-list-box {
    margin-bottom: 10px;
    background-color: #fff;
    width: 100%;
    overflow: scroll;
    -webkit-overflow-scrolling: touch;
  }
</style>
<script>
  import {isLogin,checkClient} from '@@/components/session'
  export default {
    layout:'mobile',
    data () {
      return {
        isShowNav:true,
        title:"企业大客户系统",
        demo01_index: 0,
        baseList : [{
          url: 'javascript:',
          img: 'https://gw.alipayobjects.com/os/f/cms/images/jc8tdalh/49bb1a2d-61ce-416d-b3c6-c7b11d81144f.jpeg',
          title: ''
        }, {
          url: 'javascript:',
          img: 'https://ww1.sinaimg.cn/large/663d3650gy1fq66vw1k2wj20p00goq7n.jpg',
          title: '送你一辆车'
        }, {
          url: 'javascript:',
          img: 'https://ww1.sinaimg.cn/large/663d3650gy1fq66vw50iwj20ff0aaaci.jpg', // 404
          title: '送你一次旅行',
          fallbackImg: 'https://ww1.sinaimg.cn/large/663d3650gy1fq66vw50iwj20ff0aaaci.jpg'
        }]
        //components: this.split(components)
      }
    },
    mounted () {
      checkClient(this)
      //this.height = window.innerHeight - 46 - 53
      //log(this)
    },
    methods: {
      leftOptions () {
        return {
          showBack: false,
          backText:''
        }
      },
      rightOptions () {
        return {
          showMore: false
        }
      },
      onClickMore () {
        this.showMenu = true
      }
    },


  }
</script>


