# watchProps 高级用法指南

## 新增的 Options 配置

### watchProp 函数

```javascript
watchProp(target, propertyName, options)
```

#### Options 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `debugger` | `Boolean\|Function` | `false` | 是否开启调试或条件断点函数 |
| `log` | `Boolean` | `true` | 是否输出日志 |
| `onBefore` | `Function` | `null` | 操作前钩子函数 |
| `onAfter` | `Function` | `null` | 操作后钩子函数 |
| `onAccess` | `Function` | `null` | 访问属性时的钩子 |
| `onModify` | `Function` | `null` | 修改属性时的钩子 |
| `onCall` | `Function` | `null` | 调用方法时的钩子 |

### watchObj 函数

```javascript
watchObj(obj, options, objName)
```

#### Options 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `debugger` | `Boolean\|Function` | `false` | 是否开启调试或条件断点函数 |
| `log` | `Boolean` | `true` | 是否输出日志 |
| `onBefore` | `Function` | `null` | 操作前钩子函数 |
| `onAfter` | `Function` | `null` | 操作后钩子函数 |
| `onAccess` | `Function` | `null` | 访问属性时的钩子 |
| `onModify` | `Function` | `null` | 修改属性时的钩子 |
| `onCall` | `Function` | `null` | 调用方法时的钩子 |
| `onDefine` | `Function` | `null` | 定义属性时的钩子 |
| `onDelete` | `Function` | `null` | 删除属性时的钩子 |
| `onConstruct` | `Function` | `null` | 构造函数调用时的钩子 |

## 使用示例

### 1. 条件断点

```javascript
// 只有当属性值包含特定内容时才触发断点
watchProp(obj, 'username', {
  debugger: (context) => {
    return context.type === 'set' && 
           context.newValue && 
           context.newValue.includes('admin');
  }
});

// 函数式条件断点
watchObj(obj, {
  debugger: (context) => {
    // 只在访问敏感属性时断点
    return context.type === 'get' && 
           ['password', 'token', 'secret'].includes(context.property);
  }
});
```

### 2. 钩子函数应用

#### 数据验证

```javascript
watchProp(user, 'email', {
  onBefore: (context) => {
    if (context.type === 'set') {
      const email = context.newValue;
      if (!email.includes('@')) {
        throw new Error('Invalid email format');
      }
    }
  },
  onAfter: (context) => {
    if (context.type === 'set') {
      console.log(`Email updated to: ${context.newValue}`);
    }
  }
});
```

#### 性能监控

```javascript
watchObj(apiClient, {
  onCall: (context) => {
    context.startTime = performance.now();
  },
  onAfter: (context) => {
    if (context.type === 'apply') {
      const duration = performance.now() - context.startTime;
      console.log(`API call took ${duration}ms`);
    }
  }
});
```

#### 状态同步

```javascript
watchObj(store, {
  onModify: (context) => {
    // 自动保存到 localStorage
    localStorage.setItem('store', JSON.stringify(context.target));
  },
  onAfter: (context) => {
    if (context.type === 'set') {
      // 触发 UI 更新
      updateUI(context.property, context.newValue);
    }
  }
});
```

### 3. 静默监听

```javascript
// 只使用钩子，不输出默认日志
watchObj(obj, {
  log: false,
  onAccess: (context) => {
    // 自定义访问日志
    console.log(`🔍 Accessed: ${context.property}`);
  },
  onModify: (context) => {
    // 自定义修改日志
    console.log(`✏️ Modified: ${context.property} = ${context.newValue}`);
  }
});
```

### 4. 安全监控

```javascript
watchObj(sensitiveObject, {
  debugger: (context) => {
    // 检测可疑操作
    const suspiciousPatterns = ['eval', 'innerHTML', 'outerHTML'];
    return suspiciousPatterns.some(pattern => 
      JSON.stringify(context).includes(pattern)
    );
  },
  onBefore: (context) => {
    // 记录所有操作
    securityLog.push({
      timestamp: Date.now(),
      operation: context.type,
      property: context.property,
      caller: context.caller
    });
  }
});
```

### 5. 开发调试

```javascript
// 开发环境的详细监控
if (process.env.NODE_ENV === 'development') {
  watchObj(complexObject, {
    debugger: true, // 所有操作都断点
    onBefore: (context) => {
      console.group(`🚀 ${context.type} operation starting`);
      console.log('Context:', context);
    },
    onAfter: (context) => {
      console.log('✅ Operation completed');
      console.groupEnd();
    }
  });
}
```

## Context 对象结构

钩子函数接收的 context 对象包含以下信息：

```javascript
{
  type: 'get' | 'set' | 'call' | 'apply' | 'defineProperty' | 'deleteProperty' | 'has' | 'ownKeys' | 'construct',
  target: Object,           // 目标对象
  property: String,         // 属性名（如果适用）
  oldValue: any,           // 原值（set 操作）
  newValue: any,           // 新值（set 操作）
  value: any,              // 获取的值（get 操作）
  arguments: Array,        // 函数参数（call/apply/construct 操作）
  result: any,             // 操作结果（onAfter 钩子）
  caller: String,          // 调用栈信息
  // ... 其他特定于操作类型的字段
}
```

## 兼容性

新版本完全兼容旧版本 API：

```javascript
// 旧版本写法仍然有效
watchProp(obj, 'prop', true);  // 等同于 { debugger: true }
watchObj(obj, true);           // 等同于 { debugger: true }
```

## 最佳实践

1. **性能考虑**：钩子函数应该尽可能轻量，避免复杂计算
2. **错误处理**：在钩子函数中使用 try-catch 避免影响原始操作
3. **条件断点**：使用具体的条件避免过度触发断点
4. **日志管理**：在生产环境中考虑禁用日志（`log: false`）
5. **内存管理**：及时调用 `unwatchObj` 清理不需要的监听

## 注意事项

- `watchProp` 和 `watchObj` 是独立的监听机制
- `unwatchObj` 只会取消 `watchObj` 创建的监听，不会影响 `watchProp`
- 钩子函数中修改 context 对象可能会影响后续处理
- 条件断点函数应该是纯函数，避免副作用