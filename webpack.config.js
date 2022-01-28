const glob = require('glob')
const path = require('path')
const FixStyleOnlyEntriesPlugin = require('webpack-remove-empty-scripts')
const TSConfigPathsPlugin = require('tsconfig-paths-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const WriteFilePlugin = require('write-file-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const options = { sourceMap: true }

function entries(files, outputDir = '') {
  const fileRegex = /(.+\/)?(.+)\.(.+)/ // $1 = dir, $2 = filename, $3 = ext
  const res = {}

  glob.sync(files).forEach(file => {
    const match = file.match(fileRegex)
    res[outputDir + match[2]] = file
  })

  return res
}

const config = function (env, argv) {
  const mode = argv.mode || 'development'

  return {
    mode: mode,
    stats: 'errors-warnings',
    devtool: 'source-map',
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.scss'],
      plugins: [new TSConfigPathsPlugin({ configFile: './src/web/tsconfig.json' })]
    },
    entry: {
      ...entries('./src/web/scss/themes/*.scss', '../themes/'),
      chat: ['./src/web/ts/chat.ts', ...glob.sync('./src/web/scss/themes/*.scss')],
      login: ['./src/web/ts/login.ts', './src/web/scss/login.scss'],
    },
    devServer: {
      port: 8000,
      proxy: [{
        context: url => !url.includes('/ws'), // So that it doesn't conflict with WDS's own websocket server
        target: 'http://localhost:8080',
        ws: true,
      }],

      // onBeforeSetupMiddleware(app) {
      //   const extRegex = /\.(mustache|html)$/
      //   app.compiler.hooks.watchRun.tap('WatchRun', (comp) => {
      //     if (comp.modifiedFiles) {
      //       const changedFiles = Array.from(comp.modifiedFiles)
      //       if (this.hot && changedFiles.some(file => extRegex.test(file) || file.includes('/templates'))) {
      //         console.log(app.server)
      //         app.sendMessage(app.webSocketServer.clients, 'content-changed');
      //       }
      //     }
      //   });
      // }
    },
    plugins: [
      new FixStyleOnlyEntriesPlugin({ silent: true }),
      new MiniCssExtractPlugin({ filename: 'css/[name].css' }),
      new WriteFilePlugin(),
      new CopyWebpackPlugin({ patterns: [
        { from: './src/web/images/', to: 'images/' },
        { from: './src/web/templates/', to: 'templates/' },
        { from: './src/web/PWA/', to: 'PWA/' }
      ]}),
    ],
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: { loader: 'ts-loader', options: { experimentalWatchApi: true } }
        },
        {
          test: /\.scss$/,
          use: [
            { loader: MiniCssExtractPlugin.loader },
            { loader: 'css-loader', options: { ...options, url: false } },
            { loader: 'sass-loader', options }
          ]
        }
      ]
    },
    output: {
      path: path.resolve('dist/web'),
      filename: 'js/[name]-bundle.js'
    }
  }
}

module.exports = config
