const {
  db_getShared,
  db_getCollections,
  db_getUserInfo,
  DBBase,
  db_getMessages,
  getOpenid
} = require("../../utils/util");

const app = getApp();

Page({
  data: {
    userInfo: null,
    mine: [],
    last: "",

    // 中部数据区
    sharedCount: 0,
    collectionCount: 0,
    messageCount: 0
  },


  onShow(e) {
    const o = app.globalData.openid;
    if (!o) return;
    const that = this;
    console.log("缓存获取成功", o);
    // db_getUserInfo(o,
    //   function (userInfo) {
    //     //加上随机参数，强制刷新头像
    //     //userInfo.avatarUrl += "?t=" + parseInt(Math.random() * 100);
    //     console.log("ava:", userInfo.avatarUrl);
    //     that.setData({
    //       userInfo: userInfo,
    //     });
    //   });
    this.setData({
      userInfo: app.globalData.user,
    },()=>{console.log("avatar", this.data.userInfo.avatarUrl)});
    console.log("gb:", app.globalData.user)
    this.refreshData();
  },

  getUserProfile: function (e) {
    const that = this;

    let user = app.globalData.defaultUser;
    getOpenid(
      (openid) => {
        
        //登陆后的初始化
        user.openid = openid;
        app.globalData.openid = openid;
        wx.setStorageSync('openid', openid);

        that.refreshData();

        db_getUserInfo(openid, function (userInfo) {
          userInfo.avatarUrl = DBBase + userInfo.avatarURL
          console.log("userInfo: ", userInfo);
          wx.setStorageSync("user", userInfo); //保存用户信息
          app.globalData.user = userInfo;

          that.setData({
            userInfo: userInfo,
          });

          //跳回先前的頁面
          if (that.data.last && that.data.last != "undefined") {
            wx.navigateTo({
              url: '../share/share?contentID=' + that.data.last,
            })
          }
        });
    });
  },

  refreshData() {
    const o = app.globalData.openid;
    const that = this;
    console.log("o:", o);
    if (!o) return;

    db_getShared(o,
      (arr) => {
        that.setData({
          sharedCount: arr.length
        });
      });
    db_getCollections(o,
      (arr) => {
        that.setData({
          collectionCount: arr.length
        });
      });
    db_getMessages(o,
      (arr) => {
        let cnt = 0;
        for (let i=0; i<arr.length; i++) {
          cnt += (1-arr[i].is_read);
        }
        that.setData({
          messageCount: cnt
        });
      });
  },

  loginOut() {
    this.setData({
      userInfo: null,
      sharedCount: 0,
      collectionCount: 0,
    });
    // 清除缓存
    wx.setStorageSync("user", null);
    wx.setStorageSync("openid", null);
    app.globalData.user = app.globalData.defaultUser;
    app.globalData.openid = null;
  },

  toMyHistory: function (e) {
    wx.reLaunch({
      url: '../myHistory/myHistory',
    })
  },

  toMessages: function (e) {
    wx.navigateTo({
      url: '../message/message',
    })
  },

  showQrcode() {
    wx.previewImage({
      urls: ['https://s2.loli.net/2022/04/26/YH83zg4EiKmMXlb.jpg'],
      current: 'https://s2.loli.net/2022/04/26/YH83zg4EiKmMXlb.jpg' // 当前显示图片的http链接      
    })
  },

  toCollections() {
    wx.reLaunch({
      url: '../collection/collection',
    });
  },

  toUserInfo() {
    wx.navigateTo({
      url: 'userInfo/userInfo',
    })
  }
});