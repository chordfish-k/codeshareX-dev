// pages/message/message.js
const {
    db_getMessages,
    db_deleteMessages,
    db_setReadMessages
} = require("../../utils/util");

const app = getApp();

Page({

    data: {
        /**滑动超过一定距离，显示返回顶部按钮*/
        showReturnTopBtnDepth: 700,
        /**收藏列表 */
        messages: [],
        messageCount: 0
    },

    onLoad: function (options) {

    },

    onShow: function () {
        this.refresh();
    },

    refresh: function(){
        const openid = app.globalData.openid;
        const that = this;
        db_getMessages(openid, (list)=>{

            that.setData({
                messages: list,
                messageCount: list.length
            })
        });
    },


    tryDeleteCard: function(e) {
        const that = this;
        wx.showModal({
            title: "提示",
            content: "要删除该消息吗",
            success(res) {
                if (!res.cancel) { //确认删除
                    const dataset = e.currentTarget.dataset;
                    that.deleteCard(dataset.index, dataset.msgid);
                    console.log("确认");
                } else {
                    console.log("取消");
                }
            },
            fail(err) {
                console.log(err);
            }
        });
    },


    deleteCard: function (id, msgid) {
        const that = this;
        const o = app.globalData.openid;
    
        db_deleteMessages(o, msgid, ()=>{
          that.refresh()
        });
    },


    onTapCard: function (e) {
        console.log(e)
        const piece = this.data.messages[e.currentTarget.dataset.id];
        let url = "../share/share?"
        + "contentID=" + piece.belongsid
        + "&tab=" + (piece.to_comment?1:0)
        + (piece.to_comment?"&a=" + piece.to_comment:"");
        //console.log(piece, url)
        db_setReadMessages(app.globalData.openid, piece.id);
        wx.navigateTo({
            url
        });
    },

    tryReadAll: function(e) {
        const that = this;
        wx.showModal({
            title: "提示",
            content: "要已读全部消息吗",
            success(res) {
                if (!res.cancel) { //确认已读
                    const dataset = e.currentTarget.dataset;
                    that.readAll();
                    console.log("确认");
                } else {
                    console.log("取消");
                }
            },
            fail(err) {
                console.log(err);
            }
        });
    },

    readAll: function() {
        const o = app.globalData.openid;
        for (let i=0; i<this.data.messages.length; i++) {
            this.setData({
                ["messages["+i+"].is_read"]: true
            });
            db_setReadMessages(o, this.data.messages[i].id);
        }
    },

    tryDeleteAll: function(e) {
        const that = this;
        wx.showModal({
            title: "提示",
            content: "要删除全部消息吗",
            success(res) {
                if (!res.cancel) { //确认删除
                    const dataset = e.currentTarget.dataset;
                    that.deleteAll();
                    console.log("确认");
                } else {
                    console.log("取消");
                }
            },
            fail(err) {
                console.log(err);
            }
        });
    },

    deleteAll: function(){
        const o = app.globalData.openid;
        for (let i=0; i<this.data.messages.length; i++) {
            db_deleteMessages(o, this.data.messages[i].id);
        }
        this.setData({
            messages: [],
            messageCount: 0
        });
    }
})