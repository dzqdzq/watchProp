// watchProps - 对象属性监听工具
// 主入口文件

import { watchObj, unwatchObj, watchManager } from './watchObj.js';
import { watchProp, unwatchProp, getWatchedProps } from './watchProp.js';

// 导出所有功能
export {
  // 对象级监听
  watchObj,
  unwatchObj,
  watchManager,
  
  // 属性级监听
  watchProp,
  unwatchProp,
  getWatchedProps
};

// 便捷的全局函数（可选）
if (typeof globalThis !== 'undefined') {
  globalThis.watchObj = watchObj;
  globalThis.unwatchObj = unwatchObj;
  globalThis.watchProp = watchProp;
  globalThis.unwatchProp = unwatchProp;
  globalThis.getWatchedProps = getWatchedProps;
}

// 默认导出（包含所有功能）
export default {
  watchObj,
  unwatchObj,
  watchManager,
  watchProp,
  unwatchProp,
  getWatchedProps
};