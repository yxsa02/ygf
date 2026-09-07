// 配置
let config = {
  serverUrl: 'http://localhost:8080',
  enabled: false,
  filterRules: []
};

// 从存储加载配置
async function loadConfig() {
  try {
    const result = await chrome.storage.sync.get(['serverUrl', 'enabled', 'filterRules']);
    if (result.serverUrl) config.serverUrl = result.serverUrl;
    if (result.enabled !== undefined) config.enabled = result.enabled;
    if (result.filterRules) config.filterRules = result.filterRules;
  } catch (error) {
    console.error('加载配置失败:', error);
  }
}

// 保存配置
async function saveConfig() {
  try {
    await chrome.storage.sync.set({
      serverUrl: config.serverUrl,
      enabled: config.enabled,
      filterRules: config.filterRules
    });
  } catch (error) {
    console.error('保存配置失败:', error);
  }
}

// 检查URL是否匹配过滤规则
function matchesFilter(url) {
  if (config.filterRules.length === 0) return true;
  
  return config.filterRules.some(rule => {
    try {
      const regex = new RegExp(rule);
      return regex.test(url);
    } catch (e) {
      return url.includes(rule);
    }
  });
}

// 转发请求到服务端
async function forwardRequest(details) {
  if (!config.enabled) return;
  
  // 检查过滤规则
  if (!matchesFilter(details.url)) return;
  
  try {
    // 获取请求头
    const headers = {};
    details.requestHeaders.forEach(header => {
      headers[header.name] = header.value;
    });
    
    // 获取请求体
    let body = null;
    if (details.method !== 'GET' && details.method !== 'HEAD') {
      try {
        const response = await fetch(details.url, {
          method: 'GET',
          headers: headers
        });
        body = await response.text();
      } catch (e) {
        // 如果无法获取body，则忽略
      }
    }
    
    // 构建转发的数据
    const forwardData = {
      method: details.method,
      url: details.url,
      headers: headers,
      body: body,
      timestamp: new Date().toISOString(),
      tabId: details.tabId,
      requestId: details.requestId
    };
    
    // 发送到服务端
    const response = await fetch(`${config.serverUrl}/api/forward`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(forwardData)
    });
    
    if (!response.ok) {
      console.error('转发请求失败:', response.status);
    }
  } catch (error) {
    console.error('转发请求异常:', error);
  }
}

// 拦截请求
function setupInterceptor() {
  // 移除旧的监听器
  if (chrome.webRequest.onBeforeRequest.hasListeners()) {
    chrome.webRequest.onBeforeRequest.removeListener(handleRequest);
  }
  if (chrome.webRequest.onBeforeSendHeaders.hasListeners()) {
    chrome.webRequest.onBeforeSendHeaders.removeListener(handleHeaders);
  }
  
  // 添加新的监听器
  chrome.webRequest.onBeforeRequest.addListener(
    handleRequest,
    { urls: ['<all_urls>'] },
    ['requestBody']
  );
  
  chrome.webRequest.onBeforeSendHeaders.addListener(
    handleHeaders,
    { urls: ['<all_urls>'] },
    ['requestHeaders']
  );
}

// 存储请求头
const requestHeadersMap = new Map();

function handleHeaders(details) {
  if (!config.enabled) return;
  
  requestHeadersMap.set(details.requestId, details.requestHeaders);
  
  // 转发请求（使用缓存的请求头）
  forwardRequestWithHeaders(details);
}

function handleRequest(details) {
  if (!config.enabled) return;
  
  // 缓存请求ID
  requestHeadersMap.set(details.requestId + '_body', details.requestBody);
}

async function forwardRequestWithHeaders(details) {
  if (!config.enabled) return;
  
  if (!matchesFilter(details.url)) return;
  
  try {
    // 获取缓存的请求头
    const headers = requestHeadersMap.get(details.requestId) || [];
    const headerObj = {};
    headers.forEach(header => {
      headerObj[header.name] = header.value;
    });
    
    // 获取请求体
    const bodyData = requestHeadersMap.get(details.requestId + '_body');
    let body = null;
    if (bodyData && bodyData.raw) {
      const raw = bodyData.raw[0];
      if (raw.bytes) {
        body = new TextDecoder().decode(raw.bytes);
      }
    }
    
    const forwardData = {
      method: details.method,
      url: details.url,
      headers: headerObj,
      body: body,
      timestamp: new Date().toISOString(),
      tabId: details.tabId,
      requestId: details.requestId
    };
    
    const response = await fetch(`${config.serverUrl}/api/forward`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(forwardData)
    });
    
    if (!response.ok) {
      console.error('转发请求失败:', response.status);
    }
    
    // 清理缓存
    requestHeadersMap.delete(details.requestId);
    requestHeadersMap.delete(details.requestId + '_body');
  } catch (error) {
    console.error('转发请求异常:', error);
  }
}

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getConfig') {
    sendResponse({ config });
  } else if (message.type === 'updateConfig') {
    config = { ...config, ...message.payload };
    saveConfig();
    setupInterceptor();
    sendResponse({ success: true });
  } else if (message.type === 'getStatus') {
    sendResponse({ enabled: config.enabled });
  }
});

// 初始化
loadConfig().then(() => {
  setupInterceptor();
});

console.log('Request Forwarder background script loaded');