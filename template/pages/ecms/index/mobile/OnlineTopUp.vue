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
        @on-click-more="onClickMore"
        @on-click-back = "goback">

      </x-header>

      <!--<popup-picker title="请选择" :data="list" v-model="channel" value-text-align="left"></popup-picker>-->
      <group>
        <popup-radio title="充值方式" :options="options2" v-model="form.channel" placeholder="placeholder"></popup-radio>
      </group>
      <group>
        <x-input title="充值金额/元" type="number" v-model="form.money" required ext-align="right"></x-input>
      </group>
      <group>
        <checker
          v-model="form.money"
          default-item-class="demo5-item"
          selected-item-class="demo5-item-selected" style="text-align: center" radio-required>
          <checker-item :key="1000" :value="1000">1000元
            <x-icon class="icon-color chooseMoney" type="ios-checkmark-empty" v-show="form.money==1000"></x-icon>
          </checker-item>
          <checker-item :key="2000" :value="2000">2000元<x-icon class="icon-color chooseMoney" type="ios-checkmark-empty" v-show="form.money==2000"></x-icon></checker-item>
          <checker-item :key="3000" :value="3000">3000元<x-icon class="icon-color chooseMoney" type="ios-checkmark-empty" v-show="form.money==3000"></x-icon></checker-item>
          <checker-item :key="5000" :value="5000">5000元<x-icon class="icon-color chooseMoney" type="ios-checkmark-empty" v-show="form.money==5000"></x-icon></checker-item>
          <checker-item :key="8000" :value="8000">8000元<x-icon class="icon-color chooseMoney" type="ios-checkmark-empty" v-show="form.money==8000"></x-icon></checker-item>
          <checker-item :key="10000" :value="10000">10000元<x-icon class="icon-color chooseMoney" type="ios-checkmark-empty" v-show="form.money==10000"></x-icon></checker-item>
        </checker>
      </group>
      <group>
        <x-button type="primary" action-type="button" style="background-color: #00C1DE" @click.native="processButton001">确定</x-button>
      </group>
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
  .demo5-item {
    width: 100px;
    height: 80px;
    line-height: 80px;
    text-align: center;
    border-radius: 3px;
    border: 1px solid #ccc;
    background-color: #ccc;
    margin: 6px;
    position: relative;
  }
  .demo5-item-selected {
    border-color: #00C1DE;
  }
  .chooseMoney {
    fill: white!important;
    position: absolute;
    z-index: 200;
    bottom: 0;
    right: 0;
    background-color: #00C1DE;
  }

</style>
<script>
  import {log,init} from '@@/page-modules/ecms/index/OnlineTopUp'
  import {isLogin,checkClient} from '@@/components/session'
  export default {
    layout:'mobile',
    data () {
      return {
        options2: [{
          key: 'ALI_QRCODE',
          value: '支付宝'
        }],
        form: {
          channel:"ALI_QRCODE",
          money:1000,
          ban:0,
          balance:0.00,
          noMoney:0,
          BeCharge:0
        },

        isShowNav:true,
        title:"在线充值",
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
      init(this)
    },
    methods: {
      leftOptions () {
        return {
          showBack: true,
          backText:'',
          preventGoBack:true
        }
      },
      rightOptions () {
        return {
          showMore: false
        }
      },
      onClickMore () {
        this.showMenu = true
      },
      processButton001(){
        this.$vux.alert.show({
          title: '',
          content: '提交！',
          onShow () {
            console.log('Plugin: I\'m showing')
          },
          onHide () {
            console.log('Plugin: I\'m hiding')
          }
        })
      },
      goback(){
          this.$router.push("/ecms/m000001")
      }
    },


  }
</script>

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
