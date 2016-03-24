#!/usr/bin/env node

var async = require('async');

var fs = require("fs"),
    path = require("path");

var sys = require('sys')
var exec = require('child_process').exec;

var p = "/tmp/kroudly/comments/"
var numFiles =0;
var pos = 0;
var dFiles = [];
fs.readdir(p, function (err, files) {
    	if (err) {
        	throw err;
    	}

    	files.map(function (file) {
        	return path.join(p, file);
    	}).filter(function (file) {
        	return fs.statSync(file).isFile();
	}).forEach(function (file, index, array) {
		console.log("Numfiles: "+array.length+" "+numFiles);
		numFiles++;
		if (numFiles === array.length){
        		async.eachLimit(array, 1,function(file,callback){
				processAudio(file, callback);
        		}, function (err) {
 		   		if (err) console.error(err.message);
			});
		}
	});
 	
});

function processAudio(file, callback){
        	console.log("%s (%s)", file, path.extname(file));
        	if (path.extname(file) != ".wav") {
			callback();
			return;
		}
        	var birthday = fs.statSync(file).mtime.getFullYear()+("0" + (fs.statSync(file).mtime.getMonth() + 1)).slice(-2)+("0" + (fs.statSync(file).mtime.getDate())).slice(-2);
        	var birthtime = ("0" + (fs.statSync(file).mtime.getHours() )).slice(-2)+("0" + (fs.statSync(file).mtime.getMinutes() )).slice(-2)+("0" + (fs.statSync(file).mtime.getSeconds())).slice(-2);
        	var baseFileName = "./comments/cmnt-"+file.split("-")[1]+"-"+birthday+birthtime;
        	var oldMp3File = file.slice(0,-4)+".mp3";
        	var oldOggFile = file.slice(0,-4)+".ogg";
                try{
			fs.statSync(oldMp3File);
                        callback();
		} catch (err) {
			console.log(err);
			if (err.code === 'ENOENT') {		

				console.log(oldMp3File+"NOT exists");
				var wavFile = baseFileName+".wav";
		        	var oggFile = baseFileName+".ogg";
        			var mp3File = baseFileName+".mp3";
				console.log("creating "+mp3File+" "+oggFile);
				function puts(error, stdout, stderr) { sys.puts(stdout) }
               
				const doWav = exec("cp "+file+" "+wavFile, puts);
        			doWav.on('close', function(code, signal){
					console.log("Processing File:"+numFiles);
					const doMp3 = exec("lame -V 5 "+file+" "+mp3File, puts);
					doMp3.on('close', function(code, signal){
  						console.log("doMp3 process terminated due to receipt of signal " + signal);
						const doOgg = exec("oggenc -q 3 -o "+oggFile+" "+file, puts);
						doOgg.on('close', function(code, signal){
  							console.log("doOgg process terminated due to receipt of signal "+signal);
							var url =  'http://krdly-ivr-prod0.cfapps.io/reconciliation/audio-on-file';
							var postUrl = "curl '"+ url + "' -F 'wav=@"+wavFile+"' -F 'mp3=@"+mp3File+"' -F 'ogg=@"+oggFile+"'";
							console.log(postUrl);
							const doCurl = exec(postUrl);
							doCurl.on('close', function(code, signal){
								console.log((pos++)+" doCurl process terminated due to receipt of signal " + signal);
								callback();
							});
						});
					});
				});
			} else {
				callback();
			}
		}

}
