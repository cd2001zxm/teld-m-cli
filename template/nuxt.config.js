const path = require('path')
const vuxLoader = require('vux-loader')


module.exports = {
  projectName:"",
  analyze:true,
  /*
  ** Headers of the page
  */
  head: {
    // title: 'teldmobile',
    titleTemplate: '%s',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0' },
      { 'http-equiv': 'x-dns-prefetch-control', content: 'on' },
      { hid: 'description', name: 'description', content: 'Nuxt.js project' }
    ],

    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/teld.ico' },
      { rel: 'dns-prefetch', href: '//sgi.wyqcd.cn' },
      { rel: 'alternate', media: 'only screen and (max-width: 640px)', href: '//web.wyqcd.cn' }
    ]
  },
  css: [
    'vux/src/styles/reset.less',
    'vux/src/styles/1px.less',
    'element-ui/lib/theme-chalk/index.css'
  ],
  plugins: [
    {
      src: '~/plugins/vux-plugins',
      ssr: false
    },
    {
      src: '~/plugins/vux-components',
      ssr: true
    },
    {
      src: '~/plugins/element-components',
      ssr: true
    },
    {
      src: '~/plugins/teld-components',
      ssr: true
    }
  ],
  /*
  ** Customize the progress bar color
  */
  loading: { color: '#3B8070' },
  /*
  ** Build configuration
  */
  build: {
    filenames: {
      vendor: 'vendor.js',
      app: 'app.js',
      manifest:'manifest.js'
    },
    uglify:false,
    /*
    ** Run ESLint on save
    */
    // extend (config, { isDev, isClient }) {
    //   if (isDev && isClient) {
    //     config.module.rules.push({
    //       enforce: 'pre',
    //       test: /\.(js|vue)$/,
    //       loader: 'eslint-loader',
    //       exclude: /(node_modules)/
    //     })
    //   }
    // }

    extend(config, { isDev, isClient }) {



      const configs = vuxLoader.merge(config, {
        options: {
          ssr: true,
          vuxSetBabel:false
        },
        plugins: ['vux-ui', {
          name: 'less-theme',
          path: path.join(__dirname, './styles/theme.less')
        }]
      })



      return configs
    }
  },
  // router: {
  //   middleware: 'teld'
  // },

  axios: {
    // proxyHeaders: false
  },

  router: {
    extendRoutes (routes, resolve) {
      //PC端
      routes.push({name: '首页', path: '/ecms/p000001', component: resolve(__dirname, 'pages/ecms/index/pc/Index.vue')})
      routes.push({name: '在线充值', path: '/ecms/p000002', component: resolve(__dirname, 'pages/ecms/index/pc/OnlineTopUp.vue')})
      routes.push({name: '预警设置', path: '/ecms/p000003', component: resolve(__dirname, 'pages/ecms/index/pc/EarlyWarningSet.vue')})
      routes.push({name: '在线退款', path: '/ecms/p000004', component: resolve(__dirname, 'pages/ecms/index/pc/OnlineRefund.vue')})

      //移动端
      routes.push({name: '首页', path: '/ecms/m000001', component: resolve(__dirname, 'pages/ecms/index/mobile/Index.vue')})
      routes.push({name: '在线充值', path: '/ecms/m000002', component: resolve(__dirname, 'pages/ecms/index/mobile/OnlineTopUp.vue')})
    }
  }
}
