Component({
  properties: {
    placeholder: {
      type: String,
      value: '请输入内容'
    },
    editorHeight: {
      type: Number,
      value: 300
    },
    keyboardHeight: {
      type: Number,
      value: 0
    },
    isIOS: {
      type: Boolean,
      value: false
    }
  },
  data: {
    formats: {}
  },
  ready() {
    console.log('开始执行editor的ready函数');
    // 使用 createSelectorQuery 获取 editor 实例
    this.createSelectorQuery()
      .select('#editor')
      .context(res => {
        this.setData({ editorCtx: res.context }, () => {
          console.log('editorCtx 初始化成功:', this.data.editorCtx);
          // 通知页面：editorCtx 初始化完成
          this.triggerEvent('editorReady', {}); 
        });
      })
      .exec();
  },
  methods: {

    onStatusChange(e) {
      const formats = e.detail;
      this.setData({
        formats
      });
    },
    format(e) {
      const {
        name,
        value
      } = e.currentTarget.dataset;
      if (!name) return;
      this.data.editorCtx.format(name, value);
    },
    insertImage(obj) {
      console.log('图片插入成功 from editor');
      this.data.editorCtx.insertImage({
        src: obj.src,
        success: obj.success || function () {
          console.log('图片插入成功');
        },
        fail: obj.fail || function (err) {
          console.error('图片插入失败:', err);
        }
      });
    },
    // 插入文本
    setContents(obj) {
      console.log('组件 this from editor',this);
      this.data.editorCtx.setContents({
        html: obj.html,
        success: obj.success || function () {
          console.log('编辑器内容恢复成功');
        },
        fail: obj.fail || function (err) {
          console.error('编辑器内容恢复失败:', err);
        }
      });
    },
    // 获取编辑器内容
    getContents(obj) {
      console.log('组件 this from editor',this);
      this.data.editorCtx.getContents({
        success: obj.success || function (res) {
          console.log('获取编辑器内容成功:', res);
        },
        fail: obj.fail || function (err) {
          console.error('获取编辑器内容失败:', err);
        }
      });
    },

    // 获取编辑器内容（异步封装）
    getContentsAsync() {
      return new Promise((resolve, reject) => {
        this.data.editorCtx.getContents({
          success: (res) => {
            console.log('获取编辑器内容成功:', res);
            resolve(res.html); // 成功时返回结果
          },
          fail: (err) => {
            console.error('获取编辑器内容失败:', err);
            reject(err); // 失败时返回错误
          }
        });
      });
    },

    // 清空编辑器内容
    clearContents() {
      this.data.editorCtx.clear({
        success: () => {
          console.log('编辑器内容清空成功');
        },
        fail: (err) => {
          console.error('编辑器内容清空失败:', err);
        }
      });
    },
  }
});