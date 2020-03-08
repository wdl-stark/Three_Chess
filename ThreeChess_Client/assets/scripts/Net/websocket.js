var websocket = {
    sock: null, 
    cmd_handler: null,
    is_connected: false,
    
    _on_opened: function(event) {
        console.log("ws connect server success");
        this.is_connected = true;
    }, 
    
    _on_recv_data: function(event) {
        var cmd_json = event.data;

        if (!cmd_json || !this.cmd_handler) {
            return;
        }
        
        var cmd = JSON.parse(cmd_json);
        if (!cmd) {
            return;
        }
        
        var stype = cmd[0]; // 服务类型
        if (this.cmd_handler[stype]) {
            this.cmd_handler[stype](cmd);
        }
    }, 
    
    _on_socket_close: function(event) {
        this.is_connected = false;
        if (this.sock) {
            this.close();
        }
    }, 
    
    _on_socket_err: function(event) {
        this._on_socket_close();
    }, 
    
    connect: function(url) {
        this.sock = new WebSocket(url);
        
        this.sock.onopen = this._on_opened.bind(this);
        this.sock.onmessage = this._on_recv_data.bind(this);
        this.sock.onclose = this._on_socket_close.bind(this);
        this.sock.onerror = this._on_socket_err.bind(this);
        
        
    },
    
    send: function(body) {
        if (this.is_connected && this.sock) {
            this.sock.send(body);
        }
    }, 
    
    send_object: function(obj) {
        if (this.is_connected && this.sock && obj) {
            var str = JSON.stringify(obj);
            console.log(str);
            if (str) {
                this.sock.send(str);    
            }
        }
    },
    
    close: function() {
        if (this.sock !== null) {
            this.sock.close();
            this.sock = null;
        }
        this.is_connected = false;
    }, 
    
    register_cmd_handler: function(cmd_handers) {
        this.cmd_handler = cmd_handers;
    },
}

websocket.connect("ws://192.168.0.100:8003/ws");
console.log("connect to server......");
module.exports = websocket;

