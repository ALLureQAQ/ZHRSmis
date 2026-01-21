<template>
	<!-- pages/index/card1/index.wxml -->
	<view class="message-container">
		<!-- 顶部标题和统计 -->
		<view class="message-header">
			<view class="header-content">
				<text class="header-title">消息中心</text>
				<text class="header-subtitle">及时处理重要提醒</text>
			</view>
			<view class="message-stats">
				<view class="stat-item">
					<text class="stat-number">{{ unreadWorkOrders }}</text>
					<text class="stat-label">待消缺工单</text>
				</view>
				<view class="stat-divider"></view>
				<view class="stat-item">
					<text class="stat-number">{{ unreadAlerts }}</text>
					<text class="stat-label">未消除报警</text>
				</view>
			</view>
		</view>

		<!-- 消息卡片区域 -->
		<view class="cards-container">
			<!-- 工单提醒卡片 -->
			<view class="message-card workorder-card" @tap="onDocumentTap1">
				<view class="card-background"></view>
				<view class="card-content">
					<view class="card-header">
						<view class="card-icon">
							<text class="icon"></text>
						</view>
						<view class="card-title-section">
							<text class="card-title">工单提醒</text>
							<text class="card-subtitle">待处理的工单任务</text>
						</view>
						<view class="notification-badge" v-if="unreadWorkOrders > 0">
							<text class="badge-text">{{ unreadWorkOrders }}</text>
						</view>
					</view>

					<view class="card-body">
						<view class="recent-item" v-if="recentWorkOrder">
							<text class="recent-title">最新工单:</text>
							<text class="recent-content">{{ recentWorkOrder }}</text>

						</view>
						<view class="empty-state" v-else>
							<text class="empty-text">暂无待处理工单</text>
						</view>
					</view>

					<view class="card-footer">
						<text class="action-text">点击查看详情 →</text>
					</view>
				</view>

				<!-- 悬停效果层 -->
				<view class="card-hover"></view>
			</view>

			<!-- 报警提醒卡片 -->
			<view class="message-card alert-card" @tap="onDocumentTap2">
				<view class="card-background"></view>
				<view class="card-content">
					<view class="card-header">
						<view class="card-icon">
							<text class="icon"></text>
						</view>
						<view class="card-title-section">
							<text class="card-title">报警提醒</text>
							<text class="card-subtitle">设备异常报警信息</text>
						</view>
						<view class="notification-badge" v-if="unreadAlerts > 0">
							<text class="badge-text">{{ unreadAlerts }}</text>
						</view>
					</view>

					<view class="card-body">
						<view class="recent-item" v-if="recentAlert">
							<text class="recent-title">最新报警:</text>
							<text class="recent-content">{{ recentAlert }}</text>

						</view>
						<view class="empty-state" v-else>
							<text class="empty-text">暂无报警信息</text>
						</view>
					</view>

					<view class="card-footer">
						<text class="action-text">点击查看详情 →</text>
					</view>
				</view>

				<!-- 悬停效果层 -->
				<view class="card-hover"></view>
			</view>
		</view>

		<!-- 底部操作区域 -->
		<view class="actions-section">

			<view class="action-button" @tap="refreshMessages">
				<text class="action-icon"></text>
				<text class="action-label">刷新消息</text>
			</view>
		</view>

		<!-- 时间戳 -->
		<view class="timestamp">
			<text class="timestamp-text">最后更新: {{ lastUpdateTime }}</text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				// API基础URL
				// 消息统计
				unreadWorkOrders: null,
				unreadAlerts: null,
				// 最近消息
				recentWorkOrder: null,
				recentAlert: null,
				// 更新时间
				lastUpdateTime: "",
				// 定时器
				updateTimer: null
			};
		},
		onLoad: function() {
			this.updateTimestamp();
			this.startAutoUpdate();
			this.initialization();
		},
		onUnload() {
			// 清除定时器
			if (this.updateTimer) {
				clearInterval(this.updateTimer);
			}
		},
		methods: {
			onDocumentTap1: function(e) {
				this.navigateWithFeedback('/pages/message/workorder/index');
			},

			onDocumentTap2: function(e) {
				this.navigateWithFeedback('/pages/message/warn/index');
			},
			initialization() {
				const token = uni.getStorageSync('token');
				const that = this;
				if (token) {
					uni.request({
						url: 'https://fdjt.qdsteel.com:5018/prod-api/mes/report/listh5',
						method: 'GET',
						header: {
							'content-type': 'application/json',
							'Authorization': token
						},
						success: function(res) {
							

							that.unreadWorkOrders = res.data.unreadWorkOrders;
							that.unreadAlerts = res.data.unreadAlerts;
							that.recentWorkOrder = res.data.newWorkOrder;
							that.recentAlert = res.data.newAlert;

						},

					});
				}

			},
			// API请求封装


			// 标记所有为已读
			markAllAsRead() {
				uni.showLoading({
					title: '处理中...'
				});

				setTimeout(() => {
					this.unreadWorkOrders = 0;
					this.unreadAlerts = 0;

					uni.showToast({
						title: '已全部标记为已读',
						icon: 'success',
						duration: 1500
					});

					uni.hideLoading();
				}, 800);
			},

			// 刷新消息
			refreshMessages() {
				uni.showLoading({
					title: '刷新中...'
				});
				this.initialization();
				// 模拟刷新数据
				uni.showToast({
					title: '刷新成功',
					icon: 'success',
					duration: 1500
				});

				uni.hideLoading();
			},

			// 更新时间戳
			updateTimestamp() {
				const now = new Date();
				const hours = String(now.getHours()).padStart(2, '0');
				const minutes = String(now.getMinutes()).padStart(2, '0');
				this.lastUpdateTime = `${hours}:${minutes}`;
			},

			// 开始自动更新
			startAutoUpdate() {
				// 每5分钟自动更新一次时间戳
				this.updateTimer = setInterval(() => {
					this.updateTimestamp();
				}, 5 * 60 * 1000);
			},

			// 带反馈的导航
			navigateWithFeedback(url) {
				// 添加触觉反馈
				uni.vibrateShort();

				// 短延迟后跳转
				setTimeout(() => {
					uni.navigateTo({
						url: url,
						animationType: 'slide-in-right',
						animationDuration: 300
					});
				}, 150);
			}
		}
	};
</script>

<style>
	.message-container {
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 30rpx;
		display: flex;
		flex-direction: column;
	}

	/* 头部区域 */
	.message-header {
		background: rgba(255, 255, 255, 0.15);
		backdrop-filter: blur(10rpx);
		border-radius: 24rpx;
		padding: 40rpx 30rpx;
		margin-bottom: 40rpx;
		border: 1rpx solid rgba(255, 255, 255, 0.2);
		box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
	}

	.header-content {
		margin-bottom: 30rpx;
	}

	.header-title {
		font-size: 48rpx;
		font-weight: bold;
		color: white;
		display: block;
		margin-bottom: 10rpx;
	}

	.header-subtitle {
		font-size: 28rpx;
		color: rgba(255, 255, 255, 0.9);
	}

	.message-stats {
		display: flex;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 16rpx;
		padding: 20rpx;
	}

	.stat-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 10rpx;
	}

	.stat-number {
		font-size: 48rpx;
		font-weight: bold;
		color: white;
		margin-bottom: 8rpx;
	}

	.stat-label {
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.8);
	}

	.stat-divider {
		width: 2rpx;
		background: rgba(255, 255, 255, 0.3);
		margin: 0 20rpx;
	}

	/* 卡片容器 */
	.cards-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 30rpx;
	}

	/* 消息卡片 */
	.message-card {
		position: relative;
		height: 340rpx;
		border-radius: 24rpx;
		overflow: hidden;
		box-shadow: 0 15rpx 40rpx rgba(0, 0, 0, 0.2);
		transition: all 0.3s ease;
	}

	.message-card:active {
		transform: translateY(6rpx);
		box-shadow: 0 8rpx 25rpx rgba(0, 0, 0, 0.15);
	}

	.card-background {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: white;
		z-index: 1;
	}

	.card-content {
		position: relative;
		z-index: 2;
		height: 100%;
		padding: 40rpx;
		display: flex;
		flex-direction: column;
	}

	.card-header {
		display: flex;
		align-items: center;
		margin-bottom: 30rpx;
	}

	.card-icon {
		width: 80rpx;
		height: 80rpx;
		border-radius: 20rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 24rpx;
		font-size: 40rpx;
	}

	.card-title-section {
		flex: 1;
	}

	.card-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #2c3e50;
		display: block;
		margin-bottom: 6rpx;
	}

	.card-subtitle {
		font-size: 24rpx;
		color: #7f8c8d;
	}

	.notification-badge {
		background: #e74c3c;
		color: white;
		width: 50rpx;
		height: 50rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 26rpx;
		font-weight: bold;
	}

	.card-body {
		flex: 1;
		margin-bottom: 20rpx;
	}

	.recent-item {
		display: flex;
		flex-direction: column;
	}

	.recent-title {
		font-size: 26rpx;
		color: #7f8c8d;
		margin-bottom: 8rpx;
	}

	.recent-content {
		font-size: 30rpx;
		color: #2c3e50;
		font-weight: 500;
		margin-bottom: 8rpx;
		line-height: 1.4;
	}

	.recent-time {
		font-size: 24rpx;
		color: #95a5a6;
	}

	.empty-state {
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.empty-text {
		font-size: 28rpx;
		color: #bdc3c7;
		font-style: italic;
	}

	.card-footer {
		border-top: 2rpx solid #f0f0f0;
		padding-top: 20rpx;
	}

	.action-text {
		font-size: 26rpx;
		color: #3498db;
		font-weight: 500;
	}

	/* 卡片悬停效果 */
	.card-hover {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, rgba(52, 152, 219, 0.1) 0%, rgba(41, 128, 185, 0.05) 100%);
		opacity: 0;
		transition: opacity 0.3s ease;
		z-index: 3;
	}

	.message-card:active .card-hover {
		opacity: 1;
	}

	/* 卡片颜色定制 */
	.workorder-card .card-icon {
		background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
		color: white;
	}

	.alert-card .card-icon {
		background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
		color: white;
	}

	/* 底部操作区域 */
	.actions-section {
		display: flex;
		gap: 20rpx;
		margin-top: 40rpx;
	}

	.action-button {
		flex: 1;
		background: rgba(255, 255, 255, 0.9);
		border-radius: 16rpx;
		padding: 24rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12rpx;
		border: 2rpx solid rgba(255, 255, 255, 0.3);
		backdrop-filter: blur(10rpx);
		transition: all 0.3s ease;
	}

	.action-button:active {
		background: rgba(255, 255, 255, 0.8);
		transform: translateY(2rpx);
	}

	.action-icon {
		font-size: 32rpx;
	}

	.action-label {
		font-size: 28rpx;
		color: #2c3e50;
		font-weight: 500;
	}

	/* 时间戳 */
	.timestamp {
		text-align: center;
		margin-top: 30rpx;
		padding: 20rpx;
	}

	.timestamp-text {
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.7);
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

	.message-card {
		animation: fadeInUp 0.5s ease forwards;
		opacity: 0;
	}

	.workorder-card {
		animation-delay: 0.1s;
	}

	.alert-card {
		animation-delay: 0.3s;
	}

	.actions-section {
		animation: fadeInUp 0.5s ease 0.5s forwards;
		opacity: 0;
	}

	/* 响应式设计 */
	@media (max-width: 750rpx) {
		.message-container {
			padding: 20rpx;
		}

		.message-header {
			padding: 30rpx 20rpx;
		}

		.header-title {
			font-size: 40rpx;
		}

		.header-subtitle {
			font-size: 24rpx;
		}

		.card-content {
			padding: 30rpx;
		}

		.card-title {
			font-size: 32rpx;
		}

		.recent-content {
			font-size: 28rpx;
		}
	}

	/* 加载动画 */
	@keyframes pulse {
		0% {
			opacity: 0.6;
		}

		50% {
			opacity: 1;
		}

		100% {
			opacity: 0.6;
		}
	}

	.loading .card-body {
		animation: pulse 1.5s infinite;
	}
</style>