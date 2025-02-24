function displayDate() {
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDay();
    var week = `星期${"天一二三四五六".charAt(day)}`
    var hour = date.getHours();
    var minute = date.getMinutes();
    var second = date.getSeconds();
    if (hour < 10) {
        hour = `0${hour}`
    }
    if (minute < 10) {
        minute = `0${minute}`
    }
    if (second < 10) {
        second = `0${second}`
    }
    document.getElementById("gd").innerHTML = `${year}年${month}月${day}日 ${hour}:${minute}:${second} ${week}`
}
setInterval(displayDate, 1);