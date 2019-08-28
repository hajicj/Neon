const path = require('path');
const webpack = require('webpack');
const childProcess = require('child_process');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');

let commitHash = childProcess.execSync('git rev-parse --short HEAD').toString();

module.exports = {
  mode: 'production',
  entry: {
    editor: './deployment/pages/editor.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist', 'Neon-gh'),
    filename: '[name].js'
  },
  node: {
    fs: 'empty'
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          'awesome-typescript-loader'
        ],
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.(png|svg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: './img/'
            }
          }
        ]
      },
      {
        test: /\.mei$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: './mei/'
            }
          }
        ]
      },
      {
        test: /\.rng$/,
        use: [
          'raw-loader'
        ]
      },
      {
        test: /Worker\.js$/,
        use: [
          {
            loader: 'worker-loader',
            options: { publicPath: '/Neon/Neon-gh/' }
          }
        ]
      },
      {
        test: /\.html$/,
        use: [
          'html-loader'
        ]
      }
    ]
  },
  resolve: {
    extensions: [ '.ts', '.js' ]
  },
  externals: {
    'verovio-dev': 'verovio',
    d3: 'd3'
  },
  plugins: [
    new HardSourceWebpackPlugin(),
    new webpack.DefinePlugin({
      __LINK_LOCATION__: JSON.stringify('https://ddmal.music.mcgill.ca/Neon'),
      __NEON_VERSION__: JSON.stringify('Commit ' + commitHash),
      __ASSET_PREFIX__: JSON.stringify('/Neon/Neon-gh/')
    })
  ]
};
