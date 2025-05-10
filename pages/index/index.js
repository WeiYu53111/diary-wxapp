import calendar from '../../utils/js-calendar-converter';
import request from '../../utils/request';
Page({
  data: {
    date: '', // 日期,例如5月1日
    weekday: '', // 星期几,例如星期一
    traditionalDay: '', // 农历日期,例如农历三月初一
    pageIndex: 0, // 当前页面索引
    photos: [], // 用于存储上传的照片路径
    editorHeight: 350,
    address: '', // 存储地址
    editor: null, // 用于存储编辑器实例
    //editorContent: '', // 存储编辑器内容
  },

  onLoad() {
    // 获取当前日期
    const date = new Date();
    const month = date.getMonth() + 1; // 获取月份（0-11，需要加1）
    const day = date.getDate(); // 获取日期
    const formattedDate = `${month}月${day}日`; // 格式化为 x月x日
    const weekday = ['星期天', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][date.getDay()];
    const lunarDate = calendar.solar2lunar(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    );
    const traditionalDay = `农历${lunarDate.IMonthCn}${lunarDate.IDayCn}`; // 农历格式化
    this.setData({
      date: formattedDate,
      weekday: weekday,
      traditionalDay: traditionalDay,
    });
    console.log('当前日期:', formattedDate);
    console.log('当前星期:', weekday);
    console.log('农历日期:', traditionalDay);

    console.log('页面加载');
    // 恢复数据
    const storedData = wx.getStorageSync(String(this.data.pageIndex));
    if (storedData) {
      console.log('恢复数据:', storedData.address);
      console.log('恢复数据:', storedData.editorContent);
      // 恢复地址
      this.setData({
        address: storedData.address,
        editorContent: storedData.editorContent,
      });
    }

    // 获取屏幕高度并设置 editorHeight
    const systemInfo = wx.getWindowInfo();
    const screenHeight = systemInfo.windowHeight; // 获取屏幕高度（单位：px）
    const editorHeight = screenHeight * 0.45; // 取屏幕高度的 40%
    this.setData({
      editorHeight: editorHeight // 将屏幕高度赋值给 editorHeight
    });
    console.log('屏幕高度:', editorHeight);

  },

  onReady() {
    // 页面渲染完成后可以执行一些操作
    console.log('页面渲染');
  },

  onShow() {
    console.log('页面显示');

  },

  uploadPhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      maxDuration: 30,
      camera: 'back',
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath; // 获取图片临时路径
        console.log('选择的图片路径:', tempFilePath);
        console.log(res.tempFiles[0].size)

        if (this.data.editor) {
          // 将图片路径添加到 photos 数组中   
          this.setData({
            photos: [...this.data.photos, tempFilePath]
          });
        }
      }
    })
  },

  // 点击按钮后，调用 wx.chooseLocation 弹出地图选择位置
  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        // 获取用户选择的地址、经纬度等信息
        const address = res.address;
        //const latitude = res.latitude;
        const longitude = res.longitude;

        // 更新页面数据
        this.setData({
          address: address,
          //latitude: latitude,
          //longitude: longitude
        });

        // 显示选中的地址信息
        wx.showToast({
          title: '位置选择成功',
          icon: 'none'
        });
      },
      fail: (err) => {
        console.error('选择位置失败:', err);
        wx.showToast({
          title: '选择位置失败',
          icon: 'none'
        });
      }
    });
  },

  initEditorContent(e) {
    console.log('页面开始执行editorReady');
    // 获取子组件实例
    const editor = this.selectComponent('#editor');
    this.setData({
      editor: editor // 将屏幕高度赋值给 editorHeight
    });
    console.log('editor 内容:' || this.data.editorContent);
    editor.setContents({
      html: this.data.editorContent || '' // 设置编辑器内容
    });
  },

  // 页面卸载时保存数据
  onTabChange(event) {
    console.log('beforeChange 事件触发，附带参数:', event.detail.info);
    console.log('页面关闭前保存数据');


    this.data.editor.getContents({
      success: (res) => {
        console.log('编辑器内容:', res.html);
        wx.setStorage({
          key: String(this.data.pageIndex),
          data: {
            address: this.data.address,
            editorContent: res.html,
          }
        });
      },
      fail: (err) => {
        console.error('获取编辑器内容失败:', err);
      }
    });


  },

  async saveDataToServer() {
    let imageUrls = []; // 预先声明变量
    let diaryId = ''; // 预先声明变量
    try {
      const app = getApp();
      wx.showLoading({
        title: '上传中...',
        mask: true
      });
      console.log('发起请求获取ID');
      // 1. 获取diaryId
      const response = await request.request({
        url: '/api/diary/getDiaryId',
        method: 'GET'
      });
      
      if (!response.success) {
        throw new Error('获取日记 ID 失败');
      }
      diaryId = response.data.diaryId;
      console.log('获取到的日记 ID:', diaryId);
      if (!diaryId) {
        throw new Error('获取日记 ID 失败');
      }

      // 2. 上传图片
      const filePaths = this.data.photos;
      imageUrls = await Promise.all(filePaths.map(filePath => {
        return request.uploadFile({
          url: '/api/images/upload',
          filePath: filePath,
          name: 'file',
          data: { diaryId: diaryId } // 使用formData传递diaryId，而不是header
        }).then(result => {
          if (result.success) {
            return result.data.url || result.data;
          } else {
            throw new Error('图片上传失败');
          }
        });
      }));

      // 3. 上传日记数据
      const editorContent = await this.data.editor.getContentsAsync();
      const formData = {
        openId: app.globalData.openId,
        editorContent: editorContent,
        createTime: new Date().toISOString(),
        logTime: this.data.date,
        logWeek: this.data.weekday,
        logLunar: this.data.traditionalDay,
        address: this.data.address,
        imageUrls: imageUrls,
        diaryId: diaryId
      };

      const diaryResult = await request.request({
        url: '/api/diary/save',
        method: 'POST',
        data: formData
      });

      
      if (diaryResult.success) {
        wx.hideLoading();
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
      }else {
        throw new Error('保存日记失败');
      }



      // 4. 清除本地存储
      wx.removeStorage({
        key: String(this.data.pageIndex),
        success: () => {
          console.log('本地存储清除成功');
        },
        fail: (err) => {
          console.error('清除本地存储失败:', err);
        }
      });

      // 5. 清空照片数组
      this.setData({
        photos: [],
        address: '',
        editorContent: ''
      });
      console.log('照片数组已清空');
      // 移除vxml上显示的图片

      // 6. 清空编辑器内容
      this.data.editor.clearContents({
        success: () => {
          console.log('编辑器内容清空成功');
        },
        fail: (err) => {
          console.error('编辑器内容清空失败:', err);
        }
      });

    } catch (error) {
      console.error('保存日记失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
      
      // 3. 如果日记上传失败，删除已上传的图片
      if (imageUrls && imageUrls.length > 0) {
        try {
          await request.request({
            url: '/api/images/delete',
            method: 'POST',
            data: { urls: imageUrls, diaryId: diaryId } // 传递图片 URL 和日记 ID
          }).then(result => {
            if (result.success) {
              console.log('图片删除成功,', result.message);
            } else {
              console.error('图片删除失败:', result.message);
            }
          });
        } catch (rollbackError) {
          console.error('图片回滚失败:', rollbackError);
        }
      }
    }
  },

  removePhoto: function(e) {
    const index = e.currentTarget.dataset.index;
    const updatedPhotos = [...this.data.photos];
    updatedPhotos.splice(index, 1);
    
    this.setData({
      photos: updatedPhotos
    });
    
    // 如果需要的话，同时更新本地存储
    this.saveToLocalStorage();
    
    wx.showToast({
      title: '已删除图片',
      icon: 'none'
    });
  }
});
