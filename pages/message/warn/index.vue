<template>
	<view class="alarm-container">
		<!-- 顶部标题和统计 -->
		<view class="alarm-header">
			<view class="header-main">
				<text class="header-title">报警监控</text>
				<text class="header-subtitle">报警总数: {{ stats.total }}</text>
			</view>
			<view class="header-stats">
				<view class="stat-item" v-for="stat in stats.items" :key="stat.label">
					<text class="stat-number">{{ stat.value }}</text>
					<text class="stat-label">{{ stat.label }}</text>
				</view>
			</view>
		</view>

		<!-- 搜索和筛选区域 -->
		<view class="filter-section">
			<view class="search-box">
				<view class="search-icon">
					<text class="icon"></text>
				</view>
				<input class="search-input" placeholder="搜索报警类型或变量" v-model="searchKeyword" @input="onSearch"
					placeholder-class="placeholder" />
				<view class="search-clear" @tap="clearSearch" v-if="searchKeyword">
					<text class="clear-icon">✕</text>
				</view>
			</view>

			<view class="filter-options">
				<view class="filter-tabs">
					<view class="filter-tab" :class="{ active: activeFilter === 'all' }" @tap="changeFilter('all')">
						<text>全部</text>
					</view>
					<view class="filter-tab" :class="{ active: activeFilter === 'high' }" @tap="changeFilter('high')">
						<text>高报</text>
					</view>
					<view class="filter-tab" :class="{ active: activeFilter === 'low' }" @tap="changeFilter('low')">
						<text>低报</text>
					</view>
				</view>

				<view class="filter-button" @tap="showTeamFilter = !showTeamFilter">
					<text class="filter-icon">⏷</text>
					<text class="filter-text">{{ selectedTeam || '选择报警组' }}</text>
				</view>
			</view>

			<!-- 报警组筛选 -->
			<view class="team-filter" v-if="showTeamFilter">
				<view class="filter-row">
					<view class="team-item" 
						v-for="team in uniqueTeams" 
						:key="team"
						:class="{ active: selectedTeam === team }"
						@tap="selectTeam(team)">
						<text>{{ team }}</text>
					</view>
					<view class="team-item" 
						:class="{ active: selectedTeam === '' }"
						@tap="selectTeam('')">
						<text>全部</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 报警列表 -->
		<scroll-view class="alarm-list" scroll-y @scrolltolower="loadMore" refresher-enabled
			@refresherrefresh="onRefresh" :refresher-triggered="refreshing">
			<!-- 空状态 -->
			<view class="empty-state" v-if="!alarms.length && !loading">
				<view class="empty-icon">
					<text></text>
				</view>
				<text class="empty-title">暂无报警信息</text>
				<text class="empty-subtitle">一切正常</text>
			</view>

			<!-- 报警卡片 -->
			<view class="alarm-card" v-for="alarm in filteredAlarms" :key="alarm.id" @tap="viewAlarmDetail(alarm)">
				<view class="card-content">
					<!-- 左侧状态栏 -->
					

					<!-- 主内容区 -->
					<view class="alarm-main">
						<view class="alarm-header-info">
							<view class="alarm-title-section">
								<text class="alarm-title">{{ alarm.alarmtype }}</text>
								<view class="alarm-tags">
									<text class="tag priority-tag" :class="getLevelClass(alarm.alarmlevel)">
										{{ getLevelText(alarm.alarmlevel) }}
									</text>
									<text class="tag status-tag" :class="getStatusTagClass(alarm.alarmstatus)">
										{{ getStatusText(alarm.alarmstatus) }}
									</text>
									<text class="tag team-tag">{{ alarm.alarmteam }}</text>
								</view>
							</view>

							<view class="alarm-time">
								<text>{{ formatTime(alarm.ddate) }}</text>
								<text class="time-ago">{{ getTimeAgo(alarm.ddate) }}</text>
							</view>
						</view>

						<!-- 报警信息 -->
						<view class="alarm-info">
							<view class="info-row">
								<view class="info-item">
									<text class="info-label">报警变量:</text>
									<text class="info-value">{{ alarm.alarmvariable }}</text>
								</view>
							</view>

							<!-- 数值信息 -->
							<view class="alarm-values">
								<view class="value-item">
									<text class="value-label">当前值: </text>
									<text class="value-number">{{ alarm.alarmvalue }}</text>
								</view>
								<view class="value-item" v-if="alarm.alarmrestrictions">
									<text class="value-label">阈值: </text>
									<text class="value-threshold">{{ alarm.alarmrestrictions }}</text>
								</view>
								<view class="value-item" v-if="alarm.restorevalue && alarm.restorevalue !== '0'">
									<text class="value-label">恢复值: </text>
									<text class="value-restore">{{ alarm.restorevalue }}</text>
								</view>
							</view>

							<!-- 事件信息 -->
							<view class="event-info">
								<text class="event-type">{{ alarm.eventtype }}</text>
								<text class="event-time">{{ formatDateTime(alarm.ddate) }}</text>
							</view>
						</view>
					</view>
				</view>
			</view>

			<!-- 加载更多 -->
			<view class="load-more" v-if="hasMore && alarms.length">
				<text class="loading-text">{{ loading ? '加载中...' : '上拉加载更多' }}</text>
				<view class="loading-dots" v-if="loading">
					<text class="dot"></text>
					<text class="dot"></text>
					<text class="dot"></text>
				</view>
			</view>

			<view class="no-more" v-if="!hasMore && alarms.length">
				<text>已显示全部报警</text>
			</view>
		</scroll-view>

		<!-- 报警详情弹窗 -->
		<view class="modal-overlay" v-if="showDetailModal" @tap="closeDetailModal">
			<view class="alarm-detail-modal" @tap.stop>
				<view class="modal-header" :class="getStatusClass(currentAlarm.alarmstatus)">
					<view class="modal-title-section">
						<text class="modal-title">{{ currentAlarm.alarmtype }}</text>
						<view class="modal-subtitle">
							<text>{{ currentAlarm.alarmvariable }}</text>
						</view>
					</view>
					<view class="modal-close" @tap="closeDetailModal">
						<text>✕</text>
					</view>
				</view>

				<view class="modal-content">
					<view class="detail-section">
						<view class="detail-row">
							<text class="detail-label">报警组:</text>
							<text class="detail-value">{{ currentAlarm.alarmteam }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">报警级别:</text>
							<text class="detail-value">{{ getLevelText(currentAlarm.alarmlevel) }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">报警状态:</text>
							<text class="detail-value">{{ getStatusText(currentAlarm.alarmstatus) }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">事件类型:</text>
							<text class="detail-value">{{ currentAlarm.eventtype }}</text>
						</view>
					</view>

					<view class="detail-section">
						<text class="section-title">数值信息</text>
						<view class="alarm-data">
							<view class="data-item">
								<text class="data-label">当前值</text>
								<text class="data-value">{{ currentAlarm.alarmvalue }}</text>
							</view>
							<view class="data-item" v-if="currentAlarm.alarmrestrictions">
								<text class="data-label">阈值</text>
								<text class="data-value">{{ currentAlarm.alarmrestrictions }}</text>
							</view>
							<view class="data-item" v-if="currentAlarm.restorevalue && currentAlarm.restorevalue !== '0'">
								<text class="data-label">恢复值</text>
								<text class="data-value">{{ currentAlarm.restorevalue }}</text>
							</view>
						</view>
					</view>

					<view class="detail-section">
						<text class="section-title">时间信息</text>
						<view class="detail-row">
							<text class="detail-label">事件时间:</text>
							<text class="detail-value">{{ formatDateTime(currentAlarm.ddate) }}</text>
						</view>
						<view class="detail-row" v-if="currentAlarm.sdate">
							<text class="detail-label">报警时间:</text>
							<text class="detail-value">{{ formatDateTime(currentAlarm.sdate) }}</text>
						</view>
					</view>
				</view>

				<view class="modal-actions">
					<button class="modal-close-btn" @tap="closeDetailModal">关闭</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				// API基础URL - 请根据实际情况修改
				apiBaseUrl: 'https://fdjt.qdsteel.com:5018/prod-api/mes/report/',
				
				// 统计信息
				stats: {
					total: 0,
					items: [
						{ label: '高报', value: 0 },
						{ label: '低报', value: 0 },
						{ label: '汽机', value: 0 }
					]
				},

				// 搜索和筛选
				searchKeyword: '',
				activeFilter: 'all',
				selectedTeam: '',
				showTeamFilter: false,

				// 报警数据
				alarms: [],

				// 分页相关
				pageNum: null,
				pageSize: null,
				hasMore: true,
				loading: false,
				refreshing: false,

				// 详情弹窗
				currentAlarm: {},
				showDetailModal: false
			};
		},

		computed: {
			// 获取唯一的报警组
			uniqueTeams() {
				const teams = [...new Set(this.alarms.map(item => item.alarmteam))];
				return teams.filter(team => team && team.trim() !== '');
			},

			// 筛选后的报警列表
			filteredAlarms() {
				let filtered = [...this.alarms];

				// 按状态筛选
				if (this.activeFilter === 'high') {
					filtered = filtered.filter(item => item.alarmstatus === '4');
				} else if (this.activeFilter === 'low') {
					filtered = filtered.filter(item => item.alarmstatus === '5');
				}

				// 按报警组筛选
				if (this.selectedTeam) {
					filtered = filtered.filter(item => item.alarmteam === this.selectedTeam);
				}

				// 按关键词搜索
				if (this.searchKeyword) {
					const keyword = this.searchKeyword.toLowerCase();
					filtered = filtered.filter(item =>
						(item.alarmtype && item.alarmtype.toLowerCase().includes(keyword)) ||
						(item.alarmvariable && item.alarmvariable.toLowerCase().includes(keyword))
					);
				}

				// 按时间排序（最新的在前）
				filtered.sort((a, b) => {
					return new Date(b.ddate) - new Date(a.ddate);
				});

				return filtered;
			}
		},

		onLoad() {
			this.loadAlarmData();
		},

		onPullDownRefresh() {
			this.onRefresh();
		},

		methods: {
			// 获取请求头
			getHeaders() {
				const token = uni.getStorageSync('token');
				return {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				};
			},

			// API请求封装
			async request(url, method = 'GET', data = null) {
				return new Promise((resolve, reject) => {
					uni.request({
						url: `${this.apiBaseUrl}${url}`,
						method: method,
						data: data,
						header: this.getHeaders(),
						success: (res) => {
							if (res.statusCode === 200) {
								resolve(res.data);
							} else {
								reject(res.data || '请求失败');
							}
						},
						fail: (error) => {
							console.error('API请求失败:', error);
							reject(error);
						}
					});
				});
			},

			// 获取报警级别文本
			getLevelText(level) {
				const map = {
					'1': '一级',
					'2': '二级',
					'3': '三级',
					'4': '四级'
				};
				return map[level] || '未知';
			},

			// 获取报警级别类名
			getLevelClass(level) {
				const classes = {
					'1': 'level-1',
					'2': 'level-2',
					'3': 'level-3',
					'4': 'level-4'
				};
				return classes[level] || '';
			},

			// 获取报警状态文本
			getStatusText(status) {
				// 根据数据，4为高报，5为低报
				const map = {
					'4': '高报',
					'5': '低报'
				};
				return map[status] || status;
			},

			// 获取报警状态图标
			getStatusIcon(status) {
				return status === '4' ? '' : '❄️';
			},

			// 获取报警状态类名
			getStatusClass(status) {
				return status === '4' ? 'status-high' : 'status-low';
			},

			// 获取状态标签类名
			getStatusTagClass(status) {
				return status === '4' ? 'status-tag-high' : 'status-tag-low';
			},

			// 格式化时间
			formatTime(dateStr) {
				if (!dateStr) return '';
				try {
					const date = new Date(dateStr);
					return date.getHours().toString().padStart(2, '0') + ':' +
						date.getMinutes().toString().padStart(2, '0');
				} catch (error) {
					return dateStr;
				}
			},

			// 格式化日期时间
			formatDateTime(dateStr) {
				if (!dateStr) return '';
				try {
					const date = new Date(dateStr);
					return date.toLocaleString('zh-CN', {
						year: 'numeric',
						month: '2-digit',
						day: '2-digit',
						hour: '2-digit',
						minute: '2-digit',
						second: '2-digit'
					});
				} catch (error) {
					return dateStr;
				}
			},

			// 获取相对时间
			getTimeAgo(dateStr) {
				if (!dateStr) return '';
				try {
					const date = new Date(dateStr);
					const now = new Date();
					const diffMs = now - date;
					const diffMins = Math.floor(diffMs / 60000);
					const diffHours = Math.floor(diffMs / 3600000);
					const diffDays = Math.floor(diffMs / 86400000);

					if (diffMins < 1) {
						return '刚刚';
					} else if (diffMins < 60) {
						return `${diffMins}分钟前`;
					} else if (diffHours < 24) {
						return `${diffHours}小时前`;
					} else if (diffDays === 1) {
						return '昨天';
					} else if (diffDays < 7) {
						return `${diffDays}天前`;
					} else {
						return `${Math.floor(diffDays / 7)}周前`;
					}
				} catch (error) {
					return '';
				}
			},

			// 搜索功能
			onSearch() {
				clearTimeout(this.searchTimer);
				this.searchTimer = setTimeout(() => {
					this.pageNum = 1;
					this.hasMore = true;
				}, 500);
			},

			clearSearch() {
				this.searchKeyword = '';
				this.pageNum = 1;
				this.hasMore = true;
			},

			// 筛选功能
			changeFilter(filter) {
				this.activeFilter = filter;
			},

			selectTeam(team) {
				this.selectedTeam = team;
				this.showTeamFilter = false;
			},

			// 加载报警数据
			async loadAlarmData() {
				if (this.loading) return;

				this.loading = true;

				try {
					// 构建查询参数
					
const searchParamsObj ='pageNum='+this.pageNum+'&pageSize='+this.pageSize;
					// 调用API
					const response = await this.request(`list?$`+searchParamsObj);
					
					if (response.code === 200) {
						const data = response.rows || {};
						const list = data || [];

						// 更新数据列表
						if (this.pageNum === 1) {
							this.alarms = list;
						} else {
							this.alarms = [...this.alarms, ...list];
						}

						// 更新分页状态
						this.hasMore = this.alarms.length < (data.total || 0);

						// 更新统计数据
						this.updateStats();
					} else {
						uni.showToast({
							title: response.msg || '加载失败',
							icon: 'error'
						});
						// 使用模拟数据
						this.loadMockData();
					}
				} catch (error) {
					console.error('加载报警数据失败:', error);
					// 使用模拟数据
					this.loadMockData();
				} finally {
					this.loading = false;
					this.refreshing = false;
					uni.stopPullDownRefresh();
				}
			},

			// 加载模拟数据（仅用于演示）
			loadMockData() {
				const mockData = [

				];

				if (this.pageNum === 1) {
					this.alarms = mockData;
				} else {
					this.alarms = [...this.alarms, ...mockData];
				}

				this.hasMore = false;
				this.updateStats();
			},

			// 更新统计数据
			updateStats() {
				const total = this.alarms.length;
				const highCount = this.alarms.filter(item => item.alarmstatus === '4').length;
				const lowCount = this.alarms.filter(item => item.alarmstatus === '5').length;
				const qijiCount = this.alarms.filter(item => item.alarmteam === '汽机').length;

				this.stats = {
					total: total,
					items: [
						{ label: '高报', value: highCount },
						{ label: '低报', value: lowCount },
						{ label: '汽机', value: qijiCount }
					]
				};
			},

			onRefresh() {
				this.refreshing = true;
				this.pageNum = 1;
				this.hasMore = true;
				this.loadAlarmData();
			},

			loadMore() {
				if (!this.hasMore || this.loading) return;

				this.pageNum++;
				this.loadAlarmData();
			},

			// 查看报警详情
			viewAlarmDetail(alarm) {
				this.currentAlarm = alarm;
				this.showDetailModal = true;
			},

			closeDetailModal() {
				this.showDetailModal = false;
			}
		}
	};
</script>

<style>
	.alarm-container {
		min-height: 100vh;
		background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
		font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
		color: #f8fafc;
	}

	/* 头部区域 */
	.alarm-header {
		background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
		padding: 40rpx 30rpx 30rpx;
		border-bottom-left-radius: 30rpx;
		border-bottom-right-radius: 30rpx;
		box-shadow: 0 10rpx 30rpx rgba(37, 99, 235, 0.3);
	}

	.header-main {
		margin-bottom: 30rpx;
	}

	.header-title {
		font-size: 48rpx;
		font-weight: bold;
		display: block;
		margin-bottom: 10rpx;
		color: white;
	}

	.header-subtitle {
		font-size: 28rpx;
		opacity: 0.9;
		color: rgba(255, 255, 255, 0.9);
	}

	.header-stats {
		display: flex;
		background: rgba(255, 255, 255, 0.15);
		backdrop-filter: blur(10rpx);
		border-radius: 20rpx;
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
		font-size: 42rpx;
		font-weight: bold;
		margin-bottom: 8rpx;
		color: white;
	}

	.stat-label {
		font-size: 24rpx;
		opacity: 0.9;
		color: rgba(255, 255, 255, 0.9);
	}

	/* 筛选区域 */
	.filter-section {
		padding: 30rpx;
		background: #1e293b;
	}

	.search-box {
		display: flex;
		align-items: center;
		background: #334155;
		border-radius: 16rpx;
		padding: 20rpx 30rpx;
		margin-bottom: 20rpx;
		border: 1rpx solid #475569;
	}

	.search-icon {
		margin-right: 20rpx;
		font-size: 32rpx;
		color: #94a3b8;
	}

	.search-input {
		flex: 1;
		font-size: 28rpx;
		color: #f1f5f9;
		height: 40rpx;
		line-height: 40rpx;
		background: transparent;
	}

	.placeholder {
		color: #64748b;
	}

	.search-clear {
		width: 40rpx;
		height: 40rpx;
		background: #475569;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-left: 20rpx;
		cursor: pointer;
	}

	.clear-icon {
		font-size: 20rpx;
		color: #94a3b8;
	}

	.filter-options {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.filter-tabs {
		display: flex;
		background: #334155;
		border-radius: 12rpx;
		padding: 4rpx;
		border: 1rpx solid #475569;
	}

	.filter-tab {
		padding: 12rpx 24rpx;
		border-radius: 10rpx;
		font-size: 26rpx;
		color: #94a3b8;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.filter-tab.active {
		background: #2563eb;
		color: white;
		font-weight: 500;
	}

	.filter-button {
		display: flex;
		align-items: center;
		background: #334155;
		padding: 12rpx 24rpx;
		border-radius: 12rpx;
		border: 1rpx solid #475569;
		cursor: pointer;
	}

	.filter-icon {
		font-size: 20rpx;
		margin-right: 8rpx;
		color: #2563eb;
	}

	.filter-text {
		font-size: 26rpx;
		color: #2563eb;
		font-weight: 500;
		max-width: 150rpx;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.team-filter {
		background: #334155;
		border-radius: 16rpx;
		padding: 20rpx;
		border: 1rpx solid #475569;
		margin-top: 20rpx;
		animation: slideDown 0.3s ease;
	}

	.filter-row {
		display: flex;
		flex-wrap: wrap;
		gap: 15rpx;
	}

	.team-item {
		padding: 12rpx 24rpx;
		background: #475569;
		border-radius: 8rpx;
		font-size: 26rpx;
		color: #cbd5e1;
		cursor: pointer;
		border: 2rpx solid transparent;
	}

	.team-item.active {
		background: #2563eb;
		color: white;
		border-color: #3b82f6;
	}

	/* 报警列表 */
	.alarm-list {
		flex: 1;
		padding: 0 30rpx 120rpx;
		height: calc(100vh - 500rpx);
		background: #1e293b;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 100rpx 30rpx;
		text-align: center;
	}

	.empty-icon {
		font-size: 120rpx;
		margin-bottom: 30rpx;
		opacity: 0.6;
		color: #475569;
	}

	.empty-title {
		font-size: 32rpx;
		font-weight: 500;
		color: #cbd5e1;
		margin-bottom: 16rpx;
	}

	.empty-subtitle {
		font-size: 26rpx;
		color: #94a3b8;
	}

	/* 报警卡片 */
	.alarm-card {
		background: #334155;
		border-radius: 20rpx;
		margin-bottom: 30rpx;
		overflow: hidden;
		border-left: 6rpx solid transparent;
		transition: all 0.3s ease;
		position: relative;
	}

	.alarm-card:active {
		transform: translateY(4rpx);
		background: #3e4c67;
	}

	.card-content {
		display: flex;
		min-height: 200rpx;
	}

	.alarm-indicator {
		width: 80rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.alarm-indicator.status-high {
		background: linear-gradient(180deg, #dc2626 0%, #991b1b 100%);
	}

	.alarm-indicator.status-low {
		background: linear-gradient(180deg, #059669 0%, #047857 100%);
	}

	.indicator-icon {
		font-size: 40rpx;
		color: white;
	}

	.alarm-main {
		flex: 1;
		padding: 20rpx 30rpx;
	}

	.alarm-header-info {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 20rpx;
	}

	.alarm-title-section {
		flex: 1;
	}

	.alarm-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #f8fafc;
		display: block;
		margin-bottom: 12rpx;
		line-height: 1.4;
	}

	.alarm-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 8rpx;
	}

	.tag {
		display: inline-block;
		padding: 4rpx 12rpx;
		border-radius: 8rpx;
		font-size: 22rpx;
		margin-right: 8rpx;
		margin-bottom: 4rpx;
	}

	.priority-tag {
		background: #475569;
		color: #cbd5e1;
	}

	.priority-tag.level-1 {
		background: #059669;
		color: white;
	}

	.priority-tag.level-2 {
		background: #ca8a04;
		color: white;
	}

	.priority-tag.level-3 {
		background: #ea580c;
		color: white;
	}

	.priority-tag.level-4 {
		background: #dc2626;
		color: white;
	}

	.status-tag-high {
		background: #dc2626;
		color: white;
	}

	.status-tag-low {
		background: #059669;
		color: white;
	}

	.team-tag {
		background: #2563eb;
		color: white;
	}

	.alarm-time {
		text-align: right;
		min-width: 120rpx;
	}

	.alarm-time text {
		display: block;
		font-size: 24rpx;
		color: #94a3b8;
	}

	.time-ago {
		font-size: 22rpx;
		color: #64748b;
	}

	.alarm-info {
		margin-bottom: 10rpx;
	}

	.info-row {
		display: flex;
		margin-bottom: 12rpx;
	}

	.info-item {
		flex: 1;
	}

	.info-label {
		font-size: 24rpx;
		color: #94a3b8;
		margin-right: 8rpx;
	}

	.info-value {
		font-size: 26rpx;
		color: #f1f5f9;
		font-weight: 500;
		word-break: break-all;
	}

	.alarm-values {
		display: flex;
		flex-direction: column;
		gap: 10rpx;
		background: #475569;
		border-radius: 12rpx;
		padding: 15rpx;
		margin: 15rpx 0;
	}

	.value-item {
		display: flex;
		align-items: center;
	}

	.value-label {
		font-size: 24rpx;
		color: #94a3b8;
		margin-right: 8rpx;
		min-width: 120rpx;
	}

	.value-number {
		font-size: 28rpx;
		font-weight: bold;
		color: #f1f5f9;
		margin-right: 8rpx;
	}

	.value-threshold {
		font-size: 26rpx;
		color: #94a3b8;
		margin-right: 8rpx;
	}

	.value-restore {
		font-size: 26rpx;
		color: #34d399;
		margin-right: 8rpx;
	}

	.event-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: #475569;
		border-radius: 12rpx;
		padding: 15rpx;
		margin-top: 15rpx;
	}

	.event-type {
		font-size: 26rpx;
		color: #f1f5f9;
		font-weight: 500;
	}

	.event-time {
		font-size: 24rpx;
		color: #94a3b8;
	}

	/* 加载更多 */
	.load-more,
	.no-more {
		text-align: center;
		padding: 40rpx 30rpx;
		font-size: 26rpx;
		color: #94a3b8;
	}

	.loading-dots {
		display: inline-flex;
		gap: 10rpx;
		margin-top: 20rpx;
	}

	.dot {
		width: 12rpx;
		height: 12rpx;
		background: #2563eb;
		border-radius: 50%;
		animation: bounce 1.4s infinite ease-in-out both;
	}

	.dot:nth-child(1) {
		animation-delay: -0.32s;
	}

	.dot:nth-child(2) {
		animation-delay: -0.16s;
	}

	@keyframes bounce {
		0%, 80%, 100% {
			transform: scale(0);
			opacity: 0.5;
		}
		40% {
			transform: scale(1);
			opacity: 1;
		}
	}

	/* 弹窗样式 */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10000;
		animation: fadeIn 0.3s ease;
	}

	.alarm-detail-modal {
		background: #334155;
		width: 85%;
		max-width: 750rpx;
		max-height: 85vh;
		border-radius: 24rpx;
		overflow: hidden;
		box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.5);
		position: relative;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx;
		color: white;
	}

	.modal-header.status-high {
		background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
	}

	.modal-header.status-low {
		background: linear-gradient(135deg, #059669 0%, #047857 100%);
	}

	.modal-title-section {
		flex: 1;
	}

	.modal-title {
		font-size: 36rpx;
		font-weight: bold;
		display: block;
		margin-bottom: 8rpx;
	}

	.modal-subtitle {
		font-size: 26rpx;
		opacity: 0.9;
	}

	.modal-close {
		width: 50rpx;
		height: 50rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		font-size: 24rpx;
	}

	.modal-content {
		padding: 30rpx;
		max-height: 60vh;
		overflow-y: auto;
	}

	.detail-section {
		margin-bottom: 30rpx;
		padding-bottom: 20rpx;
		border-bottom: 1rpx solid #475569;
	}

	.section-title {
		font-size: 30rpx;
		font-weight: 600;
		color: #f1f5f9;
		display: block;
		margin-bottom: 20rpx;
	}

	.detail-row {
		display: flex;
		margin-bottom: 15rpx;
	}

	.detail-label {
		flex: 0 0 120rpx;
		font-size: 26rpx;
		color: #94a3b8;
	}

	.detail-value {
		flex: 1;
		font-size: 26rpx;
		color: #f1f5f9;
		font-weight: 500;
		word-break: break-all;
	}

	.alarm-data {
		display: flex;
		gap: 30rpx;
		margin-top: 20rpx;
	}

	.data-item {
		flex: 1;
		background: #475569;
		border-radius: 12rpx;
		padding: 20rpx;
	}

	.data-label {
		font-size: 24rpx;
		color: #94a3b8;
		display: block;
		margin-bottom: 8rpx;
	}

	.data-value {
		font-size: 32rpx;
		font-weight: bold;
		color: #f1f5f9;
		margin-right: 8rpx;
	}

	.modal-actions {
		display: flex;
		padding: 20rpx 30rpx 30rpx;
	}

	.modal-close-btn {
		flex: 1;
		padding: 24rpx;
		border-radius: 12rpx;
		font-size: 28rpx;
		font-weight: 500;
		border: none;
		cursor: pointer;
		background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
		color: white;
		box-shadow: 0 4rpx 15rpx rgba(37, 99, 235, 0.3);
	}

	/* 动画 */
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slideDown {
		from {
			transform: translateY(-20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	/* 响应式设计 */
	@media (max-width: 750rpx) {
		.alarm-header {
			padding: 30rpx 20rpx;
		}

		.header-title {
			font-size: 40rpx;
		}

		.header-subtitle {
			font-size: 24rpx;
		}

		.filter-section {
			padding: 20rpx;
		}

		.alarm-list {
			padding: 0 20rpx 120rpx;
		}

		.alarm-card {
			margin-bottom: 20rpx;
		}

		.card-content {
			min-height: auto;
		}

		.alarm-main {
			padding: 15rpx 20rpx;
		}

		.alarm-header-info {
			flex-direction: column;
		}

		.alarm-time {
			text-align: left;
			margin-top: 10rpx;
		}

		.alarm-data {
			flex-direction: column;
			gap: 15rpx;
		}

		.modal-actions {
			flex-direction: column;
		}
	}
</style>