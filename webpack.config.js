const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
var BomPlugin = require("webpack-utf8-bom");
const webpack = require("webpack");
require("dotenv").config();
var webpackMajorVersion = require("./package.json").version;

let commonConfig = {
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
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
};

var asgConfig = Object.assign({}, commonConfig, {
  entry: {
    asg: "./src/asg/index.tsx",
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/public/asg/index.html",
      //publicPath: "asg",
      filename: "index.html",
      chunks: ["asg"],
    }),
    new webpack.EnvironmentPlugin({
      NODE_ENV: process.env.NODE_ENV,
      STRIPE_PUBLISHABLE_KEY_DEV: process.env.STRIPE_PUBLISHABLE_KEY_DEV,
      STRIPE_PUBLISHABLE_KEY_PROD: process.env.STRIPE_PUBLISHABLE_KEY_PROD,
    }),
    // process.env.NODE_ENV === "production" ? new BomPlugin(true) : false,
  ],

  output: {
    filename: "asg.bundle-" + webpackMajorVersion + ".js",
    path: path.resolve(__dirname, "build/asg"),
    clean: true,
  },
  devServer: {
    hot: true,
    host: "localhost",
    server: "spdy",
    port: 443,
    static: {
      directory: path.join(__dirname, "src/public"),
    },
  },
});

var quizConfig = Object.assign({}, commonConfig, {
  entry: {
    quiz: "./src/quiz/index.tsx",
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/public/quiz/index.html",
      filename: "index.html",
      chunks: ["quiz"],
    }),
    new webpack.EnvironmentPlugin({
      NODE_ENV: process.env.NODE_ENV,
    }),
    // process.env.NODE_ENV === "production" ? new BomPlugin(true) : false,
  ],

  output: {
    filename: "quiz.bundle-" + webpackMajorVersion + ".js",
    path: path.resolve(__dirname, "build/quiz"),
    clean: true,
  },
});

module.exports = [asgConfig, quizConfig];
