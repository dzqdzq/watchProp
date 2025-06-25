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
 * @returns {Boolean} isDebugger 是否开启调试, 默认为false
 */
function watchProp(targetObject, propertyName, isDebugger = false) {
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

  const { set, get } = desc;
  if (typeof desc.value === "function") {
    let oldValue = desc.value;
    targetObject[prop] = function (...args) {
      if (isDebugger) {
        debugger;
      }
      // 防止无限递归
      if(targetObject !== console && targetObject !== log){
        console.log(
          `[${TAG}][调用] ${propertyName} 参数:`,
          args,
          "位置:\n",
          getCallerInfo()
        );
      }
      return oldValue.apply(this, args);
    };
    return;
  } else if (set || get) {
    let oldSet = set;
    let oldGet = get;
    if (oldSet) {
      desc.set = function (value) {
        if (isDebugger) {
          debugger;
        }
        console.log(`[${TAG}][修改] ${propertyName} 值:`, value);
        console.log(
          `[${TAG}][修改] ${propertyName} 修改位置:\n`,
          getCallerInfo()
        );
        return oldSet.apply(this, [value]);
      };
    }
    if (oldGet) {
      desc.get = function () {
        if (isDebugger) {
          debugger;
        }
        const value = oldGet.apply(this);
        console.log(`[${TAG}][访问] ${propertyName} 值:`, value, "位置:\n", getCallerInfo());
        return value;
      };
    }
    Object.defineProperty(targetObject, prop, desc);
    return;
  } else {
    let _value = targetObject[prop];

    Object.defineProperty(targetObject, prop, {
      get: function () {
        if (isDebugger) {
          debugger;
        }
        console.log(`[${TAG}][访问] ${propertyName} 值:`, _value, "位置:\n", getCallerInfo());
        return value;
      },
      set: function (value) {
        if (isDebugger) {
          debugger;
        }
        console.log(
          `[${TAG}][修改] ${propertyName} 原值:`, _value, "新值:", value, "位置:\n", getCallerInfo()
        );
        _value = value;
      },
      configurable: true,
      enumerable: true,
    });
  }
}

// 全局对象监听管理器
const watchManager = {
  // 存储原始对象到监听信息的映射
  watchedObjects: new WeakMap(),
  // 存储对象名称到对象的映射（用于eval方案）
  namedObjects: new Map(),
  // 存储Proxy对象的元数据，避免在Proxy上定义属性触发监听
  proxyMetadata: new WeakMap(),
  
  /**
   * 监听对象 - 高级版本，支持自动替换
   * @param {Object} obj 要监听的对象
   * @param {Boolean} isDebugger 是否开启调试
   * @param {String} objName 对象名称（用于eval替换）
   * @returns {Object} 返回proxy对象
   */
  watchObj(obj, isDebugger = false, objName = null) {
    const TAG = "WATCH_OBJ";
    
    if (!obj || (typeof obj !== "object" && typeof obj !== "function")) {
      console.error(`[${TAG}] 参数必须是对象或函数`);
      return obj;
    }
    
    // 如果已经被监听，直接返回
    if (this.watchedObjects.has(obj)) {
      console.warn(`[${TAG}] 对象已经被监听`);
      return this.watchedObjects.get(obj).proxy;
    }
    
    function log(action, infos) {
      console.log(`[${TAG}] [${action}]`, infos, "stack:", new Error().stack.split("\n").slice(3).join("\n"));
    }
    
    const proxyInfo = Proxy.revocable(obj, {
      apply(target, thisArg, argumentsList) {
        if (isDebugger) {
          debugger;
        }
        log("call/apply", {调用方法: target, 参数: argumentsList});
        return Reflect.apply(target, thisArg, argumentsList);
      },
      
      defineProperty(target, propertyName, desc) {
        if (isDebugger) {
          debugger;
        }
        log("defineProperty", {target, 属性名: propertyName, 属性描述: desc});
      return Reflect.defineProperty(target, propertyName, desc);
      },
      deleteProperty(target, propertyName) {
        if (isDebugger) {
          debugger;
        }
        log("deleteProperty", {target, 属性名: propertyName, 删除值: Reflect.get(target, propertyName)});
        return Reflect.deleteProperty(target, propertyName);
      },
      has(target, propertyName) {
        if (isDebugger) {
          debugger;
        }
        const value = Reflect.has(target, propertyName);
        log("has", {target, 属性名: propertyName, 是否存在: value});
        return value;
      },
      get(target, prop, receiver) {
        if (isDebugger) {
          debugger;
        }
        const value = Reflect.get(target, prop, receiver);
        log("get", {target, 属性名: prop, 获取值: value});
        return value;
      },
      set(target, prop, value, receiver) {
        if (isDebugger) {
          debugger;
        }
        log("set", {target, 属性名: prop, 原值: Reflect.get(target, prop), 新值: value});
        // 直接设置属性值，避免触发defineProperty trap
        target[prop] = value;
        return true;
      },
      construct(target, argumentsList) {
        if (isDebugger) {
          debugger;
        }
        log("new_class", {target, 参数: argumentsList});
        return Reflect.construct(target, argumentsList);
      },
      ownKeys(target) {
        if (isDebugger) {
          debugger;
        }
        const value = Reflect.ownKeys(target);
        log("ownKeys", {target, keys: value});
        return value;
      },
    });

    const proxy = proxyInfo.proxy;
     
     // 存储监听信息
     const watchInfo = {
       originalObject: obj,
       proxy: proxy,
       revoke: proxyInfo.revoke,
       isDebugger: isDebugger,
       objName: objName
     };
     
     this.watchedObjects.set(obj, watchInfo);
     
     // 如果提供了对象名称，存储名称映射
     if (objName) {
       this.namedObjects.set(objName, { original: obj, proxy: proxy });
     }
     
     console.log(`[${TAG}] 开始监听对象${objName ? ` (${objName})` : ''}`);
     
     // 使用WeakMap存储Proxy元数据，避免触发监听器
     this.proxyMetadata.set(proxy, {
       isWatchedProxy: true,
       originalObject: obj
     });
     
     return proxy;
   },
   
   /**
     * 取消监听对象
     * @param {Object} objOrName 要取消监听的对象或对象名称
     * @returns {Object|Boolean} 返回原始对象或false
     */
    unwatchObj(objOrName) {
      const TAG = "WATCH_OBJ";
      
      if (!objOrName) {
        console.error(`[${TAG}] 参数不能为空`);
        return false;
      }
      
      let watchInfo;
      let originalObj;
      
      // 如果是字符串，按名称查找
      if (typeof objOrName === 'string') {
        const namedObj = this.namedObjects.get(objOrName);
        if (!namedObj) {
          console.warn(`[${TAG}] 未找到名为 '${objOrName}' 的监听对象`);
          return false;
        }
        originalObj = namedObj.original;
        watchInfo = this.watchedObjects.get(originalObj);
      } else {
        // 检查是否是proxy对象（使用WeakMap避免触发监听）
        const proxyMeta = this.proxyMetadata.get(objOrName);
        if (proxyMeta && proxyMeta.isWatchedProxy) {
          originalObj = proxyMeta.originalObject;
          watchInfo = this.watchedObjects.get(originalObj);
        } else {
          // 直接是原始对象
          originalObj = objOrName;
          watchInfo = this.watchedObjects.get(originalObj);
        }
      }
      
      if (!watchInfo) {
        console.warn(`[${TAG}] 对象未被监听`);
        return false;
      }
      
      try {
        // 撤销proxy
        watchInfo.revoke();
        
        // 清除映射关系
        this.watchedObjects.delete(originalObj);
        if (watchInfo.objName) {
          this.namedObjects.delete(watchInfo.objName);
        }
        // 清除proxy元数据
        this.proxyMetadata.delete(watchInfo.proxy);
        
        console.log(`[${TAG}] 取消监听成功${watchInfo.objName ? ` (${watchInfo.objName})` : ''}`);
        return originalObj; // 返回原始对象
      } catch (e) {
        console.error(`[${TAG}] 取消监听失败:`, e.message);
        return false;
      }
    },
 };

// 导出便捷函数
function watchObj(obj, isDebugger = false) {
  return watchManager.watchObj(obj, isDebugger);
}

function unwatchObj(obj) {
  const result = watchManager.unwatchObj(obj);
  return result !== false ? result : false;
}

export { watchProp, watchObj, unwatchObj, watchManager, smartWatch };