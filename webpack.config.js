var path = require('path')
		webpack = require('webpack');

module.exports = {
	cache: true,
  entry: {
    'signalr-tabex': [
      './src/index.js'
    ],
  },

  output: {
    path: path.resolve(__dirname, './lib/'),
    publicPath: 'lib/',
    filename: '[name].js',
  },

  resolve: {
		alias: {},
    root: [
      path.resolve(__dirname, './src')
    ],
    extensions: ['', '.js'],
    modulesDirectory: [
      'web_modules',
      path.resolve(__dirname, './node_modules'),
      path.resolve(__dirname, './bower_components')
    ]
  },
  externals: {
      // require("jquery") is external and available
      //  on the global var jQuery
      'jquery': 'jQuery',
			'tabex': 'tabex'
  },

  module: {
    loaders: [
      { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ },
    ]
  },

  plugins: [
    new webpack.ResolverPlugin(
        new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin('bower.json', ['main'])
    )
  ]
};
