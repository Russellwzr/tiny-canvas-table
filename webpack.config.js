const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
	mode: 'development',
	entry: {		
    index: './src/index.ts',
    worker: './src/worker.ts'
  },
	output: {
		path: path.resolve(__dirname, './dist')
	},
	resolve: {
		extensions: ['.ts', '.js']
	},
	plugins: [
    new HtmlWebpackPlugin({
      templateContent: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>HPC Table</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body>
						<canvas id="canvas" tabindex="0"></canvas>
          </body>
        </html>`
    }),
    new CopyPlugin({
      patterns: [
        { from: 'public', to: path.resolve(__dirname, './dist') },
      ],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "babel-loader",
        options: {
          presets: ["@babel/preset-typescript"],
        }
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      }
    ],
  },
	devServer: {
		open: true,
		hot: true,
	},
  devtool: 'eval-source-map',
};
