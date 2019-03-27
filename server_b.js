/*
 * Mimi Chat
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

//初始化
const ws = require("nodejs-websocket");
var options = config.use_ssl ? {
	secure: true,
	cert: fs.readFileSync(config.cert),
	key: fs.readFileSync(config.key)
} : {};
var server = ws.createServer(options, (conn) => {
	console.log("[New User]", conn.protocols[0]);
	//conn.channel = conn.protocols[0];
	//protocol用来区分channel 其值与前面的 info.req.headers["sec-websocket-protocol"] 相同
	if (!count[conn.protocols[0]]) count[conn.protocols[0]] = 1;
	else count[conn.protocols[0]]++;
	server.broadcast("system", count[conn.protocols[0]], "+1", conn.protocols[0]);
	//发送消息
	conn.on("text", (data) => {
		if (conn.banned) return;
		conn.banned = true;
		setTimeout(() => {
			conn.banned = false;
		}, 3000); //避免刷屏
		var msg = JSON.parse(data);
		server.broadcast("user", msg.user, msg.content, conn.protocols[0]);
		var msglist = msg.user + " " + msg.content;
		if (config.debug) console.log("[New Message]", conn.protocols[0], msglist);
		if (config.multi_log) fs.appendFile("logs/" + conn.protocols[0] + ".log", timeStamp() + msglist + "\n", (err) => {
			if (err && config.debug) console.error("[ERROR] Failed to write the log.");
		});
		if (config.single_log) fs.appendFile("logs/msg.logs", timeStamp() + conn.protocols[0] + " " + msglist + "\n", (err) => {
			if (err && config.debug) console.error("[ERROR] Failed to write the log.");
		});
	});
	//退出聊天
	conn.on("close", (close) => {
		count[conn.protocols[0]]--;
		server.broadcast("system", count[conn.protocols[0]], "-1", conn.protocols[0]);
	});
	//错误处理
	conn.on("error", (error) => {
		if (config.debug) console.error("[ERROR] " + error);
	});
}).listen(config.port);

function timeStamp() {
	var date = new Date().toISOString();
	return date.slice(0, 10) + " " + date.slice(11, 19) + " ";
}
//count记录某个频道的人数
var count = [];
//广播
server.broadcast = (type, user, content, towhom) => {
	var data = {"type": type, "user": user, "content": content};
	var str = JSON.stringify(data);
	server.connections.forEach((client) => {
		//console.log(client.protocol);
		if (client.protocols[0] == towhom) client.send(str);
	});
};
server.on("error", (error) => {
	if (config.debug) console.error("[ERROR] " + error);
});

process.on("uncaughtException", (error) => {
	if (config.debug) console.error("[FATAL ERROR] " + error);
	//process.exit(); //不强制退出可能产生不可控问题
});
