function upload_mcstructure(eve) {
    const reader = new FileReader()
    const file = eve.target.files[0]
    reader.readAsArrayBuffer(file)
    reader.onload = function(event) {
        // 解析NBT数据
        nbt.parse(event.target.result, function(error, data) {
            if (error) {
                throw error
            }
            var url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 4)], { type: "text/plain;charset=utf-8" }))
            var aE = document.createElement("a")
            aE.href = url

            // 设置下载的文件名
            aE.download = file.name.replace(/.mcstructure/g, ".json")
            document.body.appendChild(aE)
            aE.click()
            document.body.removeChild(aE)

            // 释放URL对象
            URL.revokeObjectURL(url)
        }, nbt.Little_Endian = true)
    }
    reader.onprogress = function(event) {
        if (event.lengthComputable) {
            document.getElementById("usp").innerHTML = `进度：${(event.loaded / event.total) * 100}%`
        }
    }
}

function upload_JSON(eve) {
    const reader = new FileReader()
    const file = eve.target.files[0]
    reader.readAsText(file)
    reader.onload = function(event) {
        var url = URL.createObjectURL(new Blob([nbt.write(JSON.parse(event.target.result), nbt.Little_Endian = true)]))
        var aE = document.createElement("a")
        aE.href = url

        // 设置下载的文件名
        aE.download = file.name.replace(/.json/g, ".mcstructure")
        document.body.appendChild(aE)
        aE.click()
        document.body.removeChild(aE)

        // 释放URL对象
        URL.revokeObjectURL(url)
    }
    reader.onprogress = function(event) {
        if (event.lengthComputable) {
            document.getElementById("ujp").innerHTML = `进度：${(event.loaded / event.total) * 100}%`
        }
    }
}