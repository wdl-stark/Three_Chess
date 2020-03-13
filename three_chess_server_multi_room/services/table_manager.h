
#include "table_service.h"

#define MAX_TABLE_NUM 3000
struct table_manager {
	struct game_table* free_list;
	struct game_table* online_table;
	struct game_table* cache_mem;
};

extern struct table_manager tableMgr;



void init_table_manager();
void exit_table_manager();



struct game_table* create_table();
void release_table(struct game_table* t);