/**
 * 使用方法：传入蓝牙的特征值
 */
import esc from "@/utils/esc.js"
import printf from "@/utils/dayin.js"
var command = esc.jpPrinter.createNew()
command.init() //初始化打印机
command.setPrint();
command.setText("单号："+item.seqno)	//单号
command.setPrint()
printf.prepareSend(command.getData()) //准备发送数据
const bule = {
	deviceId: "",
	notifyCharaterId: "",
	notifyServiceId: "",
	writeCharaterId: "",
	writeServiceId: "",
	readCharaterId: "",
	readServiceId: ""
}

export default {
	looptime: 0,
	currentTime: 1,
	lastData: 0,
	oneTimeData: 0,
	buffSize: [],
	buffIndex: 0, //发送字节数下标
	printNum: [],
	printNumIndex: 0,
	printerNum: 1,
	currentPrint: 1,
	isReceiptSend: false,
	isQuery: false,
	canvasWidth: 100,
	canvasHeight: 100,
	jpgWidth: 200,
	jpgHeight: 200,
	prepareSend(buff,bule) { //准备发送，根据每次发送字节数来处理分包数量
		this.onLoad()
		var that = this
		var time = this.oneTimeData
		var looptime = parseInt(buff.length / time);
		var lastData = parseInt(buff.length % time);
		//console.log(looptime + "---" + lastData)
		this.looptime = looptime + 1
		this.lastData = lastData
		this.currentTime = 1
		that.Send(buff,bule)
	},
	onLoad() {
		var list = []
		var numList = []
		var j = 0
		for (var i = 20; i < 200; i += 10) {
			list[j] = i;
			j++
		}
		for (var i = 1; i < 10; i++) {
			numList[i - 1] = i
		}
		this.buffSize = list
		this.oneTimeData = list[0]
		this.printNum = numList
		this.printerNum = numList[0]
	},
	Send(buff,bule) { //分包发送
		var that = this
		var currentTime = this.currentTime
		var loopTime = this.looptime
		var lastData = this.lastData
		var onTimeData = this.oneTimeData
		var printNum = this.printerNum
		var currentPrint = this.currentPrint
		var buf
		var dataView
		if (currentTime < loopTime) {
			buf = new ArrayBuffer(onTimeData)
			dataView = new DataView(buf)
			for (var i = 0; i < onTimeData; ++i) {
				dataView.setUint8(i, buff[(currentTime - 1) * onTimeData + i])
			}
		} else {
			buf = new ArrayBuffer(lastData)
			dataView = new DataView(buf)
			for (var i = 0; i < lastData; ++i) {
				dataView.setUint8(i, buff[(currentTime - 1) * onTimeData + i])
			}
			// console.log("buf1：", buf)
			// console.log("dataView：", dataView)
		}
		uni.writeBLECharacteristicValue({
			deviceId: bule.selfInfo.deviceId,
			serviceId: bule.selfInfo.writeServiceId,
			characteristicId: bule.selfInfo.writeCharaterId,
			value: buf,
			success: function(res) {
				if (currentTime <= loopTime) {
					// uni.showLoading({
					//   title: '传输中...',
					// })
				} else {
					uni.showToast({
						title: '已打印第' + currentPrint + '张成功',
					})
				}
				//console.log(res)
			},
			fail: function(e) {
				uni.showToast({
					title: '打印第' + currentPrint + '张失败',
					icon: 'none',
				})
				//console.log(e)
			},
			complete: function() {
				currentTime++
				if (currentTime <= loopTime) {
					that.currentTime = currentTime
					that.Send(buff)
				} else {
					if (currentPrint == printNum) {
						that.looptime = 0
						that.lastData = 0
						that.currentTime = 1
						that.isReceiptSend = false
						currentPrint = 1
					} else {
						currentPrint++
						that.currentPrint = currentPrint,
							that.currentTime = 1,
							that.Send(buff)
					}
				}
			}
		})
	}
}
