var path = require("path");
var webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
    target: "web",
    entry: {
        workitemstats: "./src/work-item-stats.ts"
    },
    devtool: "source-map",
    devServer: {
        https: true,
        port: 3000,
        publicPath: "/dist/"
    },
    output: {
        filename: "[name].js",
        libraryTarget: "amd",
        sourceMapFilename: "[file].map"
    },
    externals: [{
        "q": true
    },
        /^VSS\/.*/, /^TFS\/.*/
    ],
    resolve: {
        extensions: ["*",".webpack.js", ".web.js", ".ts", ".tsx", ".js"],
        modules: [path.resolve("./src"),"node_modules"],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                enforce: 'pre',
                use: [
                    {
                        loader: 'tslint-loader',
                        options: { emitErrors: true, failOnHint:true}
                    }
                ]
            },
            {
                test: /\.tsx?$/, 
                loader: "ts-loader" 
            }
        ]
    },
    plugins: [new CopyWebpackPlugin([{ from: "**/*.html", context: "src" }])]
}