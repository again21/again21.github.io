let index = 0// 索引数

// 监听事件：点击
window.onclick = function(event) {

	// 单词列表
	const word_list = ["富强", "民主", "文明", "和谐", "自由", "平等", "公正", "法治", "爱国", "敬业", "诚信", "友善"]

	// 创建b元素
	const bE = document.createElement("b")

	// 防止拖动
	bE.onselectstart = new Function("event.returnValue=false")

	// 将b元素添加到页面上
	document.body.appendChild(bE).innerHTML = word_list[index]
	index = (index + 1) % word_list.length

	// 给b元素设置样式
	bE.style.cssText = "position: fixed;left:-100%;"

	// 字体大小
	let font_size = 12

	// 横坐标
	let X = event.clientX - font_size / 2 - 30

	// 纵坐标
	let Y = event.clientY - font_size

	// 随机颜色
	let colored = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`

	// 不透明度
	let alpha = 1

	// 缩放比例
	let scaling = 0.8

	// 添加定时器
	let timer = setInterval(() => {
		if (alpha <= 0) {
			document.body.removeChild(bE)
			clearInterval(timer)
		} else {
			bE.style.cssText = `font-size: 16px; cursor: default; position: fixed; color: ${colored}; left: ${X}px; top: ${Y}px; opacity:${alpha}; transform: scale(${scaling});`
			Y--
			alpha -= 0.016
			scaling += 0.002
		}
	}, 16)
}