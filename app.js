// app.js
App({
  globalData: {
    userInfo: null,      // 用户信息
    token: null,          // 自定义登录 Token（由后端生成）
    openId: null,        // 微信 OpenId
    serverUrl: 'http://localhost:8080', // 全局服务器地址
  },

  onLaunch() {
    this.checkLoginStatus(); // 检查登录状态
  },

  async checkLoginStatus() {
    // 如果已有 Token，直接验证有效性
    if (this.globalData.token) {
      const isValid = await this.validateToken(this.globalData.token);
      if (isValid) return; // Token 有效，无需重新登录
    }

    // 无有效 Token，执行登录流程
    await this.login();
  },

  // 执行登录逻辑
  async login() {
    try {
      // 1. 调用 wx.login 获取 code
      const { code } = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        });
      });

      // 2. 发送 code 到服务端，换取 token 和 openId
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: this.globalData.serverUrl + '/wx/login',
          method: 'POST',
          data: { code },
          success: (res) => resolve(res),
          fail: (err) => reject(err),
        });
      });

      // 3. 保存全局登录态
      this.globalData.token = res.data.token;
      this.globalData.openId = res.data.openid;

      // wx.getUserProfile({
      //   desc: '用于完善会员资料', // 必须填写用途说明（微信审核要求）
      //   success(res) {
      //     console.log('用户昵称:', res.userInfo.nickName);
      //     console.log('头像:', res.userInfo.avatarUrl);
      //     const userData = {
      //       nickName: res.userInfo.nickName,
      //       avatarUrl: res.userInfo.avatarUrl
      //     }
      //     this.globalData.userData = userData;
      //     // 其他字段：gender（性别）、city（城市）、province（省份）、country（国家）
      //   },
      //   fail(err) {
      //     console.error('获取失败:', err);
      //     // 用户拒绝授权时会触发
      //   }
      // });


    } catch (error) {
      console.error('登录失败:', error);
      // 可在此处提示用户重新登录
    }
  },

  // 验证 Token 有效性（示例）
  async validateToken(token) {
    const res = await wx.request({
      url: serverUrl + '/wx/validate',
      method: 'POST',
      data: { token }
    });
    return res.data.isValid;
  }
});