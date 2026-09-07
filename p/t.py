import requests

response = requests.get("https://www.pixiv.net/signup.php?ref=wwwtop_accounts_index")

with open("signup.html","w",encoding="utf-8") as f:
    f.write(response.text)