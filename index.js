const Bacon = require("baconjs");
const debug = require("debug")("signalk:signalk-perf-logger");
const util = require("util");
const _ = require('lodash')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')

/*

Signal K server plugin to log performance data to csv files.

Features:
- Basic logging
- Configurable log directory
- Splitting per hour

TODO:

*/

module.exports = function(app) {
    var plugin = {};
    var logDir = ""
    var logFileName = "data_log.json"
    var logRotationInterval = 3600
    var timerRotationId
    var timerId
    var period = 300

    plugin.id = "sk-perf-logger"
    plugin.name = "Signal K perf data logger"
    plugin.description = "Log Signal K performance data to csv files."

    plugin.schema = {
	type: "object",
	title: "Performance data logging to csv files",
	description: "Log Signal K performance data into csv files.",
	properties: {
	    logdir: {
		type: 'string',
		title: 'Data log file directory',
            default: '/root/.signalk/sk-perf-data'
	    },
	    interval: {
		type: 'number',
		title: 'Log rotation interval (in seconds). Value of zero disables log rotation.',
            default: 3600
	    },
	    context: {
		type: 'string',
		title: 'Subscription context',
            default: 'vessels.self'
	    },
	    period: {
		type: 'number',
		title: 'Logging period.',
		default: 300
	    }
	}
    }

    plugin.start = function (options) {

	if (typeof options.logdir === 'undefined') {
	    app.setProviderStatus('Log directory not defined, plugin disabled')
	    return
	}
	logDir = options.logdir
	logRotationInterval = options.interval
	context = options.context
	period = options.period

	if (!fs.existsSync(logDir)) {
	    // attempt creating the log directory
	    try {
		fs.mkdirSync(logDir)
	    } catch (error) {
		app.setProviderStatus(`Unable to create log directory ${logDir}, plugin disabled`)
		return
	    }
	}

	// compress the old leftover logfile, if any
	const logMetaFileName = path.join(logDir, '.current_log_file')
	if (fs.existsSync(logMetaFileName)) {
	    app.debug("meta file exists")
	    const oldLogFile = fs.readFileSync(logMetaFileName).toString()
	    if (fs.existsSync(path.join(logDir, oldLogFile))) {
		compressLogFile(logDir, oldLogFile)
	    }
	}

	// create a new logfile
	rotateLogFile(new Date())

	if (logRotationInterval > 0) {
	    timerRotationId = setInterval(() => { rotateLogFile(new Date(), true) }, logRotationInterval * 1000 )
	}

	timerId = setInterval(() => { writeData() }, period * 1000 )
    }
    
    plugin.stop = function () {

	clearInterval(timerRotationId)
	clearInterval(timerId)

	// compress the log file
	rotateLogFile(new Date(), true)
    }
    return plugin

    function writeData() {
	//	timestamp,lat,lon,sog,cog,stw,aws,awa
	try {
	    let obj = {
		datetime : app.getSelfPath('navigation.datetime.value'),
		position : app.getSelfPath('navigation.position.value'),
		sog : app.getSelfPath('navigation.speedOverGround.value'),
		cog : app.getSelfPath('navigation.courseOverGroundTrue.value'),
		stw : app.getSelfPath('navigation.speedThroughWater.value'),
		aws : app.getSelfPath('environment.wind.speedApparent'),
		awa : app.getSelfPath('environment.wind.angleApparent')
	    }
	    fs.appendFile(
		path.join(logDir, logFileName),
		(obj.datetime).concat(",")
		    .concat(obj.position.latitude).concat(",")
		    .concat(obj.position.longitude).concat(",")
		    .concat(obj.sog).concat(",")
		    .concat(obj.cog).concat(",")
		    .concat(obj.stw).concat(",")
		    .concat(obj.aws).concat(",")
		    .concat(obj.awa).concat("\n"), (err) => {
		    if (err) throw err;
		}
	    )
	} catch (err) {
	    console.log(err)
	}
    }

    function compressLogFile(logDir, logFileName) {
	let logPath = path.join(logDir, logFileName)
	const gzip = spawn('gzip', [logPath])
	gzip.on('close', (code) => {
	    if (code !== 0) {
		console.log(`Compressing file ${logPath} failed with exit code ${code}`)
	    }
	})
    }

    function writeHeaders() {
	try {
	    fs.appendFile(
		path.join(logDir, logFileName),
		"timestamp,lat,lon,sog,cog,stw,aws,awa\n", (err) => {
		    if (err) throw err;
		}
	    )
	} catch (err) {
	    console.log(err)
	}
    }

    function rotateLogFile(time, compressPrevious = false) {
	// update the log filename
	const oldLogFileName = logFileName
	logFileName = "perf-data.".concat(time.toISOString().replace(/\:/g,"-")).concat('.log')

	// write the column headers
	writeHeaders();

	// gzip the old logfile
	if (compressPrevious) {
	    compressLogFile(logDir, oldLogFileName)
	}

	// keep track of the current log file
	fs.writeFileSync(path.join(logDir, '.current_log_file'), logFileName)
    }
}
