var Util = require("./util");
var Polyfill = require("./polyfill");
var Factory = require("./transpiler");

var version = require("../version");

var Watcher = {
	
	compile: function(folder, dest, watch){
	
		function conv(str) {
			str = str.replace('\\', '/');
			if(!Polyfill.endsWith.call(str, '/')) str += '/';
			return str;
		}
		
		folder = conv(folder);
		if(!dest) dest = folder;
		else dest = conv(dest);
		
		var fs = require("fs");
		var path = require("path");
		
		function update(filename) {
			if(Polyfill.endsWith.call(filename, ".jsb")) {
				console.log("Changes detected to " + folder + filename);
				fs.readFile(folder + filename, function(error, data){
					if(error) {
						console.error(error);
					} else {
						var source = path.relative(dest, folder).replace('\\', '/');
						if(source) source += "/";
						source += filename;
						var namespace = folder + filename;
						var conv;
						try {
							conv = Factory.convertSource(data.toString(), {namespace: namespace});
						} catch(e) {
							console.error(e);
						}
						Util.reset(namespace);
						if(conv) {
							var destFilename = dest + filename.substring(0, filename.length - 1);
							var destFolder = destFilename.substring(0, destFilename.lastIndexOf('/'));
							function save() {
								fs.writeFile(destFilename, "/*! This file was automatically generated using Factory v" + version.version + " from '" + source + "'. Do not edit manually! */" + conv, function(error){
									if(error) {
										console.error(error);
									} else {
										console.log("Converted to " + dest + filename);
									}
								});
							}
							fs.access(destFolder, fs.constants.F_OK, function(error){
								if(error) {
									fs.mkdir(destFolder, {recursive: true}, function(error){
										if(error) {
											console.error(error);
										} else {
											save();
										}
									});
								} else {
									save();
								}
							});
						}
					}
				});
			}
		}
		
		function read(currFolder) {
			fs.readdir(folder + currFolder, function(error, files){
				if(error) {
					console.error(error);
				} else {
					files.forEach(function(file){
						var currFile = (currFolder && currFolder + '/') + file;
						fs.stat(folder + currFile, function(error, stat){
							if(error) {
								console.error(error);
							} else if(stat.isFile()) {
								update(currFile);
							} else if(stat.isDirectory()) {
								read(currFile);
							}
						});
					});
				}
			});
		}
		read("");
		
		if(watch) {
			
			fs.watch(folder, {recursive: true}, function(event, filename){
				update(filename);
			});
			
			console.log("Watching " + folder + "**/*.jsb using Factory v" + Factory.VERSION);
			
		}
		
	},
	
	watch: function(folder, dest){
		Watcher.compile(folder, dest, true);
	}
	
};

if(typeof process == "object" && process.argv && (process.argv[2] == "compile" || process.argv[2] == "watch")) {
	Watcher[process.argv[2]](process.argv[3], process.argv[4]);
}

module.exports = Watcher;
	