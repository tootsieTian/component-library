<template>
	<view>
		<scroll-view scroll-y scroll-with-animation>
			<view v-for="item in list" :data-title="item.deviceId" :data-name="item.name" :data-advertisData="item.advertisServiceUUIDs"
			 data :key="item.deviceId" @click="getConnected" class="list">
				<view style="font-size: 16px; color: #333;">{{item.name}}</view>
				<view style="font-size: 16px; color: #333;">{{item.deviceId}}</view>
			</view>
		</scroll-view>
		<button type="primary" @click="openBluetoothAdapter" :loading="isLoading" class="bottom-btn">
			搜索蓝牙
		</button>
	</view>
</template>

<script>
	import {
		mapMutations
	} from "vuex"
	export default {
		data: () => ({
			list: [], // 蓝牙设备数据
			services: [], // 蓝牙支持的所有服务
			isLoading: false, //按钮加载图标
			serviceId: 0, //设备id
			writeCharacter: false, //特征值
			readCharacter: false,
			notifyCharacter: false
		}),
		onLoad() {},
		methods: {
			...mapMutations(['setBuleInfo','setUserInfo']),
			/**
			 * 1、初始化蓝牙
			 * 2、开始搜寻附近的蓝牙外围设备
			 * 3、监听寻找到新设备的事件
			 * 4、获取在蓝牙模块生效期间所有已发现的蓝牙设备
			 */

			//1、初始化蓝牙适配器
			openBluetoothAdapter() {
				let that = this
				uni.openBluetoothAdapter({
					success() {
						//2、获取蓝牙状态
						uni.getBluetoothAdapterState({
							success(res) {
								//3、蓝牙模块是否可用
								// 3、蓝牙模块是否可用
								if (res.available) {
									// 4、蓝牙是否为搜索状态 if：是则停止搜索 else：不是则打开蒙层，开始搜索蓝牙设备
									if (res.discovering) {
										that.stopSearch()
									} else {
										uni.showLoading({
											content: '加载中...',
										});
										that.startBluetoothDeviceDiscovery()
									}
								} else {
									uni.showToast({
										title: "本机蓝牙不可用"
									});
								}
							}
						})
					},
					fail() {
						uni.showToast({
							title: "请打开蓝牙！"
						})
					}
				});
			},
			/**
			 *  1、开启按钮上的加载图标 
			 *  2、开始搜索蓝牙设备
			 *  3、获取所有已发现的设备
			 *  
			 */
			// 搜索并获取蓝牙列表
			startBluetoothDeviceDiscovery() {
				var that = this
				that.isLoading = true
				// 1、开启按钮上的加载图标 
				uni.startBluetoothDevicesDiscovery({ // 2、开始搜索蓝牙设备  
					success() {
						// 3、获取所有已发现的设备
						setTimeout(function() {
							uni.getBluetoothDevices({
								// 4、获取设备列表存储在list中，并排除未知设备
								success(res) {
									var devices = []
									var num = 0
									for (var i = 0; i < res.devices.length; ++i) {
										if (res.devices[i].name != undefined) {
											devices[num] = res.devices[i]
											num++
										}
									}
									that.isLoading = false
									that.list = devices
									that.stopBluetoothDevicesDiscovery()
									uni.hideLoading()
								}
							})
						}, 2000)
					}
				})
			},
			/**
			 * 停止搜索蓝牙设备
			 */
			stopBluetoothDevicesDiscovery() {
				var that = this
				uni.stopBluetoothDevicesDiscovery({
					success(e) {
						// console.log('停止搜索蓝牙设备:' + e);
						// console.log("蓝牙列表：", that.list)
					},
				});
			},

			/**
			 * 连接蓝牙操作
			 * 1、停止搜索蓝牙
			 * 2、连接设备
			 * 3、获取所有服务
			 */
			getConnected(e) {
				var that = this
				console.log("测试")
				this.stopBluetoothDevicesDiscovery() // 停止搜索
				that.serviceId = 0
				that.writeCharacter = false
				that.readCharacter = false
				that.notifyCharacter = false
				let contnectId = e.currentTarget.dataset.title //要连接的蓝牙id
				// uni.showLoading({
				// 	content: '加载中...',
				// })
				uni.connectBLEDevice({ // 连接蓝牙
					deviceId: contnectId, //    蓝牙ID
					success(res) {
						/**
						 * 1、将连接的蓝牙ID赋值到全局变量
						 * 2、后续会传给后端
						 */
						console.log(`连接蓝牙成功：${res},设备id：${contnectId}`)
						that.setBuleInfo("deviceId", contnectId)
						console.log("赋值id完成")
						that.getSeviceId()
						// uni.getBLEDeviceServices({ //    获取蓝牙的所有服务
						// 	deviceId: contnectId,
						// 	success(res) {
						// 		//  将蓝牙的服务存进services
						// 		that.getSeviceId() //获取蓝牙的所有服务
						// 	},
						// 	fail() {}
						// })
					},
					fail(res) {
						console.log(res)
					}
				})
			},

			/**
			 * 遍历获取蓝牙的特征值
			 */
			getSeviceId() {
				var that = this
				console.log(that.$store.state)
				// var platform =  that.$store.state.buleTooth.platform
				uni.getBLEDeviceServices({
					deviceId: that.$store.state.buleInfo.deviceId,
					success(res) {
						that.services = res.services
						that.getCharacteristics()
					},
					fail(e) {
						console.log(e)
					},
					complete(e) {
						console.log(e)
					}
				})
			},
			/**
			 * 获取所有特征值
			 */
			getCharacteristics() {
				var that = this
				var list = that.services
				var num = that.serviceId
				var write = that.writeCharacter
				var read = that.readCharacter
				var notify = that.notifyCharacter
				if (list.length == 0) {
					uni.alert({
						title: '提示',
						content: '找不到该读写的特征值',
					})
					uni.hideLoading()
					return
				}
				uni.getBLEDeviceCharacteristics({
					deviceId: that.$store.state.buleInfo.deviceId,
					serviceId: list[num].serviceId,
					success: function(res) {
						for (var i = 0; i < res.characteristics.length; ++i) {
							var properties = res.characteristics[i].properties
							var item = res.characteristics[i].characteristicId
							if (!notify) {
								if (properties.notify) {
									that.setBuleInfo("notifyCharaterId", item)
									that.setBuleInfo("notifyServiceId", list[num].serviceId)
									// app.BLEInformation.notifyCharaterId = item
									// app.BLEInformation.notifyServiceId = list[num].serviceId
									notify = true
								}
							}
							if (!write) {
								if (properties.write) {
									that.setBuleInfo("writeCharaterId", item)
									// app.BLEInformation.writeCharaterId = item
									that.setBuleInfo("writeServiceId", list[num].serviceId)
									// app.BLEInformation.writeServiceId = list[num].serviceId
									write = true
								}
							}
							if (!read) {
								if (properties.read) {
									that.setBuleInfo("readCharaterId", item)
									that.setBuleInfo("readServiceId", list[num].serviceId)
									// app.BLEInformation.readCharaterId = item
									// app.BLEInformation.readServiceId = list[num].serviceId
									read = true
								}
							}
						}
						if (!write || !notify || !read) {
							num++
							that.writeCharacter = write
							that.readCharacter = read
							that.notifyCharacter = notify
							that.serviceId = num
							if (num == list.length) {
								dd.alert({
									title: '提示',
									content: '找不到该读写的特征值',
								})
							} else {
								that.getCharacteristics()
							}
						} else {
							dd.alert({
								title: '提示',
								content: '连接成功',
								buttonText: '确认',
								success: () => {
									that.$store.state.selfInfo.defaultdevicename = that.data.list[num].name
									dd.navigateBack({
										delta: 2
									})
								},
							});
							// that.openControl()
						}
					},
					fail(e) {
						console.log(e)
					},
					complete(e) {
						console.log("write:" + that.$store.state.buleInfo.writeCharaterId)
						console.log("read:" + that.$store.state.buleInfo.readCharaterId)
						console.log("notify:" + that.$store.state.buleInfo.notifyCharaterId)
					}
				})
			}
		}
	}
</script>

<style lang="scss" scoped>

</style>
