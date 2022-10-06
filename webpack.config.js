//dist is usually used. github requires "docs" name for public foder

//variable which will be set to whichever stage of the cycle is being executed
const currentTask = process.env.npm_lifecycle_event;

//including the Path module from node
const path = require('path');

//clean dist folder before adding there updated files
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
//extract .css file from main js file
const MiniCSSExtractPlugin = require('mini-css-extract-plugin');
//minimize the size of css file
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
//can put css and js links to html file
const HtmlWebpackPlugin = require('html-webpack-plugin');
//put other files into dist
const fse = require('fs-extra');

//add funcionality of post css
const postCSSPlugins = [
    require('postcss-import'),
    require('postcss-mixins'),
    require('postcss-simple-vars'),
    require('postcss-nested'),
    require('postcss-hexrgba'),
    require('autoprefixer'),
];

//copying img to dist folder
class RunAfterCompile {
    apply(compiler) {
        compiler.hooks.done.tap('Copy images', () => {
            fse.copySync('./app/assets/images', './docs/assets/images');
        });
    }
}

//cs config shared for both dev and build
let cssConfig = {
    test: /\.css$/i,
    use: [
        "css-loader?url=false", 
        {
            loader: 'postcss-loader',
            options: {
                postcssOptions: {
                    plugins: postCSSPlugins
                }
            },
        },
    ],
};

//preparing an array of html to add to dist folder
let pages = fse.readdirSync('./app').filter(file => {
    return file.endsWith('.html');
    }).map(page => {
    return new HtmlWebpackPlugin({
        filename: page,
        template: `./app/${page}`,
    });
})

//config with shared "properties" of dev and build
let config = {
    entry: './app/assets/scripts/App.js',
    plugins: pages,
    module: {
        rules: [
            cssConfig,
        ],
    },
};

//adding special "properties" just for dev task
if(currentTask == 'dev') {
    cssConfig.use.unshift('style-loader');
    config.output = {
        filename: 'bundled.js',
        path: path.resolve(__dirname, 'app'),
    };
    config.devServer = {
        before: (app, server) => {
            server._watch('./app/**/*.html');
        },
        contentBase: path.join(__dirname, 'app'),
        hot: true,
        port: 3000,
        host: '0.0.0.0',
    };
    config.mode = 'development';
}

//adding special "properties" just for build task
if(currentTask == 'build') {
    //preparing the site to work on more variety of web browsers (i.e. older)
    config.module.rules.push({
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
            loader: 'babel-loader',
            options: {
                presets:  ['@babel/preset-env'],
            },
        },
    });

    //excluding css from main file
    cssConfig.use.unshift(MiniCSSExtractPlugin.loader);
    config.output = {
        filename: '[name].[chunkhash].js',
        chunkFilename: '[name].[chunkhash].js',
        path: path.resolve(__dirname, 'docs'),
    };
    config.mode = 'production';
    config.optimization = {
        //minimizing css
        splitChunks: {chunks: 'all'},
        minimize: true,
        minimizer: [`...`, new CssMinimizerPlugin()],
    };
    //adding plugins
    config.plugins.push(
        new CleanWebpackPlugin(), 
        new MiniCSSExtractPlugin({
            filename: 'styles.[chunkhash].css',
        }),
        new RunAfterCompile(),
    );
};

module.exports = config;