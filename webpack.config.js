const glob = require('glob')
const path = require('path')
const FixStyleOnlyEntriesPlugin = require('webpack-fix-style-only-entries')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const options = { sourceMap: true }

function entries (files, outputDir = '') {
  const fileRegex = /(.+\/)?(.+)\.(.+)/ // $1 = dir, $2 = filename, $3 = ext
  const res = {}

  glob.sync(files).forEach(file => {
    const match = file.match(fileRegex)
    res[outputDir + match[2] + (match[3] === 'scss' ? '.css' : '')] = file
  })

  return res
}

const config = {
  mode: 'production',
  stats: 'errors-warnings',
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.scss']
  },
  entry: {
    ...entries('./src/web/ts/*.ts'),
    ...entries('./src/web/scss/login.scss'),
    ...entries('./src/web/scss/themes/*.scss', 'themes/')
  },
  plugins: [
    new FixStyleOnlyEntriesPlugin({ silent: true }),
    new MiniCssExtractPlugin({ filename: 'css/[name]' }),
    new CopyWebpackPlugin([
      { from: './src/web/images/', to: 'images/' },
      { from: './src/web/html/', to: 'html/' },
      { from: './src/web/templates/', to: 'templates/' },
      { from: './src/web/PWA/', to: 'PWA/' }
    ])
  ],
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader'
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
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

module.exports = config
