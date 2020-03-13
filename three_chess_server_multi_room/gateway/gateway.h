#ifndef __SERVER_GATEWAY_H__
#define __SERVER_GATEWAY_H__

#include "../3rd/mjson/json.h"

enum {
	TCP_SOCKET_IO = 0,  // tcp socket
	WEB_SOCKET_IO = 1,  // websocket
};

enum {
	BIN_PROTOCAL = 0, // ������Э��
	JSON_PROTOCAL = 1, // jsonЭ��
};

void
init_server_gateway(int socket_type, int protocal_type);

void
exit_server_gateway();

void start_server(char* ip, int port);


struct service_module{
	int stype; // ��������ͣ�ϵͳ����������������������Ϣ�ַ�����Ӧ�ķ���

	void  // ģ���ʼ�����
	(*init_service_module)(struct service_module* module);

	int  // �����Ϊ0���ײ��رյ����socket;
	(*on_bin_protocal_recv)(void* module_data, struct session* s, 
	                        unsigned char* data, int len); 

	int
	(*on_json_protocal_recv)(void* module_data, struct session* s,
	                         json_t* json, unsigned char* data, int len);

	void
	(*on_connect_lost)(void* module_data, struct session* s); // ���Ӷ�ʧ���յ��������;
	
	void* module_data; // ����Я��service_module�û��Զ������ݵ�;
};

// ע�����Ľӿں���;
void 
register_service(int stype, struct service_module* module);

// �û����ùܵ��µķְ���ֻ�ܷ������ݾͿ����ˣ�
void session_send(struct session*s, unsigned char* body, int len);
void session_send_json(struct session* s, json_t* json);
// end 

#endif


