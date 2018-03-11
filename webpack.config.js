const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
        entry: './src/index.js',
        devtool: 'inline-source-map',
        devServer: {
                contentBase: './dist',
                port: 8081
        },
        plugins: [
                new HtmlWebpackPlugin({
                        template: 'src/index.html'
                }),
                new CleanWebpackPlugin(['dist']),
                new UglifyJSPlugin()
        ],
        output: {
                filename: 'bundle.js',
                path: path.resolve(__dirname, 'dist')
        },
        module: {
                rules: [
                        {
                                test: /\..js$/,
                                exclude: /node_modules/,
                                use: [
                                        'babel-loader'
                                ]
                        },
                        {
                                test: /\.css$/,
                                use: [
                                        'style-loader',
                                        'css-loader'
                                ]
                        },
                        {
                                test: /\.(png|svg|jpg|gif)$/,
                                use: [
                                        'file-loader'
                                ]
                        },
                        {
                                test: /\.(woff|woff2|eot|ttf|otf)$/,
                                use: [
                                        'file-loader'
                                ]
                        }
                ]
        }
};
