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
    }
};