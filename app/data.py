class Task:
    def __init__(self,need,needNot,count):
        self.need = need
        self.needNot = needNot
        self.count = count
    def makeKeyword(self):
        self.keyword = ""
        for i in self.need:
            self.keyword += i + " "
        for i in self.needNot:
            self.keyword += "-" + i + " "
