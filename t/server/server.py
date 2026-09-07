#!/usr/bin/env python3
"""
请求转发服务端
接收来自Chrome插件的请求数据并处理
"""

import json
import logging
import os
import sys
from datetime import datetime
from typing import Dict, Any, Optional

from flask import Flask, request, jsonify
from flask_cors import CORS
import yaml

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 创建Flask应用
app = Flask(__name__)
CORS(app)  # 允许跨域

# 配置
CONFIG_FILE = 'config.yaml'
config = {
    'max_requests': 1000,
    'log_requests': True,
    'save_to_file': False,
    'output_file': 'requests.log'
}

# 存储请求
requests_store: list = []


def load_config():
    """加载配置文件"""
    global config
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                config.update(yaml.safe_load(f) or {})
            logger.info(f"已加载配置文件: {CONFIG_FILE}")
        except Exception as e:
            logger.error(f"加载配置文件失败: {e}")
    else:
        logger.warning(f"配置文件不存在，使用默认配置")


def save_request(data: Dict[str, Any]):
    """保存请求数据"""
    global requests_store
    
    # 添加接收时间
    data['received_at'] = datetime.now().isoformat()
    
    # 存储到内存
    requests_store.append(data)
    
    # 限制存储数量
    if len(requests_store) > config.get('max_requests', 1000):
        requests_store.pop(0)
    
    # 保存到文件
    if config.get('save_to_file', False):
        try:
            output_file = config.get('output_file', 'requests.log')
            with open(output_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(data, ensure_ascii=False) + '\n')
        except Exception as e:
            logger.error(f"保存请求到文件失败: {e}")
    
    # 日志记录
    if config.get('log_requests', True):
        logger.info(f"收到请求: {data.get('method')} {data.get('url')}")
        logger.debug(f"请求头: {data.get('headers')}")
        if data.get('body'):
            logger.debug(f"请求体: {data.get('body')[:200]}...")


@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查端点"""
    return jsonify({
        'status': 'ok',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat(),
        'requests_count': len(requests_store)
    })


@app.route('/api/forward', methods=['POST'])
def forward_request():
    """接收转发的请求"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': '无效的请求数据'}), 400
        
        # 保存请求
        save_request(data)
        
        # 可以在这里添加自定义处理逻辑
        # 例如：转发到其他服务、存储到数据库、分析请求等
        
        return jsonify({
            'status': 'ok',
            'message': '请求已接收',
            'request_id': data.get('requestId')
        }), 200
        
    except Exception as e:
        logger.error(f"处理请求失败: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/requests', methods=['GET'])
def get_requests():
    """获取已接收的请求列表"""
    limit = request.args.get('limit', 100, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    # 获取请求列表
    items = requests_store[-limit-offset:-offset] if offset > 0 else requests_store[-limit:]
    
    return jsonify({
        'total': len(requests_store),
        'limit': limit,
        'offset': offset,
        'items': items
    })


@app.route('/api/requests/<request_id>', methods=['GET'])
def get_request(request_id):
    """获取特定请求详情"""
    for req in requests_store:
        if req.get('requestId') == request_id:
            return jsonify(req)
    
    return jsonify({'error': '请求不存在'}), 404


@app.route('/api/config', methods=['GET', 'POST'])
def manage_config():
    """管理配置"""
    if request.method == 'GET':
        return jsonify(config)
    else:
        try:
            new_config = request.get_json()
            if new_config:
                config.update(new_config)
                # 保存到文件
                with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
                    yaml.dump(config, f, allow_unicode=True)
                return jsonify({'status': 'ok', 'message': '配置已更新'})
            return jsonify({'error': '无效的配置'}), 400
        except Exception as e:
            return jsonify({'error': str(e)}), 500


@app.route('/api/clear', methods=['POST'])
def clear_requests():
    """清空存储的请求"""
    global requests_store
    count = len(requests_store)
    requests_store = []
    return jsonify({
        'status': 'ok',
        'message': f'已清空 {count} 条请求'
    })


@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': '接口不存在'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': '服务器内部错误'}), 500


def main():
    """主函数"""
    # 加载配置
    load_config()
    
    # 获取端口
    port = int(os.environ.get('PORT', 8080))
    host = os.environ.get('HOST', '0.0.0.0')
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    logger.info(f"启动请求转发服务: http://{host}:{port}")
    logger.info(f"调试模式: {debug}")
    
    # 启动服务
    app.run(host=host, port=port, debug=debug)


if __name__ == '__main__':
    main()