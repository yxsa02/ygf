const util = {
    "listWidget": class {
        constructor(ui) {
            this.box = [];
            ui.style.overflowY = "auto";
            this.ui = ui;
            this.chose = null;
        }

        add(item) {
            if (this.box.indexOf(item) !== -1) {
                return;
            }
            this.box.push(item);
            this.updateUi();
        }
        
        remove(item) {
            const index = this.box.indexOf(item);
            if (index !== -1) {
                this.box.splice(index, 1);
                // 如果删除的是当前选中的项，清空选择
                if (this.chose === item) {
                    this.chose = null;
                }
                this.updateUi();
            }
        }
        
        get() {
            return [...this.box]; // 返回副本，防止外部修改
        }
        
        clear() {
            this.box = [];
            this.chose = null;
            this.updateUi();
        }
        
        updateUi() {
            this.ui.innerHTML = "";
            for (const item of this.box) {
                const div = document.createElement("div");
                div.textContent = item; // 使用 textContent 防止 XSS
                div.onclick = () => {
                    this.updateUiHighlight();
                    this.chose = item;
                };
                this.ui.appendChild(div);
            }
        }
        
        // 新增：获取当前选中的项
        getChose() {
            return this.chose;
        }
        
        // 新增：设置选中的项
        setChose(item) {
            if (this.box.indexOf(item) !== -1) {
                this.chose = item;
                this.updateUiHighlight();
            }
        }
        
        // 新增：高亮显示选中的项
        updateUiHighlight() {
            const children = this.ui.children;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                const itemText = child.textContent;
                if (itemText === this.chose) {
                    child.style.backgroundColor = "#2a11e9";
                    child.style.color = "white";
                } else {
                    child.style.backgroundColor = "";
                    child.style.color = "";
                }
            }
        }
    },
    "choseTagDialog": function () {
    return new Promise((resolve) => {
        // 使用 const 声明
        const ctd_window = document.createElement("div");
        ctd_window.style.position = "fixed";
        ctd_window.style.top = "50%";
        ctd_window.style.left = "50%";
        ctd_window.style.transform = "translate(-50%, -50%)";
        ctd_window.style.backgroundColor = "#fff";
        ctd_window.style.padding = "20px";
        ctd_window.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.5)";
        ctd_window.style.zIndex = "10000";
        ctd_window.style.borderRadius = "8px";
        ctd_window.style.minWidth = "300px";

        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "请输入标签名称";
        input.style.width = "100%";
        input.style.marginBottom = "10px";
        input.style.padding = "8px";
        input.style.boxSizing = "border-box";

        const buttonContainer = document.createElement("div");
        buttonContainer.style.display = "flex";
        buttonContainer.style.justifyContent = "flex-end";
        buttonContainer.style.gap = "10px";

        const confirmButton = document.createElement("button");
        confirmButton.textContent = "确认";
        confirmButton.style.padding = "6px 12px";
        confirmButton.style.cursor = "pointer";

        const cancelButton = document.createElement("button");
        cancelButton.textContent = "取消";
        cancelButton.style.padding = "6px 12px";
        cancelButton.style.cursor = "pointer";

        buttonContainer.appendChild(confirmButton);
        buttonContainer.appendChild(cancelButton);
        ctd_window.appendChild(input);
        ctd_window.appendChild(buttonContainer);
        document.body.appendChild(ctd_window);

        // 自动聚焦输入框
        input.focus();

        const cleanup = () => {
            if (ctd_window.parentNode) {
                document.body.removeChild(ctd_window);
            }
        };

        confirmButton.onclick = () => {
            const tagName = input.value.trim();
            if (tagName) {
                cleanup();
                resolve(tagName);
            } else {
                alert("标签名称不能为空！");
                input.focus();
            }
        };

        cancelButton.onclick = () => {
            cleanup();
            resolve(null);
        };

        // 按 ESC 键取消
        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                cleanup();
                resolve(null);
                document.removeEventListener("keydown", onKeyDown);
            } else if (e.key === "Enter") {
                confirmButton.click();
            }
        };
        document.addEventListener("keydown", onKeyDown);
    });
}
};