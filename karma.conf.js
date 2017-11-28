module.exports = function(config) {
    config.set({
        frameworks: ["mocha", "chai"],
        files: ["src/yalla.js","test/**/*.js"],
        reporters: ["progress","coverage"],
        preprocessors: {
            "src/**/*.js": ["coverage"]
        },
        coverageReporter: {
            dir: "coverage/",
            reporters: [
                { type: "html", subdir: "report-html" },
                { type: "lcov", subdir: "report-lcov" }
            ]
        },
        port: 9876,  // karma web server port
        colors: true,
        logLevel: config.LOG_INFO,
        browsers: ["ChromeHeadless"],
        autoWatch: false,
        // singleRun: false, // Karma captures browsers, runs the tests and exits
        concurrency: Infinity
    })
}