// const DBBase = "http://127.0.0.1:8000"
// const DBBase = "http://43.163.219.104"
const DBBase = "https://cs.hyperchordfish.cn"


const DBPath = DBBase + "/codesharex/";

const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

function getShort(str, lineNum = 5) {
  var ss = str.split("\n");
  str = ss.splice(0, lineNum).join("\n");
  return str;
}

function escape(str){
  console.log(str)
  return str.replace(/[<>&"'\\\n]/g, function (c) {
    return { '<': '&lt;', '>': '&gt;', '&': '&amp;',
              '\'': '&#39;', '\"': '&#39;', 
              //'\s':'&nbsp;', 
              '\\':'&sl;', 
              '\n':'&et;', 
              //'\t':'&tab;'
            }[c];
  });
}

function safe(str){
  var arrEntities = { 'lt': '<', 'gt': '>', 'nbsp': ' ', 'amp': '&', 'quot': '"', '#39': '\'', '\s':'nbsp', 'sl':'\\', 'et':'\n'};
  return str.replace(/&(lt|gt|nbsp|amp|quot|#39|sl|et);/ig, function (all, t) {
    return arrEntities[t];
  });
}
function getOpenid(success) {
  wx.login({
    success: function (res) { //请求自己后台获取用户openid
      console.log('code', res.code)
      wx.request({
        //url: DBPath + 'get_openid.php',
        url: DBPath + 'get-openid',
        data: {
          code: res.code
        },
        success: function (response) {
          console.log(response)
          const openid = response.data.openid;
          console.log('请求获取openid:' + openid); //可以把openid存到本地，方便以后调用

          if (success) {
            success(openid);
          }
        },
        fail: function (err) {
          console.log(err);
          wx.showModal({
            cancelColor: 'cancelColor',
            showCancel: true,
            title: 'A',
          })
        }
      });
    }
  })
}

function formatCommentId(id) {
  return (Array(6).join(0) + id).slice(-6);
}

function db_getComment(id, page) {
  const that = page;
  wx.request({
    // url:  DBPath + 'get_comment.php',
    url:  DBPath + 'get-comment',
    data: {
      belongs: id
    },
    success: function (res) {
      console.log(res)
      if (res.data.code != 200) return;
      for (let i = 0; i < res.data.list.length; i++) {
        res.data.list[i].comment = safe(res.data.list[i].comment);
        res.data.list[i].avatar = DBBase + res.data.list[i].avatar;
        res.data.list[i].idstr = formatCommentId(res.data.list[i].id);
        if (res.data.list[i].to) {
          res.data.list[i].to = formatCommentId(res.data.list[i].to);
        }
      }
      that.setData({
        talks: res.data.list,
      });
      // for (let i = res.data.length - 1, j = 0; i >= 0; i--, j++) {
      //   const talks = "talks[" + j + "]";
      //   res.data[i].time = formatTime(new Date(parseInt(res.data[i].time) * 1000));
      //   that.setData({
      //     [talks]: res.data[i],
      //   }); //将评论区刷新，显示最新的留言
      // }

      console.log("talks:", that.data.talks);
    },
    fail: function (err) {
      console.log(err)
    }
  });
}




function db_addComment(openid, text, page, sucess) {
  
  const that = page;
  const dataBox = {
    content: escape(text), //获得评论
    time: Math.round(new Date().getTime() / 1000), //获得评论时间
    belongs: that.data.contentID, //获取当前文本id
    openid: openid
  };

  console.log("comment: ", dataBox);

  wx.request({
    // url:  DBPath + 'add_comment.php',
    url:  DBPath + 'add-comment',
    method: 'POST',
    header: {
      'content-type': 'application/x-www-form-urlencoded',
      'cookie': wx.getStorageSync('cookie'),
      'X-CSRFToken':  wx.getStorageSync('csrftoken')
    },
    data: dataBox,
    success: function (res) {
      console.log(res);
      if (sucess) {
        sucess(res);
      }
    },
    fail: function (err) {
      console.log(err)
    }
  });
}

function db_submitContent(json, callback) {
  console.log("contentJson: ", json)
  wx.request({
    // url:  DBPath + 'add_content.php',
    url:  DBPath + 'add-content',
    method: 'POST',
    header: {
      'content-type': 'application/x-www-form-urlencoded',
      'cookie': wx.getStorageSync('cookie'),
      'X-CSRFToken':  wx.getStorageSync('csrftoken')
    },
    data: {
      content: json.content,
      short: json.short,
      lang: json.lang,
      openid: json.openid,
      neverDestory: json.neverDestory,
      destoryTime: json.destoryTime,
      postTime: json.postTime,
      password: json.password
    },
    success: function (res) {
      console.log(res.data);
      if (res.data.code != 200) return;
      callback?callback(res.data.contentid):0;
    },
    fail: function (err) {
      console.log(err);
    }
  });
}

function db_jumpToContent(id) {
  wx.request({
    // url:  DBPath + 'search_content.php',
    url:  DBPath + 'get-content',

    data: {
      id: id
    },
    success: function (res) {
      if (res.data.code==200) {
        var json = res.data;
        console.log(json);
        wx.navigateTo({
          url: '../share/share?contentID=' + id + "&locked=" + true,
        });
      } else {
        console.log(res);
      }
    },
    fail: function (err) {
      console.log(err)
    }
  });
}

function db_getContent(id, callback) {
  wx.request({
    // url:  DBPath + 'search_content.php',
    url:  DBPath + 'get-content',

    data: {
      id: id
    },
    success: function (res) {
      if (res.data.code!=200) return;
      console.log(res.data);
      var json = res.data;

      if (callback) {
        json.content = safe(json.content)
        json.posterInfo.short = safe(json.posterInfo.short)
        callback(json);
      } else {
        console.log(res);
      }
    },
    fail: function (err) {
      console.log(err)
    }
  });
}

function db_deleteContent(openid, contentid, callback) {
  wx.request({
    // url:  DBPath + 'delete_content.php',
    url:  DBPath + 'delete-content',
    method: 'POST',
    header: {
      'content-type': 'application/x-www-form-urlencoded',
      'cookie': wx.getStorageSync('cookie'),
      'X-CSRFToken':  wx.getStorageSync('csrftoken')
    },
    data: {
      openid: openid,
      contentid: contentid,
    },
    success: function (res) {
      //if (res.data.code != 200) return;
      callback?callback(res):0;
    },
    fail: function (err) {
      console.log(err)
    }
  });
}

function db_updateContent(openid, contentid, content, callback) {
  wx.request({
    // url:  DBPath + 'update_content.php',
    url:  DBPath + 'update-content',
    method: 'POST',
    header: {
      'content-type': 'application/x-www-form-urlencoded',
      'cookie': wx.getStorageSync('cookie'),
      'X-CSRFToken':  wx.getStorageSync('csrftoken')
    },
    header: {
      'content-type': 'application/x-www-form-urlencoded',
      'cookie': wx.getStorageSync('cookie'),
      'X-CSRFToken':  wx.getStorageSync('csrftoken')
    },
    data: {
      openid: openid,
      contentid: contentid,
      content: content,
      short: getShort(content)
    },
    success: function (res) {
      if (res.data.code != 200) return;
      callback?callback():0;
    },
    fail: function (err) {
      console.log(err)
    }
  });
}

function db_getCollections(openid, callback) {
  console.log(openid);
  wx.request({
    // url:  DBPath + 'get_collection.php',
    url:  DBPath + 'get-collect',

    data: {
      openid: openid,
    },
    success: function (res) {
      if (res.data.code != 200) return;
      callback?callback(res.data.list):0;
    },
    fail: function (err) {
      console.log(err);
    }
  });
}

function db_setCollections(openid, contentid, collect, sucess) {
  wx.request({
    // url:  DBPath + 'add_collection.php',
    url:  DBPath + 'set-collect',
    method: 'POST',
    header: {
      'content-type': 'application/x-www-form-urlencoded',
      'cookie': wx.getStorageSync('cookie'),
      'X-CSRFToken':  wx.getStorageSync('csrftoken')
    },
    data: {
      openid: openid,
      contentid: contentid,
      collect: collect
    },
    success: function (res) {
      console.log("收藏更新成功", res);
      if (sucess) {
        sucess(res);
      }
    },
    fail: function (err) {
      console.log("收藏更新失败", err);
    }
  });
}


function db_setUserInfo(openid, userInfo, sucess) {
  console.log("aaa:", userInfo)
  wx.request({
    // url:  DBPath + 'update_user.php',
    url:  DBPath + 'update-user',
    method: 'POST',
    header: {
      'content-type': 'application/x-www-form-urlencoded',
      'cookie': wx.getStorageSync('cookie'),
      'X-CSRFToken':  wx.getStorageSync('csrftoken')
    },
    data: {
      openid: openid,
      nickName: userInfo.nickName,
    },
    success: function (res) {
      if (res.data.code == 200) {
        console.log("信息更新成功", res);
        sucess?sucess(res):0;
      }
    },
    fail: function (err) {
      console.log("信息更新失败", err);
    }
  });
}

function db_createUser(success) {
  wx.login({
    success: function (res) { //请求自己后台获取用户openid
      console.log('code', res.code)
      wx.request({
        url: DBPath + 'create-user',
        method: 'POST',
        header: {
          'content-type': 'application/x-www-form-urlencoded',
          'cookie': wx.getStorageSync('cookie'),
          'X-CSRFToken':  wx.getStorageSync('csrftoken')
        },
        data: {
          code: res.code
        },
        success: function(res) {
          success?success(res.data):0;
        },
        fail: function(err) {
          console.log(err);
        }
      });
    }
  })
  
}

function db_getUserInfo(openid, success) {
  wx.request({
    //url:  DBPath + 'get_user.php',
    url:  DBPath + 'get-user',
    
    data: {
      openid: openid,
    },
    success: function (res) {
      if (res.data.code == 200) {
        console.log('info:', res.data)
        success?success(res.data):0;
      } else {
        // 创建用户
        db_createUser(success);
      }
    },
    fail: function (err) {
      console.log("失败", err);
    }
  });
}

function db_getShared(openid, callback) {
  console.log(openid);
  wx.request({
    // url:  DBPath + 'get_shared.php',
    url:  DBPath + 'get-share',

    data: {
      openid: openid,
    },
    success: function (res) {
      console.log("data:", res);
      if (res.data.code != 200) return;
      //const data = res.data[0];
      const sharedArr = res.data.list;

      // if (data.shared_json) {
      //   sharedArr = JSON.parse(data.shared_json);
      // }

      if (callback) {
        callback(sharedArr);
      }
    },
    fail: function (err) {
      console.log(err);
    }
  });
}


function db_getToken(callback) {
  wx.request({
    url: DBPath + 'token',
    success:(res)=>{
      if(callback)
        callback(res);
    }
  });
}


function db_uploadAvatar(path, openid, callback) {
  console.log("token:", wx.getStorageSync('csrftoken'));
    wx.uploadFile({
      filePath: path,
      name: 'file',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
        'cookie': wx.getStorageSync('cookie'),
        'X-CSRFToken':  wx.getStorageSync('csrftoken')
      },
      formData:{
        //csrfmiddlewaretoken:wx.getStorageSync('csrftoken'),
        openid: openid
      },
      
      url: DBPath + 'upload-avatar',
      success:function(res){
          console.log(res);
          if (callback){
            callback(res.data);
          }
      },
      fail:function(err){
          console.log(err);
      }
  });
}


function db_getMessages(openid, callback) {
  wx.request({
    url:  DBPath + 'get-message',
    data: {
      openid: openid,
    },
    success: function (res) {
      console.log("data:", res);
      if (res.data.code != 200) return;
      const messageArr = res.data.list;

      if (callback) {
        callback(messageArr);
      }
    },
    fail: function (err) {
      console.log(err);
    }
  });
}

function db_deleteMessages(openid, msgid, callback) {
  wx.request({
    url:  DBPath + 'delete-message',
    method: 'POST',
    header: {
      'content-type': 'application/x-www-form-urlencoded',
      'cookie': wx.getStorageSync('cookie'),
      'X-CSRFToken':  wx.getStorageSync('csrftoken')
    },
    data: {
      openid: openid,
      msgid: msgid
    },
    success: function (res) {
      console.log("data:", res);
      if (res.data.code != 200) return;
      if (callback) {
        callback();
      }
    },
    fail: function (err) {
      console.log(err);
    }
  });
}

function db_setReadMessages(openid, msgid, callback) {
  wx.request({
    url:  DBPath + 'read-message',
    data: {
      openid: openid,
      msgid: msgid
    },
    success: function (res) {
      console.log("data:", res);
      if (res.data.code != 200) return;
      if (callback) {
        callback();
      }
    },
    fail: function (err) {
      console.log(err);
    }
  });
}

module.exports = {
  formatTime,
  getShort,

  safe,
  escape,
  formatCommentId,

  getOpenid,

  db_getComment,
  db_addComment,

  db_submitContent,
  db_jumpToContent,
  db_getContent,
  db_updateContent,
  db_deleteContent,


  db_getCollections,
  db_setCollections,

  db_getShared,

  db_setUserInfo,
  db_getUserInfo,

  db_getMessages,
  db_deleteMessages,
  db_setReadMessages,

  db_uploadAvatar,

  db_getToken,

  DBBase,
  DBPath
}