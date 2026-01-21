// 本地存储工具类
const storage = {
    // 存储数据
    setData: function (key, data) {
        try {
            uni.setStorageSync(key, data);
            return true;
        } catch (e) {
            console.log('CatchClause', e);
            console.log('CatchClause', e);
            console.error('存储数据失败', e);
            return false;
        }
    },
    // 获取数据
    getData: function (key) {
        try {
            return uni.getStorageSync(key) || null;
        } catch (e) {
            console.log('CatchClause', e);
            console.log('CatchClause', e);
            console.error('获取数据失败', e);
            return null;
        }
    },
    // 清除数据
    clearData: function (key) {
        try {
            uni.removeStorageSync(key);
            return true;
        } catch (e) {
            console.log('CatchClause', e);
            console.log('CatchClause', e);
            console.error('清除数据失败', e);
            return false;
        }
    }
};
module.exports = storage;
