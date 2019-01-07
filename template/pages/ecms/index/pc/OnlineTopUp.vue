<template>
  <t-pcLayout v-bind:isLogin="isLogin" v-on:logout="logout">
    <el-container slot="Content">
      <el-main>
        <t-Banner2 v-bind:bannerData="bannerData" v-bind:isLogin="isLogin" appName="企业大客户系统"></t-Banner2>
        <div style="margin: 20px 350px;background: #fff;" class="container-box">
          <div class="col-left-wrapper">
            <div class="slide-menu-title"><span class="menu-nav">财务中心</span></div>
            <t-LeftMenu v-bind:menuData="menuData"></t-LeftMenu>
          </div>
          <div class="col-right-wrapper" style="min-height: 890px">
            <h3 class="doraemon-pagetitle"><span>在线充值</span></h3>
            <div class="m-page-content">
              <div style="overflow: hidden;padding: 15px 20px;background: #ecf6fd;border-radius: 4px;">
                <span style="line-height: 40px;">当前余额{{form.balance}}元</span>
                <el-button type="text" style="float: right;padding-left:15px;">冻结金额明细</el-button>
                <el-button type="text" style="float: right">充值退款记录</el-button>
              </div>
              <div style="overflow: hidden;padding: 15px 20px;">
                <el-form name="form" :model="form" :rules="rules" ref="form" label-width="100px" style="width: 400px">
                  <el-form-item label="充值方式" prop="channel">
                    <el-select v-model="form.channel" placeholder="请选择活充值方式">
                      <el-option label="支付宝" value="ALI_QRCODE"></el-option>
                    </el-select>
                  </el-form-item>
                  <el-form-item label="充值金额/元" prop="money" placeholder="请输入充值金额">
                    <el-input type="text" v-model="form.money"><template slot="append">元</template></el-input>
                  </el-form-item>
                  <el-form-item>

                    <ul class="money-select" >
                      <li @click="changeMoney(1000)" v-bind:class="form.money==1000?'active':''">
                        <a><span>1000元</span></a>
                        <span class="el-icon-check chooseMoney" v-show="form.money==1000"></span>
                      </li>
                      <li @click="changeMoney(2000)" v-bind:class="form.money==2000?'active':''"><a><span>2000元</span></a>
                        <span class="el-icon-check chooseMoney" v-show="form.money==2000"></span>
                      </li>
                      <li @click="changeMoney(3000)" v-bind:class="form.money==3000?'active':''"><a><span>3000元</span></a>
                        <span class="el-icon-check chooseMoney" v-show="form.money==3000"></span>
                      </li>
                      <li @click="changeMoney(5000)" v-bind:class="form.money==5000?'active':''"><a><span>5000元</span></a>
                        <span class="el-icon-check chooseMoney" v-show="form.money==5000"></span>
                      </li>
                      <li @click="changeMoney(8000)" v-bind:class="form.money==8000?'active':''"><a><span>8000元</span></a>
                        <span class="el-icon-check chooseMoney" v-show="form.money==8000"></span>
                      </li>
                      <li @click="changeMoney(10000)" v-bind:class="form.money==10000?'active':''"><a><span>10000元</span></a>
                        <span class="el-icon-check chooseMoney" v-show="form.money==10000"></span>
                      </li>
                    </ul>
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" @click="submitForm('form')">立即充值</el-button>
                  </el-form-item>
                </el-form>
              </div>

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
          {name:"缴费",url:null,icon:"el-icon-edit",children:[{name:"在线充值",url:"/ecms/p000002",icon:null,active:true}]},
          {name:"办理",url:null,icon:"el-icon-edit",children:[
            {name:"在线退款申请",url:"/ecms/p000004",icon:null,active:false},
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
    async mounted () {
      //检查客户端类型
      checkClient(this)

      //业务处理
      await init(this)
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
          //window.location.href = "http://localhost.wyqcd.cn:3000/mixProject/index/pc/index"
        this.$router.push("/ecms/p000001")
      }
    }
  }
</script>
