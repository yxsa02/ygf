const display = {
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
        
        // 获取当前选中的项
        getChose() {
            return this.chose;
        }
        
        // 设置选中的项
        setChose(item) {
            if (this.box.indexOf(item) !== -1) {
                this.chose = item;
                this.updateUiHighlight();
            }
        }
        
        // 高亮显示选中的项
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
            const ctd_window = document.createElement("div");
            ctd_window.style.position = "fixed";
            ctd_window.style.top = "50%";
            ctd_window.style.left = "50%";
            ctd_window.style.transform = "translate(-50%, -50%)";
            ctd_window.style.backgroundColor = "#fff";
            ctd_window.style.padding = "20px";
            ctd_window.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.5)";
            ctd_window.style.zIndex = "100";
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

            const completeItemsBar = document.createElement("div");
            completeItemsBar.style.width = "100%";
            completeItemsBar.style.maxHeight = "150px";
            completeItemsBar.style.overflowY = "auto";
            completeItemsBar.style.border = "1px solid #ddd";
            completeItemsBar.style.borderRadius = "4px";
            completeItemsBar.style.marginBottom = "10px";
            completeItemsBar.style.display = "none";

            const suggestions = [];
            let selectedSuggestionIndex = -1;
            let suggestionTimer = null;

            const normalizeTag = (value) => String(value ?? "").trim();

            const renderSuggestions = () => {
                completeItemsBar.innerHTML = "";
                if (!suggestions.length) {
                    completeItemsBar.style.display = "none";
                    return;
                }

                for (let i = 0; i < suggestions.length; i++) {
                    const item = document.createElement("div");
                    item.textContent = suggestions[i];
                    item.style.padding = "6px 8px";
                    item.style.cursor = "pointer";
                    item.style.borderBottom = i === suggestions.length - 1 ? "" : "1px solid #f0f0f0";
                    item.style.backgroundColor = i === selectedSuggestionIndex ? "#eef2ff" : "#fff";
                    item.onmousedown = (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        const picked = normalizeTag(suggestions[i]);
                        input.value = picked;
                        suggestions.length = 0;
                        selectedSuggestionIndex = -1;
                        renderSuggestions();
                        input.focus();
                    };
                    item.onclick = (event) => {
                        event.preventDefault();
                    };
                    completeItemsBar.appendChild(item);
                }

                completeItemsBar.style.display = "block";
            };

            const loadSuggestions = async () => {
                const keyword = normalizeTag(input.value);
                if (!keyword || keyword.length < 3) {
                    suggestions.length = 0;
                    selectedSuggestionIndex = -1;
                    renderSuggestions();
                    return;
                }

                try {
                    const data = await geter.complete(keyword);
                    const nextSuggestions = Array.isArray(data)
                        ? data
                            .map((item) => {
                                if (typeof item === "string") return normalizeTag(item);
                                return normalizeTag(item?.name || item?.tag || item?.label || item?.value || "");
                            })
                            .filter(Boolean)
                            .slice(0, 10)
                        : [];

                    suggestions.length = 0;
                    suggestions.push(...nextSuggestions);
                    selectedSuggestionIndex = suggestions.length ? 0 : -1;
                    renderSuggestions();
                } catch (error) {
                    console.error("[E][choseTagDialog]", error);
                    suggestions.length = 0;
                    selectedSuggestionIndex = -1;
                    renderSuggestions();
                }
            };

            buttonContainer.appendChild(confirmButton);
            buttonContainer.appendChild(cancelButton);
            ctd_window.appendChild(input);
            ctd_window.appendChild(completeItemsBar);
            ctd_window.appendChild(buttonContainer);
            document.body.appendChild(ctd_window);

            input.addEventListener("input", () => {
                clearTimeout(suggestionTimer);
                suggestionTimer = setTimeout(() => {
                    loadSuggestions();
                }, 200);
            });

            input.focus();

            const cleanup = () => {
                clearTimeout(suggestionTimer);
                document.removeEventListener("keydown", onKeyDown);
                if (ctd_window.parentNode) {
                    document.body.removeChild(ctd_window);
                }
            };

            confirmButton.onclick = () => {
                const tagName = String(input.value ?? "").trim();
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

            const onKeyDown = (e) => {
                if (e.key === "Escape") {
                    cleanup();
                    resolve(null);
                    return;
                }

                if (e.key === "ArrowDown" && suggestions.length) {
                    e.preventDefault();
                    selectedSuggestionIndex = (selectedSuggestionIndex + 1) % suggestions.length;
                    renderSuggestions();
                    return;
                }

                if (e.key === "ArrowUp" && suggestions.length) {
                    e.preventDefault();
                    selectedSuggestionIndex = (selectedSuggestionIndex - 1 + suggestions.length) % suggestions.length;
                    renderSuggestions();
                    return;
                }

                if (e.key === "Enter") {
                    if (suggestions.length && selectedSuggestionIndex >= 0) {
                        e.preventDefault();
                        input.value = normalizeTag(suggestions[selectedSuggestionIndex]);
                        suggestions.length = 0;
                        selectedSuggestionIndex = -1;
                        renderSuggestions();
                        return;
                    }
                    confirmButton.click();
                }
            };

            document.addEventListener("keydown", onKeyDown);
        });
    }
};