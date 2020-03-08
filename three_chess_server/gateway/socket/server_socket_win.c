#include<stdio.h>
#include<string.h>
#include <stdlib.h>


#include <WinSock2.h>
#include <mswsock.h>

#include <windows.h>

#define my_malloc malloc
#define my_free free
#define my_realloc realloc

#define MAX_PKG_SIZE ((1<<16) - 1)
#define MAX_RECV_SIZE 2047
// #define MAX_RECV_SIZE 8

#pragma comment(lib, "ws2_32.lib")
// #pragma comment(lib, "WSOCK32.LIB")
#pragma comment(lib, "odbc32.lib")
#pragma comment(lib, "odbccp32.lib")

#include "session.h"
#include "../../3rd/http_parser/http_parser.h"
#include "../../3rd/crypt/sha1.h"
#include "../../3rd/crypt/base64_encoder.h"
#include "../gateway.h"


char *wb_accept = "HTTP/1.1 101 Switching Protocols\r\n" \
"Upgrade:websocket\r\n" \
"Connection: Upgrade\r\n" \
"Sec-WebSocket-Accept: %s\r\n" \
"WebSocket-Location: ws://%s:%d/chat\r\n" \
"WebSocket-Protocol:chat\r\n\r\n";

extern void
on_json_protocal_recv_entry(struct session* s, unsigned char* data, int len);

extern void
on_bin_protocal_recv_entry(struct session* s, unsigned char* data, int len);


extern void
init_server_gateway();

extern void
exit_server_gateway();

static LPFN_ACCEPTEX lpfnAcceptEx;
static LPFN_GETACCEPTEXSOCKADDRS lpfnGetAcceptExSockaddrs;
enum {
	IOCP_ACCPET = 0,
	IOCP_RECV,
	IOCP_WRITE,
};

struct io_package {
	WSAOVERLAPPED overlapped;
	WSABUF wsabuffer;

	int opt; // ���һ�����ǵ�ǰ�����������;
	int accpet_sock;
	int recved; // �յ����ֽ���;
	unsigned char* long_pkg;
	int max_pkg_len;
	unsigned char pkg[MAX_RECV_SIZE + 1];
};



static void
post_accept(SOCKET l_sock, HANDLE iocp, struct io_package* pkg) {


	pkg->wsabuffer.buf = pkg->pkg;
	pkg->wsabuffer.len = MAX_RECV_SIZE;
	pkg->opt = IOCP_ACCPET;

	DWORD dwBytes = 0;
	SOCKET client = WSASocket(AF_INET, SOCK_STREAM, IPPROTO_TCP, NULL, 0, WSA_FLAG_OVERLAPPED);
	int addr_size = (sizeof(struct sockaddr_in) + 16);
	pkg->accpet_sock = client;

	// AcceptEx(l_sock, client, pkg->wsabuffer.buf, 0/*pkg->wsabuffer.len - addr_size* 2*/,
	lpfnAcceptEx(l_sock, client, pkg->wsabuffer.buf, 0/*pkg->wsabuffer.len - addr_size* 2*/,
		addr_size, addr_size, &dwBytes, &pkg->overlapped);
}

static void
post_recv(SOCKET client_fd, HANDLE iocp) {
	// �첽��������;
	// ʲô���첽? recv 8K���ݣ��������ʱ��û�����ݣ�
	// ��ͨ��ͬ��(����)�̹߳��𣬵ȴ����ݵĵ���;
	// �첽�������û�����ݷ�����Ҳ�᷵�ؼ���ִ��;
	struct io_package* io_data = my_malloc(sizeof(struct io_package));
	// ��0����ҪĿ����Ϊ������overlapped��0;
	memset(io_data, 0, sizeof(struct io_package));

	io_data->opt = IOCP_RECV;
	io_data->wsabuffer.buf = io_data->pkg;
	io_data->wsabuffer.len = MAX_RECV_SIZE;
	io_data->max_pkg_len = MAX_RECV_SIZE;

	// ������recv������;
	// 
	DWORD dwRecv = 0;
	DWORD dwFlags = 0;
	int ret = WSARecv(client_fd, &(io_data->wsabuffer),
		1, &dwRecv, &dwFlags,
		&(io_data->overlapped), NULL);
}

// ������ͷ�Ļص�����
static char header_key[64];
static char client_ws_key[128];
static int has_client_key = 0;
static int
on_header_field(http_parser* p, const char *at, size_t length) {
	length = (length < 63) ? length : 63;
	strncpy(header_key, at, length);
	header_key[length] = 0;
	// printf("%s:", header_key);
	return 0;
}

static int
on_header_value(http_parser* p, const char *at,
size_t length) {
	if (strcmp(header_key, "Sec-WebSocket-Key") != 0) {
		return 0;
	}
	length = (length < 127) ? length : 127;

	strncpy(client_ws_key, at, length);
	client_ws_key[length] = 0;
	// printf("%s\n", client_ws_key);
	has_client_key = 1;

	return 0;
}


static int
process_ws_shake_hand(struct session* ses, struct io_package* io_data, 
                     char* ip, int port) {
	http_parser p;
	http_parser_init(&p, HTTP_REQUEST);

	http_parser_settings s;
	http_parser_settings_init(&s);
	s.on_header_field = on_header_field;
	s.on_header_value = on_header_value;

	has_client_key = 0;
	http_parser_execute(&p, &s, io_data->pkg, io_data->recved);

	// ���û���õ�key_migic,��ʾ����û�����꣬����ȥ�����ֵ�����;
	if (has_client_key == 0) {
		ses->is_shake_hand = 0;
		if (io_data->recved >= MAX_RECV_SIZE) { // �����������ְ�;
			close_session(ses);
			my_free(io_data);
			return -1;
		}
		DWORD dwRecv = 0;
		DWORD dwFlags = 0;
		if (io_data->long_pkg != NULL) {
			my_free(io_data->long_pkg);
			io_data->long_pkg = NULL;

		}

		io_data->max_pkg_len = MAX_RECV_SIZE;
		io_data->wsabuffer.buf = io_data->pkg + io_data->recved;
		io_data->wsabuffer.len = io_data->max_pkg_len - io_data->recved;

		int ret = WSARecv(ses->c_sock, &(io_data->wsabuffer),
			1, &dwRecv, &dwFlags,
			&(io_data->overlapped), NULL);

		return -1;
	}

	// ��һ��http�����ݸ����ǵ�client,����websocket����
	static char key_migic[256];
	const char* migic = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
	sprintf(key_migic, "%s%s", client_ws_key, migic);

	int sha1_size = 0; // ��ż��ܺ�����ݳ���
	int base64_len = 0;
	char* sha1_content = crypt_sha1(key_migic, strlen(key_migic), &sha1_size);
	char* b64_str = base64_encode(sha1_content, sha1_size, &base64_len);
	// end 

	strncpy(key_migic, b64_str, base64_len);
	key_migic[base64_len] = 0;
	// printf("key_migic = %s\n", key_migic);

	// �����http�ı��Ļظ����ǵ�websocket��������Ŀͻ��ˣ�
	// ����websocket���ӡ�
	static char accept_buffer[256];
	sprintf(accept_buffer, wb_accept, key_migic, ip, port);
	send(ses->c_sock, accept_buffer, strlen(accept_buffer), 0);
	ses->is_shake_hand = 1;

	DWORD dwRecv = 0;
	DWORD dwFlags = 0;
	if (io_data->long_pkg != NULL) {
		my_free(io_data->long_pkg);
		io_data->long_pkg = NULL;

	}

	io_data->recved = 0;
	io_data->max_pkg_len = MAX_RECV_SIZE;
	io_data->wsabuffer.buf = io_data->pkg + io_data->recved;
	io_data->wsabuffer.len = io_data->max_pkg_len - io_data->recved;

	int ret = WSARecv(ses->c_sock, &(io_data->wsabuffer),
		1, &dwRecv, &dwFlags,
		&(io_data->overlapped), NULL);
	return 0;
}

static int
recv_ws_header(unsigned char* pkg_data, int pkg_len, 
               int* pkg_size, int* out_header_size) {
	// ��һ���ֽ���ͷ���Ѿ��жϣ�����;
	// end 

	unsigned char* mask = NULL;
	unsigned char* raw_data = NULL;
	
	if (pkg_len < 2) { // websocket ��ͷû������
		return -1;
	}

	unsigned int len = pkg_data[1];
	
	// ��ߵ�һ��bitʼ��Ϊ1,����Ҫ����ߵ����bit,��Ϊ0;
	len = (len & 0x0000007f);
	if (len <= 125) { // 4��mask�ֽڣ�ͷ������������
		if (pkg_len < (2 + 4)) { // �޷������� ��С��mask��ֵ
			return -1;
		}
		mask = pkg_data + 2; // ͷ�ֽڣ������ֽ�
	}
	else if (len == 126) { // ���������ֽڱ�ʾ���ȣ�
		if (pkg_len < (4 + 4)) { // 1 + 1 + 2�������ֽ� + 4 MASK
			return -1;
		}
		len = ((pkg_data[2]) | (pkg_data[3] << 8));
		mask = pkg_data + 2 + 2;
	}
	// 1 + 1 + 8(������Ϣ) + 4MASK
	else if (len == 127){ // ����������ÿ���,����ǰ4���ֽڵĴ�С�����治��;
		if (pkg_len < 14) {
			return -1;
		}
		unsigned int low = ((pkg_data[2]) | (pkg_data[3] << 8) | (pkg_data[4] << 16) | (pkg_data[5] << 24));
		unsigned int hight = ((pkg_data[6]) | (pkg_data[7] << 8) | (pkg_data[8] << 16) | (pkg_data[9] << 24));
		if (hight != 0) { // ��ʾ���ĸ��ֽ�������int��Ų��ˣ�̫���ˣ����ǲ�Ҫ�ˡ�
			return -1;
		}
		len = low;
		mask = pkg_data + 2 + 8;
	}
	// mask �̶�4���ֽڣ����Ժ�������ݲ���
	raw_data = mask + 4;
	*out_header_size = (raw_data - pkg_data);
	*pkg_size = len + (*out_header_size);
	// printf("data length = %d\n", len);
	return 0;
}

static void
parser_ws_pack(struct session* s,
                      unsigned char* body, int body_len,
					  unsigned char* mask, int protocal_type) {
	// ʹ��mask,�����ݻ�ԭ������
	for (int i = 0; i < body_len; i++) {
		body[i] = body[i] ^ mask[i % 4]; // maskֻ��4���ֽڵĳ��ȣ����ԣ�Ҫѭ��ʹ�ã����������ȡ��Ϳ����ˡ�
	}
	// end

	// ������ȥ���������ڷֺ��ˡ�
	if (protocal_type == JSON_PROTOCAL) {
		on_json_protocal_recv_entry(s, body, body_len);
	}
	else if (protocal_type == BIN_PROTOCAL){
		on_bin_protocal_recv_entry(s, body, body_len);
	}
	// end
}

static void
on_ws_pack_recved(struct session* s, struct io_package* io_data, int protocal_type) {
	// Step1: �������ݵ�ͷ����ȡ������Ϸ��Э�����Ĵ�С;
	while (io_data->recved > 0) {
		int pkg_size = 0;
		int header_size = 0;
		if (recv_ws_header(io_data->pkg, io_data->recved, &pkg_size, &header_size) != 0) { // ����Ͷ��recv����֪���ܷ����һ������ͷ;
			DWORD dwRecv = 0;
			DWORD dwFlags = 0;

			io_data->wsabuffer.buf = io_data->pkg + io_data->recved;
			io_data->wsabuffer.len = MAX_RECV_SIZE - io_data->recved;

			int ret = WSARecv(s->c_sock, &(io_data->wsabuffer),
				1, &dwRecv, &dwFlags,
				&(io_data->overlapped), NULL);
			break;
		}

		// Step2:�ж����ݴ�С���Ƿ񲻷��Ϲ涨�ĸ�ʽ
		if (pkg_size >= MAX_PKG_SIZE) { // ,�쳣�����ݰ���ֱ�ӹرյ�socket;
			close_session(s);
			my_free(io_data); // �ͷ����socketʹ�õ���ɶ˿ڵ�io_data;
			break;
		}

		// �Ƿ�������һ�����ݰ�;
		if (io_data->recved >= pkg_size) { // ��ʾ�����Ѿ��յ����ٳ�����һ���������ݣ�
			unsigned char* pkg_data = (io_data->long_pkg != NULL) ? io_data->long_pkg : io_data->pkg;
			
			// 0x81
			if (pkg_data[0] == 0x88) { // �Է�Ҫ�ر�socket
				// unsigned char close_data[2] = {0x88, 0};
				// session_send(s, close_data, 2);
				close_session(s);
				break;
			}

			parser_ws_pack(s, pkg_data + header_size, 
				                  pkg_size - header_size, pkg_data + header_size - 4, protocal_type);

			if (io_data->recved > pkg_size) { // 1.5 ����
				memmove(io_data->pkg, io_data->pkg + pkg_size, io_data->recved - pkg_size);
			}
			io_data->recved -= pkg_size;

			if (io_data->long_pkg != NULL) {
				my_free(io_data->long_pkg);
				io_data->long_pkg = NULL;
			}

			if (io_data->recved == 0) { // ����Ͷ������
				DWORD dwRecv = 0;
				DWORD dwFlags = 0;
				io_data->wsabuffer.buf = io_data->pkg + io_data->recved;
				io_data->wsabuffer.len = MAX_RECV_SIZE - io_data->recved;

				int ret = WSARecv(s->c_sock, &(io_data->wsabuffer),
					1, &dwRecv, &dwFlags,
					&(io_data->overlapped), NULL);
				break;
			}
		}
		else { // û������һ�����ݰ�����������ֱ��Ͷ��recv����;
			unsigned char* recv_buffer = io_data->pkg;
			if (pkg_size > MAX_RECV_SIZE) {
				if (io_data->long_pkg == NULL) {
					io_data->long_pkg = my_malloc(pkg_size + 1);
					memcpy(io_data->long_pkg, io_data->pkg, io_data->recved);
				}
				recv_buffer = io_data->long_pkg;
			}

			DWORD dwRecv = 0;
			DWORD dwFlags = 0;
			io_data->wsabuffer.buf = recv_buffer + io_data->recved;
			io_data->wsabuffer.len = pkg_size - io_data->recved;

			int ret = WSARecv(s->c_sock, &(io_data->wsabuffer),
				1, &dwRecv, &dwFlags,
				&(io_data->overlapped), NULL);
			break;
		}
		// end 
	}
}

static int
read_pkg_tail(unsigned char* pkg_data, int recv, int* pkg_size) {
	if (recv < 2) { // �����ܴ��\r\n
		return -1;
	}

	int i = 0;
	*pkg_size = 0;

	while (i < recv - 1) {
		if (pkg_data[i] == '\r' && pkg_data[i + 1] == '\n') {
			*pkg_size = (i + 2);
			return 0;
		}
		i++;
	}

	return -1;
}

static int
recv_header(unsigned char* pkg, int len, int* pkg_size) {
	if (len <= 1) { // �յ������ݲ��ܹ������ǵİ��Ĵ�С��������
		return -1;
	}

	*pkg_size = (pkg[0]) | (pkg[1] << 8);
	return 0;
}

static void 
on_bin_protocal_recved(struct session* s, struct io_package* io_data) {
	// Step1: �������ݵ�ͷ����ȡ������Ϸ��Э�����Ĵ�С;
	while (io_data->recved > 0) {
		int pkg_size = 0;
		if (recv_header(io_data->pkg, io_data->recved, &pkg_size) != 0) { // ����Ͷ��recv����֪���ܷ����һ������ͷ;
			DWORD dwRecv = 0;
			DWORD dwFlags = 0;

			io_data->wsabuffer.buf = io_data->pkg + io_data->recved;
			io_data->wsabuffer.len = MAX_RECV_SIZE - io_data->recved;

			int ret = WSARecv(s->c_sock, &(io_data->wsabuffer),
				1, &dwRecv, &dwFlags,
				&(io_data->overlapped), NULL);
			break;
		}

		// Step2:�ж����ݴ�С���Ƿ񲻷��Ϲ涨�ĸ�ʽ
		if (pkg_size >= MAX_PKG_SIZE) { // ,�쳣�����ݰ���ֱ�ӹرյ�socket;
			close_session(s);
			my_free(io_data); // �ͷ����socketʹ�õ���ɶ˿ڵ�io_data;
			break;
		}

		// �Ƿ�������һ�����ݰ�;
		if (io_data->recved >= pkg_size) { // ��ʾ�����Ѿ��յ����ٳ�����һ���������ݣ�
			unsigned char* pkg_data = (io_data->long_pkg != NULL) ? io_data->long_pkg : io_data->pkg;

			// on_server_recv(s, pkg_data + 2, pkg_size - 2);
			on_bin_protocal_recv_entry(s, pkg_data + 2, pkg_size - 2);

			if (io_data->recved > pkg_size) { // 1.5 ����
				memmove(io_data->pkg, io_data->pkg + pkg_size, io_data->recved - pkg_size);
			}
			io_data->recved -= pkg_size;

			if (io_data->long_pkg != NULL) {
				my_free(io_data->long_pkg);
				io_data->long_pkg = NULL;
			}

			if (io_data->recved == 0) { // ����Ͷ������
				DWORD dwRecv = 0;
				DWORD dwFlags = 0;
				io_data->wsabuffer.buf = io_data->pkg + io_data->recved;
				io_data->wsabuffer.len = MAX_RECV_SIZE - io_data->recved;

				int ret = WSARecv(s->c_sock, &(io_data->wsabuffer),
					1, &dwRecv, &dwFlags,
					&(io_data->overlapped), NULL);
				break;
			}
		}
		else { // û������һ�����ݰ�����������ֱ��Ͷ��recv����;
			unsigned char* recv_buffer = io_data->pkg;
			if (pkg_size > MAX_RECV_SIZE) {
				if (io_data->long_pkg == NULL) {
					io_data->long_pkg = my_malloc(pkg_size + 1);
					memcpy(io_data->long_pkg, io_data->pkg, io_data->recved);
				}
				recv_buffer = io_data->long_pkg;
			}

			DWORD dwRecv = 0;
			DWORD dwFlags = 0;
			io_data->wsabuffer.buf = recv_buffer + io_data->recved;
			io_data->wsabuffer.len = pkg_size - io_data->recved;

			int ret = WSARecv(s->c_sock, &(io_data->wsabuffer),
				1, &dwRecv, &dwFlags,
				&(io_data->overlapped), NULL);
			break;
		}
		// end 
	}
}

static void
on_json_protocal_recved(struct session* s, struct io_package* io_data) {
	while (io_data->recved > 0) {
		int pkg_size = 0;
		unsigned char* pkg_data = (io_data->long_pkg != NULL) ? io_data->long_pkg : io_data->pkg;

		if (read_pkg_tail(pkg_data, io_data->recved, &pkg_size) != 0) { // û�ж���\r\n
			if (io_data->recved >= (((1 << 16) - 1))) { // ���������ݰ�,close session
				close_session(s);
				my_free(io_data);
				break;
			}

			if (io_data->recved >= io_data->max_pkg_len) { // pkg,�Ų�����,
				int alloc_len = io_data->recved * 2;
				alloc_len = (alloc_len > ((1 << 16) - 1)) ? ((1 << 16) - 1) : alloc_len;

				if (io_data->long_pkg == NULL) { // С����治���������
					io_data->long_pkg = my_malloc(alloc_len + 1);
					memcpy(io_data->long_pkg, io_data->pkg, io_data->recved);
				}
				else {
					io_data->long_pkg = my_realloc(io_data->long_pkg, alloc_len + 1);
				}
				io_data->max_pkg_len = alloc_len;
			}


			DWORD dwRecv = 0;
			DWORD dwFlags = 0;
			unsigned char* buf = (io_data->long_pkg != NULL) ? io_data->long_pkg : io_data->pkg;
			io_data->wsabuffer.buf = buf + io_data->recved;
			io_data->wsabuffer.len = io_data->max_pkg_len - io_data->recved;
			int ret = WSARecv(s->c_sock, &(io_data->wsabuffer),
				1, &dwRecv, &dwFlags,
				&(io_data->overlapped), NULL);
			break;
		}
		// �������������,�ҵ�������������, io_data->pkg,��ʼ,  pkg_size
		// end 
		// on_server_recv_line(s, pkg_data, pkg_size);
		on_json_protocal_recv_entry(s, pkg_data, pkg_size);

		if (io_data->recved > pkg_size) {
			memmove(pkg_data, pkg_data + pkg_size, io_data->recved - pkg_size);
		}
		io_data->recved -= pkg_size;
		// printf("=================\n");
		if (io_data->recved == 0) { // IOCP������
			DWORD dwRecv = 0;
			DWORD dwFlags = 0;
			if (io_data->long_pkg != NULL) {
				my_free(io_data->long_pkg);
				io_data->long_pkg = NULL;

			}

			io_data->max_pkg_len = MAX_RECV_SIZE;
			io_data->wsabuffer.buf = io_data->pkg + io_data->recved;
			io_data->wsabuffer.len = io_data->max_pkg_len - io_data->recved;

			int ret = WSARecv(s->c_sock, &(io_data->wsabuffer),
				1, &dwRecv, &dwFlags,
				&(io_data->overlapped), NULL);
			break;
		}
	} // end while
}

void
start_server(char*ip, int port) {
	int socket_type, protocal_type;

	socket_type = get_socket_type();
	protocal_type = get_proto_type();

	WSADATA data;
	WSAStartup(MAKEWORD(2, 2), &data);
	// �½�һ����ɶ˿�;
	SOCKET l_sock = INVALID_SOCKET;
	HANDLE iocp = CreateIoCompletionPort(INVALID_HANDLE_VALUE, NULL, 0, 0);
	if (iocp == NULL) {
		goto failed;
	}

	// ����һ���߳�
	// CreateThread(NULL, 0, ServerWorkThread, (LPVOID)iocp, 0, 0);
	// end

	// ��������socket
	l_sock = socket(AF_INET, SOCK_STREAM, 0);
	if (l_sock == INVALID_SOCKET) {
		goto failed;
	}
	// bind socket
	struct sockaddr_in s_address;
	memset(&s_address, 0, sizeof(s_address));
	s_address.sin_family = AF_INET;
	s_address.sin_addr.s_addr = inet_addr(ip);
	s_address.sin_port = htons(port);

	if (bind(l_sock, (struct sockaddr *) &s_address, sizeof(s_address)) != 0) {
		goto failed;
	}

	if (listen(l_sock, SOMAXCONN) != 0) {
		goto failed;
	}

	DWORD dwBytes = 0;
	GUID guidAcceptEx = WSAID_ACCEPTEX;
	WSAIoctl(l_sock, SIO_GET_EXTENSION_FUNCTION_POINTER,
		&guidAcceptEx, sizeof(guidAcceptEx), &lpfnAcceptEx, sizeof(lpfnAcceptEx),
		&dwBytes, NULL, NULL);

	dwBytes = 0;
	GUID guidGetAcceptExSockaddrs = WSAID_GETACCEPTEXSOCKADDRS;
	if (0 != WSAIoctl(l_sock, SIO_GET_EXTENSION_FUNCTION_POINTER,
		&guidGetAcceptExSockaddrs,
		sizeof(guidGetAcceptExSockaddrs),
		&lpfnGetAcceptExSockaddrs,
		sizeof(lpfnGetAcceptExSockaddrs),
		&dwBytes, NULL, NULL))
	{
	}
	// start 
	CreateIoCompletionPort((HANDLE)l_sock, iocp, (DWORD)0, 0);
	struct io_package* pkg = my_malloc(sizeof(struct io_package));
	memset(pkg, 0, sizeof(struct io_package));

	post_accept(l_sock, iocp, pkg);
	// end 

	DWORD dwTrans;
	struct session* s;
	//  ������������¼��������Ժ�,
	// GetQueuedCompletionStatus �᷵�����������
	// ʱ���WSAOVERLAPPED �ĵ�ַ,���������ַ���ҵ�
	// io_data, �ҵ���io_data,Ҳ����ζ�������ҵ���,
	// ���Ļ�������
	struct io_package* io_data;

	while (1) {
		clear_offline_session();
		// ������������IOCP��������߳��������Ѿ������¼�
		// ��ʱ�򣬲Ż������̻߳���;
		// IOCP ��select��һ�����ȴ�����һ����ɵ��¼�;
		s = NULL;
		dwTrans = 0;
		io_data = NULL;
		int ret = GetQueuedCompletionStatus(iocp, &dwTrans, (LPDWORD)&s, (LPOVERLAPPED*)&io_data, WSA_INFINITE);
		if (ret == 0) {
			printf("iocp error"); // bug,
			continue;
		}
		// IOCP�˿ڻ�����һ�������̣߳�
		// �������û���socket������¼�������;
		// printf("IOCP have event\n");
		if (dwTrans == 0 && io_data->opt == IOCP_RECV) { // socket �ر�
			close_session(s);
			my_free(io_data);
			continue;
		}// end

		switch (io_data->opt) {
			case IOCP_RECV: { // ��ɶ˿���ζ�������Ѿ�����
				// ���������������ȡ
				io_data->recved += dwTrans; // ��ʾ�����Ѿ���ȡ�õ����ݵĴ�С;
				if (socket_type == TCP_SOCKET_IO) {
					if (protocal_type == BIN_PROTOCAL) {
						on_bin_protocal_recved(s, io_data);
					}
					else if (protocal_type == JSON_PROTOCAL) {
						on_json_protocal_recved(s, io_data);
					}
				}
				else if (socket_type == WEB_SOCKET_IO) { // ����web socket,�Լ���ʡ�Ͷ����˷�������ĸ�ʽ;
					if (s->is_shake_hand == 0) { // websocket��û�����ֳɹ�,��������;
						process_ws_shake_hand(s, io_data, ip, port);
					}
					else { // ����websocket���͹��������ݰ���
						on_ws_pack_recved(s, io_data, protocal_type);
					}
				}
			}
			break;
			case IOCP_ACCPET:
			{
				int client_fd = io_data->accpet_sock;
				int addr_size = (sizeof(struct sockaddr_in) + 16);
				struct sockaddr_in* l_addr = NULL;
				int l_len = sizeof(struct sockaddr_in);

				struct sockaddr_in* r_addr = NULL;
				int r_len = sizeof(struct sockaddr_in);

				lpfnGetAcceptExSockaddrs(io_data->wsabuffer.buf,
					0, /*io_data->wsabuffer.len - addr_size * 2, */
					addr_size, addr_size,
					(struct sockaddr**)&l_addr, &l_len,
					(struct sockaddr**)&r_addr, &r_len);

				struct session* s = save_session(client_fd, inet_ntoa(r_addr->sin_addr), ntohs(r_addr->sin_port));
				CreateIoCompletionPort((HANDLE)client_fd, iocp, (DWORD)s, 0);
				post_recv(client_fd, iocp);
				post_accept(l_sock, iocp, io_data);
			}
			break;
		}
	}
failed:
	if (iocp != NULL) {
		CloseHandle(iocp);
	}

	if (l_sock != INVALID_SOCKET) {
		closesocket(l_sock);
	}
	
	

	WSACleanup();
}

