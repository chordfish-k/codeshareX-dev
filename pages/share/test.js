Page({
  data: {
    inputValue: null,
  },
 onLoad: function (options) {
  var TIME = formatTime(new Date());
  this.setData({
    time: TIME,
  });
  var that = this;
  wx.getUserInfo({
    success: function (res) {
      console.log(res);
      var avatarUrl = 'userInfo.avatarUrl';
      var nickName = 'userInfo.nickName';
      that.setData({
        avatarUrl: res.userInfo.avatarUrl,
        nickName: res.userInfo.nickName,
      })
    }
  })
    //原util
    const formatTime = (date) => {
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var hour = date.getHours();
    var minute = date.getMinutes();
    var second = date.getSeconds();
    return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
    }
    function formatNumber(n) {
      n = n.toString()
      return n[1] ? n : '0' + n
    }
    //留言显示，按照留言顺序，最新的在最上面
    const db = wx.cloud.database({
      env: '自己云开发数据库的ID'
    })
    db.collection('存储区的名字').get({
      success: res => {
        console.log(res.data.length)
        for (let i=res.data.length-1,j=0; i >= 0;i--,j++) {
          console.log(res.data[j])
          var talks = "talks[" + j + "]";
          that.setData({
            [talks]: res.data[i],
          })
        }
        }
    })
  },
    talkInput: function (e) {
    var that= this;
   that.setData({
      talk: e.detail.value
    });
  },
  submit: function (e) {
    if (this.data.talk) {  //talk不为空的时候
      const db = wx.cloud.database()
      db.collection('存储区的名字').add({
        data: {
          name: this.data.nickName,//获得用户名
          content: this.data.talk,//获得评论
          time: this.data.time,//获得评论时间
          photo: this.data.avatarUrl,//获得用户头像
        },
        success: res => {
          // 在返回结果中会包含新创建的记录的 _id
          this.setData({
            'inputValue': ''
          })
          wx.showToast({
            title: '评论成功',
          })	//成功将评论数据写入小程序云开发数据库
          var that = this;
          db.collection('存储区的名字').get({
            success: res => {
              console.log(res.data.length)
              for (let i = res.data.length - 1, j = 0; i >= 0; i-- , j++) {
                console.log(res.data[j])
                var talks = "talks[" + j + "]";
                that.setData({
                  [talks]: res.data[i],
                })		//将评论区刷新，显示最新的留言
              }
            }
          })
        },
        fail: err => { //未成功写入数据库
          wx.showToast({
            icon: 'none',
            title: '请检查网络'
          })
          console.error('[数据库] [新增记录] 失败：', err)
        }
      })
    }
    else {// talk为0，输入框未输入数据
      wx.showModal({
        title: '提示',
        content: '评论不能为空',
        showCancel: false,
        confirmText: '我知道了',
      })
    }
  }

})
