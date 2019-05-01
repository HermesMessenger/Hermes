const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const devMode = process.env.NODE_ENV !== 'production';
const fs = require('fs');

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
                            hmr: process.env.NODE_ENV === 'development',
                        },
                    },
                    'css-loader',
                    {
                        loader: 'postcss-loader',
                        options: { sourceMap: true }
                    },
                    {
                        loader: 'sass-loader', options: {
                            sourceMap: true,
                            outputStyle: 'compressed'
                        }
                    },
                ],
            },
            { test: /\.ts$/, use: 'ts-loader', exclude: /node_modules/ },
            {
                test: /\.(html|png|jpe?g|json)$/,
                loader: 'file-loader',
                options: {
                    name(file) {
                        return '[path][name].[ext]';
                    },
                },
            },
        ]
    },
    output: {
        path: path.resolve(__dirname, 'dist/web'),
    },
    entry: {
        index: ['./index.ts', './index.scss', './index.html'],
    },
    resolve: {
        extensions: [ '.ts', '.html', '.scss', '.png', '.jpeg', '.jpg', '.json' ]
    }
};

// Add themes
let files = fs.readdirSync(config.context + '/themes/')
for (let file of files){
    if(file.endsWith('.scss')) {
        config.entry['theme_'+file.replace('.scss', '')] = ['./themes/'+file]
    }
}

module.exports = config;