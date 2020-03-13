#ifndef __HASH_TABLE_H__
#define __HASH_TABLE_H__

struct hash_table;

// n: 多少个集合;
struct hash_table* create_hash_table(int n);
void destroy_hash_table(struct hash_table* t);
// end 

// 在HASH表里面查找我们的值
void* hash_find(struct hash_table* t, char* key);
// end 

// 删除HASH表中的项
void hash_delete(struct hash_table* t, char* key);

// 插入一个key: value,不判断是否有重复
void hash_insert(struct hash_table* t, char*key, void* value);

// 插入/更改 key: value,
void hash_set(struct hash_table* t, char*key, void* value);

// 清理所有的hash 表的数据
void hash_clear(struct hash_table* t);

#endif

