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

var config = require(process.argv[2] || "./config.json");

if (!(config.port >= 0 && config.port < 65536 && config.port % 1 === 0)) {
	console.error("[ERROR] Port argument must be an integer >= 0 and < 65536.");
	config.port = 9000;
}

//控制台输出
var logs = config.multi_log || config.single_log;
console.log(`Thank you for using Michat WebSocket server. The server will run on port ${config.port}. When users connect or send message, logs will ${config.debug ? "" : "not "}show in the console ${((config.debug && logs) || (!config.debug && !logs)) ? "and" : "but" } ${logs ? "write to files in /logs." : "won't write to files." }`);

var WebSocketServer, wss;
if (config.use_ssl) {
	const https = require("https");
	const server = https.createServer({
		cert: fs.readFileSync(config.cert),
		key: fs.readFileSync(config.key)
		/*
		verifyClient: socketVerify, //可选，验证连接函数
		clientTracking: true,
		maxPayload: 1300 //50个unicode字符最大可能大小（Emoji表情“一家人”）
		*/
	});

	server.listen(config.port); //监听端口

	WebSocketServer = require("ws").Server;
	wss = new WebSocketServer({ server });
}
else {
	WebSocketServer = require("ws").Server;
	wss = new WebSocketServer({
		port: config.port, //监听端口
		verifyClient: socketVerify, //可选，验证连接函数
		clientTracking: true,
		maxPayload: 1300 //50个unicode字符最大可能大小（Emoji表情“一家人”）
	});
}

function socketVerify(info) {
	if (config.debug) console.log("[New User]", info.req.headers["sec-websocket-protocol"], info.origin, info.req.url, info.secure);
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
wss.broadcast = (type, user, content, towhom) => {
	var data = {"type": type, "user": user, "content": content};
	var str = JSON.stringify(data);
	wss.clients.forEach((client) => {
		//console.log(client.protocol);
		if (client.protocol == towhom) client.send(str);
	});
};
//初始化
wss.on("connection", (ws) => {
	//ws.channel = ws.protocol;
	//protocol用来区分channel 其值与前面的 info.req.headers["sec-websocket-protocol"] 相同
	if (!count[ws.protocol]) count[ws.protocol] = 1;
	else count[ws.protocol]++;
	wss.broadcast("system", count[ws.protocol], "+1", ws.protocol);
	//发送消息
	ws.on("message", (data) => {
		if (ws.banned) return;
		ws.banned = true;
		setTimeout(() => {
			ws.banned = false;
		}, 3000); //避免刷屏
		var msg = JSON.parse(data);
		wss.broadcast("user", msg.user, msg.content, ws.protocol);
		var msglist = msg.user + " " + msg.content;
		if (config.debug) console.log("[New Message]", ws.protocol, msglist);
		if (config.multi_log) fs.appendFile("logs/" + ws.protocol + ".log", timeStamp() + msglist + "\n", (err) => {
			if (err && config.debug) console.error("[ERROR] Failed to write the log.");
		});
		if (config.single_log) fs.appendFile("logs/msg.logs", timeStamp() + ws.protocol + " " + msglist + "\n", (err) => {
			if (err && config.debug) console.error("[ERROR] Failed to write the log.");
		});
	});
	//退出聊天
	ws.on("close", (close) => {
		count[ws.protocol]--;
		wss.broadcast("system", count[ws.protocol], "-1", ws.protocol);
	});
	//错误处理
	ws.on("error", (error) => {
		if (config.debug) console.error("[ERROR] " + error);
	});
});

wss.on("error", (error) => {
	if (config.debug) console.error("[ERROR] " + error);
});

process.on("uncaughtException", (error) => {
	if (config.debug) console.error("[FATAL ERROR] " + error);
	//process.exit(); //不强制退出可能产生不可控问题
});
