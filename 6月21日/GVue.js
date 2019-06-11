class GVue {
    constructor(options) {
        // options == {data: { ... }}
        this.$options = options

        // 实现数据响应化  将data挂载到$data上
        this.$data = options.data

        // 将数据添加观察者
        this.observe(this.$data)

        // 判断是否存在created生命周期钩子 如果存在 则把this指向到实例
        if (options.created) {
            options.created.call(this)
        }
        this.$compile = new Compile(options.el, this)
    }

    observe(value) {
        if (!value || typeof value !== 'object') {
            return
        }
        // 遍历该数据对象
        // 为每一个属性添加响应化

        Object.keys(value).forEach(key => {
            // 定义响应化
            this.defineReactive(value, key, value[key])

            // 将data里的属性代理到vue的实例上
            this.proxyData(key)
        })
    }
    proxyData(key) {
        Object.defineProperty(this, key, {
            get() {
                return this.$data[key]
            },
            set(v) {
                this.$data[key] = v
            }
        })
    }

    // 实现数据响应化
    defineReactive(obj, key, val) {
        this.observe(val)

        const dep = new Dep()

        Object.defineProperty(obj, key, {
            get() {
                Dep.target && dep.addDep(Dep.target)
                return val
            },
            set(v) {
                if (v === val) {
                    return
                }
                val = v
                dep.notify()
            }
        })
    }
}

class Dep {
    constructor() {
        this.deps = [] // 依赖 一个watcher对应一个属性
    }

    addDep(dep) {
        this.deps.push(dep) // 添加依赖
    }

    depend() {
        Dep.target.addDep(this)
    }

    notify() {
        this.deps.forEach(dep => dep.update()) // 修改后通知更新
    }
}

class Watcher {
    constructor(vm, key, cb) {
        // 将当前watcher实例指定到Dep静态属性target上
        this.vm = vm
        this.key = key
        this.cb = cb

        Dep.target = this // 只会有一个静态属性
        this.vm[this.key]
        Dep.target = null
    }

    update() {
        // console.log('属性更新了')
        this.cb.call(this.vm, this.vm[this.key])
    }
}
