export function render(vnode, container) {
  //通过虚拟节点创建真实节点，并添加进真实节点中
  const el = createDomElementFromVnode(vnode);
  container.appendChild(el);
}

function createDomElementFromVnode(vnode) {
  let {
    type,
    key,
    props,
    children,
    text
  } = vnode;
  if (type) { //若为标签节点，则创建标签元素
    vnode.domElement = document.createElement(type);
    //更新他的属性
    updateProperties(vnode);
    //将它的孩子节点也创建为dom节点并添加
    children.forEach(child => {
      vnode.domElement.appendChild(createDomElementFromVnode(child));
    })
  } else { //若为文本节点，则直接创建文本节点
    vnode.domElement = document.createTextNode(text);
  }
  return vnode.domElement;
}

function updateProperties(newVnode, oldProps = {}) {
  let domElement = newVnode.domElement;
  let newProps = newVnode.props;
  //新节点没有，但是旧节点有的属性则从dom节点中删除掉对应的属性
  for (let oldPropName in oldProps) {
    if (!newProps[oldPropName]) {
      delete domElement[oldPropName];
    }
  }
  let newStyleObj = newProps.style || {};
  let oldStyleObj = oldProps.style || {};
  //对于style属性，新节点无，但是旧节点有的属性则置空
  for (let propName in oldStyleObj) {
    if (!newStyleObj[propName]) {
      domElement.style[propName] = "";
    }
  }
  //新节点有的属性，直接添加
  for (let newPropName in newProps) {
    if (newPropName === "style") {
      //对于style属性,要对dom的style直接设置
      for (let s in newStyleObj) {
        domElement.style[s] = newStyleObj[s];
      }
    } else {
      domElement[newPropName] = newProps[newPropName];
    }

  }
}

//打补丁操作
export function patch(oldVnode, newVnode) {
  //两个节点的标签类型不一样直接替换掉
  if (oldVnode.type !== newVnode.type) {
    return oldVnode.domElement.parentNode
      .replaceChild(createDomElementFromVnode(newVnode), oldVnode.domElement);
  }
  //两个节点的文本不一样，则直接替换掉
  if (oldVnode.text !== newVnode.text) {
    return oldVnode.domElement.textContent = newVnode.text;
  }

  //获取dom节点
  let domElement = newVnode.domElement = oldVnode.domElement;
  updateProperties(newVnode, oldVnode.props);

  //获取新虚拟节点的孩子和旧虚拟节点的孩子
  let oldChildren = oldVnode.children;
  let newChildren = newVnode.children;

  //新、旧虚拟节点的孩子数量都大于0的话，则更新他们的孩子
  if (oldChildren.length > 0 && newChildren.length > 0) {
    updateChildren(domElement, oldChildren, newChildren);
  } else if (oldChildren.length > 0) {
    //旧虚拟节点的孩子数量不为零，新虚拟节点的孩子数量为0，
    //则直接把dom节点的innerHTML置空，清空
    domElement.innerHTML = "";
  } else if (newChildren.length > 0) {
    //新虚拟节点的孩子数量不为零，旧虚拟节点的孩子数量为0，
    //则为dom节点添加新虚拟节点的所有孩子
    newChildren.forEach(child => {
      domElement.appendChild(createDomElementFromVnode(child));
    })
  }

}

//通过key和type判断两个虚拟节点是否值得比较
function isSameVnode(oldVnode, newVnode) {
  return oldVnode.key === newVnode.key &&
    oldVnode.type === newVnode.type;
}

//找到孩子列表中对应索引的前一个元素
function findBeforeElement(children, index) {
  return !children[index + 1] ?
    null : children[index + 1].domElement;
}

//创建旧孩子节点对应的key和index的映射
function createMapByKeyToIndex(oldChildren) {
  let map = {}
  for (let i = 0; i < oldChildren.length; ++i) {
    let cur = oldChildren[i];
    if (cur.key) {
      map[cur.key] = i;
    }
  }
  return map;
}

//diff操作
function updateChildren(parent, oldChildren, newChildren) {
  /**
   * 这里我们将新、旧孩子节点的第一个节点分别称为“新前”和“旧前”
   * 这里我们将新、旧孩子节点的最后一个节点分别称为“新后”和“旧后”
   * 首先我们要设置好“新前”、“旧前”、“新后”、“旧后”的指针
   */
  let oldStartIndex = 0;
  let oldStartVnode = oldChildren[0];
  let newStartIndex = 0;
  let newStartVnode = newChildren[0];
  let oldEndIndex = oldChildren.length - 1;
  let oldEndVnode = oldChildren[oldEndIndex];
  let newEndIndex = newChildren.length - 1;
  let newEndVnode = newChildren[newEndIndex];

  //创建旧孩子节点对应的key和index的映射
  let map = createMapByKeyToIndex(oldChildren);

  /**
   * 开始比较
   * 比较规则顺序为：
   * 1.“新前”和“旧前”
   * 2，“新后”和“旧后”
   * 3.“新后”和“旧前”
   * 4.“新前”和“旧后”
   * 5.在map中寻找是否有和“新前”的key值对应的节点
   * 比较开始的时候要对比较的两个节点也进行patch操作
   * 比较结束后要对对应的指针进行移动，
   * 若为“*前”指针则后移一个位置，若为“*后”指针则前移一个位置，
   * 对于第5种比较顺序的移动规则详细见代码块内
   */
  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    if (!oldStartVnode) { //“旧前”为undefine则向后移动
      oldStartVnode = oldChildren[++oldStartIndex];
    } else if (!oldEndVnode) { //“旧后”为undefined则向前移动
      oldEndVnode = oldChildren[--oldEndIndex];
    } else if (isSameVnode(oldStartVnode, newStartVnode)) {
      patch(oldStartVnode, newStartVnode);
      oldStartVnode = oldChildren[++oldStartIndex];
      newStartVnode = newChildren[++newStartIndex];
    } else if (isSameVnode(oldEndVnode, newEndVnode)) {
      patch(oldEndVnode, newEndVnode);
      oldEndVnode = oldChildren[--oldEndIndex];
      newEndVnode = newChildren[--newEndIndex];
    } else if (isSameVnode(oldStartVnode, newEndVnode)) {
      patch(oldStartVnode, newEndVnode)
      parent.insertBefore(oldStartVnode.domElement, oldEndVnode.domElement.nextSiblings);
      oldStartVnode = oldChildren[++oldStartIndex];
      newEndVnode = newChildren[--newEndIndex];
    } else if (isSameVnode(oldEndVnode, newStartVnode)) {
      patch(oldEndVnode, newStartVnode);
      parent.insertBefore(oldEndVnode.domElement, oldStartVnode.domElement);
      oldEndVnode = oldChildren[--oldEndIndex];
      newStartVnode = newChildren[++newStartIndex];
    } else {
      let index = map[newStartVnode.key];
      if (!index) {
        //若map中无和“新前”的key一样的节点，则直接向oldStartVnode前插入新的节点
        parent.insertBefore(createDomElementFromVnode(newStartVnode), oldStartVnode.domElement);
      } else {
        //若有对应的则复用
        patch(oldChildren[index], newStartVnode);
        parent.insertBefore(oldChildren[index].domElement, oldStartVnode.domElement);
        //复用完要把对应的旧孩子节点设置为undefined，表示已经使用了
        oldChildren[index] = undefined;
      }
      //最后都要把“新前”的指针位置向前移动，因为已经它已被处理了
      newStartVnode = newChildren[++newStartIndex];
    }
  }
  /**
   * 到最后“新前”指针位置小于等于“新后”位置,
   * 则表示新孩子节点数量比旧孩子节点数量多，
   * 则直接把多出来的节点直接添加到newEndIndex+1对应的节点之前。
   * 原因是经过比较操作，newEndIndex会多向前移动一个位置(因为每次都是++newEndIndex)
   */
  if (newStartIndex <= newEndIndex) {
    for (let i = newStartIndex; i <= newEndIndex; ++i) {
      let beforeElement = findBeforeElement(newChildren, newEndIndex);
      parent.insertBefore(createDomElementFromVnode(newChildren[i]), beforeElement);
    }
  }
  /**
   * 到最后“旧前”指针位置小于等于“旧后”位置
   * 则表示新孩子节点数量比旧孩子节点数量少，
   * 直接移除多余的旧孩子节点即可
   */
  if (oldStartIndex <= oldEndIndex) {
    for (let i = oldStartIndex; i <= oldEndIndex; ++i) {
      if (oldChildren[i]) {
        parent.removeChild(oldChildren[i].domElement);
      }
    }
  }
}