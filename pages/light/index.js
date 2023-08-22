//index.js

const {
  getShort,
  db_submitContent,
  db_jumpToContent,
  db_getShared,
  db_setShared,
  db_getToken,
  escape,
} = require("../../utils/util");

//获取应用实例
const app = getApp();

Page({
  data: {
    /**picker选择器相关数据 */
    langsArr: ["Unknow", "C/C++", "Python", "Java", "JavaScript", "HTML", "CSS", "C#", "Shell", "Swift"],
    langKeysArr: ["Unknow", "c", "python", "java", "js", "html", "css", "c#", "shell", "swift"],
    langIndex: 0,

    timeUnitArr: ["分钟", "小时", "天"],
    timeUnits: [60, 3600, 86400],
    timeUnitIndex: 0,

    isloading: true,
    article: {}, //最后解析出来用于template的json数据集
    timer: undefined,

    /*内容区 */
    codeText: null,
    input: "", //当输入框失去焦点时会获取数据到这里
    textInput: "", //编辑框显示内容
    renderState: false,
    contentID: "",
    myid: 0,

    md: "", //转换后的md格式文本
    showReturnTopBtn: false, //返回顶部按钮
    showBottomModal: false, //模态框
    neverDestory: true,
    timeInput: 10,

    isPublic: true, //密码
    pwdInput: "",

    showSucceedModal: false, //发布成功对话框
    isLoading: false, // 加载中

    /**滑动超过一定距离，显示返回顶部按钮*/
    showReturnTopBtnDepth: 700,
  },

  onLoad: function (option) {
    db_getToken((res)=>{
      console.log(res)
      let csrftoken = (res.cookies[0].split(';')[0]).split('=')[1];
      console.log(csrftoken);
      wx.setStorageSync('csrftoken', res.data.token);
      console.log(res.header['Set-Cookie']);
      wx.setStorageSync('cookie', res.header['Set-Cookie']);
    })
    app.getLocalStorage();
    //获取最近选用的语言
    var langid = parseInt(wx.getStorageSync('lang'));
    if (langid)
      this.setData({
        langIndex: langid
      });
    else
      wx.setStorageSync('lang', 0);
  },

  bindPickerEvent: function (e) {
    this.setData({
      langIndex: e.detail.value,
    });
    if (this.data.renderState) {
      this.transMD();
    }
    wx.setStorageSync('lang', this.data.langIndex);
  },

  bindTimePickerEvent: function (e) {
    this.setData({
      timeUnitIndex: e.detail.value,
    });
  },

  bindTextAreaInput: function (e) {
    this.setData({
      input: e.detail.value,
    });
    ////console.log(this.data.input);
  },

  hideModal() {
    this.setData({
      showBottomModal: false,
      showSucceedModal: false,
      timeInput: "10"
    });
  },

  showModal(event) {
    console.log(46959);
    this.setData({
      showBottomModal: true
    });
    console.log(123);

  },

  onFormSubmit(event) {
    var type = event.detail.target.dataset.type;
    var content = event == null ? this.data.textInput : (event.detail.value["code"] ? event.detail.value["code"] : this.data.textInput);
    if (content == "") {
      wx.showModal({
        title: "提示",
        content: "内容不能为空",
        showCancel: false,
      })
      return;
    }
    //console.log(content);

    if (type == "show") {
      this.showHighlight(event);
    } else if (type == "modal") {
      console.log("a5d");
      this.showModal();
    } else if (type == "save") {
      this.hideModal();
      this.saveContent(event);
      console.log("??");
    }
  },

  showHighlight: function (event) {
    const code = event.detail.value["code"]; // 解构 用"name"属性作为变量名，可以获取对应组件的值
    this.setData({
      renderState: !this.data.renderState,
    });


    if (!code) return;
    this.setData({
      textInput: code,
    });
    if (this.data.renderState) {
      this.transMD();
    }
  },


  //这是我从test中抽离的部分代码，去除了网络请求，仅解析文本
  transMD: function () {
    let _ts = this;
    let dots = "\`\`\`";
    let data =
      dots +
      this.data.langKeysArr[this.data.langIndex] +
      "\n" +
      this.data.textInput +
      "\n" +
      dots;

    ////console.log(data);
    this.setData({
      md: data
    });
  },

  // 分享
  onShareAppMessage: function (e) {
    let that = this;
    var userInfo = app.globalData.user;
    return {
      title: "CodeShareX",
      path: "/pages/light/index",
    };
    // return {
    //   title: userInfo.nickName + "给你分享了一段代码",
    //   path: "/pages/share/share?contentID=" + that.data.contentID,
    // };
  },

  //清空输入框
  clearContent: function (e) {
    this.setData({
      textInput: "",
      renderState: false
    });
  },


  // 保存输入框中的值
  saveContent(e) {
    if(!app.checkLogin(this)) return;

    const content = e == null ? this.data.textInput : (e.detail.value["code"] ? e.detail.value["code"] : this.data.textInput);
    const o = app.globalData.openid;
    if (!o || o == null)
      return;
    //console.log("o:", o);
    const that = this;
    const TIME = app.getTime(); //formatTime(new Date());
    var mine = app.mine;
    var realTime = Math.round(new Date().getTime() / 1000);
    var destoryTime = realTime + parseInt(e.detail.value["delTime"]) * this.data.timeUnits[e.detail.value["timeUnit"]];
    console.log(destoryTime);

    const datas = {
        content: escape(content),
        lang: that.data.langsArr[that.data.langIndex],
        neverDestory: e.detail.value["neverDestory"]?1:0,
        destoryTime: destoryTime,
        postTime: realTime,
        password: this.data.isPublic ? "" : e.detail.value["pwd"],
        time: TIME,
        short: escape(getShort(content)),
        openid: app.globalData.openid
    };
    
    db_submitContent(datas,
      function (contentid) {
        //跳转到对应页面
        wx.navigateTo({
          url: '../share/share?contentID=' + contentid,
        });
      }
    );
  },

  onSearchSubmit: function (e) {
    var search = e.detail.value.search;
    if (!(/^([0-9]{1,})$/g).test(search)) { //正则匹配：全是数字
      wx.showToast({
        title: 'ID应为数字',
        icon: 'error'
      })
      return;
    }

    var id = parseInt(search);
    db_jumpToContent(id);
  },

  onPageScroll: function (e) {
    ////console.log(e.scrollTop);
    this.setData({
      showReturnTopBtn: e.scrollTop > this.data.showReturnTopBtnDepth
    });
  },

  scrollToTop: function (e) {
    //console.log("返回顶部");
    // 1.使用wx.createSelectorQuery()查询到需要滚动到的元素位置
    wx.createSelectorQuery().select('.buttonstyle').boundingClientRect(res => {
      // 到这里，我们可以从res中读到class为bb4的top，即离顶部的距离（px）
      // 2使用wx.pageScrollTo()将页面滚动到对应位置
      wx.pageScrollTo({
        scrollTop: res.top, // 滚动到的位置（距离顶部 px）
        duration: 500 //滚动所需时间 如果不需要滚动过渡动画，设为0（ms）
      })
    }).exec()
  },

  //时间数字限制
  bindinputTime(e) {
    let value = this.validateNumber(e.detail.value);
    if (value == "") value = "0";
    ////console.log(value);
    //this.setData({timeInput: value});
  },

  validateNumber(val) {
    return val.replace(/\D/g, '').replace(/^0/g, '').substr(0, 5);
  },


  onSwitchChange: function (e) {
    var type = e.currentTarget.dataset.type;
    console.log("switch", e);
    if (type == "neverDestory") {
      //永不销毁switch
      this.setData({
        neverDestory: e.detail.value
      });
    } else {
      this.setData({
        isPublic: e.detail.value
      });
    }
  },

  getContentID: function (e) {
    contentID = e.detail.value;
  },

  //密码限制
  bindinputPwd(e) {
    let value = this.validateNumber(e.detail.value);
    this.setData({
      pwdInput: value
    });
  },
});