/* eslint-disable */

const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const TerserWebpackPlugin = require("terser-webpack-plugin");
const webpack = require("webpack");

module.exports = {
    entry: {
        cli: "./src/cli.ts"
    },
    devtool: "source-map",
    output: {
        path: __dirname + "/bin",
        filename: "uno-server.js"
    },
    target: "node",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [ ".ts", ".tsx", ".js", ".jsx" ],
    },
    plugins: [
        new CleanWebpackPlugin(),
        new webpack.BannerPlugin({ banner: "#!/usr/bin/env node", raw: true })
    ],
    optimization: {
        splitChunks: {
            chunks: "all"
        },
        usedExports: true,
        minimizer: [
            new TerserWebpackPlugin()
        ]
    }
}
