# Michat Server

Websocket server based on Node.js  
基于Node.js构建的Websocket服务器，支持ws和wss协议。

## Install
```bash
# Clone this repository
git clone https://github.com/stevenjoezhang/michat-server.git
# Go into the repository
cd michat-server
# Install dependency packges
npm install
```
**Note**: Run `npm install` to install dependency packges:
- [nodejs-websocket](https://github.com/sitegui/nodejs-websocket)
- [websockets](https://github.com/websockets/ws/blob/master/doc/ws.md)

## Run
```bash
node server_a.js
#or node server_b.js
```
server_a uses ws, and server_b uses nodejs-websocket.

## Usage
Server Options:
```bash
  -v, --version  show the version number
  -d, --debug    show logs in the console in order to debug
  -m, --multi    write logs to different files accroading to the channel
  -s, --single   write logs to a single file
  -p, --port     set the listening port (default: 9000)
  -h, --help     show help
```

Client (using jQuery):
```javascript
var ws = new WebSocket("ws://localhost:9000", headers = channel);
//you can replace "localhost" with your ip or hostname, clients in the same channel can send messages to each other
ws.onopen = function() {
	//do something
};
ws.onmessage = function(event) {
	var msg = JSON.parse(event.data);
	//You will receive msg.type and msg.content here
	//do something
};
ws.onerror = function() {
	//do something
};
```

## Credits
* [Mimi](https://zhangshuqiao.org) Developer of this project.

## License
Released under the GNU General Public License v3  
http://www.gnu.org/licenses/gpl-3.0.html
