<template>
  <div>
    <div class="demo-list-box" id="demo_list_box" :style="{height: `${height}px`}">
      <flexbox>
        <flexbox-item :span="1/3" class="cbox vux-1px-t vux-tap-active" @click.native="$router.push('/mixProject/0000003')">
          <div class="vux-1px-r cbox-inner">
            <span class="demo-icon demo-icon-big" ></span>
            <br>
            <span style="fontSize:12px">Cell组件</span>

          </div>
        </flexbox-item>
        <flexbox-item :span="1/3" class="cbox vux-1px-t vux-tap-active" @click.native="$router.push('/mixProject/0000004')">
          <div class="vux-1px-r cbox-inner">
            <span class="demo-icon demo-icon-big" ></span>
            <br>
            <span style="fontSize:12px">checklist</span>

          </div>
        </flexbox-item>
        <flexbox-item :span="1/3" class="cbox vux-1px-t vux-tap-active" @click.native="$router.push('/projA/flow')">
          <div class="vux-1px-r cbox-inner">
            <span class="demo-icon demo-icon-big" ></span>
            <br>
            <span style="fontSize:12px">流转状态</span>

          </div>
        </flexbox-item>

      </flexbox>
      <!--<flexbox>-->
        <!--<flexbox-item :span="1/3" class="cbox vux-1px-t vux-tap-active" @click.native="$router.push('/xtable')">-->
          <!--<div class="vux-1px-r cbox-inner">-->
            <!--<span class="demo-icon demo-icon-big" ></span>-->
            <!--<br>-->
            <!--<span style="fontSize:12px">表格</span>-->

          <!--</div>-->
        <!--</flexbox-item>-->
        <!--<flexbox-item :span="1/3" class="cbox vux-1px-t vux-tap-active" @click.native="$router.push('/linebasic')">-->
          <!--<div class="vux-1px-r cbox-inner">-->
            <!--<span class="demo-icon demo-icon-big" ></span>-->
            <!--<br>-->
            <!--<span style="fontSize:12px">基本图表</span>-->

          <!--</div>-->
        <!--</flexbox-item>-->

      <!--</flexbox>-->
    </div>
  </div>

</template>

<script>
  import {log} from '../../../../page-modules/mixProject/index/Demo'

  export default {
    title:"test",
    name: 'demoList',
    activated () {
      document.querySelector('#demo_list_box').scrollTop = this.demoTop
    },
    mounted () {
      this.height = window.innerHeight - 46 - 53
      log(this)
    },
    methods: {
//      go (name, hasHome) {
//        if (!hasHome) {
//          this.$router.push(`/component/${name}`)
//        } else {
//          this.$router.push(`/components/${name}/home`)
//        }
//      },
//      split (array) {
//        let chunks = []
//        let count = Math.ceil(array.length / 3)
//        while (count > 0) {
//          chunks.push(array.slice((count - 1) * 3, count * 3))
//          count--
//        }
//        chunks = chunks.reverse()
//        const lastList = chunks[chunks.length - 1]
//        const lastLength = lastList.length
//        if (lastLength < 3) {
//          for (let i = 0; i < 3 - lastLength; i++) {
//            lastList.push({
//              name: '----',
//              icon: ''
//            })
//          }
//        }
//        return chunks
//      }
    },
    data () {
      return {
        height: 0,
        //components: this.split(components)
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
