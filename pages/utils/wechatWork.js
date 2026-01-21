// utils/wechatWork.js
import wx from 'weixin-js-sdk';

class WeChatWork {
  constructor() {
    this.isReady = false;
  }

  // 初始化企业微信配置
  async init(config) {
    return new Promise((resolve, reject) => {
      wx.config({
        beta: true, // 必须这么写，否则wx.invoke调用形式的jsapi会有问题
        debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来
        appId: config.appId, // 必填，企业微信的corpID
        timestamp: config.timestamp, // 必填，生成签名的时间戳
        nonceStr: config.nonceStr, // 必填，生成签名的随机串
        signature: config.signature, // 必填，签名
        jsApiList: [
          'scanQRCode',
          'onMenuShareAppMessage',
          'onMenuShareWechat'
        ] // 必填，需要使用的JS接口列表
      });

      wx.ready(() => {
        this.isReady = true;
        resolve();
      });

      wx.error((error) => {
        this.isReady = false;
        reject(error);
      });
    });
  }

  // 调用扫一扫
  async scanQRCode(needResult = 1) {
    if (!this.isReady) {
      throw new Error('企业微信尚未初始化完成');
    }

    return new Promise((resolve, reject) => {
      wx.scanQRCode({
        needResult: needResult, // 默认为0，扫描结果由企业微信处理，1则直接返回扫描结果
        scanType: ["qrCode", "barCode"], // 可以指定扫二维码还是条形码，默认二者都有
        success: (res) => {
          const result = res.resultStr; // 当needResult 为 1 时，扫码返回的结果
          resolve(result);
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
  }
}

export default new WeChatWork();