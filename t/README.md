# Request Forwarder - 请求转发工具

一个Chrome插件+Python服务端的请求转发工具，用于捕获和转发浏览器请求。

## 功能特点

- 🔄 实时拦截和转发浏览器请求
- 🎯 支持URL过滤规则（正则表达式）
- 📝 完整的请求信息（方法、URL、请求头、请求体）
- 🔒 支持HTTPS请求
- 📊 请求列表查看
- ⚙️ 灵活配置

## 安装和使用

### 1. 安装Python服务端

```bash
cd server
pip install -r requirements.txt
python server.py