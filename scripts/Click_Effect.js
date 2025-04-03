// 索引数
var index = 0

// 监听事件：点击
window.onclick = function(event) {
    var array_list = ["富强", "民主", "文明", "和谐", "自由", "平等", "公正", "法治", "爱国", "敬业", "诚信", "友善"]

    //创建b元素
    var element = document.createElement("b")

    //防止拖动
    element.onselectstart = new Function("event.returnValue=false")

    //将b元素添加到页面上
    document.body.appendChild(element).innerHTML = array_list[index]
    index = (index + 1) % array_list.length

    //给p元素设置样式
    element.style.cssText = "position: fixed;left:-100%;"

    //字体大小
    var font_size = 12,

    //横坐标
    X = event.clientX - font_size / 2 - 30,

    //纵坐标
    Y = event.clientY - font_size,

    //调用函数：随机颜色
    colored = randomColor(),

    //不透明度
    alpha = 1,

    //缩放比例
    scaling = 0.8

    //添加定时器
    var timer = setInterval(function() {
        if (alpha <= 0) {
            document.body.removeChild(element)
            clearInterval(timer)
        } else {
            element.style.cssText = "font-size:16px;cursor: default;position: fixed;color:" + colored + ";left:" + X + "px;top:" + Y + "px;opacity:" + alpha + ";transform:scale(" + scaling + ");"
            Y--;
            alpha -= 0.016
            scaling += 0.002
        }
    }, 16)
}

//随机颜色
function randomColor() {
    return `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`
}
