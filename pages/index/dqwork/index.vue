<template>
	<view class="ledger-container">
		<!-- 顶部标题和统计 -->
		<view class="ledger-header">
			<view class="header-main">
				<text class="header-title">任务跟踪</text>
				<text class="header-subtitle">总任务数: {{ totalCount }}</text>
			</view>
			<view class="header-stats">
				<view class="stat-item" v-for="stat in stats" :key="stat.label">
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
				<input class="search-input" placeholder="搜索任务信息" v-model="searchKeyword" @input="onSearch"
					placeholder-class="placeholder" />
				<view class="search-clear" @tap="clearSearch" v-if="searchKeyword">
					<text class="clear-icon">✕</text>
				</view>
			</view>
			<!-- 添加搜索结果显示 -->
			<view class="search-result" v-if="showSearchResult">
				<text class="result-text">找到 {{ searchResultCount }} 条相关记录</text>
				<view class="clear-search-btn" @tap="clearAllFilters" v-if="hasActiveFilters">
					<text>清除所有筛选</text>
				</view>
			</view>


			<view class="filter-options">
				<view class="filter-tabs">
					<view class="filter-tab" :class="{ active: activeFilter === 'all' }" @tap="changeFilter('all')">
						<text>全部</text>
					</view>
					<view class="filter-tab" :class="{ active: activeFilter === 'in-progress' }"
						@tap="changeFilter('in-progress')">
						<text>进行中</text>
					</view>
					<view class="filter-tab" :class="{ active: activeFilter === 'completed' }"
						@tap="changeFilter('completed')">
						<text>已完成</text>
					</view>

				</view>

				<view class="filter-button" @tap="showAdvancedFilter = !showAdvancedFilter">
					<text class="filter-icon">⏷</text>
					<text class="filter-text">筛选</text>
				</view>
			</view>

			<!-- 高级筛选 -->
			<view class="advanced-filter" v-if="showAdvancedFilter">
				<view class="filter-row">
					<view class="filter-item">
						<text class="filter-label">科室</text>
						<picker class="filter-select" :value="filterKs" :range="ksOptions" range-key="label"
							@change="onKsChange">
							<view class="filter-select-text">
								{{ filterKs ? getKsLabel(filterKs) : '选择科室' }}
							</view>
						</picker>
					</view>

					<view class="filter-item">
						<text class="filter-label">执行人</text>
						<input class="filter-select" placeholder="执行人" v-model="filterZxr" @input="onZxrChange"
							placeholder-class="placeholder" />
					</view>
				</view>
				<view class="filter-row">
					<view class="filter-item">
						<text class="filter-label">开始时间</text>
						<picker mode="date" class="filter-select" :value="filterStartDate" @change="onStartDateChange">
							<view class="filter-select-text">{{ filterStartDate || '选择日期' }}</view>
						</picker>
					</view>
					<view class="filter-item">
						<text class="filter-label">结束时间</text>
						<picker mode="date" class="filter-select" :value="filterEndDate" @change="onEndDateChange">
							<view class="filter-select-text">{{ filterEndDate || '选择日期' }}</view>
						</picker>
					</view>
				</view>
				<view class="filter-row">
					<view class="filter-item">
						<text class="filter-label">是否延期</text>
						<picker class="filter-select" :value="filterIsDelay" :range="isDelayOptions" range-key="label"
							@change="onIsDelayChange">
							<view class="filter-select-text">
								{{ filterIsDelay !== null ? getIsDelayLabel(filterIsDelay) : '选择状态' }}
							</view>
						</picker>
					</view>
				</view>
				<view class="filter-actions">
					<button class="filter-reset" @tap="resetFilters">重置</button>
					<button class="filter-apply" @tap="applyFilters">应用筛选</button>
				</view>
			</view>
		</view>

		<!-- 台账列表 -->
		<scroll-view class="ledger-list" scroll-y @scrolltolower="loadMore" refresher-enabled
			@refresherrefresh="onRefresh" :refresher-triggered="refreshing">
			<!-- 空状态 -->
			<view class="empty-state" v-if="!ledgers.length && !loading">
				<view class="empty-icon">
					<text></text>
				</view>
				<text class="empty-title">暂无台账记录</text>
				<text class="empty-subtitle">点击下方按钮添加新台账</text>
			</view>

			<!-- 台账卡片 -->
			<view class="ledger-card" v-for="ledger in filteredLedgers" :key="ledger.id"
				@tap="viewLedgerDetail(ledger)">
				<view class="card-header">
					<view class="card-title-section">

						<view class="ledger-tags">
							<text class="tag ks-tag">{{ ledger.ks || '未分配科室' }}</text>
							<text class="tag status-tag" :class="getStatusClass(ledger.status)">
								{{ ledger.statusText }}
							</text>
							<text class="tag delay-tag" v-if="ledger.isDelay === '是'">
								已延期
							</text>
						</view>
					</view>
				</view>

				<view class="card-content">
					<!-- 工作安排 -->
					<view class="info-section">
						<text class="section-label">工作安排</text>
						<text class="section-content">{{ ledger.detail || '暂无工作安排' }}</text>
					</view>

					<!-- 人员信息 -->
					<view class="info-row">
						<view class="info-item">
							<text class="info-label">工作委托人:</text>
							<text class="info-value">{{ ledger.name || '未指定' }}</text>
						</view>
						<view class="info-item">
							<text class="info-label">执行人:</text>
							<text class="info-value">{{ ledger.zxr || '未指定' }}</text>
						</view>
					</view>

					<!-- 时间信息 -->
					<view class="info-row">
						<view class="info-item">
							<text class="info-label">开始时间:</text>
							<text class="info-value">{{ formatDate(ledger.starttime) }}</text>
						</view>
						<view class="info-item">
							<text class="info-label">预计完成:</text>
							<text class="info-value">{{ formatDate(ledger.yjtime) }}</text>
						</view>
					</view>

					<!-- 完成信息 -->
					<view class="info-row" v-if="ledger.sjtime">
						<view class="info-item">
							<text class="info-label">实际完成:</text>
							<text class="info-value success-text">{{ formatDate(ledger.sjtime) }}</text>
						</view>
					</view>

					<!-- 进展信息 -->
					<view class="progress-section" v-if="ledger.jinzhan">
						<view class="progress-info">
							<text class="progress-label">进展：</text>
							<text class="progress-value">{{ ledger.jinzhan }}</text>
						</view>
					</view>

					<!-- 最新进展 -->
					<view class="info-section" v-if="ledger.newjz">
						<text class="section-label">最新进展</text>
						<text class="section-content">{{ ledger.newjz }}</text>
					</view>

					<!-- 备注 -->
					<view class="info-section" v-if="ledger.desb">
						<text class="section-label">备注</text>
						<text class="section-content">{{ ledger.desb }}</text>
					</view>
				</view>

				<view class="card-footer">
					<view class="footer-actions">
						<!-- 						<view class="action-button" @tap.stop="editLedger(ledger)">
							<text class="action-icon">✎</text>
							<text class="action-text">编辑</text>
						</view>
						<view class="action-button" @tap.stop="updateProgress(ledger)">
							<text class="action-icon"></text>
							<text class="action-text">更新进展</text>
						</view> -->
						<view class="action-button" @tap.stop="completeLedger(ledger)" v-if="!ledger.sjtime">
							<text class="action-icon">✓</text>
							<text class="action-text">标记完成</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 加载更多 -->
			<view class="load-more" v-if="hasMore && ledgers.length">
				<text class="loading-text">{{ loading ? '加载中...' : '上拉加载更多' }}</text>
				<view class="loading-dots" v-if="loading">
					<text class="dot"></text>
					<text class="dot"></text>
					<text class="dot"></text>
				</view>
			</view>

			<view class="no-more" v-if="!hasMore && ledgers.length">
				<text>已显示全部台账</text>
			</view>
		</scroll-view>

		<!-- 底部操作栏 -->
		

		<!-- 添加台账弹窗 -->
		<view class="modal-overlay" v-if="showAddModal" @tap="showAddModal = false">
			<view class="add-ledger-modal" @tap.stop>
				<view class="modal-header">
					<text class="modal-title">新建台账</text>
					<view class="modal-close" @tap="showAddModal = false">
						<text>✕</text>
					</view>
				</view>
				<view class="modal-content">
					<input class="modal-input" placeholder="工作委托人" v-model="newLedger.name" />

					<view class="filter-item">
						<text class="filter-label">科室</text>
						<picker class="filter-select" :value="newLedger.ks" :range="ksOptions.slice(1)"
							range-key="label" @change="onNewLedgerKsChange">
							<view class="filter-select-text">
								{{ newLedger.ks ? getKsLabel(newLedger.ks) : '选择科室' }}
							</view>
						</picker>
					</view>

					<textarea class="modal-textarea" placeholder="工作安排" v-model="newLedger.detail" />

					<view class="filter-item">
						<text class="filter-label">执行人</text>
						<picker class="filter-select" :value="newLedger.zxr" :range="zxrOptions.slice(1)"
							range-key="label" @change="onNewLedgerZxrChange">
							<view class="filter-select-text">
								{{ newLedger.zxr ? getZxrLabel(newLedger.zxr) : '选择执行人' }}
							</view>
						</picker>
					</view>

					<view class="date-row">
						<view class="date-item">
							<text class="date-label">开始时间</text>
							<picker mode="date" class="date-select" :value="newLedger.starttime"
								@change="onNewLedgerStartTimeChange">
								<view class="date-select-text">{{ newLedger.starttime || '选择开始时间' }}</view>
							</picker>
						</view>
						<view class="date-item">
							<text class="date-label">预计完成</text>
							<picker mode="date" class="date-select" :value="newLedger.yjtime"
								@change="onNewLedgerYjTimeChange">
								<view class="date-select-text">{{ newLedger.yjtime || '选择预计完成时间' }}</view>
							</picker>
						</view>
					</view>

					<textarea class="modal-textarea" placeholder="备注" v-model="newLedger.desb" />
				</view>
				<view class="modal-actions">
					<button class="modal-cancel" @tap="showAddModal = false">取消</button>
					<button class="modal-confirm" @tap="createLedger">确认创建</button>
				</view>
			</view>
		</view>

		<!-- 更新进展弹窗 -->
		<view class="modal-overlay" v-if="showProgressModal" @tap="showProgressModal = false">
			<view class="add-ledger-modal" @tap.stop>
				<view class="modal-header">
					<text class="modal-title">更新进展</text>
					<view class="modal-close" @tap="showProgressModal = false">
						<text>✕</text>
					</view>
				</view>
				<view class="modal-content">
					<text class="modal-label">当前台账：{{ currentLedger.name }}</text>
					<textarea class="modal-textarea" placeholder="请输入进展描述" v-model="progressData.jinzhan" />
					<textarea class="modal-textarea" placeholder="请输入最新进展" v-model="progressData.newjz" />
					<view class="checkbox-row">
						<checkbox-group @change="onIsDelayChange">
							<label class="checkbox-label">
								<checkbox :value="progressData.isDelay === '是'" />是否延期
							</label>
						</checkbox-group>
					</view>
				</view>
				<view class="modal-actions">
					<button class="modal-cancel" @tap="showProgressModal = false">取消</button>
					<button class="modal-confirm" @tap="submitProgress">确认更新</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				// API基础URL
				apiBaseUrl: 'https://fdjt.qdsteel.com:5018/prod-api/', // 请替换为实际API地址
				// 统计信息
				totalCount: 0,
				stats: [{
						label: '进行中',
						value: 0
					},
					{
						label: '已完成',
						value: 0
					}
				],

				// 科室选项
				ksOptions: [{
						value: '',
						label: '全部'
					},
					{
						value: '设备科',
						label: '设备科'
					},
					{
						value: '综合科',
						label: '综合科'
					},
					{
						value: '技术科',
						label: '技术科'
					},
					{
						value: '运行科',
						label: '运行科'
					},
					{
						value: '安全科',
						label: '安全科'
					},
					{
						value: '厂部领导',
						label: '厂部领导'
					},
					{
						value: '供热',
						label: '供热'
					},
					{
						value: '各科室',
						label: '各科室'
					},
					{
						value: '检修作业区',
						label: '检修作业区'
					}
				],

				// 执行人选项
				zxrOptions: [{
						value: '',
						label: '全部执行人'
					}
				],

				// 是否延期选项
				isDelayOptions: [{
						value: null,
						label: '全部状态'
					},
					{
						value: '是',
						label: '已延期'
					},
					{
						value: '否',
						label: '未延期'
					}
				],

				// 搜索和筛选
				searchKeyword: '',
				activeFilter: 'all',
				showAdvancedFilter: false,
				filterKs: '',
				filterZxr: '',
				filterIsDelay: null,
				filterStartDate: '',
				filterEndDate: '',

				// 台账数据
				ledgers: [],

				// 分页相关
				page: 1,
				pageSize: 10,
				totalPages: 0,
				hasMore: true,
				loading: false,
				refreshing: false,

				// 添加台账
				showAddModal: false,
				newLedger: {
					name: '',
					ks: '',
					detail: '',
					zxr: '',
					starttime: '',
					yjtime: '',
					desb: ''
				},

				// 更新进展
				showProgressModal: false,
				currentLedger: {},
				progressData: {
					id: null,
					jinzhan: '',
					newjz: '',
					isDelay: '否'
				}
			};
		},

		computed: {
			// 搜索结果显示数量
						searchResultCount() {
							return this.filteredLedgers.length;
						},
						
						// 是否显示搜索结果
						showSearchResult() {
							return this.hasActiveFilters || this.searchKeyword;
						},
			// 筛选后的台账列表
			filteredLedgers() {
				let filtered = [...this.ledgers];

				// 按状态筛选
				if (this.activeFilter !== 'all') {
					filtered = filtered.filter(item => {
						// 计算当前状态
						const status = this.calculateStatus(item);
						return status === this.activeFilter;
					});
				}

				// 按科室筛选
				if (this.filterKs) {
					filtered = filtered.filter(item => item.ks === this.filterKs);
				}

				// 按执行人筛选
				if (this.filterZxr) {
					filtered = filtered.filter(item => item.zxr === this.filterZxr);
				}

				// 按是否延期筛选
				if (this.filterIsDelay !== null) {
					filtered = filtered.filter(item => item.isDelay === this.filterIsDelay);
				}
				

				// 按关键词搜索
				if (this.searchKeyword) {
					const keyword = this.searchKeyword.toLowerCase();
					filtered = filtered.filter(item =>
						(item.name && item.name.toLowerCase().includes(keyword)) ||
						(item.detail && item.detail.toLowerCase().includes(keyword)) ||
						(item.zxr && item.zxr.toLowerCase().includes(keyword)) ||
						(item.jinzhan && item.jinzhan.toLowerCase().includes(keyword)) ||
						(item.newjz && item.newjz.toLowerCase().includes(keyword)) ||
						(item.desb && item.desb.toLowerCase().includes(keyword))
					);
				}

				// 按时间范围筛选
				if (this.filterStartDate || this.filterEndDate) {
					filtered = filtered.filter(item => {
						if (!item.starttime) return false;

						const startTime = new Date(item.starttime);
						let valid = true;

						if (this.filterStartDate) {
							const startDate = new Date(this.filterStartDate);
							if (startTime < startDate) valid = false;
						}

						if (this.filterEndDate) {
							const endDate = new Date(this.filterEndDate);
							if (startTime > endDate) valid = false;
						}

						return valid;
					});
				}

				return filtered;
			}
		},

		onLoad() {
			// 检查token
			this.checkToken();
			// 加载台账数据
			this.loadLedgerData();
			// 加载统计数据
			this.loadStats();
		},

		onPullDownRefresh() {
			this.onRefresh();
		},

		methods: {
			// 检查token
			checkToken() {
				const token = uni.getStorageSync('token');
				if (!token) {
					uni.showToast({
						title: '请先登录',
						icon: 'error',
						duration: 2000
					});
					setTimeout(() => {
						uni.navigateTo({
							url: '/pages/login/index'
						});
					}, 1500);
					return false;
				}
				return true;
			},

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
				if (!this.checkToken()) {
					return Promise.reject('未登录');
				}

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

			// 获取科室标签
			getKsLabel(value) {
				const ks = this.ksOptions.find(item => item.value === value);
				return ks ? ks.label : value;
			},

			// 获取执行人标签
			getZxrLabel(value) {
				const zxr = this.zxrOptions.find(item => item.value === value);
				return zxr ? zxr.label : value;
			},

			// 获取延期状态标签
			getIsDelayLabel(value) {
				const option = this.isDelayOptions.find(item => item.value === value);
				return option ? option.label : value;
			},

			// 计算状态
			calculateStatus(ledger) {
				if (ledger.sjtime) {
					return 'completed'; // 已完成
				}
				return 'in-progress'; // 进行中
			},

			// 获取状态类名
			getStatusClass(ledger) {
				const status = this.calculateStatus(ledger);
				const classes = {
					'in-progress': 'status-in-progress',
					'completed': 'status-completed',
					'overdue': 'status-overdue'
				};
				return classes[status] || '';
			},

			// 格式化日期
			formatDate(dateStr) {
				if (!dateStr) return '未设置';
				try {
					const date = new Date(dateStr);
					return date.toLocaleDateString('zh-CN');
				} catch (error) {
					return dateStr;
				}
			},

			// 搜索功能
			onSearch() {
				// 防抖处理
				clearTimeout(this.searchTimer);
				this.searchTimer = setTimeout(() => {
					this.page = 1;
					this.hasMore = true;
				}, 500);
			},

			clearSearch() {
				this.searchKeyword = '';
				this.page = 1;
				this.hasMore = true;
			},

			// 筛选功能
			changeFilter(filter) {
				this.activeFilter = filter;
			},

			onKsChange(e) {
				const index = e.detail.value;
				this.filterKs = this.ksOptions[index].value;
			},

			onZxrChange(e) {
				const index = e.detail.value;
				this.filterZxr = this.zxrOptions[index].value;
			},

			onIsDelayChange(e) {
				const index = e.detail.value;
				this.filterIsDelay = this.isDelayOptions[index].value;
			},

			onStartDateChange(e) {
				this.filterStartDate = e.detail.value;
			},

			onEndDateChange(e) {
				this.filterEndDate = e.detail.value;
			},

			resetFilters() {
				this.filterKs = '';
				this.filterZxr = '';
				this.filterIsDelay = null;
				this.filterStartDate = '';
				this.filterEndDate = '';
				this.searchKeyword = '';
				this.activeFilter = 'all';
				this.showAdvancedFilter = false;
				this.page = 1;
				this.hasMore = true;
			},

			applyFilters() {
				this.page = 1;
				this.hasMore = true;
				this.showAdvancedFilter = false;

				if (this.filterKs || this.filterZxr || this.filterIsDelay !== null ||
					this.filterStartDate || this.filterEndDate) {
					uni.showToast({
						title: '筛选已应用',
						icon: 'success',
						duration: 1500
					});
				}
			},

			// 加载台账数据
			async loadLedgerData() {
				if (this.loading) return;

				this.loading = true;

				try {
					// 构建查询参数
					const params = {
						pageNum: this.pageNum,
						pageSize: this.pageSize
					};

					// 添加筛选条件
					if (this.filterKs) params.ks = this.filterKs;
					if (this.filterZxr) params.zxr = this.filterZxr;
					if (this.filterIsDelay !== null) params.isDelay = this.filterIsDelay;
					if (this.filterStartDate) params.starttimeBegin = this.filterStartDate;
					if (this.filterEndDate) params.starttimeEnd = this.filterEndDate;
					if (this.searchKeyword) params.search = this.searchKeyword;

					// 调用API
					const response = await this.request(`mes/important/list`);

					if (response.code === 200) {
						const data = response.rows || {};
						const list = response.rows || [];
						

						// 计算状态并添加statusText
						const processedList = list.map(item => {
							const status = this.calculateStatus(item);
							const statusTextMap = {
								'in-progress': '进行中',
								'completed': '已完成'
							};

							return {
								...item,
								status: status,
								statusText: statusTextMap[status] || '未知'
							};
						});

						// 更新数据列表
						if (this.pageNum === 1) {
							this.ledgers = processedList;
						} else {
							this.ledgers = [...this.ledgers, ...processedList];
						}

						// 更新分页状态
						this.totalCount = response.rows.length || 0;
						this.hasMore = this.pageNum < (data.pages || 1);
					} else {
						uni.showToast({
							title: response.msg || '加载失败',
							icon: 'error'
						});
					}
				} catch (error) {
					console.error('加载台账数据失败:', error);
					uni.showToast({
						title: '网络错误，请重试',
						icon: 'error'
					});
				} finally {
					this.loading = false;
					this.refreshing = false;
					uni.stopPullDownRefresh();
				}
			},

			// 加载统计数据
			async loadStats() {
				try {
					const response = await this.request('mes/important/list');
					if (response.code === 200) {
						const stats = response.rows || {};

						this.stats = [{
								label: '进行中',
								value: stats.filter(item => this.calculateStatus(item) === 'in-progress').length ||
									0
							},
							{
								label: '已完成',
								value: stats.filter(item => this.calculateStatus(item) === 'completed').length || 0
							}
						];
						this.totalCount = stats.total || 0;
					}
				} catch (error) {
					console.error('加载统计数据失败:', error);
					// 使用本地计算作为备选
					this.calculateLocalStats();
				}
			},

			// 本地计算统计数据
			calculateLocalStats() {
				
				const inProgress = this.ledgers.filter(item => this.calculateStatus(item) === 'in-progress').length;
				const completed = this.ledgers.filter(item => this.calculateStatus(item) === 'completed').length;
				const overdue = this.ledgers.filter(item => this.calculateStatus(item) === 'overdue').length;

				this.stats = [{
						label: '进行中',
						value: inProgress
					},
					{
						label: '已完成',
						value: completed
					},
					{
						label: '已逾期',
						value: overdue
					}
				];
			},

			onRefresh() {
				this.refreshing = true;
				this.page = 1;
				this.hasMore = true;
				this.loadLedgerData();
				this.loadStats();
			},

			loadMore() {
				if (!this.hasMore || this.loading) return;

				this.page++;
				this.loadLedgerData();
			},

			// 台账详情
			viewLedgerDetail(ledger) {
				uni.navigateTo({
					url: `mes/important/getInfo?id=${ledger.id}`,
					animationType: 'slide-in-right'
				});
			},

			// 编辑台账
			editLedger(ledger) {
				uni.showModal({
					title: '编辑台账',
					content: '确定要编辑此台账吗？',
					success: (res) => {
						if (res.confirm) {
							uni.navigateTo({
								url: `mes/important/edit?id=${ledger.id}`,
								animationType: 'slide-in-right'
							});
						}
					}
				});
			},

			// 更新进展
			updateProgress(ledger) {
				this.currentLedger = ledger;
				this.progressData = {
					id: ledger.id,
					jinzhan: ledger.jinzhan || '',
					newjz: ledger.newjz || '',
					isDelay: ledger.isDelay || '否'
				};
				this.showProgressModal = true;
			},

			// 提交进展更新
			async submitProgress() {
				if (!this.progressData.jinzhan && !this.progressData.newjz) {
					uni.showToast({
						title: '请填写至少一项进展信息',
						icon: 'none'
					});
					return;
				}

				try {
					const response = await this.request('mes/important/edit', 'PUT', this.progressData);

					if (response.code === 200) {
						uni.showToast({
							title: '进展更新成功',
							icon: 'success'
						});

						// 更新本地数据
						const index = this.ledgers.findIndex(item => item.id === this.progressData.id);
						if (index !== -1) {
							this.ledgers[index].jinzhan = this.progressData.jinzhan;
							this.ledgers[index].newjz = this.progressData.newjz;
							this.ledgers[index].isDelay = this.progressData.isDelay;
							this.$set(this.ledgers, index, this.ledgers[index]);
						}

						this.showProgressModal = false;
						this.progressData = {
							id: null,
							jinzhan: '',
							newjz: '',
							isDelay: '否'
						};
					} else {
						uni.showToast({
							title: response.msg || '更新失败',
							icon: 'error'
						});
					}
				} catch (error) {
					console.error('更新进展失败:', error);
					uni.showToast({
						title: '网络错误，请重试',
						icon: 'error'
					});
				}
			},

			// 标记完成
			async completeLedger(ledger) {
				uni.showModal({
					title: '标记完成',
					content: '确定要将此台账标记为完成吗？',
					success: async (res) => {
						if (res.confirm) {
							try {
								const response = await this.request(`mes/important/pass/${ledger.id}`,
									'GET');

								if (response.code === 200) {
									uni.showToast({
										title: '标记完成成功',
										icon: 'success'
									});

									// 更新本地数据
									const index = this.ledgers.findIndex(item => item.id === ledger.id);
									if (index !== -1) {
										this.ledgers[index].sjtime = new Date().toISOString().split('T')[
											0];
										this.ledgers[index].jinzhan = '已完成'
										this.ledgers[index].statusText = '已完成'
										this.$set(this.ledgers, index, this.ledgers[index]);
									}

									// 重新加载统计数据
									this.loadStats();
								} else {
									uni.showToast({
										title: response.msg || '操作失败',
										icon: 'error'
									});
								}
							} catch (error) {
								console.error('标记完成失败:', error);
								uni.showToast({
									title: '网络错误，请重试',
									icon: 'error'
								});
							}
						}
					}
				});
			},

			// 新建台账相关
			addNewLedger() {
				this.showAddModal = true;
			},

			onNewLedgerKsChange(e) {
				const index = e.detail.value;
				this.newLedger.ks = this.ksOptions[index + 1].value; // +1跳过"全部科室"
			},

			onNewLedgerZxrChange(e) {
				const index = e.detail.value;
				this.newLedger.zxr = this.zxrOptions[index + 1].value; // +1跳过"全部执行人"
			},

			onNewLedgerStartTimeChange(e) {
				this.newLedger.starttime = e.detail.value;
			},

			onNewLedgerYjTimeChange(e) {
				this.newLedger.yjtime = e.detail.value;
			},

			// 创建台账
			async createLedger() {
				// 验证必填字段
				if (!this.newLedger.name) {
					uni.showToast({
						title: '请输入工作委托人',
						icon: 'none'
					});
					return;
				}

				if (!this.newLedger.detail) {
					uni.showToast({
						title: '请输入工作安排',
						icon: 'none'
					});
					return;
				}

				if (!this.newLedger.starttime) {
					uni.showToast({
						title: '请选择开始时间',
						icon: 'none'
					});
					return;
				}

				try {
					const response = await this.request('mes/important/add', 'POST', this.newLedger);

					if (response.code === 200) {
						uni.showToast({
							title: '台账创建成功',
							icon: 'success'
						});

						// 添加到列表顶部
						const newLedger = {
							id: response.data.id,
							...this.newLedger,
							status: 'in-progress',
							statusText: '进行中',
							isDelay: '否'
						};

						this.ledgers.unshift(newLedger);
						this.totalCount++;

						// 重置表单
						this.newLedger = {
							name: '',
							ks: '',
							detail: '',
							zxr: '',
							starttime: '',
							yjtime: '',
							desb: ''
						};
						this.showAddModal = false;

						// 重新加载统计数据
						this.loadStats();
					} else {
						uni.showToast({
							title: response.msg || '创建失败',
							icon: 'error'
						});
					}
				} catch (error) {
					console.error('创建台账失败:', error);
					uni.showToast({
						title: '网络错误，请重试',
						icon: 'error'
					});
				}
			},

			// 显示统计分析
			showStatistics() {
				// 这里可以跳转到统计页面或者显示统计弹窗
				const statsText = `台账统计：
总计：${this.totalCount}个
进行中：${this.stats[0].value}个
已完成：${this.stats[1].value}个;`

				uni.showModal({
					title: '统计分析',
					content: statsText,
					showCancel: false
				});
			}
		}
	};
</script>

<style>
	.ledger-container {
		min-height: 100vh;
		background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
		font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
	}

	/* 头部区域 */
	.ledger-header {
		background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
		padding: 40rpx 30rpx 30rpx;
		color: white;
		border-bottom-left-radius: 30rpx;
		border-bottom-right-radius: 30rpx;
		box-shadow: 0 10rpx 30rpx rgba(52, 152, 219, 0.3);
		position: relative;
		overflow: hidden;
	}

	.ledger-header::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="white" stroke-width="1" opacity="0.1"/></svg>');
		background-size: 200rpx 200rpx;
		opacity: 0.3;
	}

	.header-main {
		margin-bottom: 30rpx;
	}

	.header-title {
		font-size: 48rpx;
		font-weight: bold;
		display: block;
		margin-bottom: 10rpx;
	}

	.header-subtitle {
		font-size: 28rpx;
		opacity: 0.9;
	}

	.header-stats {
		display: flex;
		background: rgba(255, 255, 255, 0.2);
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
	}

	.stat-label {
		font-size: 24rpx;
		opacity: 0.9;
	}

	/* 筛选区域 */
	.filter-section {
		padding: 30rpx;
	}

	.search-box {
		display: flex;
		align-items: center;
		background: white;
		border-radius: 16rpx;
		padding: 20rpx 30rpx;
		box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.1);
		margin-bottom: 30rpx;
		position: relative;
	}

	.search-icon {
		margin-right: 20rpx;
		font-size: 32rpx;
		color: #7f8c8d;
	}

	.search-input {
		flex: 1;
		font-size: 28rpx;
		color: #2c3e50;
		height: 40rpx;
		line-height: 40rpx;
	}

	.placeholder {
		color: #bdc3c7;
	}

	.search-clear {
		width: 40rpx;
		height: 40rpx;
		background: #f0f0f0;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-left: 20rpx;
		cursor: pointer;
	}

	.clear-icon {
		font-size: 20rpx;
		color: #7f8c8d;
	}

	.filter-options {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
	}

	.filter-tabs {
		display: flex;
		background: #f0f4f8;
		border-radius: 12rpx;
		padding: 4rpx;
	}

	.filter-tab {
		padding: 12rpx 24rpx;
		border-radius: 10rpx;
		font-size: 26rpx;
		color: #7f8c8d;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.filter-tab.active {
		background: white;
		color: #3498db;
		font-weight: 500;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
	}

	.filter-button {
		display: flex;
		align-items: center;
		background: white;
		padding: 12rpx 24rpx;
		border-radius: 12rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
		cursor: pointer;
	}

	.filter-icon {
		font-size: 20rpx;
		margin-right: 8rpx;
		color: #3498db;
	}

	.filter-text {
		font-size: 26rpx;
		color: #3498db;
		font-weight: 500;
	}

	/* 高级筛选 */
	.advanced-filter {
		background: white;
		border-radius: 16rpx;
		padding: 30rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
		margin-top: 20rpx;
		animation: slideDown 0.3s ease;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-20rpx);
		}

		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.filter-row {
		display: flex;
		gap: 20rpx;
		margin-bottom: 30rpx;
	}

	.filter-item {
		flex: 1;
	}

	.filter-label {
		font-size: 26rpx;
		color: #2c3e50;
		margin-bottom: 12rpx;
		display: block;
		font-weight: 500;
	}

	.filter-select {
		background: #f8fafc;
		border: 2rpx solid #e2e8f0;
		border-radius: 12rpx;
		padding: 20rpx;
		font-size: 26rpx;
		color: #2c3e50;
		cursor: pointer;
	}

	.filter-select-text {
		color: #4a5568;
	}

	.filter-actions {
		display: flex;
		gap: 20rpx;
		margin-top: 30rpx;
	}

	.filter-reset,
	.filter-apply {
		flex: 1;
		padding: 24rpx;
		border-radius: 12rpx;
		font-size: 28rpx;
		font-weight: 500;
		border: none;
		cursor: pointer;
	}

	.filter-reset {
		background: #f8fafc;
		color: #4a5568;
		border: 2rpx solid #e2e8f0;
	}

	.filter-apply {
		background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
		color: white;
		box-shadow: 0 4rpx 15rpx rgba(52, 152, 219, 0.3);
	}

	/* 台账列表 */
	.ledger-list {
		flex: 1;
		padding: 0 30rpx 120rpx;
		height: calc(100vh - 500rpx);
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
	}

	.empty-title {
		font-size: 32rpx;
		font-weight: 500;
		color: #4a5568;
		margin-bottom: 16rpx;
	}

	.empty-subtitle {
		font-size: 26rpx;
		color: #a0aec0;
	}

	/* 台账卡片 */
	.ledger-card {
		background: white;
		border-radius: 20rpx;
		margin-bottom: 30rpx;
		box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.08);
		overflow: hidden;
		transition: all 0.3s ease;
		position: relative;
	}

	.ledger-card:active {
		transform: translateY(4rpx);
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
	}

	.card-header {
		padding: 30rpx 30rpx 20rpx;
		border-bottom: 2rpx solid #f0f4f8;
	}

	.card-title-section {
		flex: 1;
	}

	.ledger-name {
		font-size: 32rpx;
		font-weight: bold;
		color: #2c3e50;
		display: block;
		margin-bottom: 12rpx;
		line-height: 1.4;
	}

	.ledger-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 8rpx;
		margin-bottom: 8rpx;
	}

	.tag {
		display: inline-block;
		padding: 4rpx 12rpx;
		border-radius: 8rpx;
		font-size: 22rpx;
		margin-right: 8rpx;
		margin-bottom: 4rpx;
	}

	.ks-tag {
		background: #e8f4fd;
		color: #3498db;
	}

	.status-tag {
		background: #e8f5e9;
		color: #27ae60;
	}

	.status-tag.status-overdue {
		background: #ffebee;
		color: #e74c3c;
	}

	.status-tag.status-in-progress {
		background: #fff3e0;
		color: #f57c00;
	}

	.delay-tag {
		background: #ffebee;
		color: #e74c3c;
		border: 1rpx solid #e74c3c;
	}

	.card-content {
		padding: 20rpx 30rpx;
	}

	.info-section {
		margin-bottom: 20rpx;
	}

	.section-label {
		font-size: 26rpx;
		color: #7f8c8d;
		font-weight: 500;
		display: block;
		margin-bottom: 8rpx;
	}

	.section-content {
		font-size: 28rpx;
		color: #2c3e50;
		line-height: 1.5;
		display: block;
	}

	.info-row {
		display: flex;
		margin-bottom: 16rpx;
	}

	.info-item {
		flex: 1;
	}

	.info-label {
		font-size: 24rpx;
		color: #7f8c8d;
		margin-right: 8rpx;
	}

	.info-value {
		font-size: 26rpx;
		color: #2c3e50;
		font-weight: 500;
	}

	.success-text {
		color: #27ae60;
		font-weight: bold;
	}

	.progress-section {
		margin-top: 20rpx;
		padding: 15rpx;
		background: #f8fafc;
		border-radius: 12rpx;
	}

	.progress-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.progress-label {
		font-size: 26rpx;
		color: #4a5568;
		font-weight: 500;
	}

	.progress-value {
		font-size: 26rpx;
		color: #3498db;
		font-weight: bold;
	}

	.card-footer {
		padding: 20rpx 30rpx;
		border-top: 2rpx solid #f0f4f8;
	}

	.footer-actions {
		display: flex;
		justify-content: space-around;
	}

	.action-button {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 10rpx 20rpx;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.action-button:active {
		transform: scale(0.95);
	}

	.action-icon {
		font-size: 32rpx;
		margin-bottom: 8rpx;
	}

	.action-text {
		font-size: 22rpx;
		color: #7f8c8d;
	}

	/* 加载更多 */
	.load-more,
	.no-more {
		text-align: center;
		padding: 40rpx 30rpx;
		font-size: 26rpx;
		color: #a0aec0;
	}

	.loading-dots {
		display: inline-flex;
		gap: 10rpx;
		margin-top: 20rpx;
	}

	.dot {
		width: 12rpx;
		height: 12rpx;
		background: #3498db;
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

		0%,
		80%,
		100% {
			transform: scale(0);
			opacity: 0.5;
		}

		40% {
			transform: scale(1);
			opacity: 1;
		}
	}

	/* 底部操作栏 */
	.bottom-action-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: white;
		border-top: 2rpx solid #f0f4f8;
		padding: 20rpx 30rpx 40rpx;
		box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.1);
	}

	.action-buttons {
		display: flex;
		justify-content: space-around;
	}

	.action-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 10rpx 20rpx;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.action-item:active {
		transform: scale(0.95);
	}

	.action-icon {
		width: 80rpx;
		height: 80rpx;
		background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 12rpx;
		box-shadow: 0 6rpx 20rpx rgba(52, 152, 219, 0.3);
	}

	.action-icon text {
		font-size: 40rpx;
		color: white;
		font-weight: 300;
	}

	.action-label {
		font-size: 24rpx;
		color: #2c3e50;
		font-weight: 500;
	}

	/* 弹窗 */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 0.3s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}

		to {
			opacity: 1;
		}
	}

	.add-ledger-modal {
		background: white;
		width: 80%;
		max-width: 700rpx;
		max-height: 85vh;
		/* 限制最大高度 */
		border-radius: 24rpx;
		overflow: hidden;
		box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.3);
		animation: slideUp 0.3s ease;
		z-index: 10000;
		/* 确保在遮罩层之上 */
		position: relative;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(50rpx);
		}

		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx;
		background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
		color: white;
	}

	.modal-title {
		font-size: 36rpx;
		font-weight: bold;
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
		max-height: 70vh;
		overflow-y: auto;
	}

	.modal-input {
		background: #f8fafc;
		border: 2rpx solid #e2e8f0;
		border-radius: 12rpx;
		padding: 20rpx;
		font-size: 28rpx;
		margin-bottom: 20rpx;
		color: #2c3e50;
	}

	.modal-label {
		font-size: 28rpx;
		color: #2c3e50;
		font-weight: 500;
		display: block;
		margin-bottom: 15rpx;
	}

	.modal-textarea {
		background: #f8fafc;
		border: 2rpx solid #e2e8f0;
		border-radius: 12rpx;
		padding: 20rpx;
		font-size: 28rpx;
		min-height: 120rpx;
		color: #2c3e50;
		margin-bottom: 20rpx;
	}

	.date-row {
		display: flex;
		gap: 20rpx;
		margin-bottom: 20rpx;
	}

	.date-item {
		flex: 1;
	}

	.date-label {
		font-size: 26rpx;
		color: #2c3e50;
		margin-bottom: 12rpx;
		display: block;
		font-weight: 500;
	}

	.date-select {
		background: #f8fafc;
		border: 2rpx solid #e2e8f0;
		border-radius: 12rpx;
		padding: 20rpx;
		font-size: 26rpx;
		color: #2c3e50;
		cursor: pointer;
	}

	.date-select-text {
		color: #4a5568;
	}

	.checkbox-row {
		margin: 20rpx 0;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		font-size: 28rpx;
		color: #2c3e50;
	}

	.modal-actions {
		display: flex;
		padding: 20rpx 30rpx 30rpx;
		gap: 20rpx;
	}

	.modal-cancel,
	.modal-confirm {
		flex: 1;
		padding: 24rpx;
		border-radius: 12rpx;
		font-size: 28rpx;
		font-weight: 500;
		border: none;
		cursor: pointer;
	}

	.modal-cancel {
		background: #f8fafc;
		color: #4a5568;
		border: 2rpx solid #e2e8f0;
	}

	.modal-confirm {
		background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
		color: white;
		box-shadow: 0 4rpx 15rpx rgba(52, 152, 219, 0.3);
	}

	/* 响应式设计 */
	@media (max-width: 750rpx) {
		.ledger-header {
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

		.ledger-list {
			padding: 0 20rpx 120rpx;
		}

		.ledger-card {
			margin-bottom: 20rpx;
		}

		.card-header,
		.card-content,
		.card-footer {
			padding: 20rpx;
		}

		.info-row {
			flex-direction: column;
			gap: 12rpx;
		}

		.action-buttons {
			justify-content: space-between;
			padding: 0 20rpx;
		}

		.tag {
			font-size: 20rpx;
			padding: 2rpx 8rpx;
		}

		.date-row {
			flex-direction: column;
			gap: 15rpx;
		}
		/* 搜索结果样式 */
			.search-result {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 20rpx 0;
				margin: 10rpx 0;
				background: #f8fafc;
				border-radius: 12rpx;
				padding: 15rpx 20rpx;
			}
			
			.result-text {
				font-size: 26rpx;
				color: #3498db;
				font-weight: 500;
			}
			
			.clear-search-btn {
				background: #e3f2fd;
				color: #3498db;
				padding: 8rpx 16rpx;
				border-radius: 8rpx;
				font-size: 22rpx;
				font-weight: 500;
				cursor: pointer;
				transition: all 0.2s ease;
			}
			
			.clear-search-btn:active {
				background: #bbdefb;
				transform: scale(0.95);
			}
			
			/* 响应式设计 */
			@media (max-width: 750rpx) {
				.search-result {
					flex-direction: column;
					align-items: flex-start;
					gap: 10rpx;
				}
				
				.clear-search-btn {
					align-self: flex-end;
				}
			}
	}
</style>