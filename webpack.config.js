const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const webpack = require("webpack");

module.exports = {
    mode: "development",
    entry: path.resolve(__dirname, "./src/index.js"),
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: ["babel-loader"],
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.(png|jpe?g|gif)$/i,
                use: [
                    {
                        loader: "file-loader",
                    },
                ],
            },
        ],
    },
    output: {
        filename: "main.js",
        path: path.resolve(__dirname, "build"),
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: "index.html",
            template: "./src/index.html",
        }),
        new CopyWebpackPlugin({
            patterns: [{ from: "./assets", to: "." }],
        }),
        new webpack.ProvidePlugin({
            process: "process/browser", // Fix undefined "process" in util package
            Buffer: ["buffer", "Buffer"], // Fix undefined "Buffer" in util package
        }),
    ],
    resolve: {
        alias: {
            "highlightjs-solidity": "highlightjs-solidity-shimless", // Fork with fixed browser shim
        },
        extensions: ["*", ".js", ".jsx"],
        fallback: {
            assert: require.resolve("assert"),
            crypto: require.resolve("crypto-browserify"),
            fs: false,
            http: require.resolve("stream-http"),
            https: require.resolve("https-browserify"),
            os: require.resolve("os-browserify/browser"),
            path: require.resolve("path-browserify"),
            readline: false,
            stream: require.resolve("stream-browserify"),
            url: require.resolve("url"),
            worker_threads: false,
        },
    },
    devServer: {
        contentBase: "./build",
        port: 8080,
        historyApiFallback: true,
        hot: true,
    },
};
