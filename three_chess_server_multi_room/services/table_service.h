#ifndef __TABLE_SERVICE_H__
#define __TABLE_SERVICE_H__

#include "../gateway/gateway.h"
#include "../utils/vector_array.h"
#include "../utils/hash_table.h"

extern struct service_module TABLE_SERVICE;
#define PLAY_NUM 2
#define DISK_SIZE 7
typedef struct session game_player;

struct game_seat {
	int is_sitdown; // 是否为一个有效的桌子;
	int seatid; // 座位的id号
	// 玩家的对象
	game_player* playr;
};

struct game_table {
	int status; // 存放我们当前的桌子的状体,初始化是TRADEAD的状态;
	int sub_status; //游戏状态,见枚举定义
	int button_id; // 我们当前那个玩家持黑线下。
	int cur_turn;
	int threeCount;//成三的个数
	
	struct game_seat seats[PLAY_NUM];

	int BoardPoints[DISK_SIZE][DISK_SIZE];
	
	struct vector_array threePoints;

	int tableNo;
    struct game_table* next;
};


#endif

