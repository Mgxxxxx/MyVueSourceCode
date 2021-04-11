import vnode from "./vnode.js"

//创建一个虚拟节点
export default function createElement(type, props = {}, ...children) {
  let key; //将key从props中提取出来成为单独的值
  if (props.key) {
    key = props.key;
    delete props.key;
  }
  //遍历孩子节点，让每个孩子都成为虚拟节点，文本和标签节点都被转化为虚拟节点
  children = children.map(child => {
    if (typeof child === "string") {
      //文本节点对应的虚拟节点属性只有文本一个属性，其他属性设置为undefined
      return vnode(undefined, undefined, undefined, undefined, child);
    } else {
      return child;
    }
  })

  return vnode(type, key, props, children);
}