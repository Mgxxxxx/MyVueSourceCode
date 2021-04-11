import {
  h,
  render,
  patch
} from "./index.js"

const vnode = h('div', {},
  h('li', {
    style: {
      background: 'red'
    },
    key: 'A'
  }, 'A'),
  h('li', {
    style: {
      background: 'yellow'
    },
    key: 'B'
  }, 'B'),
  h('li', {
    style: {
      background: 'blue'
    },
    key: 'C'
  }, 'C'),
  h('li', {
    style: {
      background: 'green'
    },
    key: 'D'
  }, 'D'),
);

render(vnode, document.getElementById("app"));
let newVnode = h('div', {},
  h('li', {
    style: {
      background: 'yellow'
    },
    key: 'B'
  }, 'B1'),
  h('li', {
    style: {
      background: 'blue'
    },
    key: 'C'
  }, 'C1'),
  h('li', {
    style: {
      background: 'pink'
    },
    key: 'Q'
  }, 'Q1'),
  h('li', {
    style: {
      background: 'red'
    },
    key: 'A'
  }, 'A1'),
  h('li', {
    style: {
      background: 'gold'
    },
    key: 'E'
  }, 'E1'),
);
console.log(newVnode);
setTimeout(() => {
  patch(vnode, newVnode);
}, 1000);
// patch(vnode, newVnode);