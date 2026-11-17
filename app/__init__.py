from flask import Flask
from . import server

class App:
    def __init__(self):
        self.flask = Flask("__main__")
        self
        server.setAPI(self)

