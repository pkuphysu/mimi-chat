# Mimi Chat

基于Node.js构建的Websocket服务器，支持ws和wss协议。  
Websocket server based on Node.js

## Install
```bash
# Clone this repository
git clone https://github.com/stevenjoezhang/mimi-chat.git
# Go into the repository
cd mimi-chat
# Install dependencies
npm install
```
**Note**: Run `npm install` to install dependency packges:
- [nodejs-websocket](https://github.com/sitegui/nodejs-websocket)
- [websockets](https://github.com/websockets/ws)

## Run
```bash
node server_a.js
```
or 
```bash
node server_b.js
```
server_a uses ws, and server_b uses nodejs-websocket.

Default config file is `config.json`. If you want to specify another config file, you can take it as the third argument, e.g.
```bash
node server_a.js /path/to/your/config.json
```
or 
```bash
node server_b.js /path/to/your/config.json
```

## Usage
Server options (in `config.json`):

| Option       | Available value | Description                                             |
|--------------|-----------------|---------------------------------------------------------|
| `port`       | integer         | set the listening port (default: 9000)                  |
| `use_ssl `   | true / false    | whether to use ssl                                      |
| `cert`       | string          | path to your ssl cert                                   |
| `key`        | string          | path to your ssl key                                    |
| `debug`      | true / false    | show logs in the console in order to debug              |
| `multi_log`  | true / false    | write logs to different files accroading to the channel |
| `single_log` | true / false    | write logs to a single file                             |

Client (using jQuery, see `client_sample.html`):
```javascript
var ws = new WebSocket("ws://localhost:9000", headers = channel);
//If you're using ssl, replace ws with wss
//You can replace "localhost" with your ip or hostname, clients in the same channel can send messages to each other
ws.onopen = function() {
	//Do something...
};
ws.onmessage = function(event) {
	var msg = JSON.parse(event.data);
	//You will receive msg.type and msg.content here
	//Do something...
};
ws.onerror = function() {
	//Do something...
};
```

## Credits
* [Mimi](https://zhangshuqiao.org) Developer of this project.

## License
Released under the GNU General Public License v3  
http://www.gnu.org/licenses/gpl-3.0.html
