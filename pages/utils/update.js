// 版本更新工具类 - 使用单例模式确保全局只有一个更新实例

class AppUpdate {
	constructor() {
		// 当前应用版本号
		this.currentVersion = '';
		// 服务器返回的更新信息
		this.updateInfo = null;
	}

	// 检查更新方法
	checkUpdate() {
		//仅在app环境下运行
		// #ifdef APP-PLUS 
		plus.runtime.getProperty(plus.runtime.appid, (widgetInfo) => {
			
			this.currentVersion = widgetInfo.version;
			var that = this
			uni.request({
				url: 'https://fdjt.qdsteel.com:5018/prod-api/mes/version/check?currentVersion=' +this.currentVersion,
				method: 'GET',
				header: {
					'content-type': 'application/json',
					'Authorization': token
				},
				success: function(res) {
					
					if (res.data.msg) {
						this.updateInfo = res.data.data;
						that.showUpdateDialog();
					}		
				}
			});
		});
		// #endif
	}
	showUpdateDialog() {
		uni.showModal({
			title: '发现新版本',
			content: this.updateInfo.description,
			confirmText: '立即更新',
			cancelText: '稍后再说',
			showCancel: !this.updateInfo.forceUpdate, // 强制更新时禁止取消
			success: (res) => {
				if (res.confirm) {
					this.downloadApp();
				} else if (this.updateInfo.forceUpdate) {
					plus.runtime.quit();
				}
			}
		});
	}
	
	downloadApp() {
		console.log('下载地址:'+this.updateInfo.downloadUrl);
		let showLoading = plus.nativeUI.showWaiting('正在下载');
		const downloadTask = uni.downloadFile({
			url: this.updateInfo.downloadUrl,
			success: (res) => {
				console.log('下载结果:', res); // 添加日志
				if (res.statusCode === 200) {
					console.log('开始安装:', res.tempFilePath); // 添加日志
					plus.runtime.install(
						res.tempFilePath, {
							force: false
						},
						() => {
							console.log('安装成功'); // 添加日志
							plus.nativeUI.closeWaiting();
							plus.runtime.restart();
						},
						(error) => {
							console.error('安装失败:', error); // 添加错误日志
							plus.nativeUI.closeWaiting();
							uni.showToast({
								title: '安装失败: ' + error.message,
								icon: 'none',
								duration: 2000
							});
						}
					);
				} else {
					console.error('下载状态码异常:', res.statusCode); // 添加错误日志
					plus.nativeUI.closeWaiting();
					uni.showToast({
						title: '下载失败: ' + res.statusCode,
						icon: 'none',
						duration: 2000
					});
				}
			},
			fail: (err) => {
				console.error('下载失败:', err); // 添加错误日志
				plus.nativeUI.closeWaiting();
				uni.showToast({
					title: '下载失败: ' + err.errMsg,
					icon: 'none',
					duration: 2000
				});
			}
		});

		//监听下载进度
		downloadTask.onProgressUpdate((res) => {
			console.log('下载进度:', res.progress); // 添加进度日志
			if (res.progress > 0) { // 只在有实际进度时更新提示
				showLoading.setTitle('正在下载' + res.progress + '%');
			}
		});
	}
}

//单例模式实现
let instance = null;

export default {
	getInstance() {
		if (!instance) {
			instance = new AppUpdate();
		}
		return instance;
	}
}