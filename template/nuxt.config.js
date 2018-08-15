const path = require('path')
const vuxLoader = require('vux-loader')


module.exports = {
  analyze:true,
  /*
  ** Headers of the page
  */
  head: {
    title: 'teldmobile',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: 'Nuxt.js project' }
    ],

    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },
  css: [
    'vux/src/styles/reset.less',
    'vux/src/styles/1px.less'
  ],
  plugins: [
    {
      src: 'teld-vue-m/plugins/vux-plugins',
      ssr: false
    },
    {
      src: 'teld-vue-m/plugins/vux-components',
      ssr: true
    },
    // {
    //   src: '~/plugins/vux-components-nossr',
    //   ssr: false
    // }
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
          ssr: true
        },
        plugins: ['vux-ui', {
          name: 'less-theme',
          path: path.join(__dirname, './styles/theme.less')
        }]
      })



      return configs
    }
  },

  modules: [
    //'@nuxtjs/axios',
  ],

  axios: {
    // proxyHeaders: false
  }
}
