<template>
  <div class="banner-floor-2" >
    <div style="margin: 0 350px;overflow: hidden;">
      <div class="logo">
        <a id="J_logoHomeUrl" href="#">
          <img v-bind:src="'/teldlogo.png'" v-bind:alt="appName">
          <span style="font-size: 15px;color: #5c5a5a;position: absolute;margin-left: -112px;height: 56px;vertical-align: middle;line-height: 56px;font-weight: 550;"></span>
        </a>
      </div>
      <ul id="J_subMenuUl" class="fn-clear mi-nav-items" style="list-style: none;margin-left: 300px;">

        <template v-for="item in bannerData">
          <li v-bind:class="item.isActive?'mi-nav-item nav-item-active':'mi-nav-item'"
              v-show="item.needAuth?(isLogin?true:false):true">
            <a class="ent-uri-placeholder"
               href="javascript:void(0)" v-on:click="jump(item.pageUrl)">
              <span class="label">{{item.pageName}}</span>
            </a>
          </li>
        </template>
      </ul>
    </div>
  </div>
</template>

<script>
  export default {
    data(){

        return {
        }
    },
    props: {
      bannerData:{
        type: Array,
        required: true
      },
      isLogin:{
        type: Boolean,
        required: true
      },
      appName:{
        type: String,
        required: true
      }
    },
    mounted(){
        //this.isLogin =  this.$utils.common.isLogin()
    },
    methods:{
        jump:function (url) {
          this.$router.push(url)
        }
    }
  }
</script>
