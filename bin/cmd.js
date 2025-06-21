#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import clipboardy from 'clipboardy';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取主文件内容
const indexPath = path.join(__dirname, '../index.js');
const indexContent = fs.readFileSync(indexPath, 'utf-8');

const usage = `
\`使用方法：
监听属性: 
  watchProp(targetObj, 'propName', false)

监听对象:
    targetObj = watchObj(targetObj, false);
  
取消对象监听：
  targetObj = unwatchObj(targetObj);
\``;
// 移除 export 语句，生成可直接执行的代码
const executableCode = indexContent
  .replace(/export\s*\{[^}]+\};?/g, '') // 移除 export 语句
  .replace(/import\s+[^;]+;/g, '') // 移除 import 语句
  + `console.log(${usage})`;

// 写入剪贴板
clipboardy.writeSync(executableCode);
console.log('✅ watchProps 代码已复制到剪贴板，粘贴到你需要的地方！');