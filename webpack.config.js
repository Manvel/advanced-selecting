const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const argv = require("minimist")(process.argv.slice(2));

module.exports = {
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "advanced-selecting.js",
  },
  optimization: {
    minimize: false
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "smoke/index.html"}
      ],
    }),
  ]
};

if (argv.watch)
{
  module.exports.watch = true;
}
