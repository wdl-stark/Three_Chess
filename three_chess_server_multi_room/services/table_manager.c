#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#include "table_manager.h"

void init_table_manager()
{
    memset(&tableMgr, 0, sizeof(struct table_manager));
	
	// 将3000个table一次分配出来。
	int size = sizeof(struct game_table);
	tableMgr.cache_mem = (struct game_table*)malloc(MAX_TABLE_NUM * sizeof(struct game_table));
	memset(tableMgr.cache_mem, 0, MAX_TABLE_NUM * sizeof(struct game_table));

	for (int i = 0; i < MAX_TABLE_NUM; i++) {
		tableMgr.cache_mem[i].next = tableMgr.free_list;
		tableMgr.free_list = &tableMgr.cache_mem[i];
	}
}
void exit_table_manager()
{

}

static struct game_table* cache_alloc() {
	struct game_table* t = NULL;
	if (tableMgr.free_list != NULL) {
		t = tableMgr.free_list;
		tableMgr.free_list = t->next;
	}
	else { // 调用系统的函数 malloc
		t = malloc(sizeof(struct game_table));
	}
	memset(t, 0, sizeof(struct game_table));

	return t;
}


void release_table(struct game_table* t) {
	// 判断一下，是从cache分配出去的，还是从系统my_malloc分配出去的？
	if (t >= tableMgr.cache_mem && t < tableMgr.cache_mem + MAX_TABLE_NUM * sizeof(struct game_table)) {
		t->next = tableMgr.free_list;
		tableMgr.free_list = t;
	}
	else { 
		free(t);
	}
	// 
}

struct game_table* create_table()
{
    struct game_table* t = cache_alloc();
	t->next = tableMgr.online_table;
	tableMgr.online_table = t;
	return t;
}
