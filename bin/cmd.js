#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import clipboardy from 'clipboardy';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const indexPath = path.join(__dirname, '../index.js');
const indexContent = fs.readFileSync(indexPath, 'utf-8');

const usage = `/* 使用方法：
监听属性: 
  watchProp(targetObj, 'propName', false)

监听对象:
    targetObj = watchObj(targetObj, false);
  
取消对象监听：
  targetObj = unwatchObj(targetObj);
*/`;
// 移除 export 语句，生成可直接执行的代码
const executableCode = indexContent
  .replace(/export\s*\{[^}]+\};?/g, '')
  + usage;

clipboardy.writeSync(executableCode);
console.log('✅ watchProps Code has been copied to the clipboard.');