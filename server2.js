//https://github.com/sitegui/nodejs-websocket
var program = require("commander"),
	fs = require("fs");

program
	.version("0.1.1", "-v, --version")
	.description("Michat WebSocket server version 0.1.1 Copyright (c) 2018 Steven Joe 'Mimi' Zhang")
	.usage("_(:з」∠)_")
	.option("-d, --debug", "show logs in the console in order to debug")
	.option("-m, --multi", "write logs to different files accroading to the channel")
	.option("-s, --single", "write logs to a single file")
	.option("-p, --port <port>", "set the listening port <port>", 9000)
	.parse(process.argv);

if (!(program.port >= 0 && program.port < 65536 && program.port % 1 === 0)) {
	console.error("[ERROR] Port argument must be an integer >= 0 and < 65536.");
	program.port = 9000;
}
//控制台输出
var message = "Thank you for using Michat WebSocket server. Use '-h' for help. The server will run on port " + program.port + ". When users connect or send message, logs will";
if (program.debug) message += " show in the console";
if (!program.debug) message += " not show in the console";
var logs;
if (program.multi || program.single) logs = true;
else logs = false;
if ((program.debug && logs) || (!program.debug && !logs)) message += " and";
else message += " but";
if (!logs) message += " won't write to files.";
if (logs) message += " write to files in /logs.";
console.log(message);
//初始化
var ws = require("nodejs-websocket");
var server = ws.createServer(function(conn){
	console.log("[New User]", conn.protocols[0]);
	//conn.channel = conn.protocols[0];
	//protocol用来区分channel 其值与前面的 info.req.headers["sec-websocket-protocol"] 相同
	if (!count[conn.protocols[0]]) count[conn.protocols[0]] = 1;
	else count[conn.protocols[0]]++;
	server.broadcast("system", count[conn.protocols[0]], "+1", conn.protocols[0]);
	//发送消息
	conn.on("text", function(data) {
		if (conn.banned) return;
		conn.banned = true;
		setTimeout(function(){conn.banned = false}, 3000); //避免刷屏
		var msg = JSON.parse(data);
		server.broadcast("user", msg.user, msg.content, conn.protocols[0]);
		var msglist = msg.user + " " + msg.content;
		if (program.debug) console.log("[New Message]", conn.protocols[0], msglist);
		if (program.multi) fs.appendFile("logs/" + conn.protocols[0] + ".log", timeStamp() + msglist + "\n", function(err) {
			if (err && program.debug) console.error("[ERROR] Failed to write the log.");
		});
		if (program.single) fs.appendFile("logs/msg.logs", timeStamp() + conn.protocols[0] + " " + msglist + "\n", function(err) {
			if (err && program.debug) console.error("[ERROR] Failed to write the log.");
		});
	});
	//退出聊天
	conn.on("close", function(close) {
		count[conn.protocols[0]]--;
		server.broadcast("system", count[conn.protocols[0]], "-1", conn.protocols[0]);
	});
	//错误处理
	conn.on("error", function(error) {
		if (program.debug) console.error("[ERROR] " + error);
	});
}).listen(program.port);

function timeStamp() {
	var date = new Date().toISOString();
	return date.slice(0, 10) + " " + date.slice(11, 19) + " ";
}
//count记录某个频道的人数
var count = new Array();
//广播
server.broadcast = function(type, user, content, towhom) {
	var data = {"type": type, "user": user, "content": content};
	var str = JSON.stringify(data);
	server.connections.forEach(function(client) {
		//console.log(client.protocol);
		if (client.protocols[0] == towhom) client.send(str);
	});
};
server.on("error", function(error) {
	if (program.debug) console.error("[ERROR] " + error);
});

process.on("uncaughtException", function(error) {
	if (program.debug) console.error("[FATAL ERROR] " + error);
	//process.exit(); //不强制退出可能产生不可控问题
});
