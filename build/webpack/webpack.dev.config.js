/*
 * Emoji Tools
 * Copyright (C) 2015-2017 Mitch Talmadge (https://MitchTalmadge.com)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const config = require('./webpack.common.config.js');
const AotPlugin = require('@ngtools/webpack').AotPlugin;
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

config.module.rules.unshift(
    {
        test: /\.ts$/,
        use: ['awesome-typescript-loader', 'angular2-template-loader'],
        exclude: [/\.(spec|e2e)\.ts$/]
    }
);

config.devServer = {
    contentBase: path.join(__dirname, "../../tmp"),
    historyApiFallback: true,
    compress: true,
    port: 9000
};

config.plugins.push(
    new HtmlWebpackPlugin({
        template: path.join(__dirname, '../../src/index.html.ejs'),
        filename: path.join(__dirname, '../../tmp/index.html'),
        inject: 'body',
        minify: {
            minifyCSS: true,
            minifyJS: true,
            removeComments: true,
            collapseWhitespace: true,
            collapseInlineTagWhitespace: true
        },
        chunksSortMode: 'dependency',
        dev: true
    })
);

config.plugins.push(
    new CleanWebpackPlugin(['tmp'], {root: path.join(__dirname, "../../")})
);

config.devtool = 'source-map';
config.output = {
    path: path.join(__dirname, '../../tmp/'),
    filename: './resources/scripts/[name].js',
    sourceMapFilename: './resources/scripts/[name].map',
    chunkFilename: './resources/scripts/[id].chunk.js'
};

module.exports = config;