const toProxy = new WeakMap(); //保存代理对象到原生对象的映射
const toRaw = new WeakMap(); //保存原生对象到代理对象的映射
const targetMap = new WeakMap(); //保存不同对象的依赖
const effectStack = []; //effect栈

function hasOwn(o, key) {
  return o.hasOwnProperty(key);
}

function isObject(o) {
  return typeof o === 'object' && o !== null;
}

function track(target, key) {
  //首先获取到当前effect，即effect栈中栈顶元素
  const effect = effectStack[effectStack.length - 1];
  if (effect) {
    //获取target上的depsMap,若无则新建
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()));
    }
    //获取depsMap上的dep,若无则新建
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, (dep = new Set()));
    }
    //若dep中无effect,则添加
    if (!dep.has(effect)) {
      dep.add(effect);
    }
  }
}

function trigger(target, key) {
  //获取所有对target[key]的依赖，并遍历执行对应的effect
  const depMap = targetMap.get(target);
  if (!depMap) return;
  const dep = depMap.get(key);
  if (dep) {
    dep.forEach(effect => {
      effect();
    })
  }
}

function reactive(target) {
  return createReactive(target);
}

function createReactive(target) {
  //不是一个对象则直接返回
  if (!isObject(target)) return target;
  //检测target是否已经被代理或是否已经是代理对象
  if (toProxy.has(target)) return toProxy.get(target);
  if (toRaw.has(target)) return target;
  //代理处理器
  const baseHandler = {
    get(target, key, receiver) {
      const res = Reflect.get(target, key, receiver);
      // console.log("获取");
      //收集依赖
      track(target, key);
      //是对象的话，则对它进行代理
      return isObject(res) ? reactive(res) : res;
    },
    set(target, key, val, receiver) {
      const hasKey = hasOwn(target, key);
      //若旧值和新值一样则不做处理
      const oldValue = target[key];
      const res = Reflect.set(target, key, val, receiver)
      if (!hasKey) {
        console.log("新增");
        // console.log(key, val);
        //触发依赖
        trigger(target, key);
      } else if (oldValue !== val) {
        // console.log(val);
        console.log("修改");
        // console.log(key, val);
        //触发依赖
        trigger(target, key);
      }
      return res;
    },
    deleteProperty(target, key) {
      const res = Reflect.deleteProperty(target, key);
      return res;
    }
  }
  const p = new Proxy(target, baseHandler);
  toProxy.set(target, p);
  toRaw.set(p, target);
  return p;
}

function effect(fn) {
  const effect = createReactiveEffect(fn);
  // 使用effect会先执行一次
  effect();
  return effect;
}

function createReactiveEffect(fn) {
  //返回一个能运行effect的函数
  const effect = function (...args) {
    return run(effect, fn, args);
  }
  return effect;
}

function run(effect, fn, args) {
  //将effect压入栈，方便存储effect
  try {
    effectStack.push(effect);
    //执行用户在effect传进来的fn函数
    fn(...args);
  } finally {
    //无论结果如何，都要把刚压入栈的effect弹出
    effectStack.pop();
  }
}

const o = {
  name: "xiaoming",
  hobbies: ["sing"],
  address: {
    china: "beijing",
    us: "newyork"
  }
};
const p = reactive(o);
p.name = "xiaohong";
p.age = 20;

const compile = (node, vm) => {
  const reg = /\{\{(.*)\}\}/;
  if (node.nodeType === 1) { //节点为Element节点
    // console.log(node.nodeValue);
    console.log(node);
    for (let i = 0; i < node.attributes.length; ++i) {
      //如果有"v-model"属性，则进行双向绑定
      if (node.attributes[i].nodeName === 'v-model') {
        let name = node.attributes[i].nodeValue;
        node.addEventListener("input", (e) => {
          vm[name] = e.target.value;
        })
        //设置effect，添加依赖
        effect(() => {
          node.value = vm[name];
        })
        node.removeAttribute("v-model");
      }
    }
    if (reg.test(node.innerText)) {
      let name = RegExp.$1; //匹配{{}}中的属性
      name = name.trim();
      //设置effect，添加依赖
      effect(() => {
        node.innerText = vm[name];
      })
    }
  } else if (node.nodeType === 3) { //节点为Text类
    // console.log(node.innerText);
    if (reg.exec(node.nodeValue)) {
      let name = RegExp.$1; //匹配{{}}中的属性
      name = name.trim();
      //设置effect，添加依赖
      effect(() => {
        node.nodeValue = vm[name];
      })
    }
  }
}

const nodeToFragment = (node, vm) => {
  //创建文档片段
  let flag = document.createDocumentFragment();
  let child;
  //解析node中的节点，并添加到文档片段中
  while (child = node.firstChild) {
    //这里在flag中append一个firstChild，node中的firstChild就会自动移除,
    //然后firstChild就会变为原先的第二个节点
    compile(child, vm);
    flag.append(child);
  }
  return flag;
}

const root = document.getElementById("app");
root.appendChild(nodeToFragment(root, p));
document.getElementById("btn").addEventListener("click", () => {
  p.age++
})