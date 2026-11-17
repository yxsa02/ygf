import os
from tqdm import tqdm
import requests, base64
import _thread

class get:
    def __init__(self, username, api_key):
        auth_string = base64.b64encode(f"{username}:{api_key}".encode()).decode()
        user_agent = "MyApp/1.0"
        self.headers = {
            "User-Agent": user_agent,
            "Authorization": f"Basic {auth_string}"
        }

    def get_f(self,uid):
        response = requests.get(f"https://e621.net/favorites.json?user_id={uid}",headers=self.headers)
        return response.json()['posts']

    def get_posts(self, keyWord, page=1):
        response = requests.get(f"https://e621.net/posts.json?tags={keyWord}&page={page}", headers=self.headers)
        return response.json()

    def get_pool(self, pool_id):
        response = requests.get(f"https://e621.net/pools/{pool_id}.json", headers=self.headers)
        return response.json()['name'], response.json()['post_ids']

    def dl_photo(self, post_id, savePath):
        url = f"https://e621.net/posts/{post_id}.json"
        # Basic 认证
        response = requests.get(url, headers=self.headers)

        if response.status_code == 200:
            data = response.json()
            image_url = data["post"]["file"]["url"]
            #print(f"图片地址: {image_url}")
            with open(os.path.join(savePath,f"{post_id}.{data["post"]["file"]['ext']}"),"wb") as pf:
                pf.write(requests.get(image_url,headers=self.headers).content)
        else:
            print(f"状态码: {response.status_code}")
            print(f"响应: {response.text}")

    def get_tags(self, keyWord):
        response = requests.get(f"https://e621.net/tags.json?search[name_matches]={keyWord}", headers=self.headers)
        return response.json()
def _a(d):
    a,b = d.get_pool(38176)
    #for i in d.get_posts("chinese")['posts']:
    if not os.path.exists(a):
        os.mkdir(a)
    for i in b:
        d.dl_photo(i,a)

def _b(d, kw):
    if not os.path.exists("temp"):
        os.mkdir("temp")
    # 定义需要跳过的版权标签和物种标签
    skip_copyrights = [
        "five_nights_at_freddy's",
        "five nights at freddy's", 
        "five_nights_at_freddy's:_security_breach",
        "five_nights_at_freddy's_2"
    ]
    skip_species = ["bear"]
    for i in tqdm(d.get_posts(kw, 4)['posts']):
        # 获取标签列表（如果不存在则为空列表）
        copyrights = i.get('tags', {}).get('copyright', [])
        species = i.get('tags', {}).get('species', [])
        # 检查是否匹配需要跳过的标签
        if i['rating'] == 's':
            continue
        if any(c in copyrights for c in skip_copyrights):
            continue
        if any(s in species for s in skip_species):
            continue
        _thread.start_new_thread(d.dl_photo, (i['id'], "temp"))  # 启动新线程下载图片

if __name__ == "__main__":
    username = "yxsa02"
    api_key = "UoCW3B5VAZjJnBVh8SLJLx5A"  # 从个人资料页生成
    d = get(username, api_key)
    for i in d.get_f("2619717"):
        print(i['id'])
        d.dl_photo(i['id'],"a")
    #print(d.get_tags("chinese"))
   # _b(d, "robot")
    #d.dl_photo(6226306,".")