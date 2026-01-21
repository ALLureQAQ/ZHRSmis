<template>
	<!-- pages/index/card1/index.wxml -->
	<view class="page-container">
		<!-- 顶部用户信息 -->
		<view class="user-info-section">

			<view class="user-details">
				<text class="user-name">{{ username || '请登录' }}</text>
				<text class="user-welcome">欢迎使用智慧燃烧Mis</text>
			</view>
			<view class="time-info">
				<text class="current-date">{{ currentDate }}</text>
				<text class="current-time">{{ currentTime }}</text>
			</view>
		</view>

		<!-- 功能菜单区域 -->
		<view class="function-section">
			<view class="section-title">
				<text class="title-text">功能菜单</text>
				<text class="title-sub">快速访问系统功能</text>
			</view>

			<view class="function-grid">
				<!-- 事故案例 -->
				<!-- <view class="function-card card-1" @tap="onDocumentTap1">
					<view class="card-icon">
						<text class="icon">📚</text>
					</view>
					<view class="card-content">
						<text class="card-title">事故案例</text>
						<text class="card-desc">学习历史事故案例</text>
					</view>
					<view class="card-badge" v-if="caseCount > 0">
						<text class="badge-text">{{ caseCount }}</text>
					</view>
				</view> -->

				<!-- 制度文档 -->
				<view class="function-card card-2" @tap="onDocumentTap2">
					<view class="card-icon">
						<text class="icon">📃</text>
					</view>
					<view class="card-content">
						<text class="card-title">制度文档</text>
						<text class="card-desc">查看管理制度文档</text>
					</view>
				</view>

				<!-- 定期任务 -->
				<view class="function-card card-3" @tap="onDocumentTap3">
					<view class="card-icon">
						<text class="icon">📅</text>
					</view>
					<view class="card-content">
						<text class="card-title">任务跟踪</text>
						<text class="card-desc">管理工作任务</text>
					</view>
					<view class="task-indicator" v-if="pendingTasks > 0">
						<text class="indicator-dot"></text>
					</view>
				</view>

				<!-- 缺陷上报 -->
				<view class="function-card card-4" @tap="onDocumentTap4">
					<view class="card-icon">
						<text class="icon">⚠️</text>
					</view>
					<view class="card-content">
						<text class="card-title">缺陷上报</text>
						<text class="card-desc">上报设备缺陷问题</text>
					</view>
				</view>

				<!-- 隐患整改 -->
				<!-- <view class="function-card card-5" @tap="onDocumentTap5">
					<view class="card-icon">
						<text class="icon">🔍</text>
					</view>
					<view class="card-content">
						<text class="card-title">隐患整改</text>
						<text class="card-desc">跟踪隐患整改进度</text>
					</view>
				</view> -->

				<!-- 风险整改 -->
				<!-- <view class="function-card card-6" @tap="onDocumentTap6">
					<view class="card-icon">
						<text class="icon">🚨</text>
					</view>
					<view class="card-content">
						<text class="card-title">风险整改</text>
						<text class="card-desc">管理风险整改事项</text>
					</view>
				</view> -->

				<!-- 巡点检 -->
				<view class="function-card card-7" @tap="onDocumentTap7">
					<view class="card-icon">
						<text class="icon">📍</text>
					</view>
					<view class="card-content">
						<text class="card-title">巡点检</text>
						<text class="card-desc">执行巡检工作任务</text>
					</view>
					<view class="feature-tag">
						<text class="tag-text">常用</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 版本信息弹窗 -->
		

		<!-- 底部统计信息 -->
		<!-- <view class="stats-section">
			<view class="stats-card">
				<view class="stats-item">
					<text class="stats-number">{{ pendingTasks }}</text>
					<text class="stats-label">待办任务</text>
				</view>
				<view class="stats-divider"></view>
				<view class="stats-item">
					<text class="stats-number">{{ completedTasks }}</text>
					<text class="stats-label">已完成</text>
				</view>
				<view class="stats-divider"></view>
				<view class="stats-item">
					<text class="stats-number">{{ thisWeekCount }}</text>
					<text class="stats-label">本周新增</text>
				</view>
			</view>
		</view> -->
	</view>
</template>

<script>
	const systemInfo = uni.getSystemInfoSync();
	const current = systemInfo.appVersionCode; // 获取app当前版本号
	const token = uni.getStorageSync('token');






	export default {
		data() {
			return {
				username: '',
				currentDate: '',
				currentTime: '',
				// 统计数据
				caseCount: 15,
				pendingTasks: 3,
				completedTasks: 42,
				thisWeekCount: 7,
				// 定时器
				timer: null,
				show:false,
				versionsFlag:0,
				// 当前应用版本号
				currentVersion : '',
				// 服务器返回的更新信息
				updateInfo :null
			}
		},
		onLoad: function() {
			this.checkUpdate();
			this.loadUserInfo();
			this.startClock();
		},
		onUnload() {
			// 清除定时器
			if (this.timer) {
				clearInterval(this.timer);
			}
		},
		methods: {
			
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
								that.updateInfo = res.data.data;
								
								setTimeout(() => {
									that.showUpdateDialog();
								}, 1000);
								
								
							}		
						}
					});
				});
				// #endif
			},
			showUpdateDialog() {
				
				var that=this
				uni.showModal({
					title: '发现新版本',
					content: that.updateInfo.description,
					confirmText: '立即更新',
					cancelText: '稍后再说',
					showCancel: !that.updateInfo.forceUpdate, // 强制更新时禁止取消
					success: (res) => {
						if (res.confirm) {
							that.downloadApp();
						} else if (that.updateInfo.forceUpdate) {
							plus.runtime.quit();
						}
					}
				});
			},
			
			downloadApp() {
				console.log('下载地址:', this.updateInfo.downloadUrl);
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
			},
			
			
			loadUserInfo() {
				const username = uni.getStorageSync('username');
				if (username) {
					this.username = username;
				}
			},
			startClock() {
				// 更新时间显示
				const updateTime = () => {
					const now = new Date();

					// 格式化日期
					const year = now.getFullYear();
					const month = String(now.getMonth() + 1).padStart(2, '0');
					const day = String(now.getDate()).padStart(2, '0');
					this.currentDate = `${year}-${month}-${day}`;

					// 格式化时间
					const hours = String(now.getHours()).padStart(2, '0');
					const minutes = String(now.getMinutes()).padStart(2, '0');
					this.currentTime = `${hours}:${minutes}`;
				};
				// 立即更新一次
				updateTime();
				// 每秒更新一次时间
				this.timer = setInterval(updateTime, 60000); // 每分钟更新一次
			},
			onDocumentTap1: function(e) {
				this.navigateWithAnimation('/pages/index/shigu/index');
			},
			onDocumentTap2: function(e) {
				this.navigateWithAnimation('/pages/index/zhidu/index');
			},
			onDocumentTap3: function(e) {
				this.navigateWithAnimation('/pages/index/dqwork/index');
			},
			onDocumentTap4: function(e) {
				this.navigateWithAnimation('/pages/index/xunjian/quexian/index');
			},
			onDocumentTap5: function(e) {
				this.navigateWithAnimation('/pages/index/xunjian/jiancha');
			},
			onDocumentTap6: function(e) {
				this.navigateWithAnimation('/pages/index/risk/index');
			},
			onDocumentTap7: function(e) {
				// uni.navigateTo({
				// 	url: '/pages/index/xunjian/jiancha?deviceId='+60
				// });
				uni.scanCode({
					onlyFromCamera: true, // 允许从相册选择
					scanType: ['qrCode'],
					success: (res) => {
						console.log(res.result)
						uni.navigateTo({
							url: '/pages/index/xunjian/jiancha?deviceId=' + res.result
						});

					},
					fail: (err) => {
						console.error('扫描失败:', err);
						// 忽略用户取消操作的错误提示
					}
				});





			},
			navigateWithAnimation(url) {
				// 添加点击反馈
				uni.vibrateShort();

				// 延迟跳转，让用户有反馈感
				setTimeout(() => {
					uni.navigateTo({
						url: url,
						animationType: 'slide-in-right',
						animationDuration: 300
					});
				}, 100);
			}
		}
	};
</script>

<style>
	.page-container {
		min-height: 100vh;
		background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
		padding: 30rpx;
		display: flex;
		flex-direction: column;
	}

	/* 用户信息区域 */
	.user-info-section {
		background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
		border-radius: 24rpx;
		padding: 40rpx 30rpx;
		display: flex;
		align-items: center;
		box-shadow: 0 10rpx 30rpx rgba(52, 152, 219, 0.3);
		margin-bottom: 40rpx;
		position: relative;
		overflow: hidden;
	}

	.user-info-section::before {
		content: '';
		position: absolute;
		top: -50%;
		right: -50%;
		width: 200%;
		height: 200%;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
		background-size: 30rpx 30rpx;
		opacity: 0.3;
	}

	.user-avatar {
		width: 100rpx;
		height: 100rpx;
		border-radius: 50%;
		background: white;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 24rpx;
		overflow: hidden;
		border: 4rpx solid rgba(255, 255, 255, 0.3);
	}

	.user-avatar image {
		width: 80%;
		height: 80%;
		border-radius: 50%;
	}

	.user-details {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.user-name {
		font-size: 36rpx;
		font-weight: bold;
		color: white;
		margin-bottom: 8rpx;
	}

	.user-welcome {
		font-size: 26rpx;
		color: rgba(255, 255, 255, 0.9);
	}

	.time-info {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}

	.current-date {
		font-size: 28rpx;
		color: white;
		font-weight: 500;
		margin-bottom: 6rpx;
	}

	.current-time {
		font-size: 32rpx;
		color: white;
		font-weight: bold;
	}

	/* 功能区域 */
	.function-section {
		flex: 1;
		margin-bottom: 40rpx;
	}

	.section-title {
		margin-bottom: 40rpx;
		padding: 0 10rpx;
	}

	.title-text {
		font-size: 40rpx;
		font-weight: bold;
		color: #2c3e50;
		display: block;
		margin-bottom: 10rpx;
	}

	.title-sub {
		font-size: 28rpx;
		color: #7f8c8d;
	}

	.function-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 24rpx;
	}

	.function-card {
		background: white;
		border-radius: 20rpx;
		padding: 30rpx;
		display: flex;
		align-items: center;
		position: relative;
		box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.08);
		transition: all 0.3s ease;
		border: 2rpx solid transparent;
	}

	.function-card:active {
		transform: translateY(4rpx);
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
	}

	.function-card:hover {
		border-color: rgba(52, 152, 219, 0.2);
	}

	.card-icon {
		width: 80rpx;
		height: 80rpx;
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 24rpx;
		font-size: 40rpx;
	}

	.card-content {
		flex: 1;
	}

	.card-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #2c3e50;
		display: block;
		margin-bottom: 8rpx;
	}

	.card-desc {
		font-size: 24rpx;
		color: #7f8c8d;
	}

	/* 卡片颜色 */
	.card-1 .card-icon {
		background: linear-gradient(135deg, #FF9A9E 0%, #FAD0C4 100%);
	}

	.card-2 .card-icon {
		background: linear-gradient(135deg, #A1C4FD 0%, #C2E9FB 100%);
	}

	.card-3 .card-icon {
		background: linear-gradient(135deg, #FFECD2 0%, #FCB69F 100%);
	}

	.card-4 .card-icon {
		background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
	}

	.card-5 .card-icon {
		background: linear-gradient(135deg, #84FAB0 0%, #8FD3F4 100%);
	}

	.card-6 .card-icon {
		background: linear-gradient(135deg, #FFD1FF 0%, #FAD0C4 100%);
	}

	.card-7 .card-icon {
		background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
	}

	/* 徽章和标签 */
	.card-badge {
		position: absolute;
		top: 20rpx;
		right: 20rpx;
		background: #e74c3c;
		color: white;
		width: 36rpx;
		height: 36rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 22rpx;
		font-weight: bold;
	}

	.task-indicator {
		position: absolute;
		top: 20rpx;
		right: 20rpx;
	}

	.indicator-dot {
		display: block;
		width: 16rpx;
		height: 16rpx;
		background: #27ae60;
		border-radius: 50%;
	}

	.feature-tag {
		position: absolute;
		bottom: 20rpx;
		right: 20rpx;
		background: #3498db;
		padding: 6rpx 16rpx;
		border-radius: 20rpx;
	}

	.tag-text {
		font-size: 22rpx;
		color: white;
		font-weight: 500;
	}

	/* 统计区域 */
	.stats-section {
		margin-top: auto;
	}

	.stats-card {
		background: white;
		border-radius: 20rpx;
		padding: 30rpx;
		display: flex;
		justify-content: space-around;
		box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.08);
	}

	.stats-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex: 1;
	}

	.stats-number {
		font-size: 48rpx;
		font-weight: bold;
		color: #3498db;
		margin-bottom: 8rpx;
	}

	.stats-label {
		font-size: 26rpx;
		color: #7f8c8d;
	}

	.stats-divider {
		width: 2rpx;
		height: 60rpx;
		background: #f0f0f0;
		margin: 0 20rpx;
	}

	/* 响应式调整 */
	@media (max-width: 700rpx) {
		.function-grid {
			grid-template-columns: 1fr;
			gap: 20rpx;
		}

		.user-info-section {
			flex-direction: column;
			text-align: center;
			padding: 40rpx 20rpx;
		}

		.user-avatar {
			margin-right: 0;
			margin-bottom: 20rpx;
		}

		.user-details {
			margin-bottom: 20rpx;
			align-items: center;
		}

		.time-info {
			align-items: center;
		}

		.stats-card {
			padding: 20rpx;
		}

		.stats-number {
			font-size: 40rpx;
		}

		.stats-label {
			font-size: 24rpx;
		}
	}

	/* 动画效果 */
	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(30rpx);
		}

		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.function-card {
		animation: fadeInUp 0.5s ease forwards;
		opacity: 0;
	}

	.function-card:nth-child(1) {
		animation-delay: 0.1s;
	}

	.function-card:nth-child(2) {
		animation-delay: 0.2s;
	}

	.function-card:nth-child(3) {
		animation-delay: 0.3s;
	}

	.function-card:nth-child(4) {
		animation-delay: 0.4s;
	}

	.function-card:nth-child(5) {
		animation-delay: 0.5s;
	}

	.function-card:nth-child(6) {
		animation-delay: 0.6s;
	}

	.function-card:nth-child(7) {
		animation-delay: 0.7s;
	}
</style>