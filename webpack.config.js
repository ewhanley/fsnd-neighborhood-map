const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
        entry: './src/index.js',
        devtool: 'inline-source-map',
        devServer: {
                contentBase: path.join(__dirname, 'dist'),
                compress: true
        },
        plugins: [
                new HtmlWebpackPlugin({
                        template: 'src/index.html'
                }),
                new CleanWebpackPlugin(['dist']),
                new UglifyJSPlugin(),
                new CopyWebpackPlugin([
                        {
                                from: 'src/img/Powered-by-Foursquare-full-color-300.png',
                                to: 'Powered-by-Foursquare-full-color-300.png'
                        }
                ])
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
