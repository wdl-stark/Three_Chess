#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#include "service_type.h"
#include "table_service.h"

#include "../utils/vector_array.h"
#include "../utils/hash_table.h"

enum {
	OK = 1, // �ɹ���
	INVALID_COMMAND = -100, // ��Ч�Ĳ�������
	INVALID_PARAMS = -101, // ��Ч���û�����;
	USER_IS_INTABLE = -102, // ����Ѿ�������������ظ������;
	TABLE_IS_FULL = -103, // ��ǰ�������������Ժ�����;
	USER_IS_NOT_INTABLE = -104, //��ǰ����Ҳ�����������
	INAVLID_TABLE_STATUS = -105, // ���������״̬;
	INVALID_ACTION = -106, // �Ƿ�����
	INAVLID_SUB_STATUS = -107, //�������״̬
};

enum {
	INVALID = -1,
	EMPTY = 0,
	BLACK_CHESS = 1,
	WHITE_CHESS = 2,
	DOUBLE_CHESS = 3,
};

enum {
	SITDOWN = 1, // �����������
	USER_ARRIVED = 2, // ����ҽ���; 
	STANDUP = 3, // ���վ��;
	GAME_STATED = 4, // ��Ϸ��ʼ;
	TURN_TO_PLAYER = 5, // �ֵ��ĸ����;
	PUT_CHESS = 6,
	CHANGE_GAME_STATUS = 7, // �л���Ϸ״̬
	MAKE_THREE = 8,
	THREE_COUNT = 9,
	CLEAR_DOUBLE = 10,
	CHECKOUT = 11, // ����
	USER_QUIT = 12, // �û��뿪
};

//��Ϸ״̬ö�� sub_status ��ȡ��ֵ
enum {
	NONE = 0,
	DROP_CHESS = 1,
	PRESS_CHESS = 2,
	MOVE_CHESS = 3,
	EAT_CHESS = 4,
	GAME_END = 5,
};


enum {
	SELECT_CHESS = 0,
	DO_MOVE = 1,
};
enum {
	T_READY = 0, // ��ʱ׼����ʼ��Ϸ; 
	T_STATED, // ��Ϸ�Ѿ���ʼ�����ǣ���Ҫ��һ�������ʽ��ʼ;
	T_PLAYING, // ��Ϸ���ڽ�����;
	T_CHECKOUT, // ��Ϸ���ڽ�����;
};

// ����߳���ԭ��
enum {
	GAME_OVER = 1,
	PLAY_LOST = 2,
	PLAY_STANDUP = 3, // �뿪,����
};
// end 

// ����session���������,û�����������ôһ˵
typedef struct session game_player;

struct game_seat {
	int is_sitdown; // �Ƿ�Ϊһ����Ч������;
	int seatid; // ��λ��id��
	// ��ҵĶ���
	game_player* playr;
};


// �����������
#define PLAY_NUM 2
#define DISK_SIZE 7

const int BoardPoints[DISK_SIZE][DISK_SIZE] =  {{ 0,-1,-1, 0,-1,-1, 0},
												{-1, 0,-1, 0,-1, 0,-1},
												{-1,-1, 0, 0, 0,-1,-1},
												{ 0, 0, 0,-1, 0, 0, 0},
												{-1,-1, 0, 0, 0,-1,-1},
												{-1, 0,-1, 0,-1, 0,-1},
												{ 0,-1,-1, 0,-1,-1, 0}};

struct game_table {
	int status; // ������ǵ�ǰ�����ӵ�״��,��ʼ����TRADEAD��״̬;
	int sub_status; //��Ϸ״̬,��ö�ٶ���
	int button_id; // ���ǵ�ǰ�Ǹ���ҳֺ����¡�
	int cur_turn;
	int threeCount;//�����ĸ���
	struct vector_array threePoints;
	struct game_seat seats[PLAY_NUM];

	int BoardPoints[DISK_SIZE][DISK_SIZE];
	struct hash_table* ThreePointsMap;
	struct hash_table* PointsCanMovies;
};

struct vec2 {
	int x;
	int y;
};

static void
write_error_command(struct session*s, int opt, int status) {
	json_t* json = json_new_comand(THREE_CHESS_SERVICE, opt);
	json_object_push_number(json, "2", status);
	session_send_json(s, json);
	json_free_value(&json);
}

static void
table_broadcast_json(struct game_table* table, json_t* json, int not_to_seatid) {
	for (int i = 0; i < PLAY_NUM; i++) {
		if (table->seats[i].is_sitdown && i != not_to_seatid) {
			session_send_json(table->seats[i].playr, json);
		}
	}
}

static void
send_to_player(struct game_table* table, json_t* json, int to_seatid)
{
	for (int i = 0; i < PLAY_NUM; i++) {
		if (table->seats[i].is_sitdown && i == to_seatid) {
			session_send_json(table->seats[i].playr, json);
		}
	}
}

static int
is_intable(struct game_table* table, game_player* p) {
	for (int i = 0; i < PLAY_NUM; i++) {
		if (table->seats[i].is_sitdown && table->seats[i].playr == p) {
			return 1;
		}
	}
	return 0;
}

static int
get_seatid(struct game_table* table, game_player* p) {
	for (int i = 0; i < PLAY_NUM; i++) {
		if (table->seats[i].is_sitdown && table->seats[i].playr == p) {
			return i;
		}
	}
	return -1;
}

static int
get_empty_seatid(struct game_table* table, game_player* p) {
	for (int i = 0; i < PLAY_NUM; i++) {
		if (table->seats[i].is_sitdown == 0) {
			return i;
		}
	}
	return -1;
}

static json_t*
get_user_arrived_data(struct game_table* table, int seatid) {
	json_t* json = json_new_comand(THREE_CHESS_SERVICE, USER_ARRIVED);
	// ���������������ͻ��˵ģ�����Ҫдstatus��;
	// ��ҵ����ݣ�����û����ҵ����ݣ�����������seatid������;
	json_object_push_number(json, "2", seatid);
	return json;
}


static void
sitdown_success(struct game_table* table, game_player* p, int seatid) {
	// Ҫ��������ҵ����ݷ��͸�������
	for (int i = 0; i < PLAY_NUM; i++) {
		if (i != seatid && table->seats[i].is_sitdown == 1) {
			json_t* json = get_user_arrived_data(table, i);
			session_send_json(p, json);
			json_free_value(&json);
		}
	}
	// end 
}

static int
check_game_started(struct game_table* table) {
	for (int i = 0; i < PLAY_NUM; i++) {
		if (table->seats[i].is_sitdown == 0) {
			return 0;
		}
	}
	return 1;
}
static void 
send_three_points(struct game_table* table)
{
	json_t* json = json_new_comand(THREE_CHESS_SERVICE, MAKE_THREE);
	json_object_push_number(json, "2", table->threeCount);
	int chessCnt = vector_size(&table->threePoints);
	json_object_push_number(json, "3", chessCnt);
	for (int i = 0; i < chessCnt; i++)
	{
		struct vec2* pt = (struct vec2*)vector_at(&table->threePoints, i);
		int pt2int = pt->x * 10 + pt->y;
		char index[2] = { 0 };
		sprintf(index, "%d", 4 + i);
		json_object_push_number(json, index, pt2int);
	}
	table_broadcast_json(table, json, -1);
	json_free_value(&json);
}

static void 
change_game_status(struct game_table* table, int status) {
	table->sub_status = status;
	json_t* json = json_new_comand(THREE_CHESS_SERVICE, CHANGE_GAME_STATUS);
	json_object_push_number(json, "2", status);
	table_broadcast_json(table, json, -1);
	json_free_value(&json);
}
static void
turn_to_player(struct game_table* table, int seatid) {
	table->cur_turn = seatid;
	json_t* json = json_new_comand(THREE_CHESS_SERVICE, TURN_TO_PLAYER);
	json_object_push_number(json, "2", seatid);
	table_broadcast_json(table, json, -1);
	json_free_value(&json);
}

static void
init_game_data(struct game_table* table)
{
	/*
		[ 0,-1,-1, 0,-1,-1, 0],
		[-1, 0,-1, 0,-1, 0,-1],
		[-1,-1, 0, 0, 0,-1,-1],
		[ 0, 0, 0,-1, 0, 0, 0],
		[-1,-1, 0, 0, 0,-1,-1],
		[-1, 0,-1, 0,-1, 0,-1],
		[ 0,-1,-1, 0,-1,-1, 0]
	*/

	for (int i = 0; i < DISK_SIZE; i++)
	{
		for (int j = 0; j < DISK_SIZE; j++)
		{
			table->BoardPoints[i][j] = BoardPoints[i][j];
		}
	}
	printf("���̳�ʼ����\n");
	for (int i = 0; i < DISK_SIZE; i++)
	{
		for (int j = 0; j < DISK_SIZE; j++)
		{
			if(table->BoardPoints[i][j] == 0)
			{
				printf(" %d ", table->BoardPoints[i][j]);
			}
			else {
				printf("%d ", table->BoardPoints[i][j]);
			}
		}
		printf("\n");
	}
	//
	vector_define(&table->threePoints, sizeof(struct vec2));
	table->ThreePointsMap = create_hash_table(256);
	table->PointsCanMovies = create_hash_table(256);
	const int CENTER = 3;
	for (int i = 0; i < DISK_SIZE; i++)
	{
		for (int j = 0; j < DISK_SIZE; j++)
		{
			int ptValue = table->BoardPoints[i][j];
			if (ptValue != 0)
			{
				continue;
			}
			struct vec2 cur_pt;
			cur_pt.x = i;
			cur_pt.y = j;
			char ptStr[3] = { 0 };
			sprintf(ptStr,"%d%d", cur_pt.x, cur_pt.y);
			if (i == 0 || i == 6)
			{
				if (j == 0 || j == 6)
				{
					int rowOffset = i == 0 ? 1 : -1;
					int colOffset = j == 0 ? 1 : -1;
					struct vec2 points[2];
					struct vector_array *line = (struct vector_array*)malloc(sizeof(struct vector_array));
					vector_define(line, sizeof(struct vec2) * 2);

					//��
					memset(points, 0, sizeof(struct vec2) * 2);
					points[0].x = i;
					points[0].y = 3;
					points[1].x = i;
					points[1].y = CENTER + 3 * colOffset;
					vector_push_back(line, &points);

					//��
					memset(points, 0, sizeof(struct vec2) * 2);
					points[0].x = 3;
					points[0].y = j;
					points[1].x = CENTER + 3 * rowOffset;
					points[1].y = j;
					vector_push_back(line, &points);

					//б
					memset(points, 0, sizeof(struct vec2) * 2);
					points[0].x = i + 1 * rowOffset;
					points[0].y = j + 1 * colOffset;
					points[1].x = i + 2 * rowOffset;
					points[1].y = j + 2 * colOffset;
					vector_push_back(line, &points);

					hash_insert(table->ThreePointsMap, ptStr, (void*)line);

					//for test
					/*struct vector_array *testLine = (struct vector_array*) hash_find(table->ThreePointsMap, ptStr);
					struct vec2* ptr = NULL;
					ptr = vector_at(testLine, 0);
					printf("%d,%d,%d,%d\n", ptr[0].x, ptr[0].y, ptr[1].x, ptr[1].y);
					ptr = vector_at(testLine, 1);
					printf("%d,%d,%d,%d\n", ptr[0].x, ptr[0].y, ptr[1].x, ptr[1].y);*/

					//ÿ����������߷�
					struct vector_array *movies = (struct vector_array*)malloc(sizeof(struct vector_array));
					vector_define(movies, sizeof(struct vec2));
					rowOffset = i == 0 ? 1 : -1;
					colOffset = j == 0 ? 1 : -1;
					struct vec2 pt;
					pt.x = i;
					pt.y = 3;
					vector_push_back(movies, &pt);
					pt.x = 3;
					pt.y = j;
					vector_push_back(movies, &pt);
					pt.x = i + 1 * rowOffset;
					pt.y = j + 1 * colOffset;
					vector_push_back(movies, &pt);
					hash_insert(table->PointsCanMovies, ptStr, (void*)movies);
					//for test
					/*struct vector_array *testMovies = (struct vector_array*) hash_find(table->PointsCanMovies, ptStr);
					ptr = NULL;
					ptr = (struct vec2*)vector_at(testMovies, 0);
					printf("%d,%d\n", ptr->x, ptr->y);
					ptr = (struct vec2*)vector_at(testMovies, 1);
					printf("%d,%d\n", ptr->x, ptr->y);
					ptr = (struct vec2*)vector_at(testMovies, 2);
					printf("%d,%d\n", ptr->x, ptr->y);*/
				}
				else if (j == 3)
				{
					int rowOffset = i == 0 ? 1 : -1;
					//int colOffset = j == 0 ? 1 : -1;
					struct vec2 points[2];
					struct vector_array *line = (struct vector_array*)malloc(sizeof(struct vector_array));
					vector_define(line, sizeof(struct vec2) * 2);

					//��
					memset(points, 0, sizeof(struct vec2) * 2);
					points[0].x = i;
					points[0].y = 0;
					points[1].x = i;
					points[1].y = 6;
					vector_push_back(line, &points);
					//��
					memset(points, 0, sizeof(struct vec2) * 2);
					points[0].x = i+1*rowOffset;
					points[0].y = 3;
					points[1].x = i+2*rowOffset;
					points[1].y = 3;
					vector_push_back(line, &points);

					hash_insert(table->ThreePointsMap, ptStr, (void*)line);

					struct vector_array *movies = (struct vector_array*)malloc(sizeof(struct vector_array));
					vector_define(movies, sizeof(struct vec2));
					rowOffset = i == 0 ? 1 : -1;
					
					struct vec2 pt;
					pt.x = i;
					pt.y = 0;
					vector_push_back(movies, &pt);
					pt.x = i;
					pt.y = 6;
					vector_push_back(movies, &pt);
					pt.x = i + 1 * rowOffset;
					pt.y = 3;
					vector_push_back(movies, &pt);
					hash_insert(table->PointsCanMovies, ptStr, (void*)movies);
				}
			}
			else if (i == 1 || i == 5)
			{
				if (j == 1 || j == 5)
				{
					int rowOffset = i == 1 ? 1 : -1;
					int colOffset = j == 1 ? 1 : -1;
					struct vec2 points[2];
					struct vector_array *line = (struct vector_array*)malloc(sizeof(struct vector_array));
					vector_define(line, sizeof(struct vec2) * 2);

					//��
					memset(points, 0, sizeof(struct vec2) * 2);
					points[0].x = i;
					points[0].y = 3;
					points[1].x = i;
					points[1].y = 3 + 2 * colOffset;
					vector_push_back(line, &points);

					//��
					memset(points, 0, sizeof(struct vec2) * 2);
					points[0].x = 3;
					points[0].y = j;
					points[1].x = 3 + 2 * rowOffset;
					points[1].y = j;
					vector_push_back(line, &points);

					//б
					memset(points, 0, sizeof(struct vec2) * 2);
					points[0].x = i + 1 * rowOffset;
					points[0].y = j + 1 * colOffset;
					points[1].x = i - 1 * rowOffset;
					points[1].y = j - 1 * colOffset;
					vector_push_back(line, &points);

					hash_insert(table->ThreePointsMap, ptStr, (void*)line);
				
					//ÿ����������߷�
					struct vector_array *movies = (struct vector_array*)malloc(sizeof(struct vector_array));
					vector_define(movies, sizeof(struct vec2));
					//rowOffset = i == 1 ? 1 : -1;
					//colOffset = j == 1 ? 1 : -1;
					struct vec2 pt;
					pt.x = i;
					pt.y = 3;
					vector_push_back(movies, &pt);
					pt.x = 3;
					pt.y = j;
					vector_push_back(movies, &pt);
					pt.x = i + 1 * rowOffset;
					pt.y = j + 1 * colOffset;
					vector_push_back(movies, &pt);
					rowOffset = i == 1 ? -1 : 1;
					colOffset = j == 1 ? -1 : 1;
					pt.x = i + 1 * rowOffset;
					pt.y = j + 1 * colOffset;
					vector_push_back(movies, &pt);
					hash_insert(table->PointsCanMovies, ptStr, (void*)movies);
				}
				else if (j == 3)
				{
					struct vec2 points[2];
					struct vector_array *line = (struct vector_array*)malloc(sizeof(struct vector_array));
					vector_define(line, sizeof(struct vec2) * 2);

					//��
					memset(points, 0, sizeof(struct vec2) * 2);
					points[0].x = i;
					points[0].y = 1;
					points[1].x = i;
					points[1].y = 5;
					vector_push_back(line, &points);

					//��
					memset(points, 0, sizeof(struct vec2) * 2);
					points[0].x = i-1;
					points[0].y = 3;
					points[1].x = i+1;
					points[1].y = 3;
					vector_push_back(line, &points);

					hash_insert(table->ThreePointsMap, ptStr, (void*)line);

					//ÿ����������߷�
					struct vector_array *movies = (struct vector_array*)malloc(sizeof(struct vector_array));
					vector_define(movies, sizeof(struct vec2));
					struct vec2 pt;
					pt.x = i;
					pt.y = 1;
					vector_push_back(movies, &pt);
					pt.x = i;
					pt.y = 5;
					vector_push_back(movies, &pt);
					pt.x = i + 1;
					pt.y = 3;
					vector_push_back(movies, &pt);
					pt.x = i - 1;
					pt.y = 3;
					vector_push_back(movies, &pt);
					hash_insert(table->PointsCanMovies, ptStr, (void*)movies);
				}
			}
			else if (i == 2 || i == 4)
			{
				if (j == 2 || j == 4)
				{
					int rowOffset = i == 2 ? 1 : -1;
					int colOffset = j == 2 ? 1 : -1;
					struct vec2 points[2];
					struct vector_array *line = (struct vector_array*)malloc(sizeof(struct vector_array));
					vector_define(line, sizeof(struct vec2) * 2);

					//��
					memset(points, 0, sizeof(struct vec2) * 2);
					points[0].x = i;
					points[0].y = 3;
					points[1].x = i;
					points[1].y = 3 + 1 * colOffset;
					vector_push_back(line, &points);

					//��
					memset(points, 0, sizeof(struct vec2) * 2);
					points[0].x = i + 1 * rowOffset;
					points[0].y = j;
					points[1].x = i + 2 * rowOffset;
					points[1].y = j;
					vector_push_back(line, &points);

					//б
					rowOffset = i == 2 ? -1 : 1;
					colOffset = j == 2 ? -1 : 1;
					memset(points, 0, sizeof(struct vec2) * 2);
					points[0].x = i + 1 * rowOffset;
					points[0].y = j + 1 * colOffset;
					points[1].x = i + 2 * rowOffset;
					points[1].y = j + 2 * colOffset;
					vector_push_back(line, &points);

					hash_insert(table->ThreePointsMap, ptStr, (void*)line);

					//ÿ����������߷�
					struct vector_array *movies = (struct vector_array*)malloc(sizeof(struct vector_array));
					vector_define(movies, sizeof(struct vec2));
					rowOffset = i == 2 ? -1 : 1;
					colOffset = j == 2 ? -1 : 1;
					struct vec2 pt;
					pt.x = i;
					pt.y = 3;
					vector_push_back(movies, &pt);
					pt.x = 3;
					pt.y = j;
					vector_push_back(movies, &pt);
					pt.x = i + 1 * rowOffset;
					pt.y = j + 1 * colOffset;
					vector_push_back(movies, &pt);
					hash_insert(table->PointsCanMovies, ptStr, (void*)movies);
				}
				else if (j == 3)
				{
					int rowOffset = i == 2 ? -1 : 1;
					//int colOffset = j == 2 ? 1 : -1;
					struct vec2 points[2];
					struct vector_array *line = (struct vector_array*)malloc(sizeof(struct vector_array));
					vector_define(line, sizeof(struct vec2) * 2);

					//��
					memset(points, 0, sizeof(struct vec2) * 2);
					points[0].x = i;
					points[0].y = 2;
					points[1].x = i;
					points[1].y = 4;
					vector_push_back(line, &points);

					//��
					memset(points, 0, sizeof(struct vec2) * 2);
					points[0].x = i + 1 * rowOffset;
					points[0].y = 3;
					points[1].x = i + 2 * rowOffset;
					points[1].y = 3;
					vector_push_back(line, &points);

					hash_insert(table->ThreePointsMap, ptStr, (void*)line);

					//ÿ����������߷�
					struct vector_array *movies = (struct vector_array*)malloc(sizeof(struct vector_array));
					vector_define(movies, sizeof(struct vec2));
					rowOffset = i == 2 ? -1 : 1;
					//colOffset = j == 2 ? -1 : 1;
					struct vec2 pt;
					pt.x = i;
					pt.y = 2;
					vector_push_back(movies, &pt);
					pt.x = i;
					pt.y = 4;
					vector_push_back(movies, &pt);
					pt.x = i + 1 * rowOffset;
					pt.y = 3;
					vector_push_back(movies, &pt);
					hash_insert(table->PointsCanMovies, ptStr, (void*)movies);
				}
			}
			else if (i == 3)
			{
				if (j == 0 || j == 6)
				{
					//int rowOffset = i == 0 ? 1 : -1;
					int colOffset = j == 0 ? 1 : -1;
					struct vec2 points[2];
					struct vector_array *line = (struct vector_array*)malloc(sizeof(struct vector_array));
					vector_define(line, sizeof(struct vec2) * 2);

					//��
					memset(points, 0, sizeof(struct vec2) * 2);
					points[0].x = 3;
					points[0].y = j+1*colOffset;
					points[1].x = 3;
					points[1].y = j + 2 * colOffset;
					vector_push_back(line, &points);

					//��
					memset(points, 0, sizeof(struct vec2) * 2);
					points[0].x = 0;
					points[0].y = j;
					points[1].x =6;
					points[1].y = j;
					vector_push_back(line, &points);

					hash_insert(table->ThreePointsMap, ptStr, (void*)line);

					//ÿ����������߷�
					struct vector_array *movies = (struct vector_array*)malloc(sizeof(struct vector_array));
					vector_define(movies, sizeof(struct vec2));
					struct vec2 pt;
					pt.x = 0;
					pt.y = j;
					vector_push_back(movies, &pt);
					pt.x = 6;
					pt.y = j;
					vector_push_back(movies, &pt);
					pt.x = 3;
					pt.y = j + 1 * colOffset;
					vector_push_back(movies, &pt);
					hash_insert(table->PointsCanMovies, ptStr, (void*)movies);
				}
				else if (j == 1 || j == 5)
				{
					struct vec2 points[2];
					struct vector_array *line = (struct vector_array*)malloc(sizeof(struct vector_array));
					vector_define(line, sizeof(struct vec2) * 2);

					//��
					memset(points, 0, sizeof(struct vec2) * 2);
					points[0].x = 3;
					points[0].y = j -1;
					points[1].x = 3;
					points[1].y = j +1;
					vector_push_back(line, &points);

					//��
					memset(points, 0, sizeof(struct vec2) * 2);
					points[0].x = 1;
					points[0].y = j;
					points[1].x = 5;
					points[1].y = j;
					vector_push_back(line, &points);

					hash_insert(table->ThreePointsMap, ptStr, (void*)line);

					//ÿ����������߷�
					struct vector_array *movies = (struct vector_array*)malloc(sizeof(struct vector_array));
					vector_define(movies, sizeof(struct vec2));
					//colOffset = j == 2 ? -1 : 1;
					struct vec2 pt;
					pt.x = 3;
					pt.y = j-1;
					vector_push_back(movies, &pt);
					pt.x = 3;
					pt.y = j+1;
					vector_push_back(movies, &pt);
					pt.x = i-2;
					pt.y = j;
					vector_push_back(movies, &pt);
					pt.x = i + 2;
					pt.y = j;
					vector_push_back(movies, &pt);
					hash_insert(table->PointsCanMovies, ptStr, (void*)movies);
				}
				else if (j == 2 || j == 4)
				{
					int colOffset = j == 2 ? -1 : 1;
					struct vec2 points[2];
					struct vector_array *line = (struct vector_array*)malloc(sizeof(struct vector_array));
					vector_define(line, sizeof(struct vec2) * 2);

					//��
					memset(points, 0, sizeof(struct vec2) * 2);
					points[0].x = 3;
					points[0].y = j + 1*colOffset;
					points[1].x = 3;
					points[1].y = j + 2*colOffset;
					vector_push_back(line, &points);

					//��
					memset(points, 0, sizeof(struct vec2) * 2);
					points[0].x = 2;
					points[0].y = j;
					points[1].x = 4;
					points[1].y = j;
					vector_push_back(line, &points);

					hash_insert(table->ThreePointsMap, ptStr, (void*)line);

					//ÿ����������߷�
					struct vector_array *movies = (struct vector_array*)malloc(sizeof(struct vector_array));
					vector_define(movies, sizeof(struct vec2));
					struct vec2 pt;
					pt.x = 3;
					pt.y = j + 1*colOffset;
					vector_push_back(movies, &pt);
					pt.x = i-1;
					pt.y = j;
					vector_push_back(movies, &pt);
					pt.x = i+1;
					pt.y = j;
					vector_push_back(movies, &pt);
					hash_insert(table->PointsCanMovies, ptStr, (void*)movies);
				}
			}
		}	
	}
}

static void
start_game(struct game_table* table) {
	table->status = T_STATED; // �����Ѿ���ʼ�ˡ�
	table->button_id = (table->button_id + 1) % 2; // һ���ֺ����е�
	

	// �㲥һ����Ϸ��ʼ����������ǵ������ڵĿͻ��ˣ�֪ͨ������ϷҪ��ʼ
	// �ͻ����յ���������Ժ󣬲���ready�Ķ���,����ʽ��ʼ֮ǰ��Ԥ��һ��ʱ��Σ��������ʱ��κ󣬲ſ�ʼ
	json_t* json = json_new_comand(THREE_CHESS_SERVICE, GAME_STATED);
	json_object_push_number(json, "2", table->button_id); // ���͸��ͻ��ˣ��ÿͻ���ȥ�ж��Լ��ǳֺڻ��ǳְ�ɫ;
	table_broadcast_json(table, json, -1); // ���е���Ҷ�Ҫ�յ�����㲥;
	json_free_value(&json);
	// end 

	// �������ֵ���ҿ�ʼ��
	table->status = T_PLAYING;
	change_game_status(table, DROP_CHESS);
	turn_to_player(table, table->button_id); // �ֵ�ׯ�ҿ�ʼ��
	// end 
}

// 1���Ǳ�ʾ�ֳ�ʤ��, 0���Ǳ�ʾδ�ֳ�ʤ��
static int
checkout_game(struct game_table* table, int seatid) {
	int just_eat_type = (table->button_id == seatid) ? WHITE_CHESS : BLACK_CHESS;
	int leftCount = 0;
	for (int i = 0; i < DISK_SIZE; i++)
	{
		for (int j = 0; j < DISK_SIZE; j++)
		{
			if (table->BoardPoints[i][j] == just_eat_type)
			{
				leftCount++;
			}
		}
	}
	if (leftCount > 2)
	{
		return 0;
	}
	char *winner = table->button_id == seatid ? "black" : "white";
	printf("game end,%s win!\n",winner);
	return 1;
}

static json_t* 
get_user_quit_data(int seatid, int reason) {
	json_t* json = json_new_comand(THREE_CHESS_SERVICE, USER_QUIT);
	json_object_push_number(json, "2", seatid);
	json_object_push_number(json, "3", reason);

	return json;
}

// �������㲥�����еĿͻ�����ҵ�
// { THREE_CHESS_SERVICE, USER_QUIT, seadid, reason}
static void do_user_quit(struct game_table* table, int seatid, int reason) {
	if (table->seats[seatid].is_sitdown == 0) {
		return;
	}

	json_t* json = get_user_quit_data(seatid, reason);
	// �㲥�����е���ң����뿪��
	table_broadcast_json(table, json, -1);
	// end 
	json_free_value(&json);

	table->seats[seatid].is_sitdown = 0;
	table->seats[seatid].playr = NULL;
}

static void
send_checkout(struct game_table* table, int winner) {
	table->status = T_CHECKOUT;

	json_t* json = json_new_comand(THREE_CHESS_SERVICE, CHECKOUT);
	json_object_push_number(json, "2", winner);
	table_broadcast_json(table, json, -1);
	json_free_value(&json);

	do_user_quit(table, 0, GAME_OVER);
	do_user_quit(table, 1, GAME_OVER);

	table->status = T_READY;
	table->button_id = -1;
}

static int
check_make_three(struct game_table* table, int block_x, int block_y)
{
	table->threeCount = 0;
	vector_clear(&table->threePoints);
	char key[3] = { 0 };
	sprintf(key, "%d%d", block_x, block_y);
	struct vector_array *lines = (struct vector_array *)hash_find(table->ThreePointsMap, key);
	for (int i = 0; i < vector_size(lines); i++)
	{
		int cnt = 0;
		struct vec2* pts = (struct vec2*)vector_at(lines, i);
		int ptType = table->BoardPoints[pts->x][pts->y];
		if ((ptType == BLACK_CHESS || ptType == WHITE_CHESS) &&
			table->BoardPoints[block_x][block_y] == ptType)
		{
			cnt++;
		}
		ptType = table->BoardPoints[(pts+1)->x][(pts+1)->y];
		if ((ptType == BLACK_CHESS || ptType == WHITE_CHESS) &&
			table->BoardPoints[block_x][block_y] == ptType)
		{
			cnt++;
		}
		//��(block_x,block_y)�����������㹹��ֱ�ߣ����������
		if (cnt == 2)
		{
			printf("make a three:pt0=(%d,%d),pt1=(%d,%d)\n",pts->x,pts->y,(pts+1)->x,(pts+1)->y);
			table->threeCount++;
			vector_push_back(&table->threePoints, (void*)pts);
			vector_push_back(&table->threePoints, (void*)(pts+1));
		}
	}
	if (table->threeCount > 0)
	{
		struct vec2 cur_pt={block_x,block_y};
		vector_push_back(&table->threePoints, (void*)&cur_pt);
	}
	return table->threeCount;
}

static void 
notify_three_count(struct game_table* table,int count)
{
	json_t* json = json_new_comand(THREE_CHESS_SERVICE, THREE_COUNT);
	json_object_push_number(json, "2", count);
	table_broadcast_json(table, json, -1);
	json_free_value(&json);
}

static int
check_drop_chess_end(struct game_table* table)
{
	int count = 0;
	for (int i = 0; i < DISK_SIZE; i++)
	{
		for (int j = 0; j < DISK_SIZE; j++)
		{
			if (table->BoardPoints[i][j] == 0)
			{
				return 0;
			}
			else if (table->BoardPoints[i][j] == DOUBLE_CHESS)
			{
				count++;
			}
		}
	}

	printf("clear %d pairs chess\n",count);
	json_t* json = json_new_comand(THREE_CHESS_SERVICE, CLEAR_DOUBLE);
	json_object_push_number(json, "2", count);
	int index = 3;
	char indexStr[2] = { 0 };
	for (int i = 0; i < DISK_SIZE; i++)
	{
		for (int j = 0; j < DISK_SIZE; j++)
		{
			if (table->BoardPoints[i][j] == DOUBLE_CHESS)
			{
				int pt2int = i * 10 + j;
				sprintf(indexStr, "%d", index);
				json_object_push_number(json, indexStr, pt2int);
				table->BoardPoints[i][j] = EMPTY;// set to 0
				index++;
			}
		}
	}
	table_broadcast_json(table, json, -1);
	json_free_value(&json);
	return 1;
}

static int
check_can_move(struct game_table* table, int from_x, int from_y, int to_x, int to_y)
{
	char key[3] = { 0 };
	sprintf(key, "%d%d", from_x, from_y);
	struct vector_array *lines = (struct vector_array *)hash_find(table->PointsCanMovies, key);
	for (int i = 0; i < vector_size(lines); i++)
	{
		int cnt = 0;
		struct vec2* pt = (struct vec2*)vector_at(lines, i);
		if (pt->x == to_x && pt->y == to_y)
		{
			return 1;
		}
	}
	return 0;
}

static void
on_player_put_chess(struct game_table* table, struct session* s, json_t* json, int len) {

	// ���ӵ�״̬
	if (table->status != T_PLAYING) {
		write_error_command(s, PUT_CHESS, INVALID_ACTION);
		return;
	}
	// end 

	// ����Ƿ�����������
	if (!is_intable(table, s)) {
		write_error_command(s, PUT_CHESS, USER_IS_INTABLE);
		return;
	}
	// end 
	int seatid = get_seatid(table, s);
	if (seatid != table->cur_turn) {// ��ǰ�Ƿ��ֵ��˸����˵��
		write_error_command(s, PUT_CHESS, INVALID_ACTION);
		return;
	}
	// end 

	//�����ҷ������Ĳ����Ƿ����������ǰ����Ϸ״̬һ��
	json_t* value = json_object_at(json, "2");
	if (!value || value->type != JSON_NUMBER) {
		write_error_command(s, PUT_CHESS, INVALID_PARAMS);
		return;
	}
	int sub_status = atoi(value->text);
	if (sub_status != table->sub_status)
	{
		write_error_command(s, PUT_CHESS, INAVLID_SUB_STATUS);
		return;
	}
	//end
	switch (table->sub_status)
	{
		case DROP_CHESS:
		{
			value = json_object_at(json, "3");
			if (!value || value->type != JSON_NUMBER) {
				write_error_command(s, PUT_CHESS, INVALID_PARAMS);
				return;
			}
			int x_block = atoi(value->text);
			// ���������Ҵ������ǵ������λ�õ�����;
			value = json_object_at(json, "4");
			if (!value || value->type != JSON_NUMBER) {
				write_error_command(s, PUT_CHESS, INVALID_PARAMS);
				return;
			}
			int y_block = atoi(value->text);

			// ����û�������λ�õĺϷ���
			if (x_block < 0 || x_block >= DISK_SIZE || y_block < 0 || y_block >= DISK_SIZE) {
				write_error_command(s, PUT_CHESS, INVALID_PARAMS);
				return;
			}
			// end

			// �������ط���û���Ѿ����¹��壬����У�Ҳ�ǷǷ��Ĳ���
			if (table->BoardPoints[x_block][y_block] != 0) {
				write_error_command(s, PUT_CHESS, INVALID_PARAMS);
				return;
			}
			// end 

			//������û������㲥��ȥ
			table->BoardPoints[x_block][y_block] = seatid == table->button_id ? BLACK_CHESS : WHITE_CHESS;
			json_t* send_data = json_new_comand(THREE_CHESS_SERVICE, PUT_CHESS);
			json_object_push_number(send_data, "2", OK);
			json_object_push_number(send_data, "3", table->sub_status);
			json_object_push_number(send_data, "4", seatid);
			json_object_push_number(send_data, "5", x_block);
			json_object_push_number(send_data, "6", y_block);
			table_broadcast_json(table, send_data, -1); // �㲥�������������е���
			json_free_value(&send_data);
			// end 

			//�ж��Ƿ����
			if (check_make_three(table, x_block, y_block) > 0)
			{
				send_three_points(table);
				change_game_status(table, PRESS_CHESS);
			}
			else {
				//check drop chess phase end
				int next = -1;
				if (check_drop_chess_end(table))
				{
					table->sub_status = MOVE_CHESS;
					change_game_status(table, MOVE_CHESS);
					// ת����һ�����
					next = (table->button_id + 1) % PLAY_NUM;
				}
				else
				{
					// ת����һ�����
					next = (table->cur_turn + 1)% PLAY_NUM;
				}
				turn_to_player(table, next);
				// end 
			}
			
		}
		break;
		case PRESS_CHESS:
		{
			if (table->threeCount<=0)
			{
				write_error_command(s, PUT_CHESS, INVALID_ACTION);
				return;
			}
			value = json_object_at(json, "3");
			if (!value || value->type != JSON_NUMBER) {
				write_error_command(s, PUT_CHESS, INVALID_PARAMS);
				return;
			}
			int x_block = atoi(value->text);
			// ���������Ҵ������ǵ������λ�õ�����;
			value = json_object_at(json, "4");
			if (!value || value->type != JSON_NUMBER) {
				write_error_command(s, PUT_CHESS, INVALID_PARAMS);
				return;
			}
			int y_block = atoi(value->text);


			// ����û�������λ�õĺϷ���
			if (x_block < 0 || x_block >= DISK_SIZE || y_block < 0 || y_block >= DISK_SIZE) {
				write_error_command(s, PUT_CHESS, INVALID_PARAMS);
				return;
			}
			// end
			int type = table->cur_turn == table->button_id ? WHITE_CHESS : BLACK_CHESS;
			if (table->BoardPoints[x_block][y_block] != type)//Ҫѹ���Ӳ��ǶԷ����ӣ��򷵻ش���
			{
				write_error_command(s, PUT_CHESS, INVALID_PARAMS);
				return;
			}
			
			json_t* send_data = json_new_comand(THREE_CHESS_SERVICE, PUT_CHESS);
			json_object_push_number(send_data, "2", OK);
			json_object_push_number(send_data, "3", table->sub_status);
			json_object_push_number(send_data, "4", seatid);
			json_object_push_number(send_data, "5", x_block);
			json_object_push_number(send_data, "6", y_block);
			table_broadcast_json(table, send_data, -1); // �㲥�������������е���
			json_free_value(&send_data);
			table->BoardPoints[x_block][y_block] = DOUBLE_CHESS;
			table->threeCount--;
			notify_three_count(table, table->threeCount);
			if (table->threeCount <= 0)
			{
				if (check_drop_chess_end(table))
				{
					table->sub_status = MOVE_CHESS;
					change_game_status(table, table->sub_status);
					// ת����һ�����
					int next = (table->button_id + 1) % PLAY_NUM;
					turn_to_player(table, next);
				}
				else {
					//change to drop chess status
					change_game_status(table, DROP_CHESS);
					// ת����һ�����
					int next = (table->cur_turn + 1) % PLAY_NUM;
					turn_to_player(table, next);
					// end 
					table->threeCount = 0;
					vector_clear(&table->threePoints);
				}	
			}
			break;
		}
		case MOVE_CHESS:
		{
			value = json_object_at(json, "3");
			if (!value || value->type != JSON_NUMBER) {
				write_error_command(s, PUT_CHESS, INVALID_PARAMS);
				return;
			}
			int move_step = atoi(value->text);
			switch (move_step)
			{
				case SELECT_CHESS:
				{
					// ���������Ҵ������ǵ������λ�õ�����;
					value = json_object_at(json, "4");
					if (!value || value->type != JSON_NUMBER) {
						write_error_command(s, PUT_CHESS, INVALID_PARAMS);
						return;
					}
					int select_x = atoi(value->text);
					value = json_object_at(json, "5");
					if (!value || value->type != JSON_NUMBER) {
						write_error_command(s, PUT_CHESS, INVALID_PARAMS);
						return;
					}
					int select_y = atoi(value->text);

					// ����û�������λ�õĺϷ���
					if (select_x < 0 || select_x >= DISK_SIZE || select_y < 0 || select_y >= DISK_SIZE) {
						write_error_command(s, PUT_CHESS, INVALID_PARAMS);
						return;
					}
					// end
					int type = table->cur_turn == table->button_id ? BLACK_CHESS : WHITE_CHESS;
					if (table->BoardPoints[select_x][select_y] != type)//
					{
						write_error_command(s, PUT_CHESS, INVALID_PARAMS);
						return;
					}
					//ok,send select chess to all players
					json_t* send_data = json_new_comand(THREE_CHESS_SERVICE, PUT_CHESS);
					json_object_push_number(send_data, "2", OK);
					json_object_push_number(send_data, "3", table->sub_status);
					json_object_push_number(send_data, "4", SELECT_CHESS);
					json_object_push_number(send_data, "5", select_x);
					json_object_push_number(send_data, "6", select_y);
					table_broadcast_json(table, send_data, -1); // �㲥�������������е���
					json_free_value(&send_data);
					break;
				}
				case DO_MOVE:
				{
					// ���������Ҵ������ǵ������λ�õ�����;
					value = json_object_at(json, "4");
					if (!value || value->type != JSON_NUMBER) {
						write_error_command(s, PUT_CHESS, INVALID_PARAMS);
						return;
					}
					int from_x = atoi(value->text);
					value = json_object_at(json, "5");
					if (!value || value->type != JSON_NUMBER) {
						write_error_command(s, PUT_CHESS, INVALID_PARAMS);
						return;
					}
					int from_y = atoi(value->text);
					value = json_object_at(json, "6");
					if (!value || value->type != JSON_NUMBER) {
						write_error_command(s, PUT_CHESS, INVALID_PARAMS);
						return;
					}
					int to_x = atoi(value->text);
					value = json_object_at(json, "7");
					if (!value || value->type != JSON_NUMBER) {
						write_error_command(s, PUT_CHESS, INVALID_PARAMS);
						return;
					}
					int to_y = atoi(value->text);

					// ����û�������λ�õĺϷ���
					if (from_x < 0 || from_x >= DISK_SIZE || from_y < 0 || from_y >= DISK_SIZE ||
						to_x < 0 || to_x >= DISK_SIZE || to_y < 0 || to_y >= DISK_SIZE) {
						write_error_command(s, PUT_CHESS, INVALID_PARAMS);
						return;
					}
					// end
					int type = table->cur_turn == table->button_id ? BLACK_CHESS : WHITE_CHESS;
					if (table->BoardPoints[from_x][from_y] != type ||
						table->BoardPoints[to_x][to_y] != EMPTY)//move to point is not empty,error
					{
						write_error_command(s, PUT_CHESS, INVALID_PARAMS);
						return;
					}
					if (check_can_move(table, from_x, from_y, to_x, to_y) == 0)
					{
						write_error_command(s, PUT_CHESS, INVALID_PARAMS);
						return;
					}
					table->BoardPoints[from_x][from_y] = EMPTY;
					table->BoardPoints[to_x][to_y] = type;
					json_t* send_data = json_new_comand(THREE_CHESS_SERVICE, PUT_CHESS);
					json_object_push_number(send_data, "2", OK);
					json_object_push_number(send_data, "3", table->sub_status);
					json_object_push_number(send_data, "4", DO_MOVE);
					json_object_push_number(send_data, "5", from_x);
					json_object_push_number(send_data, "6", from_y);
					json_object_push_number(send_data, "7", to_x);
					json_object_push_number(send_data, "8", to_y);
					table_broadcast_json(table, send_data, -1); // �㲥�������������е���
					json_free_value(&send_data);

					//�ж��Ƿ����
					if (check_make_three(table, to_x, to_y) > 0)
					{
						send_three_points(table);
						change_game_status(table, EAT_CHESS);
					}
					else
					{
						// ת����һ�����
						int next = (table->cur_turn + 1) % PLAY_NUM;
						turn_to_player(table, next);
					}
					break;
				}
			}
			
			break;
		}
		case EAT_CHESS:
		{
			// ���������Ҵ������ǵ������λ�õ�����;
			value = json_object_at(json, "3");
			if (!value || value->type != JSON_NUMBER) {
				write_error_command(s, PUT_CHESS, INVALID_PARAMS);
				return;
			}
			int eat_x = atoi(value->text);
			value = json_object_at(json, "4");
			if (!value || value->type != JSON_NUMBER) {
				write_error_command(s, PUT_CHESS, INVALID_PARAMS);
				return;
			}
			int eat_y = atoi(value->text);

			// ����û�������λ�õĺϷ���
			if (eat_x < 0 || eat_x >= DISK_SIZE || eat_y < 0 || eat_y >= DISK_SIZE) {
				write_error_command(s, PUT_CHESS, INVALID_PARAMS);
				return;
			}
			// end
			int type = table->cur_turn == table->button_id ? WHITE_CHESS : BLACK_CHESS;
			if (table->BoardPoints[eat_x][eat_y] != type)//Ҫchi���Ӳ��ǶԷ����ӣ��򷵻ش���
			{
				write_error_command(s, PUT_CHESS, INVALID_PARAMS);
				return;
			}
			//ok
			json_t* send_data = json_new_comand(THREE_CHESS_SERVICE, PUT_CHESS);
			json_object_push_number(send_data, "2", OK);
			json_object_push_number(send_data, "3", table->sub_status);
			json_object_push_number(send_data, "4", seatid);
			json_object_push_number(send_data, "5", eat_x);
			json_object_push_number(send_data, "6", eat_y);
			table_broadcast_json(table, send_data, -1); // �㲥�������������е���
			json_free_value(&send_data);
			table->BoardPoints[eat_x][eat_y] = EMPTY;
			table->threeCount--;
			notify_three_count(table, table->threeCount);
			if (checkout_game(table, seatid)) { // ��Ϸ�������̣����ͽ�����
				send_checkout(table, seatid);
				return;
			}
			if (table->threeCount <= 0)
			{
				//����ѹ��״̬
				change_game_status(table, MOVE_CHESS);
				// ת����һ�����
				int next = (table->cur_turn + 1)% PLAY_NUM;
				
				turn_to_player(table, next);
				// end 
				table->threeCount = 0;
				vector_clear(&table->threePoints);
			}
			break;
		}
	}
	
	// end 
}

static void
on_player_sitdown(struct game_table* table, struct session* s, json_t* json, int len) {
	if (len != 2) { // �����Э�飬�����ϸ�����
		write_error_command(s, SITDOWN, INVALID_PARAMS);
		return;
	}

	// �ж�һ������Ƿ��Ѿ�������������
	if (is_intable(table, s)) {
		write_error_command(s, SITDOWN, USER_IS_INTABLE);
		return;
	}
	// end 

	// �жϵ�ǰ���ӵ�״̬�������������Ϸ�У���ô���Ǿ�ֱ�Ӳ��������ˡ�
	if (table->status != T_READY) {
		write_error_command(s, SITDOWN, INAVLID_TABLE_STATUS);
		return;
	}
	// end 

	// �������ҳ������Ҹ���λ
	int seatid = get_empty_seatid(table, s);
	if (seatid < 0 || seatid >= PLAY_NUM) {
		write_error_command(s, SITDOWN, TABLE_IS_FULL);
		return;
	}
	// end 

	// �������ݵ���λ
	table->seats[seatid].playr = s;
	table->seats[seatid].seatid = seatid;
	table->seats[seatid].is_sitdown = 1;
	// end 

	// ���͸��ͻ��ˣ���ʾ�����³ɹ��ˡ�
	// {stype, opt_cmd, status, seatid};
	json_t* response = json_new_comand(THREE_CHESS_SERVICE, SITDOWN);
	json_object_push_number(response, "2", OK);
	json_object_push_number(response, "3", seatid);
	session_send_json(s, response);
	json_free_value(&response);
	// end 
	printf("new player sitdown\n");
	// ������������ҵ����ݸ���ǰ���µ����;
	sitdown_success(table, s, seatid);
	// end 

	// Ҫ�㲥���������������������ң� �������ҽ����ˣ�
	json_t* u_arrived = get_user_arrived_data(table, seatid);
	//  �㲥��������ӵ��������,��Ҫ�ٹ㲥�����Լ��ˡ�
	table_broadcast_json(table, u_arrived, seatid);
	json_free_value(&u_arrived);
	// end 

	// �����Ϸ�Ƿ�ʼ
	if (check_game_started(table)) {
		start_game(table);
	}
	// end 
}


static void
on_player_standup(struct game_table* table, struct session* s, json_t* json, int len) {
	if (len < 2) {
		write_error_command(s, STANDUP, INVALID_PARAMS);
		return;
	}

	// ����Ƿ�����������
	if (!is_intable(table, s)) {
		write_error_command(s, STANDUP, USER_IS_NOT_INTABLE);
		return;
	}
	// end 
	int seatid = get_seatid(table, s);

	
	table->seats[seatid].is_sitdown = 0; // ��λ
	table->seats[seatid].playr = NULL;
	table->seats[seatid].seatid = -1;

	// ����뿪�ˣ�����Ҫ�������Ϣ�㲥����������ң�Ҳ�����Լ�
	json_t* standup_data = json_new_comand(THREE_CHESS_SERVICE, STANDUP);
	json_object_push_number(standup_data, "2", OK);
	json_object_push_number(standup_data, "3", seatid);
	session_send_json(s, standup_data);
	table_broadcast_json(table, standup_data, -1); // �㲥�����е��ˡ�
	// end 

	if (table->status == T_PLAYING) {
		// ����
		table->status = T_CHECKOUT;
		int winner = seatid + 1;
		if (winner >= PLAY_NUM) {
			winner = 0;
		}
		send_checkout(table, winner);
		// end
	}
	// ������ʼ,��ʳ
	table->status = T_READY;
	// end 
}

static void
init_service_module(struct service_module* module) {
	struct game_table* table = (struct game_table*)malloc(sizeof(struct game_table));
	memset(table, 0, sizeof(struct game_table));
	table->button_id = -1;
	module->module_data = table;
	init_game_data(table);
	//for test
	printf("All threes Map:\n");
	for (int i = 0; i < DISK_SIZE; i++)
	{
		for (int j = 0; j < DISK_SIZE; j++)
		{
			int ptValue = table->BoardPoints[i][j];
			if (ptValue != 0)
			{
				continue;
			}
			char ptStr[3] = { 0 };
			sprintf(ptStr, "%d%d", i, j);
			struct vector_array *line = (struct vector_array *)hash_find(table->ThreePointsMap, ptStr);
			for (int k = 0; k < vector_size(line); k++)
			{
				struct vec2* points = (struct vec2*)vector_at(line, k);
				printf("i=%d,j=%d,pt[0]=(%d,%d),pt[1]=(%d,%d)\n", i, j, points->x, points->y, (points + 1)->x, (points + 1)->y);
			}
		}
	}
}

static int
on_three_chess_cmd(void* module_data, struct session* s,
                  json_t* json, unsigned char* data, int len) {
	struct game_table* table = (struct game_table*)module_data;
	int size = json_object_size(json);
	if (size < 2) { // ֱ�ӷ���
		return 0;
	}

	json_t* j_opt_cmd = json_object_at(json, "1");
	if (j_opt_cmd == NULL || j_opt_cmd->type != JSON_NUMBER) {
		return 0;
	}
	int opt_cmd = atoi(j_opt_cmd->text);

	switch (opt_cmd) {
		case SITDOWN:
		{
			on_player_sitdown(table, s, json, size);
		}
		break;
		case STANDUP:
		{
			on_player_standup(table, s, json, size);
		}
		break;
		case PUT_CHESS: 
		{
			on_player_put_chess(table, s, json, size);
		}
		break;
		default: // ��Ч�Ĳ���
		{
			write_error_command(s, opt_cmd, INVALID_COMMAND);
		}
		break;
	}
	return 0;
}

static void
on_player_lost(void* module_data, struct session* s) {
	struct game_table* table = (struct game_table*)module_data;
	int seatid = get_seatid(table, s);
	if (seatid < 0 || seatid >= PLAY_NUM) { // �������������;
		return;
	}

	
	// ����뿪
	table->seats[seatid].playr = NULL;
	table->seats[seatid].is_sitdown = 0;
	table->seats[seatid].seatid = -1;
	// end 

	// �㲥
	// ����뿪�ˣ�����Ҫ�������Ϣ�㲥�����������
	json_t* standup_data = json_new_comand(THREE_CHESS_SERVICE, STANDUP);
	json_object_push_number(standup_data, "2", OK);
	json_object_push_number(standup_data, "3", seatid);
	table_broadcast_json(table, standup_data, -1); // �㲥�����е��ˡ�
	// end 

	if (table->status == T_PLAYING) {
		// ����
		table->status = T_CHECKOUT;
		int winner = seatid + 1;
		if (winner >= PLAY_NUM) {
			winner = 0;
		}
		send_checkout(table, winner);
		// end
	}
	// ������ʼ,��ʳ
	table->status = T_READY;
	// end 

	return;
}

struct service_module TABLE_SERVICE = {
	THREE_CHESS_SERVICE, 
	init_service_module, // ע����ɺ�ĳ�ʼ��
	NULL, // ����������Э��
	on_three_chess_cmd, // json����Э��
	on_player_lost, // ���Ӷ�ʧ
	NULL, // �û�����
};