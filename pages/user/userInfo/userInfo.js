const { 
    db_setUserInfo,
    db_getUserInfo,
    db_uploadAvatar,
    DBBase
} = require("../../../utils/util");

const app = getApp();

Page({
    data: {
        userInfo: app.globalData.defaultUser,
        openid: wx.getStorageSync('openid')

    },

    onLoad(e) {
        console.log("user global: ", app.globalData.user);
        this.setData({
            userInfo: app.globalData.user
        })
    },

    onNameChange(e) {
        console.log(e.detail.value);
        this.setData({
            ['userInfo.nickName']: e.detail.value
        })
    },

    onChooseAvatar(e) {
        const {
            avatarUrl
        } = e.detail;
        this.setData({
            ['userInfo.avatarUrl']: avatarUrl,
        })
    },

    saveInfo(e) {
        const that = this;
        wx.showModal({
            title: '提示',
            content: '确定要更改信息吗？',
            cancelColor: 'cancelColor',
            success: function (res) {
                if (res.confirm) {
                    
                    db_setUserInfo(app.globalData.openid, that.data.userInfo);
                    wx.setStorageSync('user', that.data.userInfo);

                    wx.getImageInfo({
                        src: that.data.userInfo.avatarUrl,
                        success: function (sres){
                            const openid = wx.getStorageSync('openid');
                            console.log("path:", sres.path);
                            
                            db_uploadAvatar(sres.path, openid,
                                (url)=>{
                                    if (url) {
                                        //加上随机参数，强制刷新头像
                                        app.globalData.user.avatarUrl = that.data.userInfo.avatarUrl = DBBase + url + "?t=" + Math.random();
                                        console.log("url", url);                          
                                    }

                                });
                            // wx.uploadFile({
                            //     filePath: sres.path,
                            //     name: 'file',
                            //     formData:{
                            //         openid:openid
                            //     },
                            //     url: 'https://cs.hyperchordfish.cn/codeshare/upload_avatar.php',
                            //     success:function(res){
                            //         console.log(res);

                                    
                            //         //加上随机参数，强制刷新头像
                            //         app.globalData.user.avatarUrl = that.data.userInfo.avatarUrl = 
                            //             "http://43.142.32.115/m_pro/" + app.globalData.openid + "/" +app.globalData.openid
                            //             + ".webp?t=" + Math.random();
                            //         // wx.setStorageSync('user', that.data.userInfo);
                            //         console.log("->", that.data.userInfo)
                            //     },
                            //     fail:function(err){
                            //         console.log(err);
                            //     }
                            // })
                        }
                    });

                    
                    
                    
                }
            },
            fail:function(err){
                console.log(err)
            }
        })
    }
})