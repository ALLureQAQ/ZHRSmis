/* 加载动画相关 */
const showLoading = (tips = '加载中...') => {
    uni.showNavigationBarLoading();
    uni.showLoading({
        title: tips
    });
};
const hideLoading = () => {
    uni.hideLoading();
    uni.hideNavigationBarLoading();
};
const hideLoadingWithErrorTips = (err = '加载失败...') => {
    hideLoading();
    uni.showToast({
        title: err,
        icon: 'error',
        duration: 2000
    });
};
module.exports = {
    showLoading: showLoading,
    hideLoading: hideLoading,
    hideLoadingWithErrorTips: hideLoadingWithErrorTips
};
