#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#include "vector_array.h"

#define my_malloc malloc
#define my_free free
#define my_realloc realloc

#define ELEM_STEP 64

void vector_define(struct vector_array* v, int sizeof_elem) {
	memset(v, 0, sizeof(struct vector_array)); // 初始化一下我们动态数组的内存;
	v->sizeof_elem = sizeof_elem;
}

void vector_clear(struct vector_array* v) {
	if (v->mem_data) {
		my_free(v->mem_data);
		v->mem_data = NULL;
	}
	v->elem_count = 0;
	v->max_elem = 0;
}

void vector_push_back(struct vector_array* v, const void* elem_ptr) {
	if (v->elem_count >= v->max_elem) { // 表示这个当前的动态内存里再也不能存放元素了,扩容
		v->max_elem += ELEM_STEP;
		v->mem_data = my_realloc(v->mem_data, v->max_elem * v->sizeof_elem);
	}

	// 存放元素
	memcpy(v->mem_data + v->elem_count * v->sizeof_elem, elem_ptr, v->sizeof_elem);
	v->elem_count ++;
}

void* vector_at(struct vector_array* v, int i) {
	if (i < 0 || i >= v->elem_count) {
		return NULL;
	}

	return (void*)(v->mem_data + i * v->sizeof_elem);
}

void* vector_begin(struct vector_array* v) {
	return v->mem_data;
}

void vector_popall(struct vector_array* v) {
	v->elem_count = 0; // 数组里面的所有的元素清楚了，但是内存还保留
}

void vector_erase(struct vector_array* v, int start, int count) {
	// 判断删除的个数索引要合法
	if (start < 0 || start >= v->elem_count) {
		return;
	}

	// count合法性的处理
	if (start + count > v->elem_count) {
		count -= ((start + count) - v->elem_count);
	}

	//
	if ((v->elem_count - (start + count) > 0)) {
		memmove(v->mem_data + start * v->sizeof_elem, // 目的地
		        v->mem_data + (start + count) * v->sizeof_elem,
				(v->elem_count - (start + count)) * v->sizeof_elem); // 开始地址

	}
	
	v->elem_count -= count;
}

void vector_popback(struct vector_array* v, void* out_of_elem) {
	if (v->elem_count <= 0) {
		return;
	}

	v->elem_count --; // 元素的个数 --;
	if (out_of_elem) {
		memcpy(out_of_elem, v->mem_data + v->elem_count * v->sizeof_elem, v->sizeof_elem);
	}
}
