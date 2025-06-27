#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import clipboardy from 'clipboardy';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const indexPath = path.join(__dirname, '../index.js');
const indexContent = fs.readFileSync(indexPath, 'utf-8');

// 判断是否是 -h 参数
const isHelp = process.argv.includes('-h') || process.argv.includes('--help');
const usage = `
使用方法：

// 简单开始
watchProp(targetObj, 'propName', false);

watchProp(targetObj, 'propName', {
  log: true,
  debugger: true, // 开启调试模式
});

// 条件断点
watchProp(targetObj, 'propName', {
  log: true,
  debugger: function(context){
    return context.type === 'get';
  }
});

// 修改set or get 的结果
watchProp(targetObj, 'propName', {
  log: true,
  onModResult: function(context){
    return context.result || 5;
  },
});

// 如果属性值是function
watchProp(targetObj, 'propName', {
  log: true,
  onModResult: function(context){
    const ret = context.func();
    ret.isVip = true;
    return ret;
  },
});

// 动态修改config
watchProp.getConfig(targetObj, 'propName').debugger = function(context){
  return context.type === 'get';
}
`;
if(isHelp){
  console.log(usage);
  process.exit(0);
}

clipboardy.writeSync(indexContent);
console.log('✅ watchProp Code has been copied to the clipboard.');