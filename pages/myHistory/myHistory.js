const {
  db_getShared,
  db_getCollections,
  db_setCollections,
  db_getContent,
  db_setShared,
  db_deleteContent,
  db_getUserInfo,
  formatTime
} = require("../../utils/util");

const app = getApp();

Page({
  data: {
    /**用户信息 */
    userInfo: "",
    /**滑动超过一定距离，显示返回顶部按钮*/
    showReturnTopBtnDepth: 700,
    /**是否显示返回顶部按钮 */
    showReturnTopBtn: false,
    /**已发布的代码列表 */
    mine: []
  },



  onLoad: function (options) {
    const o = app.globalData.openid;
    this.setData({
      userInfo: o,
    });
  },

  refresh: function () {
    if (!app.checkLogin(this)) return;

    //检测是否已被销毁
    if (app.deleteLastCard) {
      app.deleteLastCard = false;
      this.deleteCard(app.lastCard.id, app.lastCard.contentID);
      return;
    }

    //拉取收藏
    const that = this;
    const o = app.globalData.openid;

    var cardsData = [];
    var tmpMap = {};
    var cnt = 0;


    const userInfo = app.globalData.user;
    db_getShared(o,
      (arr) => {
        //console.log("shared count:", arr.length);
        if (arr.length > 0) {
          for (let i = 0; i < arr.length; i++) {
            const id = arr[i];
            db_getContent(id,
              (json) => {
                // console.log(userInfo)
                tmpMap[id] = {
                  contentID: id,
                  photo: userInfo.avatarUrl,
                  name: userInfo.nickName,
                  lang: json.lang,
                  time: json.posterInfo.postTime,
                  neverDestory: json.neverDestory,
                  destoryTimeStr: json.posterInfo.destTime,//json.neverDestory ? "无" : formatTime(new Date(json.destoryTime * 1000)),
                  short: json.posterInfo.short,
                };

                cnt++
                //拿完最后一项收藏的数据后，更新data
                if (cnt == arr.length) {
                  for (let i = 0; i < arr.length; i++) {
                    cardsData[i] = tmpMap[arr[arr.length - i - 1]];
                  }
                  //console.log("cardsData:", cardsData);
                  that.setData({
                    mine: cardsData,
                  });
                }
              }
            );
          }
        } else {
          that.setData({
            mine: []
          });
        }
      }
    );
  },

  onShow: function () {
    this.refresh();
  },

  onTapCard: function (e) {
    //存一下点击的卡片信息
    app.lastCard = {
      id: e.currentTarget.dataset.index,
      contentID: e.currentTarget.dataset.contentid,
    }
    wx.navigateTo({
      url: '../share/share?contentID=' + e.currentTarget.dataset.contentid,
    });
  },

  tryDeleteCard: function (e) {
    const that = this;
    wx.showModal({
      title: "提示",
      content: "要删除该分享吗",
      success(res) {
        if (!res.cancel) { //确认删除
          const dataset = e.currentTarget.dataset;
          that.deleteCard(dataset.index, dataset.contentid);
          console.log("确认删除");
        } else {
          console.log("取消删除");
        }
      },
      fail(err) {
        console.log(err);
      }
    });
  },

  deleteCard: function (id, contentid) {
    const that = this;
    const o = app.globalData.openid;

    db_deleteContent(o, contentid, function(){
      that.refresh()
    });
  },


  //返回顶部按钮
  onPageScroll: function (e) {
    //console.log(e.scrollTop);
    this.setData({
      showReturnTopBtn: e.scrollTop > this.data.showReturnTopBtnDepth
    });
  },

  scrollToTop: function (e) {
    console.log("返回顶部");
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 500
    });
  }
});