/**
 * 封装的请求方法
 * @param {Object} options - 请求选项
 * @returns {Promise} 返回Promise对象
 */
const request = (options) => {
  const app = getApp();
  const serverUrl = app.globalData.serverUrl || '';
  const token = app.globalData.token || '';

  // 拼接完整URL
  let url = options.url;
  if (!url.startsWith('http')) {
    url = serverUrl + url;
  }

  console.log('发起请求:', url, options.data || {});

  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      data: options.data || {},
      method: options.method || 'GET',
      header: {
        ...options.header,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      success: (res) => {
        console.log('请求成功:', url, res.data);
        
        if (res.statusCode === 200) {
          // 处理标准化的响应结构
          const { status, message, data } = res.data;
          
          if (status === "success") {
            resolve({
              success: true,
              message: message,
              data: data
            });
          } else {
            reject({
              success: false,
              message: message || '请求返回错误状态',
              data: data
            });
          }
        } else if (res.statusCode === 401) {
          console.warn('Token已过期，需要重新登录');
          // 可选：清除token并处理重新登录
          // app.globalData.token = null;
          
          reject({
            success: false,
            message: '未授权，请重新登录',
            status: res.statusCode,
            data: res.data
          });
        } else {
          // 处理非200状态码，尝试解析响应格式
          try {
            const { status, message, data } = res.data;
            reject({
              success: false,
              message: message || `请求失败(${res.statusCode})`,
              status: res.statusCode,
              data: data
            });
          } catch (e) {
            // 非标准格式，使用默认错误信息
            reject({
              success: false,
              message: `请求失败(${res.statusCode})`,
              status: res.statusCode,
              data: res.data
            });
          }
        }
      },
      fail: (err) => {
        console.error('请求失败:', url, err);
        reject({
          success: false,
          message: err.errMsg || '网络错误',
          error: err
        });
      }
    });
  });
};

/**
 * 文件上传方法
 * @param {Object} options - 上传选项
 * @returns {Promise} 返回Promise对象
 */
const uploadFile = (options) => {
  const app = getApp();
  const serverUrl = app.globalData.serverUrl || '';
  const token = app.globalData.token || '';

  // 拼接完整URL
  let url = options.url;
  if (!url.startsWith('http')) {
    url = serverUrl + url;
  }

  console.log('开始上传文件:', url);

  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: url,
      filePath: options.filePath,
      name: options.name || 'file',
      formData: options.data || {},
      header: {
        ...options.header,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      success: (res) => {
        console.log('文件上传成功:', url, res);
        
        try {
          // 解析返回的JSON字符串
          const parsedData = JSON.parse(res.data);
          const { status, message, data } = parsedData;
          
          if (status === "success") {
            resolve({
              success: true,
              message: message,
              data: data
            });
          } else {
            reject({
              success: false,
              message: message || '上传返回错误状态',
              data: data
            });
          }
        } catch (err) {
          // 解析失败，返回原始数据
          console.error('解析上传响应失败:', err);
          resolve({
            success: true,
            data: res.data
          });
        }
      },
      fail: (err) => {
        console.error('文件上传失败:', url, err);
        reject({
          success: false,
          message: '上传失败',
          error: err
        });
      }
    });
  });
};

module.exports = {
  request,
  uploadFile
};