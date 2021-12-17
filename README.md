# Mimi Chat

基于 Node.js 构建的 WebSocket 实时消息服务器，支持 ws 和 wss 协议。  
WebSocket server based on Node.js

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

| Option       | Type    | Description                                             |
|------------------|---------|---------------------------------------------------------|
| `port`           | Integer | Set the listening port (default: 8080)                  |
| `debug`          | Boolean | Show logs in the console in order to debug              |
| `cool_down_time` | Integer | Set the cool down time                                  |
| `multi_log`      | Boolean | Write logs to different files accroading to the channel |
| `single_log`     | Boolean | Write logs to a single file                             |

Client (samples are in the `public` folder):
```javascript
let ws = new WebSocket("ws://localhost:8080", channel);
// If you're using ssl, replace ws with wss
// You can replace "localhost" with your ip or hostname, clients in the same channel can send messages to each other
ws.onopen = function() {
	// Do something...
};
ws.onmessage = function(event) {
	let msg = JSON.parse(event.data);
	// You will receive msg.type and msg.content here
	// Do something...
};
ws.onerror = function() {
	// Do something...
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
