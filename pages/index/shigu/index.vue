<template>
    <view>
        <!-- 列表 -->
        <scroll-view scroll-y style="height: 100vh" @scrolltolower="onLoadMore" :refresher-enabled="true" @refresherrefresh="onRefresh" :refresher-triggered="loading">
            <!-- 列表内容 -->
            <view class="list-container">
                <block v-for="(item, index) in listData" :key="index">
                    <view class="list-item" @tap="onItemClick" :data-item="item">
                        <view class="item-title">{{ item.title }}</view>
                        <view class="item-content">{{ item.content }}</view>
                        <view class="item-time">{{ item.time }}</view>
                    </view>
                </block>

                <!-- 加载状态 -->
                <view class="loading-more" v-if="loading && !noMore">
                    <text>加载中...</text>
                </view>

                <!-- 没有更多数据 -->
                <view class="no-more" v-if="noMore">
                    <text>没有更多数据了</text>
                </view>
            </view>
        </scroll-view>
    </view>
</template>

<script>
const storage = require('../../utils/storage.js');
const util = require('../../utils/util'); // 引入封装过的加载提示
export default {
    data() {
        return {
            listData: [],
            // 列表数据
            loading: false,
            // 加载状态
            noMore: false,
            // 是否没有更多数据
            pageSize: 10,
            // 每页条数
            currentPage: 1,
            // 当前页码
            storageKey: 'recycleData' // 本地存储key
        };
    },
    onLoad: function () {
        this.test();
    },
    methods: {
        // 生成模拟数据
        generateMockData: function () {
            const mockData = [];
            const total = this.listData.length; // 模拟50条数据
            const list1 = this.listData;
            for (let i = 0; i < total; i++) {
                mockData.push({
                    id: i,
                    title: list1[i].name,
                    content: list1[i].createByN,
                    time: list1[i].createTime,
                    url: list1[i].url
                });
            }

            // 存储到本地
            storage.setData(this.storageKey, mockData);

            // 显示第一页数据
            this.setData({
                listData: mockData.slice(0, this.pageSize),
                currentPage: 1,
                noMore: mockData.length <= this.pageSize
            });
        },

        // 下拉刷新
        onRefresh: function () {
            if (this.loading) {
                return;
            }
            this.setData({
                loading: true
            });

            // 模拟网络请求延迟
            setTimeout(() => {
                this.test();
                const localData = storage.getData(this.storageKey) || [];
                this.setData({
                    listData: localData.slice(0, this.pageSize),
                    currentPage: 1,
                    noMore: localData.length <= this.pageSize,
                    loading: false
                });
            }, 1000);
            uni.stopPullDownRefresh();
        },

        // 上拉加载更多
        onLoadMore: function () {
            if (this.loading || this.noMore) {
                return;
            }
            this.setData({
                loading: true
            });

            // 模拟网络请求延迟
            setTimeout(() => {
                const localData = storage.getData(this.storageKey) || [];
                const nextPage = this.currentPage + 1;
                const startIdx = (nextPage - 1) * this.pageSize;
                const endIdx = nextPage * this.pageSize;
                if (startIdx >= localData.length) {
                    this.setData({
                        noMore: true,
                        loading: false
                    });
                    return;
                }
                const newData = localData.slice(startIdx, endIdx);
                this.setData({
                    listData: [...this.listData, ...newData],
                    currentPage: nextPage,
                    noMore: endIdx >= localData.length,
                    loading: false
                });
            }, 1000);
        },

        // 点击项目
        onItemClick: function (e) {
            const item = e.currentTarget.dataset.item;
            this.previewFile(item.url);
        },

        previewFile(fileLink) {
            if (!fileLink) {
                return false;
            }
            util.showLoading();

            // 单次下载允许的最大文件为 200MB
            uni.downloadFile({
                url: 'https://fdjt.qdsteel.com:5018/prod-api/' + fileLink,
                success: function (res) {
                    console.log(111);
                    console.log(res, 'wx.downloadFile success res');
                    if (res.statusCode != 200) {
                        util.hideLoadingWithErrorTips();
                        return false;
                    }
                    var Path = res.tempFilePath; //返回的文件临时地址，用于后面打开本地预览所用
                    uni.openDocument({
                        filePath: Path,
                        showMenu: true,
                        success: function (res) {
                            console.log('打开成功');
                            util.hideLoading();
                        }
                    });
                },
                fail: function (err) {
                    console.log(err, 'wx.downloadFile fail err');
                    util.hideLoadingWithErrorTips();
                }
            });
        },

        test() {
            // 为确保this指向不发生改变，可以固定下this指向
            //使用this的时候用that代替即可
            var that = this;
            uni.request({
                url: 'https://fdjt.qdsteel.com:5018/prod-api/mes/shigu/list_wx',
                data: {},
                method: 'GET',
                // 或 ‘POST’
                header: {
                    'content-type': 'application/json'
                },
                success: function (res) {
                    console.log(res);
                    if (res.statusCode == 200) {
                        that.setData({
                            // 将res.data保存在listDate方便我们去循环遍历
                            listData: res.data.rows
                        });
                    }
                    that.generateMockData();
                },
                fail: function () {
                    uni.showToast({
                        icon: 'none',
                        mask: true,
                        title: '接口调用失败，请稍后再试。'
                    });
                }
            });
        }
    }
};
</script>
<style>
@import './index.css';
</style>
