const path = require('path')

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    codemirror: './codemirror.js'
  },
  output: {
    globalObject: 'self',
    path: path.resolve(__dirname, 'dist'),
    filename: 'codemirror.bundle.js',
  },
  devServer: {
    contentBase: path.join(__dirname),
    compress: true,
    publicPath: '/dist/'
  }
}
