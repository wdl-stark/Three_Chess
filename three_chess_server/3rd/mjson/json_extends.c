#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#include "json.h"

void 
json_free_str(char* json_str) {
	free(json_str);
}

int
json_object_size(json_t* parent) {
	int count = 0;
	json_t* walk = parent->child;
	while (walk) {
		count++;
		walk = walk->next;
	}
	return count;
}

int
json_array_size(json_t* parent) {
	int count = 0;
	json_t* walk = parent->child;
	while (walk) {
		count++;
		walk = walk->next;
	}
	return count;
}

json_t*
json_object_at(json_t* parent, char* key) {
	json_t* j_key = json_find_first_label(parent, key);
	if (!j_key) {
		return NULL;
	}

	return j_key->child;
}

json_t*
json_array_at(json_t* parent, int i) {
	json_t* j_key = parent->child;
	int index = 0;
	while (j_key) {
		if (index == i) {
			return j_key;
		}
		j_key = j_key->next;
	}

	return NULL;
}

void
json_object_push_number(json_t* root, char*key, int value) {
	char buf[16];
	sprintf(buf, "%d", value);
	
	json_t* j_value = json_new_number(buf);
	json_insert_pair_into_object(root, key, j_value);
}

void
json_object_push_string(json_t* parent, char* key, char* value) {
	json_t* j_value = json_new_string(value);
	json_insert_pair_into_object(parent, key, j_value);
}

void
json_array_push_number(json_t* parent, int value) {
	char buf[16];
	sprintf(buf, "%d", value);
	
	json_t* j_value = json_new_number(buf);
	json_insert_child(parent, j_value);
}

void
json_array_push_string(json_t* parent, char* value) {
	json_t* j_value = json_new_string(value);
	json_insert_child(parent, j_value);
}

json_t*
json_new_comand(int stype, int comand) {
	json_t* root = json_new_object();
	json_object_push_number(root, "0", stype);
	json_object_push_number(root, "1", comand);

	return root;
}