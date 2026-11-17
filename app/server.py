from flask import send_file, request
from typing import TYPE_CHECKING
from . import data
if TYPE_CHECKING:
    import app

def setAPI(app:"app.App"):
    @app.flask.route("/")
    def home():
        return send_file("src/finder.html")
    @app.flask.route("/src/<path:fn>")
    def src(fn):
        return send_file(f"src/{fn}")
    @app.flask.route("/api/setTask",methods=['POST'])
    def setTask():
        try:
            r = request.json
            app.task = data.Task(r['need'],r['needNot'],r['count'])
            return {"code":0}
        except KeyError:
            return {"code":1,"msg":"参数错误"}
        