const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  entry: "./App/index.js",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ["babel-loader"],
      },
      {
        test: /\.ts$/,
        use: {
          loader: "ts-loader",
          options: {
            onlyCompileBundledFiles: true,
            compilerOptions: {
              noEmit: false,
            },
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.json$/i,
        loader: "json5-loader",
        type: "javascript/auto",
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      hash: true,
      template: "./index.html",
    }),
    new webpack.ProvidePlugin({
      _: "lodash",
    }),
  ],
  resolve: {
    extensions: [".js", ".ts"],
    modules: [
      path.resolve("./App"),
      path.resolve("./App/Screens"),
      path.resolve("./App/Libs/Broadcast"),
      path.resolve("./App/Libs/Pixi.Classes"),
      path.resolve("./App/Libs/Three"),
      path.resolve("./App/Libs/System"),
      path.resolve("./App/Libs/AnimationStateMachine"),
      path.resolve("./App/Libs/BehaviorStateMachine"),
      path.resolve("./App/Custom"),
      path.resolve("./App/Custom/Boss"),
      path.resolve("./App/Custom/Character"),
      path.resolve("./node_modules"),
      path.resolve("./Settings"),
    ],
  },
  devServer: {
    static: __dirname + "/",
    port: 4582,
    client: {
      overlay: false,
    },
    hot: true,
    liveReload: true,
  },
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          ecma: 2020,
          compress: {
            drop_console: true,
            pure_funcs: ["console.info"],
          },
          format: {
            comments: false,
          },
        },
        extractComments: false,
      }),
    ],
  },
};
