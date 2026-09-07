from flask import Flask, jsonify, request, send_from_directory, send_file
import os, requests

app = Flask(__name__,static_url_path="",template_folder="src",static_folder="src")

@app.route('/api/finder', methods=['GET', 'POST'])
def get_data():
    data = {
        'message': 'Hello, World!',
        'status': 'success'
    }
    return jsonify(data)

@app.route('/api/pic')
def get_pic():
    return requests.get(request.args.get('url')).content

@app.route('/<path:filename>')
def serve_files(filename):
    """智能路由：自动查找文件位置"""
    if os.path.exists(os.path.join('src', filename)):
        return send_from_directory('src', filename)
    else:
        return "File not found", 404

@app.route('/res/<path:filename>')
def serve_files(filename):  
    # 在res文件夹查找
    if os.path.exists(os.path.join('res', filename)):
        return send_from_directory('res', filename)
    else:
        return "File not found", 404


if __name__ == '__main__':
    app.run()