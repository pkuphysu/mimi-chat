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

## Run

```bash
npm start
```
or
```bash
node server.js
```

Default config file is `config.json`. If you want to specify another config file, you can take it as the third argument, e.g.
```bash
node server.js /path/to/your/config.json
```

## Usage

Server options (in `config.json`):

| Option       | Available value | Description                                             |
|--------------|-----------------|---------------------------------------------------------|
| `port`       | integer         | set the listening port (default: 9000)                  |
| `debug`      | true / false    | show logs in the console in order to debug              |
| `multi_log`  | true / false    | write logs to different files accroading to the channel |
| `single_log` | true / false    | write logs to a single file                             |

Client (samples are in the `public` folder):
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

## Todo List

- [ ] 支持发送图片
- [ ] Gravatar头像
