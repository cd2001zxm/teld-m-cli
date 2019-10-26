<template>
  <div id="slide-menu">
    <ul class="menu">
      <template v-for="item in menuData">
        <li class="menu-item">
          <div class="menu-wrapper menu-icon">
            <span class="menu-link menu-item-level-1"></span>
            <div class="menu-icon-wrapper"><i v-bind:class="item.icon? ('menu-link-icon '+item.icon):''"></i></div>
          </div>
          <ul class="menu sub-menu">
            <template v-for="subitem in item.children">
              <li class="menu-item menu-leaf">
                <div class="menu-wrapper">
                  <a class="menu-item-link" href="javascript:void(0)" v-on:click="jump(subitem.url)">
                    <span v-bind:class="subitem.active?'menu-link menu-item-level-2 heightLight':'menu-link menu-item-level-2'">{{subitem.name}}</span>
                  </a>
                </div>
              </li>
            </template>

          </ul>
        </li>
      </template>
    </ul>
  </div>
</template>
<style></style>
<script>
  export default {
    data(){
        return {}
    },
    props: {
      menuData:{
        type: Array,
        required: true
      }
    },
    methods:{
      jump:function (url) {
        this.$router.push(url)
      }
    }

  }
</script>
