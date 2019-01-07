<template>
  <t-pcLayout v-bind:isLogin="isLogin" v-on:logout="logout">
    <el-container slot="Content">
      <el-main>
        <t-Banner2 v-bind:bannerData="bannerData" v-bind:isLogin="isLogin" appName="企业大客户系统"></t-Banner2>
        <!--<el-carousel indicator-position="none" style="width: 100%" height="360px" :autoplay="false">-->
        <!--<el-carousel-item v-for="item in 4" :key="item">-->
        <!--<img src="https://gw.alipayobjects.com/os/f/cms/images/jc8tdalh/49bb1a2d-61ce-416d-b3c6-c7b11d81144f.jpeg" border="0">-->
        <!--</el-carousel-item>-->
        <!--</el-carousel>-->
        <div style="margin: 20px 350px;background: #fff;" class="container-box">
          <div class="col-left-wrapper">
            <div class="slide-menu-title"><span class="menu-nav">财务中心</span></div>
            <t-LeftMenu v-bind:menuData="menuData"></t-LeftMenu>
          </div>
          <div class="col-right-wrapper" style="min-height: 890px">
            <h3 class="doraemon-pagetitle"><span>在线退款申请</span></h3>
            <div class="m-page-content">
              在线退款申请内容区域
            </div>
          </div>
        </div>
      </el-main>

    </el-container>
  </t-pcLayout>


</template>

<style>
  .money-select{list-style: none}
  .money-select li {
    float: left;
    height: 50px;
    line-height: 50px;
    width: 80px;
    border: 1px solid #ddd;
    margin: 5px;
    text-align: center;
    vertical-align: middle;
    color: #989898;
    position: relative;
  }

  .money-select li:hover,
  .money-select li.active{
    border-color: #3a8ee6;

    cursor: pointer;
  }



  .chooseMoney {
    color: white;
    position: absolute;
    z-index: 200;
    bottom: 0;
    right: 0;
    background-color: #3a8ee6;
  }
</style>
<script>
  import {log,init} from '@@/page-modules/ecms/index/OnlineTopUp'
  import {isLogin,checkClient} from '@@/components/session'

  export default {
    layout:'pc',
    asyncData (content) {

      let il = isLogin(content)
      return {isLogin:il}
    },
    data() {

      return {
        form: {
          channel:"ALI_QRCODE",
          money:1000,
          ban:0,
          balance:0.00,
          noMoney:0,
          BeCharge:0
        },
        rules:{
          channel: [
            { required: true, message: '请选择活充值方式', trigger: 'change' }
          ],
//          money : [
//            { required: true,message: '请输入充值金额', trigger: 'change' }
//          ]
        },
        bannerData:[
          {pageName:"首页",isActive:false,needAuth:false,pageUrl:"/ecms/p000001"},
          {pageName:"财务中心",isActive:true,needAuth:true,pageUrl:"/ecms/p000002"},
          {pageName:"系统设置",isActive:false,needAuth:true,pageUrl:"/ecms/p000003"},
        ],
        menuData:[
          {name:"缴费",url:null,icon:"el-icon-edit",children:[{name:"在线充值",url:"/ecms/p000002",icon:null,active:false}]},
          {name:"办理",url:null,icon:"el-icon-edit",children:[
            {name:"在线退款申请",url:"/ecms/p000004",icon:null,active:true},
            {name:"开票申请",url:"",icon:null,active:false},
            {name:"基础信息变更",url:"",icon:null,active:false},
          ]},
          {name:"管理中心",url:null,icon:"el-icon-edit",children:[
            {name:"子账户管理",url:"",icon:null,active:false},
            {name:"车辆管理",url:"",icon:null,active:false},
            {name:"银行账户管理",url:"",icon:null,active:false},
            {name:"专票资质管理",url:"",icon:null,active:false},
          ]},
          {name:"统计分析",url:null,icon:"el-icon-edit",children:[
            {name:"基础信息",url:"",icon:null,active:false},
            {name:"账户信息",url:"",icon:null,active:false},
            {name:"子账户信息",url:"",icon:null,active:false},
            {name:"充值退款记录",url:"",icon:null,active:false},
            {name:"充电记录",url:"",icon:null,active:false},
            {name:"开票记录",url:"",icon:null,active:false},
            {name:"账单信息",url:"",icon:null,active:false},
          ]},
          //{name:"系统设置",url:null,icon:"el-icon-edit",children:[{name:"预警设置",url:"http://localhost.wyqcd.cn:3000/mixProject/index/pc/EarlyWarningSet",icon:null,active:false}]},
        ]
      }
    },

    watch:{
      "form.money":function (val) {
        val = val + ""
        console.log("val===="+val)
        if(val!=null&&val!=''){
          this.form.money = val.replace(/[^\d.]/g,"");
          this.form.money = this.form.money.replace(/^\./g,"0.");
          this.form.money = this.form.money.replace(/\.{2,}/g,".");
          this.form.money = this.form.money.replace(".","$#$").replace(/\./g,"").replace("$#$",".");
          this.form.money = this.form.money.replace(/^(\-)*(\d+)\.(\d\d).*$/,'$1$2.$3');
          if(this.form.money.length>6){
            this.form.money=this.form.money.slice(0,6)
          }

        }
      }
    },
    mounted () {
      //init(this)
      if(this.$utils.common.isMobile()){
        //that
        let locations = location.pathname.split("/")
        let keyapp = locations[1]
        window.location.href = location.protocol+"//"+location.host+"/"+keyapp+"/m000001"
        return
      }
    },
    methods: {
      changeMoney(mon){
        this.form.money = parseInt(mon)
      },
      submitForm(formName) {
        console.log("money==="+this.form.money)
        this.$refs[formName].validate((valid) => {
          if (valid) {
            alert('submit!');
          } else {
            alert('error submit!!');
            return false;
          }
        });
      },
      logout(){
        //http://localhost.wyqcd.net:3000/mixProject/index/pc/index
       // window.location.href = "http://localhost.wyqcd.cn:3000/mixProject/index/pc/index"
        this.$router.push("/ecms/p000001")
      }
    }
  }
</script>
