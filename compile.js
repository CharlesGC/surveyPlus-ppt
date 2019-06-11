class Compile { 
    constructor(el, vm) { 
        this.$el = document.querySelector(el)

        this.$vm = vm

        // 编译
        if (this.$el) {
            // 转换内部内容为片段
            this.$fragment = this.node2Fragment(this.$el)
            // 执行编译
            this.compileElement(this.$fragment)
            // 将编译完的html结果追加到$el
            this.$el.appendChild(this.$fragment)
        }
    }
    // 将宿主元素中代码片段拿出来遍历
    node2Fragment(el) { 
        const frag = document.createDocumentFragment();
        // 将el所有子元素搬家至frag中
        let child;
        while (child = el.firstChild) { 
            frag.appendChild(child)
        }
        return frag
    }
    compileElement(el) {
        let childNodes = el.childNodes
        Array.from(childNodes).forEach((node) => {
            let text = node.textContent
            // 表达式文本
            // 就是识别{{}}中的数据
            let reg = /\{\{(.*)\}\}/
            // 按元素节点方式编译
            if (this.isElementNode(node)) {
                this.compile(node)
            } else if (this.isTextNode(node) && reg.test(text)) {
                // 文本 并且有{{}}
                this.compileText(node, RegExp.$1)

            }
            // 遍历编译子节点
            if (node.childNodes && node.childNodes.length) {
                this.compileElement(node)
            }
        })
    }
    compile(node) {
        let nodeAttrs = node.attributes
        Array.from(nodeAttrs).forEach((attr) => {
            // 规定：指令以 v-xxx 命名
            // 如 <span v-text="content"></span> 中指令为 v-text
            let attrName = attr.name // v-text
            let exp = attr.value // content
            if (this.isDirective(attrName)) {
                let dir = attrName.substring(2) // text
                // 普通指令
                this[dir] && this[dir](node, this.$vm, exp)
            }
            if (this.isEventDirective(attrName)) {
                let dir = attrName.substring(1) // text
                this.eventHandler(node, this.$vm, exp, dir)
            }
        })
    }
    compileText(node, exp) {
        this.text(node, this.$vm, exp)
    }
    isDirective(attr) {
        return attr.indexOf('v-') == 0
    }
    isEventDirective(dir) {
        return dir.indexOf('@') === 0
    }
    isElementNode(node) {
        return node.nodeType == 1 // 元素节点
    }
    isTextNode(node) {
        return node.nodeType == 3 // 文本节点
    }
    text(node, vm, exp) {
        this.update(node, vm, exp, 'text')
    }
    html(node, vm, exp) {
        this.update(node, vm, exp, 'html')
    }
    model(node, vm, exp) {
        this.update(node, vm, exp, 'model')
        let val = vm.exp
        node.addEventListener('input', (e) => {
            let newValue = e.target.value
            vm[exp] = newValue
            val = newValue
        })
    }
    update(node, vm, exp, dir) {
        let updaterFn = this[dir + 'Updater']
        updaterFn && updaterFn(node, vm[exp])
        new Watcher(vm, exp, function (value) {
            updaterFn && updaterFn(node, value)
        })
    }
    // 事件处理
    eventHandler(node, vm, exp, dir) {
        let fn = vm.$options.methods && vm.$options.methods[exp]
        if (dir && fn) {
            node.addEventListener(dir, fn.bind(vm), false)
        }
    }
    textUpdater(node, value) {
        node.textContent = value
    }
    htmlUpdater(node, value) {
        node.innerHTML = value
    }
    modelUpdater(node, value) {
        node.value = value
    }
}