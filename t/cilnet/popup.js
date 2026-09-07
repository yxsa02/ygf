document.addEventListener('DOMContentLoaded', async () => {
  // DOM元素
  const toggleSwitch = document.getElementById('toggleSwitch');
  const statusText = document.getElementById('statusText');
  const serverUrlInput = document.getElementById('serverUrl');
  const filterRulesTextarea = document.getElementById('filterRules');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
  const testResult = document.getElementById('testResult');
  
  // 加载配置
  async function loadConfig() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'getConfig' });
      const config = response.config;
      
      serverUrlInput.value = config.serverUrl || 'http://localhost:8080';
      filterRulesTextarea.value = (config.filterRules || []).join('\n');
      
      updateToggleState(config.enabled || false);
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  }
  
  // 更新开关状态
  function updateToggleState(enabled) {
    if (enabled) {
      toggleSwitch.classList.add('active');
      statusText.textContent = '已启用';
      statusText.style.color = '#4CAF50';
    } else {
      toggleSwitch.classList.remove('active');
      statusText.textContent = '已禁用';
      statusText.style.color = '#f44336';
    }
  }
  
  // 保存配置
  async function saveConfig() {
    const serverUrl = serverUrlInput.value.trim();
    const filterRules = filterRulesTextarea.value
      .split('\n')
      .map(rule => rule.trim())
      .filter(rule => rule.length > 0);
    
    if (!serverUrl) {
      showTestResult('请输入服务端地址', 'error');
      return;
    }
    
    const config = {
      serverUrl,
      filterRules,
      enabled: toggleSwitch.classList.contains('active')
    };
    
    try {
      await chrome.runtime.sendMessage({
        type: 'updateConfig',
        payload: config
      });
      
      showTestResult('配置已保存', 'success');
    } catch (error) {
      console.error('保存配置失败:', error);
      showTestResult('保存配置失败', 'error');
    }
  }
  
  // 切换开关
  function toggleSwitchState() {
    const isActive = toggleSwitch.classList.contains('active');
    const newState = !isActive;
    updateToggleState(newState);
    
    // 保存配置
    saveConfig();
  }
  
  // 测试连接
  async function testConnection() {
    const serverUrl = serverUrlInput.value.trim();
    
    if (!serverUrl) {
      showTestResult('请输入服务端地址', 'error');
      return;
    }
    
    testBtn.disabled = true;
    testBtn.textContent = '测试中...';
    
    try {
      const response = await fetch(`${serverUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        showTestResult(`✅ 连接成功！服务端: ${data.version || '1.0.0'}`, 'success');
      } else {
        showTestResult(`❌ 连接失败: HTTP ${response.status}`, 'error');
      }
    } catch (error) {
      console.error('测试连接失败:', error);
      showTestResult(`❌ 连接失败: ${error.message}`, 'error');
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = '测试连接';
    }
  }
  
  // 显示测试结果
  function showTestResult(message, type) {
    testResult.style.display = 'block';
    testResult.textContent = message;
    testResult.style.backgroundColor = type === 'success' ? '#d4edda' : '#f8d7da';
    testResult.style.color = type === 'success' ? '#155724' : '#721c24';
    testResult.style.border = `1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'}`;
    
    // 3秒后自动隐藏
    setTimeout(() => {
      testResult.style.display = 'none';
    }, 5000);
  }
  
  // 事件监听
  toggleSwitch.addEventListener('click', toggleSwitchState);
  saveBtn.addEventListener('click', saveConfig);
  testBtn.addEventListener('click', testConnection);
  
  // 回车键保存
  serverUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveConfig();
    }
  });
  
  // 初始化
  await loadConfig();
});