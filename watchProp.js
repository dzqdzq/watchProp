/**
 * 获取调用栈信息，用于确定谁在访问/修改/调用属性
 * @returns {string} 调用栈信息
 */
function getCallerInfo() {
  const error = new Error();
  const stack = error.stack.split('\n');
  return stack.slice(2).join('\n');
}

/**
 * 监控对象某个属性增删改查
 * @param {Object} target 目标对象
 * @param {string} propertyName 要监控的属性名， 支持Symbol
 * @param {Object|Boolean} options 配置选项或兼容旧版本的isDebugger参数
 * @param {Boolean|Function} options.debugger 是否开启调试或条件断点函数
 * @param {Boolean} options.log 是否输出日志，默认true
 * @param {Function} options.onBefore 操作前钩子函数
 * @param {Function} options.onAfter 操作后钩子函数
 * @param {Function} options.onAccess 访问属性时的钩子
 * @param {Function} options.onModify 修改属性时的钩子
 * @param {Function} options.onCall 调用方法时的钩子
 */
function watchProp(targetObject, propertyName, options = {}) {
  // 兼容旧版本API
  if (typeof options === 'boolean') {
    options = { debugger: options };
  }
  
  // 默认配置
  const config = {
    debugger: false,
    log: true,
    onBefore: null,
    onAfter: null,
    onAccess: null,
    onModify: null,
    ...options
  };
  const TAG = "WATCH_PROP";
  if (!targetObject || !propertyName) {
    console.error(`[${TAG}] 参数错误`);
    return;
  }

  let isSymbol = false;
  if (typeof propertyName === "string") {
    if (propertyName === "") {
      console.error(`[${TAG}] 参数错误, propertyName必须是string或者Symbol`);
      return;
    } else if (propertyName.startsWith("Symbol(")) {
      propertyName = propertyName.replace(/"/g, "").replace(/'/g, "");
      isSymbol = true;
    }
  }

  let sym = null;
  if (typeof propertyName === "symbol" || isSymbol) {
    propertyName = propertyName.toString();
    sym = Object.getOwnPropertySymbols(targetObject).find(
      (symbol) => symbol.toString() === propertyName
    );
    if (!sym) {
      console.error(`[${TAG}] ${propertyName} 属性不存在`);
      return;
    }
  }

  const prop = sym || propertyName;
  const desc = Object.getOwnPropertyDescriptor(targetObject, prop);
  if (!desc) {
    console.error(`[${TAG}] ${propertyName} 属性不存在, 无法监控`);
    return;
  }
  if (!desc.configurable) {
    console.error(`[${TAG}] ${propertyName} 被限制无法监控`);
    return;
  }

  // 辅助函数：条件断点检查
  const shouldDebug = (context) => {
    if (typeof config.debugger === 'function') {
      return config.debugger(context);
    }
    return config.debugger;
  };
  
  // 辅助函数：安全日志输出
  const safeLog = (message, ...args) => {
    if (config.log && targetObject !== console) {
      console.log(message, ...args);
    }
  };

  const { set, get } = desc;
  if (typeof desc.value === "function") {
    let oldValue = desc.value;
    targetObject[prop] = function (...args) {
      const context = {
        type: 'call',
        target: targetObject,
        property: propertyName,
        arguments: args,
        caller: getCallerInfo()
      };
      
      // 执行前钩子
      if (config.onBefore) {
        config.onBefore(context);
      }
      if (config.onCall) {
        config.onCall(context);
      }
      
      // 条件断点
      if (shouldDebug(context)) {
        debugger;
      }
      
      // 日志输出
      safeLog(
        `[${TAG}][调用] ${propertyName} 参数:`,
        args,
        "位置:\n",
        getCallerInfo()
      );
      
      // 执行原函数
      const result = oldValue.apply(this, args);
      
      // 执行后钩子
      const afterContext = { ...context, result };
      if (config.onAfter) {
        config.onAfter(afterContext);
      }
      
      return result;
    };
    return;
  } else if (set || get) {
    let oldSet = set;
    let oldGet = get;
    if (oldSet) {
      desc.set = function (value) {
        const context = {
          type: 'set',
          target: targetObject,
          property: propertyName,
          oldValue: this[prop],
          newValue: value,
          caller: getCallerInfo()
        };
        
        // 执行前钩子
        if (config.onBefore) {
          config.onBefore(context);
        }
        if (config.onModify) {
          config.onModify(context);
        }
        
        // 条件断点
        if (shouldDebug(context)) {
          debugger;
        }
        
        // 日志输出
        safeLog(`[${TAG}][修改] ${propertyName} 值:`, value);
        safeLog(
          `[${TAG}][修改] ${propertyName} 修改位置:\n`,
          getCallerInfo()
        );
        
        // 执行原setter
        const result = oldSet.apply(this, [value]);
        
        // 执行后钩子
        const afterContext = { ...context, result };
        if (config.onAfter) {
          config.onAfter(afterContext);
        }
        
        return result;
      };
    }
    if (oldGet) {
      desc.get = function () {
        const context = {
          type: 'get',
          target: targetObject,
          property: propertyName,
          caller: getCallerInfo()
        };
        
        // 执行前钩子
        if (config.onBefore) {
          config.onBefore(context);
        }
        if (config.onAccess) {
          config.onAccess(context);
        }
        
        // 条件断点
        if (shouldDebug(context)) {
          debugger;
        }
        
        // 执行原getter
        const value = oldGet.apply(this);
        
        // 日志输出
        safeLog(`[${TAG}][访问] ${propertyName} 值:`, value, "位置:\n", getCallerInfo());
        
        // 执行后钩子
        const afterContext = { ...context, value };
        if (config.onAfter) {
          config.onAfter(afterContext);
        }
        
        return value;
      };
    }
    Object.defineProperty(targetObject, prop, desc);
    return;
  } else {
    let _value = targetObject[prop];

    Object.defineProperty(targetObject, prop, {
      get: function () {
        const context = {
          type: 'get',
          target: targetObject,
          property: propertyName,
          value: _value,
          caller: getCallerInfo()
        };
        
        // 执行前钩子
        if (config.onBefore) {
          config.onBefore(context);
        }
        if (config.onAccess) {
          config.onAccess(context);
        }
        
        // 条件断点
        if (shouldDebug(context)) {
          debugger;
        }
        
        // 日志输出
        safeLog(`[${TAG}][访问] ${propertyName} 值:`, _value, "位置:\n", getCallerInfo());
        
        // 执行后钩子
        const afterContext = { ...context };
        if (config.onAfter) {
          config.onAfter(afterContext);
        }
        
        return _value;
      },
      set: function (value) {
        const context = {
          type: 'set',
          target: targetObject,
          property: propertyName,
          oldValue: _value,
          newValue: value,
          caller: getCallerInfo()
        };
        
        // 执行前钩子
        if (config.onBefore) {
          config.onBefore(context);
        }
        if (config.onModify) {
          config.onModify(context);
        }
        
        // 条件断点
        if (shouldDebug(context)) {
          debugger;
        }
        
        // 日志输出
        safeLog(
          `[${TAG}][修改] ${propertyName} 原值:`, _value, "新值:", value, "位置:\n", getCallerInfo()
        );
        
        // 更新值
        _value = value;
        
        // 执行后钩子
        const afterContext = { ...context };
        if (config.onAfter) {
          config.onAfter(afterContext);
        }
      },
      configurable: true,
      enumerable: true,
    });
  }
}