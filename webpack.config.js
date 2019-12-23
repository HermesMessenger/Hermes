const glob = require('glob')
const path = require('path')
const FixStyleOnlyEntriesPlugin = require('webpack-fix-style-only-entries')
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
      index: '',
      port: 8000,
      overlay: true,
      proxy: [{
        context: url => !url.startsWith('/sockjs-node'), // So that it doesn't conflict with WDS's own websocket server
        target: 'http://localhost:8080',
        ws: true,
        logLevel: 'warn'
      }],
      before(app, server, compiler) {
        const extRegex = /\.(mustache|html)$/
        compiler.hooks.done.tap('CustomHtmlReloadPlugin', () => {
          const changedFiles = Object.keys(compiler.watchFileSystem.watcher.mtimes)
          if (this.hot && changedFiles.some(file => extRegex.test(file))) {
            server.sockWrite(server.sockets, 'content-changed') // Hard reload
          }
        })
      }
    },
    plugins: [
      new FixStyleOnlyEntriesPlugin({ silent: true }),
      new MiniCssExtractPlugin({ filename: 'css/[name].css' }),
      new WriteFilePlugin(),
      new CopyWebpackPlugin([
        { from: './src/web/images/', to: 'images/' },
        { from: './src/web/templates/', to: 'templates/' },
        { from: './src/web/PWA/', to: 'PWA/' }
      ]),
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
            { loader: MiniCssExtractPlugin.loader, options: { hmr: mode === 'development' } },
            { loader: 'css-loader', options },
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
