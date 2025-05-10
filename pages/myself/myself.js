// pages/myself/myself.js
const app = getApp();
const { request } = require('../../utils/request');
const { parseDate,processImageUrl } = require('../../utils/util');

Page({
  data: {
    userInfo: {},
    registerDate: '',
    diaryList: [],
    pageIndex: 1,
    pageSize: 10,
    hasMoreDiary: true,
    isLoading: false
  },

  onLoad: function() {
    //this.getUserInfo();
    this.getDiaryList(true);
  },

  onPullDownRefresh: function() {
    this.getDiaryList(true);
  },

  onReachBottom: function() {
    if (this.data.hasMoreDiary && !this.data.isLoading) {
      this.loadMoreDiary();
    }
  },

  // 获取用户信息
  getUserInfo: function() {
    const userInfo = app.globalData.userInfo;
    if (userInfo) {
      this.setData({ userInfo });
    } else {
      // 如果全局没有，尝试从服务器获取
      this.getProfileFromServer();
    }
  },

  // 从服务器获取用户信息
  getProfileFromServer: async function() {
    try {
      const result = await request({
        url: '/api/user/profile',
        method: 'GET'
      });

      if (result.success) {
        const profile = result.data;
        
        // 格式化注册日期
        let registerDate = '未知';
        if (profile.registerTime) {
          const date = new Date(profile.registerTime);
          registerDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }
        
        this.setData({
          userInfo: profile,
          registerDate: registerDate
        });
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  },

  // 获取日记列表
  getDiaryList: async function(refresh = false) {
    try {
      this.setData({ isLoading: true });
      
      // 如果是刷新，重置页码
      const pageIndex = refresh ? 1 : this.data.pageIndex;
      
      const result = await request({
        url: '/api/diary/list',
        method: 'GET',
        data: {
          pageIndex: pageIndex,
          pageSize: this.data.pageSize
        }
      });

      if (result.success) {
        // 获取分页数据
        const { records, totalCount, totalPages, hasNext } = result.data;
        
        // 处理日记内容、时间等
        const diaries = records.map(diary => {
          // 处理内容预览（去除HTML标签，限制长度）
          let contentPreview = diary.editorContent || '';
          contentPreview = contentPreview.replace(/<[^>]+>/g, '');  // 去除HTML标签
          contentPreview = contentPreview.length > 100 ? contentPreview.substr(0, 100) + '...' : contentPreview;
          
          // 格式化创建时间
          let createTimeFormatted = '未知时间';
          let createYear = '';
          if (diary.createTime) {
            const date = parseDate(diary.createTime);
            createYear = date.getFullYear().toString();
            createTimeFormatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
          }
          // 处理图片URL数组
          let processedImages = [];
          if (diary.imageUrls && Array.isArray(diary.imageUrls)) {
            processedImages = diary.imageUrls.map(img => processImageUrl(app.globalData.serverUrl,app.globalData.openId,img));
          }
                
          return {
            ...diary,
            contentPreview: contentPreview,
            createTimeFormatted: createTimeFormatted,
            createYear: createYear, // 添加创建年份字段
            images: processedImages // 替换为处理后的图片URL数组
          };
        });
        
        // 更新数据
        this.setData({
          diaryList: refresh ? diaries : [...this.data.diaryList, ...diaries],
          pageIndex: pageIndex + 1,
          hasMoreDiary: hasNext, // 使用服务器返回的 hasNext 值
          totalCount: totalCount, // 保存总记录数
          totalPages: totalPages  // 保存总页数
        });
      } else {
        wx.showToast({
          title: result.message || '获取日记失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('获取日记列表失败:', error);
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ isLoading: false });
      wx.stopPullDownRefresh();
    }
  },

  // 加载更多日记
  loadMoreDiary: function() {
    if (!this.data.isLoading && this.data.hasMoreDiary) {
      this.getDiaryList(false);
    }
  },

  // 预览图片
  previewImage: function(e) {
    const urls = e.currentTarget.dataset.urls;
    const current = e.currentTarget.dataset.current;
    wx.previewImage({
      urls: urls,
      current: current
    });
  },

  // 查看日记详情
  viewDiary: function(e) {
    const diaryId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/diary/detail?id=${diaryId}`
    });
  },

  // 编辑日记
  editDiary: function(e) {
    const diaryId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/diary/edit?id=${diaryId}`
    });
  },

  // 删除日记
  deleteDiary: function(e) {
    const diaryId = e.currentTarget.dataset.id;
    const createYear = e.currentTarget.dataset.createyear;
    const that = this;
    
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除该日记吗？',
      success: async function(res) {
        if (res.confirm) {
          try {
            const result = await request({
              url: '/api/diary/delete',
              method: 'POST',
              data: { 
                diaryId: diaryId,
                createYear: createYear // 添加createYear参数
              }
            });
            
            if (result.success) {
              // 更新列表，移除已删除的日记
              const updatedList = that.data.diaryList.filter(diary => diary.diaryId !== diaryId);
              that.setData({
                diaryList: updatedList
              });
              
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
            } else {
              wx.showToast({
                title: result.message || '删除失败',
                icon: 'none'
              });
            }
          } catch (error) {
            console.error('删除日记失败:', error);
            wx.showToast({
              title: '删除失败，请重试',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 跳转到创建日记页面
  navigateToCreate: function() {
    wx.redirectTo({ url: '/pages/index/index' });
  }
});
