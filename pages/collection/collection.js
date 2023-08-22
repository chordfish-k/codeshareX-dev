// pages/collection/collection.js

const {
  db_getCollections,
  db_getContent,
  db_setCollections,
  db_getUserInfo,
  formatTime,
  DBBase,
} = require('../../utils/util')

const app = getApp();

Page({
  data: {
    /**滑动超过一定距离，显示返回顶部按钮*/
    showReturnTopBtnDepth: 700,
    /**收藏列表 */
    collections: [],
  },


  refresh: function () {
    if(!app.checkLogin(this)) return;
    
    //检测是否已被销毁
    //console.log("刷新",app.deleteLastCard)
    if (app.deleteLastCard) {
      app.deleteLastCard = false;
      this.deleteCard(app.lastCard.id, app.lastCard.contentID);
      return;
    }

    //拉取收藏
    const that = this;
    const o = app.globalData.openid;
    console.log("o:", o);

    var cardsData = [];
    var tmpMap = {};
    var cnt = 0;

    db_getCollections(o,
      (arr) => {
        if (arr.length > 0) {
          for (let i = 0; i < arr.length; i++) {
            const id = arr[i];
            db_getContent(id,
              (json) => {
                // db_getUserInfo(json.posterInfo.openid, function(userInfo){
                tmpMap[id] = {
                  contentID: id,
                  photo: DBBase + json.posterInfo.avatarUrl,
                  name: json.posterInfo.nickName,
                  lang: json.lang,
                  time: json.posterInfo.postTime,
                  neverDestory: json.neverDestory,
                  destoryTimeStr: json.posterInfo.destTime,
                  // destoryTimeStr: json.neverDestory ? "无" : formatTime(new Date(json.destoryTime * 1000)),
                  short: json.posterInfo.short,
                };
                cnt++
                //拿完最后一项收藏的数据后，更新data
                if (cnt == arr.length) {
                  for (let i = 0; i < arr.length; i++) {
                    cardsData[i] = tmpMap[arr[arr.length-i-1]];
                  }
                  //console.log("cardsData:", cardsData);
                  that.setData({
                    collections: cardsData,
                  });
                }
                // });
              }
            );
          }
        }
        else {
          that.setData({
            collections: []
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
    console.log("url: ", '../share/share?contentID=' + e.currentTarget.dataset.contentid);

    wx.navigateTo({
      url: '../share/share?contentID=' + e.currentTarget.dataset.contentid,
    });
  },

  /**弹出确认删除提示框 */
  tryDeleteCard: function (e) {
    //console.log(e);
    let that = this;
    wx.showModal({
      title: "提示",
      content: "要取消收藏吗",

      success(res) {
        if (!res.cancel) { //确认删除
          that.deleteCard(e.currentTarget.dataset.index, e.currentTarget.dataset.contentid);
          //console.log("确认删除");
        } else {
          //console.log("取消删除");
        }
      },
      fail(err) {
        //console.log(err);
      }
    });
  },

  /**删除一项 */
  deleteCard: function (id, contentid) {
    const that = this;
    //仅删收藏，不删原文件
    db_setCollections(app.globalData.openid, contentid, 0,
      ()=>{
        this.refresh();
      });
  },


  onPageScroll: function (e) {
    ////console.log(e.scrollTop);
    this.setData({
      showReturnTopBtn: e.scrollTop > this.data.showReturnTopBtnDepth
    });
  },

  scrollToTop: function (e) {
    //console.log("返回顶部");
    wx.pageScrollTo({
      scrollTop: 0, // 滚动到的位置（距离顶部 px）
      duration: 500 //滚动所需时间 如果不需要滚动过渡动画，设为0（ms）
    });
  },
})