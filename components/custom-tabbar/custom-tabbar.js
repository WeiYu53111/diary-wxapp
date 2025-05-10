Component({
  properties: {
    active: Number,  // 传入当前选中的 tab 索引
  },
  methods: {
    onChange(event) {
      console.log('tabChange', event.detail);
      const index = event.detail;
      const urls = [
        '/pages/index/index',
        '/pages/myself/myself'
      ];
      if (urls[index] !== getCurrentPages().slice(-1)[0].route) {
        //debugger; // 添加断点
        // 如果传入了钩子函数，则执行钩子函数
        console.log('触发beforeChange事件');
        this.triggerEvent('beforeChange', { info: '123' }) // 触发事件
        console.log('已经完成触发beforeChange事件');

        wx.redirectTo({ url: urls[index] });
      }
    }
  }




});
