// pages/login/login.js
const app = getApp();

Page({
  data: {
    userInfo: '',
  },

  onLoad() {
    let user = wx.getStorageSync('user')
    //console.log("缓存获取成功",user)
    this.setData({
      userInfo: user
    });
    app.userInfo = user;
    //console.log("userInfo: ", app.userInfo);
  },

  getUserProfile: function (e) {
    wx.getUserProfile({
      desc: '请授权',
      success: res => {

        

        let user = res.userInfo
        // 把用户信息缓存到本地
        wx.setStorageSync('user', user)
        console.log("授权成功", res.userInfo);
        this.setData({
          userInfo: user
        });
        app.userInfo = user;
      },
      fail: res => {
        console.log("授权失败", res)
      }
    })
  },

  loginOut() {
    this.setData({
      userInfo: ''
    })
    app.userInfo = {};
    // 清除缓存
    wx.setStorageSync('user', null)
  }
})