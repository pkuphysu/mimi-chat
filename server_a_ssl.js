/*
 * Michat Server
 * Created by Shuqiao Zhang in 2018.
 * https://zhangshuqiao.org
 */

/* 
 * This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 */

const program = require("commander"),
	fs = require("fs"),
	https = require("https");

program
	.version("0.1.1a", "-v, --version")
	.description("Michat WebSocket server version 0.1.1a Copyright (c) 2018 Steven Joe 'Mimi' Zhang")
	.usage("_(:з」∠)_")
	.option("-d, --debug", "show logs in the console in order to debug")
	.option("-m, --multi", "write logs to different files accroading to the channel")
	.option("-s, --single", "write logs to a single file")
	.option("-p, --port <port>", "set the listening port <port>", 9005)
	.parse(process.argv);

if (!(program.port >= 0 && program.port < 65536 && program.port % 1 === 0)) {
	console.error("[ERROR] Port argument must be an integer >= 0 and < 65536.");
	program.port = 9005;
}

const server = https.createServer({
	cert: fs.readFileSync("/etc/letsencrypt/live/your.domain.name/fullchain.pem"),
	key: fs.readFileSync("/etc/letsencrypt/live/your.domain.name/privkey.pem")
	/*
	verifyClient: socketVerify, //可选，验证连接函数
	clientTracking: true,
	maxPayload: 1300 //50个unicode字符最大可能大小（Emoji表情“一家人”）
	*/
});

server.listen(program.port); //监听端口

const WebSocketServer = require("ws").Server,
	wss = new WebSocketServer({ server });

function socketVerify(info) {
	if (program.debug) console.log("[New User]", info.req.headers["sec-websocket-protocol"], info.origin, info.req.url, info.secure);
	return true; //否则拒绝
	//传入的info参数会包括这个连接的很多信息，可以在此处使用console.log(info)来查看和选择如何验证连接
}

function timeStamp() {
	var date = new Date().toISOString();
	return date.slice(0, 10) + " " + date.slice(11, 19) + " ";
}
//count记录某个频道的人数
var count = [];
//广播
wss.broadcast = function(type, user, content, towhom) {
	var data = {"type": type, "user": user, "content": content};
	var str = JSON.stringify(data);
	wss.clients.forEach(function(client) {
		//console.log(client.protocol);
		if (client.protocol == towhom) client.send(str);
	});
};
//初始化
wss.on("connection", function(ws) {
	//ws.channel = ws.protocol;
	//protocol用来区分channel 其值与前面的 info.req.headers["sec-websocket-protocol"] 相同
	if (!count[ws.protocol]) count[ws.protocol] = 1;
	else count[ws.protocol]++;
	wss.broadcast("system", count[ws.protocol], "+1", ws.protocol);
	//发送消息
	ws.on("message", function(data) {
		if (ws.banned) return;
		ws.banned = true;
		setTimeout(function(){ws.banned = false}, 3000); //避免刷屏
		var msg = JSON.parse(data);
		wss.broadcast("user", msg.user, msg.content, ws.protocol);
		var msglist = msg.user + " " + msg.content;
		if (program.debug) console.log("[New Message]", ws.protocol, msglist);
		if (program.multi) fs.appendFile("logs/" + ws.protocol + ".log", timeStamp() + msglist + "\n", function(err) {
			if (err && program.debug) console.error("[ERROR] Failed to write the log.");
		});
		if (program.single) fs.appendFile("logs/msg.logs", timeStamp() + ws.protocol + " " + msglist + "\n", function(err) {
			if (err && program.debug) console.error("[ERROR] Failed to write the log.");
		});
	});
	//退出聊天
	ws.on("close", function(close) {
		count[ws.protocol]--;
		wss.broadcast("system", count[ws.protocol], "-1", ws.protocol);
	});
	//错误处理
	ws.on("error", function(error) {
		if (program.debug) console.error("[ERROR] " + error);
	});
});

wss.on("error", function(error) {
	if (program.debug) console.error("[ERROR] " + error);
});

process.on("uncaughtException", function(error) {
	if (program.debug) console.error("[FATAL ERROR] " + error);
	//process.exit(); //不强制退出可能产生不可控问题
});

//控制台输出
var logs = program.multi || program.single;
console.log(`Thank you for using Michat WebSocket server. Use '-h' for help. The server will run on port ${program.port}. When users connect or send message, logs will ${program.debug ? "" : "not "}show in the console ${((program.debug && logs) || (!program.debug && !logs)) ? "and" : "but" } ${logs ? "write to files in /logs." : "won't write to files." }`);
