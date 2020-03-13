#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#define my_malloc malloc
#define my_free free

#include "hash_table.h"

struct hash_node {
	char* key;
	void* value; // void*来表示value;

	struct hash_node* next; // 串联同一个集合的节点
};

struct hash_table {
	struct hash_node** hash_set; // 每个集合的链表的头指针;
	int n; // hash_table里面有多少集合
};

// n的扩大 n * 4个字节;
struct hash_table* create_hash_table(int n) {
	struct hash_table* t = my_malloc(sizeof(struct hash_table));
	memset(t, 0, sizeof(struct hash_table));

	// n个结合的内存，存放的是链表的头指针
	t->hash_set = my_malloc(n * sizeof(struct hash_node*));
	memset(t->hash_set, 0, sizeof(struct hash_node*) * n);
	t->n = n;


	return t;
}

void destroy_hash_table(struct hash_table* t) {
	// 删除所有的元素
	hash_clear(t);
	// end 

	if (t->hash_set) {
		my_free(t->hash_set);
		t->hash_set = NULL;
	}

	my_free(t);
}

static unsigned int hash_index(char *str)
{
	register unsigned int h;
	register unsigned char *p;

	for (h = 0, p = (unsigned char *)str; *p; p++)
		h = 31 * h + *p;

	return h;
}

void hash_insert(struct hash_table* t, 
                 char*key, void* value) {
	struct hash_node* node = my_malloc(sizeof(struct hash_node));
	memset(node, 0, sizeof(struct hash_node));

	node->key = strdup(key);
	node->value = value;

	// 使用hash来返回key,属于哪个集合
	int index = (hash_index(key) % t->n); // [0, n-1]
	struct hash_node* header = t->hash_set[index];

	node->next = header;
	t->hash_set[index] = node;
}

void hash_set(struct hash_table* t, 
              char*key, void* value) {
	// 使用hash来返回key,属于哪个集合
	int index = (hash_index(key) % t->n); // [0, n-1]
	struct hash_node** walk = &(t->hash_set[index]);

	while (*walk) {
		if (strcmp((*walk)->key, key) == 0) {
			(*walk)->value = value;
			return;
		}

		walk = &((*walk)->next);
	}

	// 不存在key, value
	struct hash_node* node = my_malloc(sizeof(struct hash_node));
	memset(node, 0, sizeof(struct hash_node));

	node->key = strdup(key);
	node->value = value;

	*walk = node;
	// end 
}

void* hash_find(struct hash_table* t, char* key) {
	int index = (hash_index(key) % t->n); // [0, n-1]
	struct hash_node* walk = (t->hash_set[index]);

	while (walk) {
		if (strcmp((walk)->key, key) == 0) {
			return walk->value;
		}

		walk = walk->next;
	}

	return NULL;
}

// 删除HASH表中的项
void hash_delete(struct hash_table* t, char* key) {
	int index = (hash_index(key) % t->n); // [0, n-1]
	struct hash_node** walk = &(t->hash_set[index]);

	while (*walk) {
		if (strcmp((*walk)->key, key) == 0) {
			struct hash_node* rm_node = *walk;
			*walk = (*walk)->next;
			
			rm_node->next = NULL;
			
			// key, hash_node
			my_free(rm_node->key);
			my_free(rm_node);
			// end 
		}
		else {
			walk = &((*walk)->next);
		}
	}
}

void hash_clear(struct hash_table* t) {
	for (int i = 0; i < t->n; i++) {
		struct hash_node* walk = t->hash_set[i];
		t->hash_set[i] = NULL;

		while (walk) {
			struct hash_node* rm_node = walk;
			walk = walk->next;
			rm_node->next = NULL;

			// key, hash_node
			my_free(rm_node->key);
			my_free(rm_node);
			// end 
		}
	}
}