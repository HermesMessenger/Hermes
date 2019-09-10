const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const devMode = process.env.NODE_ENV !== 'production';
const fs = require('fs-extra');
const path = require('path');
const node_sass = require('node-sass');

function entry(name){
    return `${name}/${name}`
}

let config = {
    plugins: [
        new webpack.ProvidePlugin({
            $: 'jquery'
        }),
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: '[name].css',
            chunkFilename: '[id].css',
        }),
    ],
    mode: devMode ? "development" : 'production',
    devtool: 'inline-source-map',
    context: path.resolve(__dirname, 'src/web'),
    module: {
        rules: [
            {
                test: /\.(sa|sc|c)ss$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            hmr: devMode,
                            sourceMap: true,
                        },
                    },
                    {
                        loader: 'css-loader',
                        options: { sourceMap: true }
                    },
                    {
                        loader: 'postcss-loader',
                        options: { sourceMap: true }
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: true,
                            outputStyle: 'compressed'
                        }
                    },
                ],
            },
            { 
                test: /\.ts$/, 
                use: 'ts-loader', 
                exclude: /node_modules/,
            },
            {
                test: /\.(html|png|jpe?g|json)$/,
                loader: 'file-loader',
                options: {
                    name: '[folder]/[name].[ext]'
                },
            },
        ]
    },
    output: {
        path: path.resolve(__dirname, 'dist/web'),
    },
    entry: {},
    resolve: {
        extensions: ['.ts', '.html', '.scss', '.png', '.jpeg', '.jpg', '.json']
    },
    stats: 'errors-only'
};

config.entry[entry('chat')] = ['./chat/chat.ts', './chat/chat.scss', './chat/chat.html']
config.entry[entry('login')] = ['./login/login.ts', './login/login.scss', './login/login.html']
config.entry['test/md'] = ['./test/md.ts', './test/md.html']

// Add themes
let files = fs.readdirSync(config.context + '/themes/')
fs.mkdirSync(config.output.path + '/themes/', { recursive: true }) // Ensure folder exsts
for (let file of files) {
    if (file.endsWith('.scss')) {
        let result = node_sass.renderSync({
            file: config.context + '/themes/' + file,
            outFile: config.output.path + '/themes/' + file.replace('.scss', '.css'),
            outputStyle: 'compressed',
            sourceMap: devMode, // True for development
            sourceMapEmbed: true,
            sourceMapContents: true
        });
        fs.writeFileSync(config.output.path + '/themes/' + file.replace('.scss', '.css'), result.css);
    }
}

let images = fs.readdirSync(config.context + '/images/')
fs.mkdirSync(config.output.path + '/images/', { recursive: true }) // Ensure folder exsts
for (let file of images) {
    // Copy all files from src/web/images to dist/web/images
    fs.copyFileSync(config.context + '/images/' + file, config.output.path + '/images/' + file)
}

// Fix TS file location 
// TODO: Find a better (less hacky) way to do this
if (fs.existsSync('dist/src/')) {
    fs.removeSync('dist/server/')
    fs.renameSync('dist/src/server/', 'dist/server')
    fs.removeSync('dist/src/')
}

module.exports = config;