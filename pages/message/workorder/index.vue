<template>
	<view class="defect-container">
		<!-- 顶部标题和统计 -->
		<view class="defect-header">
			<view class="header-main">
				<text class="header-title">缺陷工单</text>
				<text class="header-subtitle">总数: {{ pendingCount }}</text>
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
				<input class="search-input" placeholder="搜索缺陷信息" v-model="searchKeyword" @input="onSearch"
					placeholder-class="placeholder" />
				<view class="search-clear" @tap="clearSearch" v-if="searchKeyword">
					<text class="clear-icon">✕</text>
				</view>
			</view>

			<!-- 专业筛选区域 -->
			<view class="specialty-filter-section">
				<view class="specialty-filter" @tap="toggleSpecialtyFilter">
					<text class="specialty-label">专业:</text>
					<text class="specialty-value">
						{{ selectedSpecialty === 'all' ? '全部专业' : selectedSpecialty }}
					</text>
					<text class="specialty-arrow">{{ showSpecialtyFilter ? '▲' : '▼' }}</text>
					<view class="specialty-clear" @tap.stop="clearSpecialtyFilter" v-if="selectedSpecialty !== 'all'">
						<text>✕</text>
					</view>
				</view>

				<!-- 专业下拉框 -->
				<view class="specialty-dropdown" v-if="showSpecialtyFilter">
					<view class="dropdown-item" :class="{ active: selectedSpecialty === 'all' }"
						@tap="selectSpecialty('all')">
						<text>全部专业</text>
					</view>
					<view class="dropdown-item" v-for="specialty in specialties" :key="specialty"
						:class="{ active: selectedSpecialty === specialty }" @tap="selectSpecialty(specialty)">
						<text>{{ specialty }}</text>
					</view>
					<view class="dropdown-empty" v-if="specialties.length === 0">
						<text>暂无专业数据</text>
					</view>
				</view>
			</view>

			<view class="filter-options">
				<view class="filter-tabs">
					<view class="filter-tab" :class="{ active: activeFilter === 'all' }" @tap="changeFilter('all')">
						<text>全部</text>
					</view>
					<view class="filter-tab" :class="{ active: activeFilter === 'pending' }"
						@tap="changeFilter('pending')">
						<text>待消缺</text>
					</view>
					<view class="filter-tab" :class="{ active: activeFilter === 'processing' }"
						@tap="changeFilter('processing')">
						<text>待验收</text>
					</view>
					<view class="filter-tab" :class="{ active: activeFilter === 'completed' }"
						@tap="changeFilter('completed')">
						<text>已消缺</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 缺陷工单列表 -->
		<scroll-view class="defect-list" scroll-y @scrolltolower="loadMore" refresher-enabled
			@refresherrefresh="onRefresh" :refresher-triggered="refreshing">
			<!-- 空状态 -->
			<view class="empty-state" v-if="!defects.length && !loading">
				<view class="empty-icon">
					<text></text>
				</view>
				<text class="empty-title">暂无缺陷工单</text>
			</view>

			<!-- 缺陷卡片 -->
			<view class="defect-card" v-for="defect in filteredDefects" :key="defect.gdid">
				<view class="card-header">
					<view class="card-title-section">
						<text class="defect-code">#{{ defect.gdid }}</text>
						<view class="defect-tags">
							<text class="tag priority-tag" :class="'priority-' + getPriorityLevel(defect.form)">
								{{ defect.form || '无级别' }}
							</text>
							<text class="tag status-tag" :class="getStatusClass(defect.status)">
								{{ defect.status || '未知状态' }}
							</text>
							<text class="tag type-tag">{{ defect.special || '未知专业' }}</text>
						</view>
					</view>
				</view>

				<view class="card-content">
					<!-- 缺陷描述 -->
					<view class="info-section">
						<text class="section-label">缺陷描述</text>
						<text class="section-content">{{ defect.qxname || '无描述' }}</text>
					</view>

					<!-- 设备信息 -->
					<view class="info-row">
						<view class="info-item">
							<text class="info-label">设备ID:</text>
							<text class="info-value">{{ defect.deviceid || '无设备ID' }}</text>
						</view>
						<view class="info-item">
							<text class="info-label">位置:</text>
							<text class="info-value">{{ defect.location || '未知位置' }}</text>
						</view>
					</view>

					<!-- 人员信息 -->
					<view class="info-row">
						<view class="info-item">
							<text class="info-label">上报人:</text>
							<text class="info-value">{{ defect.peo || '未知' }}</text>
						</view>
						<view class="info-item">
							<text class="info-label">消缺人:</text>
							<text class="info-value">{{ defect.xqr || '待分配' }}</text>
						</view>
					</view>

					<!-- 时间信息 -->
					<view class="info-row">
						<view class="info-item">
							<text class="info-label">上报时间:</text>
							<text class="info-value">{{ formatDateTime(defect.time) }}</text>
						</view>
					</view>

					<!-- 完成时间 -->
					<view class="info-row" v-if="defect.compeletetime">
						<view class="info-item">
							<text class="info-label">完成时间:</text>
							<text class="info-value success-text">{{ formatDateTime(defect.compeletetime) }}</text>
						</view>
					</view>

					<!-- 消缺时间 -->
					<view class="info-row" v-if="defect.xqtime">
						<view class="info-item">
							<text class="info-label">消缺时间:</text>
							<text class="info-value success-text">{{ formatDateTime(defect.xqtime) }}</text>
						</view>
					</view>

					<!-- 审核人 -->
					<view class="info-row" v-if="defect.shenhe">
						<view class="info-item">
							<text class="info-label">审核人:</text>
							<text class="info-value">{{ defect.shenhe }}</text>
						</view>
					</view>

					<!-- 确认人 -->
					<view class="info-row" v-if="defect.confirmpeo">
						<view class="info-item">
							<text class="info-label">确认人:</text>
							<text class="info-value">{{ defect.confirmpeo }}</text>
						</view>
					</view>

					<!-- 图片展示区域 -->
					<view class="image-section" v-if="hasImages(defect)">
						<text class="section-label">相关图片</text>
						<view class="image-container">
							<view class="image-item" v-if="getImageUrl(defect, 'qx_picture')">
								<text class="image-label">消缺前</text>
								<image class="defect-image" :src="getImageUrl(defect, 'qx_picture')" mode="aspectFill"
									@tap="previewImage(getImageUrl(defect, 'qx_picture'))"></image>
							</view>
							<view class="image-item" v-if="getImageUrl(defect, 'xq_picture')">
								<text class="image-label">消缺后</text>
								<image class="defect-image" :src="getImageUrl(defect, 'xq_picture')" mode="aspectFill"
									@tap="previewImage(getImageUrl(defect, 'xq_picture'))"></image>
							</view>
						</view>
					</view>

					<!-- 备注 -->
					<view class="info-section" v-if="defect.bz">
						<text class="section-label">备注</text>
						<text class="section-content">{{ defect.bz }}</text>
					</view>
				</view>

				<view class="card-footer">
					<view class="footer-actions">
						<!-- 消缺按钮 -->
						<view class="action-button" @tap.stop="goToDisposePage(defect)" v-if="defect.status === '待消缺'">

							<text class="action-text">消缺</text>
						</view>
						<view class="action-button" @tap.stop="hangUp(defect)" v-if="defect.status === '待消缺'">

							<text class="action-text">挂起</text>
						</view>
						<!-- 转专业按钮 -->
						<view class="action-button" @tap.stop="showTransferModal(defect)"
							v-if="defect.status === '待消缺'">

							<text class="action-text">转专业</text>
						</view>

						<view class="action-button" @tap.stop="yanshou(defect)" v-if="defect.status === '待验收'">

							<text class="action-text">验收</text>
						</view>
						<view class="action-button" @tap.stop="tuihui(defect)" v-if="defect.status === '待验收'">

							<text class="action-text">退回</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 转专业弹窗 -->
			<view class="modal-overlay" v-if="showTransferModalFlag" @tap="closeTransferModal">
				<view class="transfer-modal" @tap.stop>
					<view class="modal-header">
						<text class="modal-title">转专业</text>
						<view class="modal-close" @tap="closeTransferModal">
							<text>✕</text>
						</view>
					</view>
					<view class="modal-content">



						<view class="form-group">
							<text class="form-label">选择目标专业:</text>
							<view class="specialty-select" @tap="toggleSpecialtySelect">
								<text class="select-value">{{ selectedTransferSpecialty || '请选择专业' }}</text>
								<text class="select-arrow">▼</text>
							</view>
							<!-- 专业选择下拉框 -->
							<view class="specialty-select-dropdown" v-if="showSpecialtySelect">
								<scroll-view class="dropdown-scroll" scroll-y>
									<view class="dropdown-item" v-for="specialty in transferSpecialties"
										:key="specialty" :class="{ active: selectedTransferSpecialty === specialty }"
										@tap="selectTransferSpecialty(specialty)">
										<text>{{ specialty }}</text>
									</view>
								</scroll-view>
							</view>
						</view>

						<view class="form-group">
							<text class="form-label">转专业理由:</text>
							<textarea class="form-textarea" placeholder="请输入转专业理由" v-model="transferReason"
								maxlength="200" :auto-height="true"></textarea>
							<text class="textarea-count">{{ transferReason.length }}/200</text>
						</view>
					</view>

					<view class="modal-footer">
						<view class="footer-buttons">
							<view class="btn cancel-btn" @tap="closeTransferModal">
								<text>取消</text>
							</view>
							<view class="btn confirm-btn" @tap="submitTransfer"
								:class="{ disabled: !canSubmitTransfer }">
								<text>确认转交</text>
							</view>
						</view>
					</view>
				</view>
			</view>

			<!-- 加载更多 -->
			<view class="load-more" v-if="hasMore && defects.length">
				<text class="loading-text">{{ loading ? '加载中...' : '上拉加载更多' }}</text>
				<view class="loading-dots" v-if="loading">
					<text class="dot"></text>
					<text class="dot"></text>
					<text class="dot"></text>
				</view>
			</view>

			<view class="no-more" v-if="!hasMore && defects.length">
				<text>已显示全部缺陷</text>
			</view>
		</scroll-view>
	</view>
</template>


<script>
	export default {
		data() {
			return {
				// API基础URL
				apiBaseUrl: 'https://fdjt.qdsteel.com:5018/prod-api/mes/gd/', // 请替换为实际API地址
				// 统计信息
				pendingCount: 0,
				stats: [{
						label: '待消缺',
						value: 0
					},
					{
						label: '待验收',
						value: 0
					},
					{
						label: '已消缺',
						value: 0
					}
				],
				specialties: ['锅炉', '汽机', '热控', '电气', '化验', '燃机', '脱硫', '环保机务', '环保热控', '环保电气'], // 专业列表
				selectedSpecialty: 'all', // 当前选中的专业
				showSpecialtyFilter: false, // 是否显示专业筛选下拉框
				// 搜索和筛选
				searchKeyword: '',
				activeFilter: 'all',
				// 缺陷工单数据
				defects: [],
				showAddModal: false,
				// 分页相关
				pageNum: 1,
				pageSize: 10,
				total: 0,
				hasMore: true,
				loading: false,
				refreshing: false,
				// 转专业相关数据
				showTransferModalFlag: false,
				currentDefect: null,
				transferSpecialties: [], // 可用于转专业的专业列表
				selectedTransferSpecialty: '',
				transferReason: '',
				showSpecialtySelect: false

			};
		},
		computed: {
			// 筛选后的缺陷列表
			// 筛选后的缺陷列表
			filteredDefects() {
				let filtered = [...this.defects];

				// 按状态筛选
				if (this.activeFilter !== 'all') {
					const statusMap = {
						'pending': '待消缺',
						'processing': '待验收',
						'completed': '已消缺'
					};
					filtered = filtered.filter(item => item.status === statusMap[this.activeFilter]);
				}

				// 按专业筛选
				if (this.selectedSpecialty !== 'all') {
					filtered = filtered.filter(item => item.special === this.selectedSpecialty);
				}

				// 按关键词搜索
				if (this.searchKeyword) {
					const keyword = this.searchKeyword.toLowerCase();
					filtered = filtered.filter(item =>
						(item.gdid && item.gdid.toLowerCase().includes(keyword)) ||
						(item.qxname && item.qxname.toLowerCase().includes(keyword)) ||
						(item.special && item.special.toLowerCase().includes(keyword)) ||
						(item.location && item.location.toLowerCase().includes(keyword)) ||
						(item.peo && item.peo.toLowerCase().includes(keyword))
					);
				}
				return filtered;
			},
			canSubmitTransfer() {
				return this.selectedTransferSpecialty &&
					this.transferReason.trim() &&
					this.selectedTransferSpecialty !== this.currentDefect?.special;
			}
		},

		onLoad() {
			// 检查token
			this.checkToken();
			// 加载缺陷数据
			this.loadDefectData();
			// 加载专业列表
			this.loadSpecialties();

		},

		onPullDownRefresh() {
			this.onRefresh();
		},

		methods: {
			// 加载转专业可用专业列表
			async loadTransferSpecialties() {
				try {
					// 这里可以调用API获取可转的专业列表
					// 如果没有专门的API，可以使用现有的专业列表
					this.transferSpecialties = this.specialties.filter(specialty =>
						specialty !== this.currentDefect?.special
					);
				} catch (error) {
					console.error('加载转专业列表失败:', error);
					this.transferSpecialties = this.specialties;
				}
			},

			// 显示转专业弹窗
			showTransferModal(defect) {
				this.currentDefect = defect;
				this.selectedTransferSpecialty = '';
				this.transferReason = '';
				this.showTransferModalFlag = true;
				// 加载可用专业列表（排除当前专业）
				this.transferSpecialties = this.specialties.filter(specialty =>
					specialty !== defect.special
				);
			},

			// 关闭转专业弹窗
			closeTransferModal() {
				this.showTransferModalFlag = false;
				this.showSpecialtySelect = false;;
			},

			// 切换专业选择下拉框
			toggleSpecialtySelect() {
				this.showSpecialtySelect = !this.showSpecialtySelect;
			},

			// 选择转专业目标专业
			selectTransferSpecialty(specialty) {
				this.selectedTransferSpecialty = specialty;
				this.showSpecialtySelect = false;
			},

			// 提交转专业
			async submitTransfer() {
				if (!this.canSubmitTransfer) {
					uni.showToast({
						title: '请填写完整信息',
						icon: 'none'
					});
					return;
				}
				this.closeTransferModal();
				// 确认提示
				uni.showModal({
					title: '确认转专业',
					content: `确认将工单 #${this.currentDefect.gdid} 从【${this.currentDefect.special}】转至【${this.selectedTransferSpecialty}】吗？`,
					success: async (res) => {
						if (res.confirm) {
							await this.executeTransfer();
						}
					}
				});
			},

			// 执行转专业操作
			async executeTransfer() {
				const token = uni.getStorageSync('token');
				if (!token) {
					uni.showToast({
						title: '请先登录',
						icon: 'error'
					});
					return;
				}

				try {
					uni.showLoading({
						title: '提交中...'
					});

					// 调用转专业API
					const response = await uni.request({
						url: 'https://fdjt.qdsteel.com:5018/prod-api/mes/gd/weic',
						method: 'PUT',
						data: {
							gdid: this.currentDefect.gdid,
							special: this.selectedTransferSpecialty,
							bz: this.transferReason
						},
						header: {
							'content-type': 'application/json',
							'Authorization': `Bearer ${token}`
						}
					});

					uni.hideLoading();
					console.log(response)
					if (response[1].data.code === 200) {
						uni.showToast({
							title: '转专业成功',
							icon: 'success'
						});

						this.currentDefect = null;
						this.selectedTransferSpecialty = '';
						this.transferReason = ''




						// 刷新数据
						this.loadDefectData();
					} else {
						throw new Error(response[0].msg || '转专业失败');
					}
				} catch (error) {
					uni.hideLoading();
					console.error('转专业失败:', error);
					uni.showToast({
						title: error.message || '转专业失败，请稍后重试',
						icon: 'error'
					});
				}
			},

			// 挂起功能
			async hangUp(defect) {
				const token = uni.getStorageSync('token');
				var that = this;

				// 第一步：先弹出输入理由的弹窗
				uni.showModal({
					title: '挂起理由',
					content: '',
					editable: true, // 使弹窗可输入
					placeholderText: '请输入挂起理由', // 输入框占位符
					success: (inputRes) => {
						// 如果用户点击了确定，并且输入了理由
						if (inputRes.confirm && inputRes.content.trim()) {
							const rejectReason = inputRes.content.trim();

							// 第二步：确认是否提交
							uni.showModal({
								title: '提交确认',
								content: `确认挂起吗？\n挂起理由：${rejectReason}`,
								success: (confirmRes) => {
									if (confirmRes.confirm) {
										uni.request({
											url: 'https://fdjt.qdsteel.com:5018/prod-api/mes/gd/hangup',
											data: {
												gdid: defect.gdid,
												bz: rejectReason // 添加挂起理由参数
												// 或者根据后端接口需求调整参数名
												// reason: rejectReason,
												// remark: rejectReason
											},
											method: 'PUT',
											header: {
												'content-type': 'application/json',
												'Authorization': `Bearer ${token}`
											},
											success: function(res) {
												if (res.statusCode == 200) {
													uni.showToast({
														title: '挂起成功',
														icon: 'success'
													});
													that.loadDefectData();
												} else {
													uni.showToast({
														icon: 'none',
														title: `挂起失败：${res.data.message || '未知错误'}`
													});
												}
											},
											fail: function() {
												uni.showToast({
													icon: 'none',
													mask: true,
													title: '接口调用失败，请稍后再试。'
												});
											}
										});
									}
								}
							});
						} else if (inputRes.confirm && !inputRes.content.trim()) {
							// 用户点击了确定但没有输入理由
							uni.showToast({
								icon: 'none',
								title: '请输入挂起理由'
							});
						}
					}
				});

			},




			// 加载专业列表
			async loadSpecialties() {
				try {
					// 从缺陷数据中提取不重复的专业
					if (this.defects.length > 0) {
						const specialties = [...new Set(this.defects.map(item => item.special).filter(special =>
							special))];
						this.specialties = specialties;
					}
				} catch (error) {
					console.error('加载专业列表失败:', error);
				}
			},

			// 选择专业
			selectSpecialty(specialty) {
				this.selectedSpecialty = specialty;
				this.showSpecialtyFilter = false;
				this.pageNum = 1;
				this.hasMore = true;
				// 重新加载数据
				this.loadDefectData();
			},

			// 清空专业筛选
			clearSpecialtyFilter() {
				this.selectedSpecialty = 'all';
				this.showSpecialtyFilter = false;
				this.pageNum = 1;
				this.hasMore = true;
				this.loadDefectData();
			},

			// 切换专业筛选显示
			toggleSpecialtyFilter() {
				this.showSpecialtyFilter = !this.showSpecialtyFilter;
				// 当显示下拉框时，如果没有专业列表，则加载
				if (this.showSpecialtyFilter && this.specialties.length === 0) {
					this.loadSpecialties();
				}
			},
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

			// 根据形式获取优先级级别
			getPriorityLevel(form) {
				if (!form) return 0;
				const formMap = {
					'Ⅰ级': 3,
					'Ⅱ级': 2,
					'Ⅲ级': 1,
					'Ⅰ类': 3,
					'Ⅱ类': 2,
					'Ⅲ类': 1
				};
				return formMap[form] || 0;
			},

			// 获取状态类名
			getStatusClass(status) {
				if (!status) return '';
				const statusMap = {
					'待消缺': '待消缺',
					'待验收': '待验收',
					'已消缺': '已消缺'
				};
				return statusMap[status] || '';
			},

			// 格式化日期时间
			formatDateTime(dateTimeStr) {
				if (!dateTimeStr) return '未设置';
				try {
					// 尝试解析日期时间
					const date = new Date(dateTimeStr);
					if (isNaN(date.getTime())) {
						return dateTimeStr;
					}

					// 格式化：年-月-日 时:分
					const year = date.getFullYear();
					const month = String(date.getMonth() + 1).padStart(2, '0');
					const day = String(date.getDate()).padStart(2, '0');
					const hours = String(date.getHours()).padStart(2, '0');
					const minutes = String(date.getMinutes()).padStart(2, '0');

					return `${year}-${month}-${day} ${hours}:${minutes}`;
				} catch (error) {
					return dateTimeStr;
				}
			},

			// 检查是否有图片
			hasImages(defect) {

				// 这里假设图片字段是 qx_picture 和 xq_picture
				// 如果有其他字段名，请相应修改
				return defect.qx_picture || defect.xq_picture;
			},

			// 获取图片URL
			getImageUrl(defect, fieldName) {

				let url = defect[fieldName];
				if (!url) return null;

				// 如果已经是完整URL，直接返回
				if (url.startsWith('http')) {
					return url;
				}

				// 如果是相对路径，拼接基础URL
				// 注意：这里需要根据您的实际情况调整
				return 'https://fdjt.qdsteel.com:5018/prod-api' + url;
			},

			// 预览图片
			previewImage(url) {
				if (!url) return;

				uni.previewImage({
					urls: [url],
					current: 0,
					indicator: 'default',
					loop: false
				});
			},

			// 搜索功能
			onSearch() {
				// 防抖处理
				clearTimeout(this.searchTimer);
				this.searchTimer = setTimeout(() => {
					this.pageNum = 1;
					this.hasMore = true;
					this.loadDefectData();
				}, 500);
			},

			clearSearch() {
				this.searchKeyword = '';
				this.pageNum = 1;
				this.hasMore = true;
				this.loadDefectData();
			},

			// 筛选功能
			changeFilter(filter) {
				this.activeFilter = filter;
			},

			// 加载缺陷数据
			async loadDefectData() {
				if (this.loading) return;

				this.loading = true;

				try {
					// 构建查询参数

					const searchParamsObj = 'pageNum=' + this.pageNum + '&pageSize=' + this.pageSize;
					// 如果有搜索关键词，添加到参数中

					// 调用API - 这里需要替换为实际的缺陷工单API
					const response = await this.request(`list?` + searchParamsObj);
					const response1 = await this.request(`list`);
					if (response.code === 200) {
						// 更新数据列表
						if (this.pageNum === 1) {
							this.defects = response.rows || [];
						} else {
							this.defects = [...this.defects, ...(response.rows || [])];
						}


						// 使用本地计算统计
						const pending = response1.rows.filter(item => item.status === '待消缺').length;
						const processing = response1.rows.filter(item => item.status === '待验收').length;
						const completed = response1.rows.filter(item => item.status === '已消缺').length;

						this.stats = [{
								label: '待消缺',
								value: pending
							},
							{
								label: '待验收',
								value: processing
							},
							{
								label: '已消缺',
								value: completed
							}
						];
						// 更新总数和分页状态
						this.total = response.total || 0;
						this.pendingCount = response1.rows.length

						// 判断是否还有更多数据
						this.hasMore = this.defects.length < this.total;
					} else {
						uni.showToast({
							title: response.msg || '加载失败',
							icon: 'error'
						});
					}
				} catch (error) {
					console.error('加载缺陷数据失败:', error);
					// 使用模拟数据

				} finally {
					this.loading = false;
					this.refreshing = false;
					uni.stopPullDownRefresh();
				}
			},

			// 更新专业列表
			updateSpecialtiesList(defects) {
				// 从缺陷数据中提取所有不重复的专业
				const specialtiesSet = new Set();
				defects.forEach(item => {
					if (item.special && item.special.trim()) {
						specialtiesSet.add(item.special);
					}
				});
				this.specialties = Array.from(specialtiesSet).sort();
			},



			onRefresh() {
				this.refreshing = true;
				this.pageNum = 1;
				this.hasMore = true;
				this.loadDefectData();

			},

			loadMore() {
				if (!this.hasMore || this.loading) return;

				this.pageNum++;
				this.loadDefectData();
			},

			// 查看缺陷详情
			viewDefectDetail(defect) {
				this.showAddModal = true;
			},

			// 跳转到消缺页面
			goToDisposePage(defect) {

				uni.navigateTo({
					url: '/pages/index/xunjian/xiaoque/index?id=' + defect.gdid,

				});
			},
			tuihui(defect) {
				const token = uni.getStorageSync('token');
				var that = this;

				// 第一步：先弹出输入理由的弹窗
				uni.showModal({
					title: '驳回理由',
					content: '',
					editable: true, // 使弹窗可输入
					placeholderText: '请输入驳回理由', // 输入框占位符
					success: (inputRes) => {
						// 如果用户点击了确定，并且输入了理由
						if (inputRes.confirm && inputRes.content.trim()) {
							const rejectReason = inputRes.content.trim();

							// 第二步：确认是否提交
							uni.showModal({
								title: '提交确认',
								content: `确认驳回吗？\n驳回理由：${rejectReason}`,
								success: (confirmRes) => {
									if (confirmRes.confirm) {
										uni.request({
											url: 'https://fdjt.qdsteel.com:5018/prod-api/mes/gd/tui',
											data: {
												gdid: defect.gdid,
												bz: rejectReason // 添加驳回理由参数
												// 或者根据后端接口需求调整参数名
												// reason: rejectReason,
												// remark: rejectReason
											},
											method: 'PUT',
											header: {
												'content-type': 'application/json',
												'Authorization': `Bearer ${token}`
											},
											success: function(res) {
												if (res.statusCode == 200) {
													uni.showToast({
														title: '驳回成功',
														icon: 'success'
													});
													that.loadDefectData();
												} else {
													uni.showToast({
														icon: 'none',
														title: `驳回失败：${res.data.message || '未知错误'}`
													});
												}
											},
											fail: function() {
												uni.showToast({
													icon: 'none',
													mask: true,
													title: '接口调用失败，请稍后再试。'
												});
											}
										});
									}
								}
							});
						} else if (inputRes.confirm && !inputRes.content.trim()) {
							// 用户点击了确定但没有输入理由
							uni.showToast({
								icon: 'none',
								title: '请输入驳回理由'
							});
						}
					}
				});
			},
			yanshou(defect) {
				const token = uni.getStorageSync('token');
				var that = this;

				// 第一步：先弹出输入理由的弹窗
				uni.showModal({
					title: '验收评价',
					content: '',
					editable: true, // 使弹窗可输入
					placeholderText: '请输入验收评价', // 输入框占位符
					success: (inputRes) => {
						// 如果用户点击了确定，并且输入了理由
						if (inputRes.confirm && inputRes.content.trim()) {
							const rejectReason = inputRes.content.trim();

							// 第二步：确认是否提交
							uni.showModal({
								title: '提交确认',
								content: `确认验收吗？\n验收评价：${rejectReason}`,
								success: (confirmRes) => {
									if (confirmRes.confirm) {
										uni.request({
											url: 'https://fdjt.qdsteel.com:5018/prod-api/mes/gd/shen',
											data: {
												gdid: defect.gdid,
												bz: rejectReason // 验收评价
												// 或者根据后端接口需求调整参数名
												// reason: rejectReason,
												// remark: rejectReason
											},
											method: 'PUT',
											header: {
												'content-type': 'application/json',
												'Authorization': `Bearer ${token}`
											},
											success: function(res) {
												if (res.statusCode == 200) {
													uni.showToast({
														title: '验收成功',
														icon: 'success'
													});
													that.loadDefectData();
												} else {
													uni.showToast({
														icon: 'none',
														title: `验收失败：${res.data.message || '未知错误'}`
													});
												}
											},
											fail: function() {
												uni.showToast({
													icon: 'none',
													mask: true,
													title: '接口调用失败，请稍后再试。'
												});
											}
										});
									}
								}
							});
						} else if (inputRes.confirm && !inputRes.content.trim()) {
							// 用户点击了确定但没有输入理由
							uni.showToast({
								icon: 'none',
								title: '请输入验收评价'
							});
						}
					}
				});
			}
		}
	};
</script>

<style>
	.defect-container {
		min-height: 100vh;
		background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
		font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
	}

	/* 头部区域 */
	.defect-header {
		background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
		padding: 40rpx 30rpx 30rpx;
		color: white;
		border-bottom-left-radius: 30rpx;
		border-bottom-right-radius: 30rpx;
		box-shadow: 0 10rpx 30rpx rgba(231, 76, 60, 0.3);
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
		margin-bottom: 20rpx;
	}

	.filter-tabs {
		display: flex;
		background: #f0f4f8;
		border-radius: 12rpx;
		padding: 4rpx;
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

	.filter-tab {
		flex: 1;
		text-align: center;
		padding: 12rpx 0;
		border-radius: 10rpx;
		font-size: 26rpx;
		color: #7f8c8d;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.filter-tab.active {
		background: white;
		color: #e74c3c;
		font-weight: 500;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
	}

	/* 缺陷列表 */
	.defect-list {
		flex: 1;
		padding: 0 30rpx 30rpx;
		height: calc(100vh - 400rpx);
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

	/* 缺陷卡片 */
	.defect-card {
		background: white;
		border-radius: 20rpx;
		margin-bottom: 30rpx;
		box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.08);
		overflow: hidden;
		transition: all 0.3s ease;
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

	.defect-card:active {
		transform: translateY(4rpx);
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
	}

	.card-header {
		padding: 30rpx 30rpx 20rpx;
		border-bottom: 2rpx solid #f0f4f8;
	}

	.defect-code {
		font-size: 28rpx;
		font-weight: bold;
		color: #2c3e50;
		display: block;
		margin-bottom: 12rpx;
	}

	.defect-tags {
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
		background: #ffeaea;
		color: #e74c3c;
	}

	.priority-0 {
		background: #e8f5e9;
		color: #27ae60;
	}

	.priority-1 {
		background: #fff3e0;
		color: #f57c00;
	}

	.priority-2 {
		background: #ffeaea;
		color: #e74c3c;
	}

	.priority-3 {
		background: #fce4ec;
		color: #c2185b;
	}

	.status-tag {
		background: #e8f5e9;
		color: #27ae60;
	}

	.status-tag.status-pending {
		background: #fff3e0;
		color: #f57c00;
	}

	.status-tag.status-processing {
		background: #e3f2fd;
		color: #1976d2;
	}

	.status-tag.status-completed {
		background: #e8f5e9;
		color: #27ae60;
	}

	.status-tag.status-closed {
		background: #f5f5f5;
		color: #757575;
	}

	.type-tag {
		background: #f3e5f5;
		color: #7b1fa2;
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

	/* 图片展示区域样式 */
	.image-section {
		margin-bottom: 20rpx;
	}

	.image-container {
		display: flex;
		flex-wrap: wrap;
		gap: 20rpx;
		margin-top: 10rpx;
	}

	.image-item {
		flex: 1;
		min-width: 45%;
		display: flex;
		flex-direction: column;
	}

	.image-label {
		font-size: 24rpx;
		color: #7f8c8d;
		margin-bottom: 8rpx;
	}

	.defect-image {
		width: 100%;
		height: 200rpx;
		border-radius: 8rpx;
		background-color: #f5f5f5;
		border: 1rpx solid #e0e0e0;
	}

	.card-footer {
		padding: 20rpx 30rpx;
		border-top: 2rpx solid #f0f4f8;
	}

	.footer-actions {
		display: flex;
		justify-content: flex-end;
		gap: 20rpx;
	}

	.action-button {
		display: flex;
		align-items: center;
		background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
		color: white;
		padding: 12rpx 30rpx;
		border-radius: 10rpx;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 4rpx 12rpx rgba(231, 76, 60, 0.3);
	}

	.action-button.secondary {
		background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
		box-shadow: 0 4rpx 12rpx rgba(52, 152, 219, 0.3);
	}

	.action-button:active {
		transform: scale(0.95);
		box-shadow: 0 2rpx 6rpx rgba(231, 76, 60, 0.3);
	}

	.action-button.secondary:active {
		box-shadow: 0 2rpx 6rpx rgba(52, 152, 219, 0.3);
	}

	.action-icon {
		font-size: 32rpx;
		margin-right: 8rpx;
	}

	.action-text {
		font-size: 26rpx;
		font-weight: 500;
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
		background: #e74c3c;
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

	/* 响应式设计 */
	@media (max-width: 750rpx) {
		.defect-header {
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

		.defect-list {
			padding: 0 20rpx 20rpx;
		}

		.defect-card {
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

		.image-container {
			flex-direction: column;
		}

		.image-item {
			min-width: 100%;
		}

		.footer-actions {
			flex-direction: column;
			gap: 10rpx;
		}

		/* 专业筛选区域 */
		.specialty-filter-section {
			position: relative;
			margin-bottom: 20rpx;
		}

		.specialty-filter {
			display: flex;
			align-items: center;
			background: white;
			border-radius: 16rpx;
			padding: 20rpx 30rpx;
			box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.1);
			cursor: pointer;
			position: relative;
			z-index: 100;
		}

		.specialty-label {
			font-size: 28rpx;
			color: #7f8c8d;
			margin-right: 15rpx;
			font-weight: 500;
		}

		.specialty-value {
			flex: 1;
			font-size: 28rpx;
			color: #2c3e50;
			font-weight: 500;
		}

		.specialty-arrow {
			font-size: 24rpx;
			color: #7f8c8d;
			margin-left: 10rpx;
			transition: transform 0.3s ease;
		}

		.specialty-clear {
			width: 40rpx;
			height: 40rpx;
			background: #f0f0f0;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			margin-left: 15rpx;
			cursor: pointer;
		}

		.specialty-clear text {
			font-size: 20rpx;
			color: #7f8c8d;
		}

		/* 专业下拉框 */
		.specialty-dropdown {
			position: absolute;
			top: 100%;
			left: 0;
			right: 0;
			background: white;
			border-radius: 0 0 16rpx 16rpx;
			box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.15);
			margin-top: -10rpx;
			padding-top: 10rpx;
			z-index: 99;
			max-height: 300rpx;
			overflow-y: auto;
		}

		.dropdown-item {
			padding: 25rpx 30rpx;
			font-size: 28rpx;
			color: #2c3e50;
			border-top: 1rpx solid #f0f4f8;
			cursor: pointer;
			transition: all 0.2s ease;
		}

		.dropdown-item:active {
			background-color: #f5f5f5;
		}

		.dropdown-item.active {
			background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
			color: white;
		}

		.dropdown-empty {
			padding: 40rpx 30rpx;
			text-align: center;
			font-size: 26rpx;
			color: #a0aec0;
		}

		/* 点击外部关闭下拉框的遮罩 */
		.specialty-backdrop {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: transparent;
			z-index: 98;
		}

		/* 响应式设计 */
		@media (max-width: 750rpx) {
			.specialty-filter {
				padding: 16rpx 20rpx;
			}

			.specialty-label {
				font-size: 26rpx;
			}

			.specialty-value {
				font-size: 26rpx;
			}
		}
		
		
		/* 转专业弹窗样式 */
		.transfer-modal {
			background: white;
			width: 90%;
			max-width: 600rpx;
			border-radius: 20rpx;
			overflow: hidden;
			box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.3);
			animation: slideUp 0.3s ease;
		}
		
		.transfer-info {
			display: flex;
			margin-bottom: 20rpx;
			padding: 0 30rpx;
		}
		
		.info-label {
			font-size: 28rpx;
			color: #7f8c8d;
			margin-right: 15rpx;
			min-width: 120rpx;
		}
		
		.info-value {
			font-size: 28rpx;
			color: #2c3e50;
			font-weight: 500;
		}
		
		.form-group {
			margin-bottom: 30rpx;
			padding: 0 30rpx;
			position: relative;
		}
		
		.form-label {
			font-size: 28rpx;
			color: #2c3e50;
			font-weight: 500;
			display: block;
			margin-bottom: 15rpx;
		}
		
		.specialty-select {
			background: #f8f9fa;
			border-radius: 10rpx;
			padding: 20rpx;
			border: 1rpx solid #e0e0e0;
			display: flex;
			justify-content: space-between;
			align-items: center;
			cursor: pointer;
		}
		
		.select-value {
			font-size: 28rpx;
			color: #2c3e50;
		}
		
		.select-arrow {
			font-size: 24rpx;
			color: #7f8c8d;
		}
		
		.specialty-select-dropdown {
			position: absolute;
			top: 100%;
			left: 30rpx;
			right: 30rpx;
			background: white;
			border: 1rpx solid #e0e0e0;
			border-radius: 10rpx;
			box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
			z-index: 1000;
			max-height: 300rpx;
		}
		
		.dropdown-scroll {
			max-height: 300rpx;
		}
		
		
		
		.dropdown-item:last-child {
			border-bottom: none;
		}
		
		.dropdown-item.active {
			background: #e8f5e9;
			color: #27ae60;
			font-weight: 500;
		}
		
		.dropdown-item:hover {
			background: #f5f5f5;
		}
		
		.form-textarea {
			width: 100%;
			background: #f8f9fa;
			border-radius: 10rpx;
			padding: 20rpx;
			border: 1rpx solid #e0e0e0;
			font-size: 28rpx;
			color: #2c3e50;
			min-height: 150rpx;
			box-sizing: border-box;
		}
		
		.textarea-count {
			position: absolute;
			right: 30rpx;
			bottom: 10rpx;
			font-size: 24rpx;
			color: #a0aec0;
		}
		
		.modal-footer {
			padding: 30rpx;
			background: #f8f9fa;
			border-top: 1rpx solid #e0e0e0;
		}
		
		.footer-buttons {
			display: flex;
			justify-content: space-between;
			gap: 20rpx;
		}
		
		.btn {
			flex: 1;
			padding: 20rpx;
			border-radius: 10rpx;
			text-align: center;
			cursor: pointer;
			font-size: 28rpx;
			font-weight: 500;
			transition: all 0.2s ease;
		}
		
		.cancel-btn {
			background: #f0f0f0;
			color: #7f8c8d;
		}
		
		.cancel-btn:active {
			background: #e0e0e0;
		}
		
		.confirm-btn {
			background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
			color: white;
			box-shadow: 0 4rpx 12rpx rgba(52, 152, 219, 0.3);
		}
		
		.confirm-btn.disabled {
			background: #bdc3c7;
			box-shadow: none;
			cursor: not-allowed;
			opacity: 0.7;
		}
		
		.confirm-btn:active:not(.disabled) {
			transform: scale(0.98);
			box-shadow: 0 2rpx 6rpx rgba(52, 152, 219, 0.3);
		}
		
		@keyframes slideUp {
			from {
				transform: translateY(50rpx);
				opacity: 0;
			}
		
			to {
				transform: translateY(0);
				opacity: 1;
			}
		}
	}
</style>