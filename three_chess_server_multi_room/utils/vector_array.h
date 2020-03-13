#ifndef __VECTOR_ARRAY_H__
#define __VECTOR_ARRAY_H__

// 动态数组的对象结构
struct vector_array {
	unsigned char* mem_data; // 存放我们数组元素的内存地址,内存是分配在堆上的;
	int max_elem; // 当前这块内存最大的容量;
	int elem_count; // 当前这块内存存放的元素个数;
	int sizeof_elem; // 每个元素所占的内存大小;
};
// end 

// 定义配置这个动态数组存放哪种类型的元素
void vector_define(struct vector_array* v, int sizeof_elem);

// 清楚掉我们动态数组在堆上为元素分配的内存,动态数组将不会存放任何数据;
void vector_clear(struct vector_array* v);

// 往动态数组最后存放我们的元素
void vector_push_back(struct vector_array* v, const void* elem_ptr);

// 获取第i个元素的内存地址
void* vector_at(struct vector_array* v, int i);

// 获取数组存放的内存的首地址
void* vector_begin(struct vector_array* v);

// 获取数组当前的元素个数
#define vector_size(v) ((v)->elem_count)

// 清理到这个数组里面的所有元素，但是我们还要继续存放(内存还要使用)
void vector_popall(struct vector_array* v);

// 删除我们的数组里面的元素start,开始删除多少个
void vector_erase(struct vector_array* v, int start, int count);

// 弹出数组最后一个元素，
// 并把最后一个元素的值写到我们用户准备好的内存里面
void vector_popback(struct vector_array* v, void* out_of_elem);

#endif

