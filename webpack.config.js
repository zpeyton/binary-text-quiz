const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
var BomPlugin = require("webpack-utf8-bom");
const webpack = require("webpack");
require("dotenv").config();
var webpackMajorVersion = require("./package.json").version;

module.exports = {
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  entry: {
    quiz: "./src/quiz/index.tsx",
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/public/index.html",
      filename: "index.html",
      chunks: ["quiz"],
    }),
    new webpack.EnvironmentPlugin({}),
    process.env.NODE_ENV === "production" ? new BomPlugin(true) : false,
  ],
  module: {
    rules: [
      {
        test: /\.(js|ts)x?$/,
        loader: "babel-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.svg$/,
        use: ["@svgr/webpack"],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx"],
    fallback: {
      crypto: false,
      buffer: false,
    },
  },
  output: {
    filename: "[name].bundle-" + webpackMajorVersion + ".js",
    path: path.resolve(__dirname, "build"),
    clean: true,
  },
  devServer: {
    hot: true,
    host: "localhost",
    port: 8080,
    static: {
      directory: path.join(__dirname, "src/public"),
    },
  },
};
