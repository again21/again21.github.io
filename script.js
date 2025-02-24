(function() {
    var indexed = 0;
    window.onclick = function(event) {
        var array_list = ["富强", "民主", "文明", "和谐", "自由", "平等", "公正", "法治", "爱国","敬业", "诚信", "友善"]
        var effect = document.createElement("b")//创建b元素
        effect.onselectstart = new Function("event.returnValue=false")//防止拖动
        document.body.appendChild(effect).innerHTML = array_list[indexed]//将b元素添加到页面上
        indexed = (indexed + 1) % array_list.length;
        effect.style.cssText = "position: fixed;left:-100%;"//给p元素设置样式
        var font_size = 13,// 字体大小
            X = event.clientX - font_size / 2 - 30,// 横坐标
            Y = event.clientY - font_size,// 纵坐标
            colored = randomColor(),// 随机颜色
            alpha = 1,// 透明度
            scaling = 0.8;// 放大缩小
        var timer = setInterval(function() {//添加定时器
            if (alpha <= 0) {
                document.body.removeChild(effect)
                clearInterval(timer)
            } else {
                effect.style.cssText = "font-size:16px;cursor: default;position: fixed;color:" + colored + ";left:" + X + "px;top:" + Y + "px;opacity:" + alpha + ";transform:scale(" + scaling + ");";
                Y--;
                alpha -= 0.016;
                scaling += 0.002;
            }
        }, 15)
    }
    // 随机颜色
    function randomColor() {
        return `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`
    }
}());
