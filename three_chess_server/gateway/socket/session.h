#ifndef __TCP_SESSION_H__
#define __TCP_SESSION_H__

#define MAX_SEND_PKG 2048

struct session {
	char c_ip[32];
	int c_port;
	int c_sock;
	int removed;
	int is_shake_hand;

	struct session* next;
	unsigned char send_buf[MAX_SEND_PKG]; // 90%���͵������
};

void init_session_manager(int socket_type, int protocal_type);
void exit_session_manager();


// �пͷ��˽������������sesssion;
struct session* save_session(int c_sock, char* ip, int port);
void close_session(struct session* s);

// ��������session�������������session
void foreach_online_session(int(*callback)(struct session* s, void* p), void*p);

// �������ǵ�����
void clear_offline_session();
// end 

int 
get_socket_type();

int 
get_proto_type();

#endif

