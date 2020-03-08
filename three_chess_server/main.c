#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#include "gateway/gateway.h"
#include "services/service_type.h"
#include "services/table_service.h"

int main(int argc, char** argv) {
	init_server_gateway(WEB_SOCKET_IO, JSON_PROTOCAL);
	// init_server_gateway(WEB_SOCKET_IO, BIN_PROTOCAL);
	// init_server_gateway(TCP_SOCKET_IO, BIN_PROTOCAL);
	// init_server_gateway(TCP_SOCKET_IO, JSON_PROTOCAL);

	// 注册服务的模块;
	register_service(THREE_CHESS_SERVICE, &TABLE_SERVICE);
	// end

	start_server("0.0.0.0", 8003);
	exit_server_gateway(); 

	return 0;
}
