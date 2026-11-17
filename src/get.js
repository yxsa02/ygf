const geter = {
    "complete": key => {
        const value = String(key ?? "").trim();
        if (!value || value.length < 3) {
            return Promise.resolve([]);
        }

        return fetch(`https://e926.net/tags/autocomplete.json?search%5Bname_matches%5D=${encodeURIComponent(value)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('网络响应失败');
                }
                return response.json();
            })
            .then(data => {
                if (!Array.isArray(data)) {
                    return [];
                }
                return data;
            })
            .catch(e => {
                console.error("[E][geter-complete]", e);
                return [];
            });
    },
    "sendTask": (need,needNot,count) => {
        return fetch("/api/setTask", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ need, needNot, count })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`网络响应失败 (${response.status})`);
            }
            return response.json();
        })
        .then(result => {
            console.log('发送任务结果:', result);
            if (result && result.status === 's') {
                return result;
            }
        });
    }
};