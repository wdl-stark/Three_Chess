# Three_Chess
打三棋游戏：
分为一个单机版，一个网络版，网络版分为服务端和客户端代码；
客户端采用cocos creator；
服务端采用c语言，实现了解析和封装websocket协议数据，底层采用windows的IOCP，由于没有采用c++，所以没有用vector和map保存数据，
而是采用了一个动态数组和一个hash_map
