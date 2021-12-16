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

// https://github.com/websockets/ws/blob/master/examples/express-session-parse/index.js
import MiServer from "mimi-server";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(fs.readFileSync(process.argv[2] || "./config.json", "utf-8"));

const port = process.env.PORT || config.port;

const { app, server } = new MiServer({
	port,
	static: path.join(__dirname, "public")
});

const adj = fs.readFileSync(path.join(__dirname, "name/adj.txt")).toString().split("\n");
const noun = fs.readFileSync(path.join(__dirname, "name/noun.txt")).toString().split("\n");

app.get("/name/", (req, res) => {
	const randomName = adj[Math.floor(Math.random() * adj.length)] + "的" + noun[Math.floor(Math.random() * noun.length)];
	res.end(randomName);
});

// 控制台输出
const logs = config.multi_log || config.single_log;
console.log(`Thank you for using Michat WebSocket server. The server will listen on port ${config.port}. When users connect or send message, logs will ${config.debug ? "" : "not "}show in the console ${((config.debug && logs) || (!config.debug && !logs)) ? "and" : "but" } ${logs ? "write to files in /logs." : "won't write to files." }`);

import WebSocket, { WebSocketServer } from "ws";
const wss = new WebSocketServer({
	clientTracking: true,
	maxPayload: 1300, // 50 个 Unicode 字符最大可能大小（Emoji 表情「一家人」）
	server
});

function timeStamp() {
	const date = new Date().toISOString();
	return date.slice(0, 10) + " " + date.slice(11, 19) + " ";
}

function debug(err) {
	if (config.debug) {
		console.error("[ERROR] " + err);
	}
}
// count 记录某个频道的人数
const count = [];
// 广播
function broadcast(from, meta, content, towhom) {
	const data = JSON.stringify({ from, meta, content });
	wss.clients.forEach(client => {
		if (client.readyState === WebSocket.OPEN && client.protocol === towhom) {
			client.send(data);
		}
	});
}

server.on("upgrade", (request, socket, head) => {
	if (config.debug) {
		console.log("[New User]", request.headers["sec-websocket-protocol"], request.headers.origin, request.url);
	}
});
//初始化
wss.on("connection", ws => {
	// protocol 用来区分 channel 其值与前面的 request.headers["sec-websocket-protocol"] 相同
	if (!count[ws.protocol]) count[ws.protocol] = 1;
	else count[ws.protocol]++;
	broadcast("system", { count: count[ws.protocol] }, "+1", ws.protocol);
	// 发送消息
	ws.on("message", data => {
		data = data.toString();
		if (ws.banned || data === "ping") return;
		ws.banned = true;
		setTimeout(() => {
			ws.banned = false;
		}, 3000); // 避免刷屏
		const msg = JSON.parse(data);
		if (!msg.meta) {
			if (config.debug) {
				console.log("[Invalid Message]", ws.protocol, msg.content);
			}
			return;
		}
		broadcast("user", msg.meta, msg.content, ws.protocol);
		const msglist = msg.meta.user + " " + msg.content;
		if (config.debug) {
			console.log("[New Message]", ws.protocol, msglist);
		}
		if (config.multi_log) {
			fs.appendFile("logs/" + ws.protocol + ".log", timeStamp() + msglist + "\n", err => {
				if (err) {
					debug("Failed to write the log.");
				}
			});
		}
		if (config.single_log) {
			fs.appendFile("logs/msg.logs", timeStamp() + ws.protocol + " " + msglist + "\n", err => {
				if (err) {
					debug("Failed to write the log.");
				}
			});
		}
	});
	// 退出聊天
	ws.on("close", close => {
		count[ws.protocol]--;
		broadcast("system", {
			count: count[ws.protocol]
		}, "-1", ws.protocol);
	});
	// 错误处理
	ws.on("error", error => {
		debug(error);
	});
});

wss.on("error", error => {
	debug(error);
});
