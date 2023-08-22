//index.js

const {
  getShort,
  formatTime,
  db_getComment,
  db_addComment,
  db_getContent,
  db_submitContent,
  db_getShared,
  db_getCollections,
  db_setCollections,
  db_updateContent,
  db_deleteContent,
  db_getUserInfo,
  safe,
  formatCommentId,
  DBPath,
  DBBase
} = require("../../utils/util");

//获取应用实例
const app = getApp();

Page({
  data: {
    winHeight: "100rpx",
    //picker选择器相关数据
    langsArr: ["Unknow", "C/C++", "Python", "Java", "JavaScript", "HTML", "CSS", "C#", "Shell", "Swift"],
    langKeysArr: ["Unknow", "c", "python", "java", "js", "html", "css", "c#", "shell", "swift"],
    langIndex: 0,
    lang: "",

    timeUnitArr: ["分钟", "小时", "天"],
    timeUnits: [60, 3600, 86400],
    timeUnitIndex: 0,

    isSelf: false,
    collectedColor: "yellow",
    uncollectedColor: "blue",

    /**定时删除 */
    destoryTime: 0,
    destoryTimeStr: 0,
    postTime: 0,
    neverDestory: true,

    //内容区
    tempJson: null,
    input: "", //当输入框失去焦点时会获取数据到这里
    textInput: "", //编辑框显示内容
    renderState: true,
    firstRender: true,
    contentID: "",
    myid: 0,
    isCollected: false,
    md: "",
    isLoad: false,
    password: "",
    isLocked: false,

    /**是否有密码 */
    isPublic: true, 
    pwdInput: "",

    /**当前子页面 */
    TabCur: 0,

    /**评论区 */
    commentsNums: 0,
    inputValue: null,
    talk: "",
    scrollToView: "",
    commentBarData: {
      isShow: false, // 评论框弹层弹窗是否显示
      isClear: false // 是否清空上次的数据
    },
    talks: [], // 评论列表

    showReturnTopBtn: false,
    showBottomModal: false, //模态框
    neverDestory: true,
    timeInput: "10",

    /**滑动超过一定距离，显示返回顶部按钮*/
    showReturnTopBtnDepth: 100,
  },

  bindPickerEvent: function (e) {
    this.setData({
      langIndex: e.detail.value,
    });
    if (this.data.renderState) {
      this.transMD();
    }
  },

  bindTextAreaInput: function (e) {
    this.setData({
      input: e.detail.value,
    });
    //console.log(this.data.input);
  },

  onFormSubmit: function (e) {

    var that = this;
    // 内容安全审查

    var ctn = e == null ? this.data.textInput : (e.detail.value["code"] ? e.detail.value["code"] : this.data.textInput);
    //console.log(ctn);
    this.setData({
      textInput: ctn
    })

    if (e == null) { //初次渲染
      that.transMD();
      that.setData({
        isLoad: !this.data.renderState ? true : false,
      });

      that.setData({

          renderState: that.data.firstRender ? "true" : !that.data.renderState,
          textInput: that.data.renderState ? that.data.input : that.data.textInput,
          firstRender: false
        },
        function () {
          that.setData({
            isLoad: false
          });
        });
    } else {
      var type = e.detail.target.dataset.type;
      if (type == "modify") { //按下修改按钮
        that.setData({
          renderState: !that.data.renderState,
          textInput: ctn,
        });
        if (that.data.renderState) {
          that.transMD();
          that.modify(e, ctn);
        }

      } else if (type == "clone") { //按下转存按钮
        that.hideModal();
        that.onCloneButton(e);
        //console.log(e);
      }
    }
  },

  modify(e, ctn) {
    this.saveContent(e);
  },

  hideModal() {
    this.setData({
      showBottomModal: false,
      timeInput: "10"
    });
  },

  showModal(event) {
    this.setData({
      showBottomModal: true
    });
  },

  //解析文本
  transMD: function () {
    let _ts = this;
    let dots = "```";
    let data =
      dots +
      this.data.langKeysArr[Math.max(this.data.langsArr.indexOf(this.data.lang), 0)] +
      "\n" +
      this.data.input +
      "\n" +
      dots;
    this.setData({
      md: data
    });
  },

  //转存
  onCloneButton: function (e) {
    const o = app.globalData.openid;
    const that = this;

    const TIME = app.getTime(); 

    var realTime = Math.round(new Date().getTime() / 1000);
    var destoryTime = realTime + parseInt(e.detail.value["delTime"]) * this.data.timeUnits[e.detail.value["timeUnit"]];

    var datas = {
      content: this.data.input,
      short: getShort(that.data.textInput),
      openid: app.globalData.openid,
      neverDestory: e.detail.value["neverDestory"]?1:0,
      destoryTime: destoryTime,
      postTime: realTime,
      lang: this.data.lang,
      password: this.data.isPublic ? "" : e.detail.value["pwd"]
    };
    //const json = JSON.stringify({data:datas});

    db_submitContent(datas,
      function (contentid) {
        wx.reLaunch({
          url: '../myHistory/myHistory',
        })
      }
    );
  },

  onCopyButton: function (e) {
    wx.setClipboardData({
      data: this.data.textInput,
    })
  },

  onCollectButton: function (e) {
    const that = this;
    const o = app.globalData.openid;
    const isColl = this.data.isCollected;
    this.setData({
      isCollected: ! isColl
    });

    db_setCollections(o, parseInt(that.data.contentID), (!isColl)?1:0)
    app.isClickedCollection = true;
  },



  /**生成分享 */
  onShareAppMessage: function (e) {
    const userInfo = app.globalData.user;
    const that = this;
    const shareUrl = "/pages/share/share?contentID=" + that.data.contentID + "&locked=" + (that.data.password == "");
    const res = {
      title: userInfo.nickName + "给你分享了一段代码",
      path: shareUrl
    };
    //console.log(res);
    return res;
  },

  onReady() {
    this.setData({
      TabCur: this.data.temp.tab,
    }, ()=>{
      this.setData({scrollToView: this.data.temp.scrollToID});
    });
  },

  

  // 加载
  onLoad: function (e) {
    const that = this;
    wx.getSystemInfo({
      success: function (res) {
        //屏幕的宽度/屏幕的高度 = 微信固定宽度(750)/微信高度
        that.setData({
          winHeight: res.windowHeight-((res.windowWidth)*90/750)+'px' //90为导航的告诉80+10(margin-bottom)  
        })
      }
    });

    console.log("id: ", e.contentID, "tab: ", e.tab, "a: ", e.a);
    //const that = this;
    const scrollToID = "talks_" + formatCommentId(e.a);

    this.setData({
      contentID: e.contentID,
      temp: {
        'tab': e.tab,
        'scrollToID': scrollToID
      },
      neverDestory: true
    });
    const TIME = formatTime(new Date());
    that.setData({
      time: TIME,
    });
    // console.log('contentID', e.contentID)
    db_getContent(e.contentID, 
      (json) => {
        // console.log('json', json)
        // db_getUserInfo(json.posterInfo.openid,
        //   function(userInfo){
            // console.log('userInfo', userInfo)
            const isSelf = app.globalData.openid == null ? false : (json.posterInfo.openid == app.globalData.openid);
            var content = json.content
            console.log(json)
            //content = safe(content)

            that.setData({
              tempJson: json,
              input: content, //当输入框失去焦点时会获取数据到这里
              textInput: content, //编辑框显示内容
              lang: json.lang,
              myid: e.contentID,
              postTime: formatTime(new Date(json.postTime)),
              // destoryTimeStr: json.neverDestory ? "无" : formatTime(new Date(json.destoryTime * 1000)),
              destoryTime: json.destoryTime,
              neverDestory: json.neverDestory,
              password: (json.password) ? json.password : "",
              isLocked: (json.password && e.locked == "true") ? true : false,
              posterInfo: {
                postTime: json.posterInfo.postTime, //获得发布时间
                destTime: json.posterInfo.destTime,
                belong: json.contentID, //获取当前文本id
                name: isSelf ? app.globalData.user.nickName : json.posterInfo.nickName,
                //photo: app.globalData.user.avatarUrl,
                photo: isSelf ? app.globalData.user.avatarUrl : DBBase + json.posterInfo.avatarUrl,
              },
              isSelf: isSelf
            }, function () {
              that.checkOutdate();
              that.checkIsLocked();
              that.onFormSubmit(null);
              //console.log("查询成功", res.data);
            });
          //});
        
      }  
    );

    //获取用户信息
    this.setData({
      userInfo: app.globalData.user
    });

    //留言显示，按照留言顺序，最新的在最上面
    this.refreashComments();

    //是否已经被收藏
    db_getCollections(app.globalData.openid,
      (arr) => {
        that.setData({
          isCollected: arr.indexOf(parseInt(e.contentID)) > -1
        })
      }
    );
  },

  checkOutdate() {
    const that = this;
    //检测是否已到删除时间
    //console.log("是否自动销毁: ", !this.data.neverDestory);
    if (!this.data.neverDestory) {
      //console.log("删除时间为：",this.data.destoryTimeStr, this.data.destoryTime);
      const now = new Date().getTime() / 1000;
      if (now > this.data.destoryTime) {
        //删除
        //DB.doc(this.data.contentID).remove();
        db_deleteContent(app.globalData.openid, this.data.contentID,
          (res)=>console.log(res));
        //给全局变量删除card的信息
        
        console.log(this.data.contentID);
        wx.showModal({
          title: "提示",
          content: "该分享已被销毁",
          showCancel: false,
          success(e) {
            that.backToLastPage(true);
          }
        });
        return;
      }
    }
  },

  checkIsLocked() {
    //检测是否已经解锁

    var isself = this.data.isSelf;
    var haspwd = this.data.password;
    console.log("is self: ", this.data.isSelf, "pwd: ", this.data.password);
    if (!isself && haspwd) {
      this.setData({
        isLocked: true,
      });
      return;
    }
    /*
    if (!findPwd) {
      for (var i = 0; i < app.mine.length; i++) {
        if (this.data.myid == app.mine[i].myid) {
          if (!app.mine[i]["locked"]) {
            this.setData({
              isLocked: false,
            });
            findPwd = true;
          }
        }
      }
    }
    if (!findPwd) {
      for (var i = 0; i < app.collections.length; i++) {
        if (this.data.myid == app.collections[i].myid) {
          if (!app.collections[i]["locked"]) {
            this.setData({
              isLocked: false,
            });
          }
        }
      }
    }*/
  },

  backToLastPage: function (deleteCard) {
    wx.navigateBack({
      delta: 0,
      success(e) {

        app.deleteLastCard = deleteCard;
        const pages = getCurrentPages();
        var prePage = pages[pages.length - 1];
        if (prePage == undefined || prePage == null) return;
        //console.log(prePage);
        if (prePage.refresh != undefined)
          prePage.refresh();

      }
    });
  },

  // 将输入框的内容存入数据库
  // 获取输入框中的值
  inputContent: function (e) {
    //content = e.detail.value;
  },

  // 保存输入框中的值
  saveContent: function (e) {
    const nJson = this.data.tempJson;
    const input = this.data.textInput;
    //console.log(input);

    // nJson.content = input;
    // nJson.posterInfo.short = getShort(input);


    db_updateContent(app.globalData.openid, this.data.myid, input);

    // db_updateContent(this.data.contentID, 
    //   ,
    //   ()=>{
    //     this.setData({
    //       tempJson: nJson,
    //       input: input
    //     });
    //   }
    // );
  },

  //查询数据
  /*getContent() {
    DB.doc(contentID)
      .get()
      .then((res) => {
        content = res.data.content;
        this.setData({
          input: content, //当输入框失去焦点时会获取数据到这里
          textInput: content, //编辑框显示内容
        });
        //console.log("查询成功", res.data.content);
      })
      .catch((err) => {
        console.log("查询失败");
      });
  },*/

  getContentID(e) {
    contentID = e.detail.value;
  },

  talkInput: function (e) {
    const that = this;
    that.setData({
      talk: e.detail.value,
    });
  },

  refreashComments: function () {
    db_getComment(this.data.contentID, this);
  },

  submit: function (e) {
    const talk = e.detail.value["talk"];
    //console.log(talk);
    this.submitCommnet(talk);
    this.setData({
      inputValue: ""
    });
  },

  switchReply: function(e){
    const commentid = e.currentTarget.dataset.id;
    let talk = this.data.talk;
    talk = talk.replace(/^>>\d{6}:/, "");
    talk = ">>" + commentid + ":" + talk;
    console.log(talk);
    this.setData({
      talk: talk
    });
  },

  submitCommnet: function (talk) {
    if(!app.checkLogin(this)) return;

    if (talk) {
      //talk不为空的时候
      db_addComment(app.globalData.openid, talk, this, 
        ()=>{
          this.setData({
            talk: ""
          });
          this.refreashComments();
        });
    } else {
      // talk为0，输入框未输入数据
      wx.showModal({
        title: "提示",
        content: "评论不能为空",
        showCancel: false,
        confirmText: "我知道了",
      });
    }
  },

  onPageScroll: function (e) {
    if (this.data.TabCur == 0) {
      this.setData({
        showReturnTopBtn: e.scrollTop > this.data.showReturnTopBtnDepth
      });      
    }
  },

  onCommentScroll: function (e) {
    this.setData({
      showReturnTopBtn: e.detail.scrollTop > this.data.showReturnTopBtnDepth
    });
  },

  scrollToTop: function (e) {
    //console.log("返回顶部");
    // 1.使用wx.createSelectorQuery()查询到需要滚动到的元素位置
    wx.createSelectorQuery().select('.buttons').boundingClientRect(res => {
      // 到这里，我们可以从res中读到class为bb4的top，即离顶部的距离（px）
      // 2使用wx.pageScrollTo()将页面滚动到对应位置
      this.setData({
        scrollToView: "top"
      },()=>{
        wx.pageScrollTo({
          scrollTop: res.top, // 滚动到的位置（距离顶部 px）
          duration: 500 //滚动所需时间 如果不需要滚动过渡动画，设为0（ms）
        })
      })
      
    }).exec()
  },

  //时间数字限制
  bindinputTime(e) {
    let value = this.validateNumber(e.detail.value);
    if (value == "") value = "0";
    //console.log(value);
    this.setData({
      timeInput: value
    });
  },

  validateNumber(val) {
    return val.replace(/\D/g, '').replace(/^0/g, '').substr(0, 5);
  },

  //永不销毁switch
  onSwitchChange: function (e) {
    this.setData({
      neverDestory: e.detail.value
    });
  },

  copyID: function (e) {
    wx.setClipboardData({
      data: this.data.myid.toString(),
      success(e) {
        wx.showToast({
          title: '复制ID成功',
        })
      }
    })
  },

  handleIsShowComment() {
    this.setData({
      'commentBarData.isShow': true,
      'commentBarData.id': 0,
      'commentBarData.typeName': 'card',
      'commentBarData.isClear': this.data.commentBarData.isClear
    })
  },

  myeventEvaluationData(event) {
    let {
      isShow,
      typeName,
      content
    } = event.detail
    let data = this.data.commentBarData;
    if (!data.isShow) return;
    if (typeName) { // 点击了发布评论按钮
      //console.log(content);
      this.setData({
        'commentBarData.isShow': false,
        'commentBarData.isClear': true,
      });
      this.submitCommnet(content);
    } else {
      this.setData({
        'commentBarData.isShow': isShow,
        'commentBarData.isClear': false
      });

    }
  },

  tabSelect(e) {

    this.setData({
      TabCur: e.currentTarget.dataset.id,
    })
  },
  talkForcechange(e) {
    //console.log(e);
  },

  //解锁密码
  onPasswordInput(e) {
    this.setData({
      inputPwd: e.detail.value
    });
  },

  onSubmitPassword(e) {
    
    if (this.data.password == this.data.inputPwd) {
      this.setData({
        isLocked: false
      });
/*
      for (var i = 0; i < app.mine.length; i++) {
        if (this.data.myid == app.mine[i].myid) {
          app.mine[i]["locked"] = false;
        }
      }
      //console.log(app.mine);

      db.collection("my").doc(app.user).update({
        data: {
          mine: app.mine
        }
      }).catch(e => {
        //console.log("失败");
      });*/
    } else {
      wx.showModal({
        title: "错误",
        content: "密码不正确"
      });
    }
  },

  onSwitchChange(e) {
    var type = e.currentTarget.dataset.type;
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

  //密码限制
  bindinputPwd(e) {
    let value = this.validateNumber(e.detail.value);
    this.setData({
      pwdInput: value
    });
  },

  // 举报
  submitComplain(){
    //showCancel:是否显示取消按钮
    //cancelText，cancelColor，confirmText，confirmColor可设置
    wx.showModal({
      title: '举报',
      content: '是否举报该内容？',
      showCancel: true,
      success(res) {
        if (res.confirm) {

        } else if (res.cancel) {

        }
      }
    })

  },


  scrollToComment(e) {
    console.log(e.target.dataset.id)
    this.setData({
      scrollToView: e.target.dataset.id
    },()=>{
      console.log("->",this.data.scrollToView)
    })
  },
});