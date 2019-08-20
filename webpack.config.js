const path = require('path')
module.exports = {
  entry: './src/threeTool.js',
  output: {
    filename: 'threetools.js',
    path: path.resolve(__dirname, './build/'),
    publicPath: '',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  resolve: {
    extensions: ['.js']
  },
  performance: {
    hints: 'warning',
    maxAssetSize: 30000000,
    maxEntrypointSize: 50000000,
    assetFilter: function (assetFilename) {
      return assetFilename.endsWith('.css') || assetFilename.endsWith('.js')
    }
  }
}
