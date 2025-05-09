/*
    NBT.js 一个JavaScript的NBT解析器
    https://github.com/sjmulder/nbt-js
    汉化&改进：yi个NPC
*/

(function() {
    var nbt = this
    var zlib = typeof require !== "undefined" ? require("zlib") : window.zlib
    nbt.Little_Endian

    /*
    nbt.tagTypes：NBT数据类型
    从类型名称到NBT类型编号的映射
    nbt.Writer和nbt.Reader对每种类型都有相应的方法。
    */
    nbt.tagTypes = {
        "end": 0,
        "byte": 1,
        "short": 2,
        "int": 3,
        "long": 4,
        "float": 5,
        "double": 6,
        "byteArray": 7,
        "string": 8,
        "list": 9,
        "compound": 10,
        "intArray": 11,
        "longArray": 12
    }

    // 从NBT类型编号到类型名称的映射。
    nbt.tagTypeNames = {}
    for (var typeName in nbt.tagTypes) {
        if (nbt.tagTypes.hasOwnProperty(typeName)) {
            nbt.tagTypeNames[nbt.tagTypes[typeName]] = typeName
        }
    }

    function hasGzipHeader(data) {
        var head = new Uint8Array(data.slice(0, 2))
        return head.length === 2 && head[0] === 31 && head[1] === 139
    }

    function encodeUTF8(str) {
        var array = [],
            i, c
        for (i = 0; i < str.length; i++) {
            c = str.charCodeAt(i)
            if (c < 128) {
                array.push(c)
            } else if (c < 2048) {
                array.push(192 | c >> 6)
                array.push(128 | c & 63)
            } else if (c < 65536) {
                array.push(224 | c >> 12)
                array.push(128 | (c >> 6) & 63)
                array.push(128 | c & 63)
            } else {
                array.push(240 | (c >> 18) & 7)
                array.push(128 | (c >> 12) & 63)
                array.push(128 | (c >> 6) & 63)
                array.push(128 | c & 63)
            }
        }
        return array
    }

    function decodeUTF8(array) {
        var codepoints = [],
            i
        for (i = 0; i < array.length; i++) {
            if ((array[i] & 128) === 0) {
                codepoints.push(array[i] & 127)
            } else if (i + 1 < array.length && (array[i] & 224) === 192 && (array[i + 1] & 192) === 128) {
                codepoints.push(((array[i] & 31) << 6) | (array[i + 1] & 63))
            } else if (i + 2 < array.length && (array[i] & 240) === 224 && (array[i + 1] & 192) === 128 && (array[i + 2] & 192) === 128) {
                codepoints.push(((array[i] & 15) << 12) | ((array[i + 1] & 63) << 6) | (array[i + 2] & 63))
            } else if (i + 3 < array.length && (array[i] & 248) === 240 && (array[i + 1] & 192) === 128 && (array[i + 2] & 192) === 128 && (array[i + 3] & 192) === 128) {
                codepoints.push(((array[i] & 7) << 18) | ((array[i + 1] & 63) << 12) | ((array[i + 2] & 63) << 6) | (array[i + 3] & 63))
            }
        }
        return String.fromCharCode.apply(null, codepoints)
    }

    function sliceUint8Array(array, starting, ending) {
        if ("slice" in array) {
            return array.slice(starting, ending)
        } else {
            return new Uint8Array([].slice.call(array, starting, ending))
        }
    }

    /*
    nbt.Writer：写NBT
    与nbt.Reader相对
    */
    nbt.Writer = function() {
        var self = this

        // 如有必要，将在写入时调整大小(x2)
        var buffer = new ArrayBuffer(1024)

        // 当buffer被重新创建时
        var dataView = new DataView(buffer)
        var arrayView = new Uint8Array(buffer)

        /*
        buffer中写入或读取字节的位置。
        每次写入后，此值都会增加，但可以自由更改。
        必要时将调整buffer的大小。
        */
        this.offset = 0

        // 确保buffer足够大，可以在当前的`self.offset`处写入`size`字节。
        function accommodate(size) {
            var requiredLength = self.offset + size
            if (buffer.byteLength >= requiredLength) {
                return
            }

            var newLength = buffer.byteLength
            while (newLength < requiredLength) {
                newLength *= 2
            }

            var newBuffer = new ArrayBuffer(newLength)
            var newArrayView = new Uint8Array(newBuffer)
            newArrayView.set(arrayView)

            // 如果旧buffer的结束和新buffer的开始之间存在间隙，需要将其清零
            if (self.offset > buffer.byteLength) {
                newArrayView.fill(0, buffer.byteLength, self.offset)
            }

            buffer = newBuffer
            dataView = new DataView(newBuffer)
            arrayView = newArrayView
        }

        function write(dataType, size, value) {
            accommodate(size)
            dataView[`set${dataType}`](self.offset, value, nbt.Little_Endian)
            self.offset += size
            return self
        }

        // 从内部buffer中以切片形式返回写入的数据，并在末尾截断任何填充。
        this.getData = function() {
            // 确保偏移量在buffer内
            accommodate(0)
            return buffer.slice(0, self.offset)
        }

        // 字节型(Byte)
        this[nbt.tagTypes.byte] = write.bind(this, "Int8", 1)

        // 短整型(Short)
        this[nbt.tagTypes.short] = write.bind(this, "Int16", 2)

        // 整型(Int)
        this[nbt.tagTypes.int] = write.bind(this, "Int32", 4)

        /*
        长整型(Long)
        JavaScript不支持64位整数，采用一个由两个32位整数组成的数组，这两个32位整数组成了长整型的上半部分和下半部分。
        value[0] 上半部分
        value[1] 下半部分
        */
        this[nbt.tagTypes.long] = function(value) {
            self.int(value[0])
            self.int(value[1])
            return self
        }

        // 单精度浮点数(Float)
        this[nbt.tagTypes.float] = write.bind(this, "Float32", 4)

        // 双精度浮点数(Double)
        this[nbt.tagTypes.double] = write.bind(this, "Float64", 8)

        // 字节型数组(Byte Array)
        this[nbt.tagTypes.byteArray] = function(value) {
            this.int(value.length)
            accommodate(value.length)
            arrayView.set(value, this.offset)
            this.offset += value.length
            return this
        }

        // 字符串(String)
        this[nbt.tagTypes.string] = function(value) {
            var bytes = encodeUTF8(value)
            this.short(bytes.length)
            accommodate(bytes.length)
            arrayView.set(bytes, this.offset)
            this.offset += bytes.length
            return this
        }

        /*
        列表标签(List)
        [value.type] NBT数据类型
        value.value 列表标签中的元素
        */
        this[nbt.tagTypes.list] = function(value) {
            this.byte(nbt.tagTypes[value.type])
            this.int(value.value.length)
            var i
            for (i = 0; i < value.value.length; i++) {
                this[value.type](value.value[i])
            }
            return this
        }

        /*
        复合标签(Compound)
        value 键值对
        value[key] 键
        [value[key].type] NBT数据类型
        value[key].value 键与类型匹配的值
        */
        this[nbt.tagTypes.compound] = function(value) {
            var self = this
            Object.keys(value).map(function(key) {
                self.byte(nbt.tagTypes[value[key].type])
                self.string(key)
                self[value[key].type](value[key].value)
            })
            this.byte(nbt.tagTypes.end)
            return this
        }

        // 整型数组(Int Array)
        this[nbt.tagTypes.intArray] = function(value) {
            this.int(value.length)
            var i
            for (i = 0; i < value.length; i++) {
                this.int(value[i])
            }
            return this
        }

        /*
        长整型数组(Long Array)
        长整型数组中的元素分成上半部分、下半部分
        */
        this[nbt.tagTypes.longArray] = function(value) {
            this.int(value.length)
            var i
            for (i = 0; i < value.length; i++) {
                this.long(value[i])
            }
            return this
        }

        var typeName
        for (typeName in nbt.tagTypes) {
            if (nbt.tagTypes.hasOwnProperty(typeName)) {
                this[typeName] = this[nbt.tagTypes[typeName]]
            }
        }
    }

    /*
    nbt.Reader：读NBT
    与nbt.Writer相对
    */
    nbt.Reader = function(buffer, foffset) {
        if (!buffer) {
            throw new Error("buffer参数错误")
        }

        var self = this

        // buffer中的当前位置。可以在buffer的范围内自由更改。
        if (foffset) {
            this.offset = foffset
        } else {
            this.offset = 0
        }

        var arrayView = new Uint8Array(buffer)
        var dataView = new DataView(arrayView.buffer)

        function read(dataType, size) {
            var val = dataView[`get${dataType}`](self.offset, nbt.Little_Endian)
            self.offset += size
            return val
        }

        // 字节型(Byte)
        this[nbt.tagTypes.byte] = read.bind(this, "Int8", 1)

        // 短整型(Short)
        this[nbt.tagTypes.short] = read.bind(this, "Int16", 2)

        // 整型(Int)
        this[nbt.tagTypes.int] = read.bind(this, "Int32", 4)

        // 长整型(Long)
        this[nbt.tagTypes.long] = function() {
            return [
                this.int(),
                this.int()
            ]
        }

        // 单精度浮点数(Float)
        this[nbt.tagTypes.float] = read.bind(this, "Float32", 4)

        // 双精度浮点数(Double)
        this[nbt.tagTypes.double] = read.bind(this, "Float64", 8)

        // 字节型数组(Byte Array)
        this[nbt.tagTypes.byteArray] = function() {
            var length = this.int()
            var bytes = []
            var i
            for (i = 0; i < length; i++) {
                bytes.push(this.byte())
            }
            return bytes
        }

        // 字符串(String)
        this[nbt.tagTypes.string] = function() {
            var length = this.short()
            var sliced = sliceUint8Array(arrayView, this.offset,
                this.offset + length)
            this.offset += length
            return decodeUTF8(sliced)
        }

        // 列表标签(List)
        this[nbt.tagTypes.list] = function() {
            var type = this.byte()
            var length = this.int()
            var values = []
            var i
            for (i = 0; i < length; i++) {
                values.push(this[type]())
            }
            return {
                type: nbt.tagTypeNames[type],
                value: values
            }
        }

        // 复合标签(Compound)
        this[nbt.tagTypes.compound] = function() {
            var values = {}
            while (true) {
                var type = this.byte()
                if (type === nbt.tagTypes.end) {
                    break
                }
                var name = this.string()
                var value = this[type]()
                values[name] = {
                    type: nbt.tagTypeNames[type],
                    value: value
                }
            }
            return values
        }

        // 整型数组(Int Array)
        this[nbt.tagTypes.intArray] = function() {
            var length = this.int()
            var ints = []
            var i
            for (i = 0; i < length; i++) {
                ints.push(this.int())
            }
            return ints
        }

        // 长整型数组(Long Array)
        this[nbt.tagTypes.longArray] = function() {
            var length = this.int()
            var longs = []
            var i
            for (i = 0; i < length; i++) {
                longs.push(this.long())
            }
            return longs
        }

        var typeName
        for (typeName in nbt.tagTypes) {
            if (nbt.tagTypes.hasOwnProperty(typeName)) {
                this[typeName] = this[nbt.tagTypes[typeName]]
            }
        }
    }

    /*
    nbt.write：写入NBT数据

    value NBT根部标签（复合标签）
    value.name 根部标签的键（可以不填）
    value.value 根部标签的值

    nbt.Little_Endian 是不是小端字节序
    基岩版 true
    Java版 false

    示例
    nbt.write({
         "name": "",
         "value": {
             "itemA": { "type": "int", "value": 123 },
             "itemB": { "type": "string", "value": "Hello World" }
         }
     }, nbt.Little_Endian = false)
    */
    nbt.write = function(value) {
        if (!value) {
            throw new Error("数据参数错误")
        }

        var writer = new nbt.Writer()

        writer.byte(nbt.tagTypes.compound)
        writer.string(value.name)
        writer.compound(value.value)

        return writer.getData()
    }

    nbt.parseUncompressed = function(data, offset) {
        if (!data) {
            throw new Error("数据参数错误")
        }
        if (!offset) {
            offset = 0
        }

        var reader = new nbt.Reader(data, offset)

        var type = reader.byte()
        if (type !== nbt.tagTypes.compound) {
            if (type === 8) {
                return nbt.parseUncompressed(data, 8)
            } else {
                throw new Error(`NBT根部标签必须是复合标签(Compound)，这是${type}`)
            }
        }

        return {
            name: reader.string(),
            value: reader.compound()
        }
    }

    /*
    nbt.parse：解析NBT数据

    为了在网页中使用，必须定义window.zlib来解码。如果类型可用，将传递一个Buffer，否则传递一个Uint8Array。

    error 解析失败抛出的错误
    result NBT根部标签（复合标签）
    result.name 根部标签的键（可以不填）
    result.value 根部标签的值
    data NBT数据
    callback 解析成功回调函数

    nbt.Little_Endian 是不是小端字节序
    基岩版 true
    Java版 false

    Java版的NBT可能是压缩过的（gzip格式）
    需要解压之后再操作
    NBT.js会自动解压，但不会自动压缩
    操作之后再使用gzip格式手动压缩回去

    示例
    nbt.parse(<buffer>, function(error, data) {
        if (error) {
            throw error
        }
        console.log(JSON.stringify(data, null, 4))
    }, nbt.Little_Endian = false)
    */
    nbt.parse = function(data, callback) {
        if (!data) {
            throw new Error("数据参数错误")
        }

        var self = this

        if (!hasGzipHeader(data)) {
            callback(null, self.parseUncompressed(data))
        } else if (!zlib) {
            callback(new Error("NBT存档已压缩，但zlib不可用"), null)
        } else {
            var buffer
            if (data.length) {
                buffer = data
            } else if (typeof Buffer !== "undefined") {
                buffer = new Buffer(data)
            } else {
                buffer = new Uint8Array(data)
            }

            zlib.gunzip(buffer, function(error, uncompressed) {
                if (error) {
                    callback(error, null)
                } else {
                    callback(null, self.parseUncompressed(uncompressed))
                }
            })
        }
    }
}).apply(typeof exports !== "undefined" ? exports : (window.nbt = {}))