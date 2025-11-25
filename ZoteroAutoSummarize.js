const fs = require('fs');
const path = require('path');
// Notice 和 requestUrl 是全局变量，无需 require

module.exports = {
    // 1. 设置定义
    settings: {
        name: "Zotero AI Summarizer",
        author: "Gemini",
        options: {
            "zoteroDataDir": {
                type: "text",
                defaultValue: "E:\\MyData\\Research\\Papers\\ZoteroLib",
                placeholder: "例如: E:\\Zotero",
                description: "Zotero 数据存储目录 (不包含 storage 子目录)",
            },
            "apiKey": {
                type: "text",
                defaultValue: "",
                placeholder: "sk-...",
                description: "OpenAI 格式的 API Key",
            },
            "apiUrl": {
                type: "text",
                defaultValue: "https://open.cherryin.net/v1/chat/completions",
                placeholder: "API 地址",
                description: "完整 API URL",
            },
            "modelName": {
                type: "text",
                defaultValue: "qwen/qwen3-omni-30b-a3b-thinking(free)",
                placeholder: "模型名称",
                description: "例如 gpt-4o 或 qwen-plus",
            },
            "maxPages": {
                type: "text",
                defaultValue: "10",
                description: "仅读取 PDF 前 N 页 (填数字)",
            },
            "maxTextLength": {
                type: "text",
                defaultValue: "50000",
                description: "最大提取字符数 (填数字)",
            }
        }
    },

    // 2. 入口函数
    entry: async (params, settings) => {
        const { app } = params;

        // --- 获取配置 ---
        const config = {
            dataDir: settings["zoteroDataDir"],
            apiKey: settings["apiKey"],
            apiUrl: settings["apiUrl"],
            model: settings["modelName"],
            maxPages: parseInt(settings["maxPages"]) || 10,
            maxText: parseInt(settings["maxTextLength"]) || 50000
        };

        // console.log("🛠️ [ZoteroAI] 配置加载:", config);

        if (!config.apiKey) {
            new Notice("❌ API Key 未配置");
            return;
        }

        const activeFile = app.workspace.getActiveFile();
        if (!activeFile) {
            new Notice("⚠️ 未检测到当前活动文件");
            return;
        }

        // 读取文件
        let fileContent = await app.vault.read(activeFile);
        const frontmatterMatch = fileContent.match(/^---\s*[\s\S]*?---/);
        
        if (frontmatterMatch) {
            const yamlContent = frontmatterMatch[0];
            const hasFirst = yamlContent.includes("first_import_time:");
            const hasLast = yamlContent.includes("last_import_time:");

            if (hasFirst && hasLast) {
                new Notice("🔄 更新导入：跳过 AI 总结");
                return; 
            }
            if (!hasFirst) return; 
        }

        new Notice("✨ 首次导入：正在初始化...");

        // 提取 PDF 路径
        const zoteroLinkMatch = fileContent.match(/zotero:\/\/select\/library\/items\/([A-Z0-9]+)/);
        if (!zoteroLinkMatch || !zoteroLinkMatch[1]) {
            new Notice("❌ 未找到 Zotero Link");
            return;
        }
        const itemKey = zoteroLinkMatch[1];
        
        const storageDir = path.join(config.dataDir, "storage", itemKey);

        if (!fs.existsSync(storageDir)) {
            new Notice(`❌ 找不到目录: ${storageDir}`);
            return;
        }

        const files = fs.readdirSync(storageDir);
        const pdfFile = files.find(f => f.toLowerCase().endsWith(".pdf"));
        if (!pdfFile) {
            new Notice("❌ 未找到 PDF 文件");
            return;
        }
        const pdfFullPath = path.join(storageDir, pdfFile);

        // 读取 PDF buffer
        const pdfBuffer = fs.readFileSync(pdfFullPath);
        
        if (!window.pdfjsLib) new Notice("⚙️ 正在唤醒 PDF 引擎...", 2000);
        
        // 提取文本
        const textContent = await smartExtractText(app, pdfBuffer, config.maxPages);

        if (!textContent || textContent.length < 100) {
            new Notice("⚠️ 无法提取文本或 PDF 为空");
            return;
        }

        // 调用 AI
        const prompt = `
        你是一个学术助手。请阅读附件中的论文，并严格按照以下 Markdown 格式输出内容（不要输出 markdown 代码块标记，直接输出内容）：
        
        ## 概要
        (这里写概要，200字以内)
        
        ## 研究对象
        (这里写研究对象)
        
        ## 背景
        (这里写研究背景)
        
        ## 方法
        (这里写研究方法)
        
        ## 创新点
        (这里写创新点)
        
        ## 结论
        (这里写结论)
        `;

        new Notice("🤖 AI 正在阅读 (请稍候)...", 5000);

        try {
            const response = await requestUrl({
                url: config.apiUrl,
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${config.apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: config.model,
                    messages: [
                        {
                            role: "user",
                            content: prompt + "\n\n论文内容摘要:\n" + textContent.substring(0, config.maxText)
                        }
                    ]
                })
            });

            const aiText = response.json.choices[0].message.content;

            // 写入文件
            fileContent = await app.vault.read(activeFile); 
            const newContent = fileContent.replace(
                /(## 概要[\s\S]*?)(?=# 标注)/, 
                aiText + "\n\n"
            );

            if (newContent !== fileContent) {
                await app.vault.modify(activeFile, newContent);
                new Notice("✅ AI 摘要已写入！");
            } else {
                new Notice("⚠️ 写入失败：未找到替换位置");
            }
        } catch (error) {
            console.error(error);
            new Notice("❌ AI 请求失败: " + error.message);
        }
    }
};

// --- 辅助函数 ---

async function smartExtractText(app, arrayBuffer, maxPagesConfig) {
    if (!window.pdfjsLib) {
        await silentWarmup(app);
    }

    if (!window.pdfjsLib) {
        console.error("❌ 唤醒失败");
        return null;
    }

    try {
        const doc = await window.pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = "";
        const maxPages = Math.min(doc.numPages, maxPagesConfig); 
        
        for (let i = 1; i <= maxPages; i++) {
            const page = await doc.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map(item => item.str).join(" ") + "\n";
        }
        return fullText;
    } catch (e) {
        // 如果这里偶尔还报 transport destroyed，通常不影响结果
        console.error("解析警告:", e); 
        return null;
    }
}

async function silentWarmup(app) {
    const allFiles = app.vault.getFiles();
    let triggerFile = allFiles.find(f => f.extension === 'pdf');
    let isTempFile = false;

    if (!triggerFile) {
        try {
            const dummyPdfBase64 = "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDM+PnN0cmVhbQpxCnEKZW5kc3RyZWFtCmVuZG9iago0IDAgb2JqCjw8L1BhcmVudCAzIDAgUi9NZWRpYUJveFswIDAgNTk1LjI4IDg0MS44OV0vQ29udGVudHMgMiAwIFIvVHlwZS9QYWdlL1Jlc291cmNlczw8L1Byb2NTZXRbL1BERl0+Pj4+CmVuZG9iagozIDAgb2JqCjw8L0tpZHNbNCAwIFJdL1R5cGUvUGFnZXMvQ291bnQgMT4+CmVuZG9iago1IDAgb2JqCjw8L1Jvb3QgMyAwIFIvVHlwZS9DYXRhbG9nPj4KZW5kb2JqCjEgMCBvYmoKPDwvQ3JlYXRpb25EYXRlKEQ6MjAyMTAxMDEwMDAwMDBaKS9Nb2REYXRlKEQ6MjAyMTAxMDEwMDAwMDBaKS9Qcm9kdWNlcihQREYKitikPj4KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDI0NiAwMDAwMCBuIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAxODYgMDAwMDAgbiAKMDAwMDAwMDA2NiAwMDAwMCBuIAowMDAwMDAwMjEzIDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA2L0luZm8gMSAwIFIvUm9vdCA1IDAgUj4+CnN0YXJ0eHJlZgozMzcKJSVFT0YK";
            const buffer = Buffer.from(dummyPdfBase64, 'base64');
            triggerFile = await app.vault.createBinary("obsidian-zotero-warmup.pdf", buffer);
            isTempFile = true;
        } catch (e) { return; }
    }

    // 后台打开
    const leaf = app.workspace.getLeaf(true); 
    await leaf.openFile(triggerFile, { active: false }); 

    // 等待引擎出现
    let attempts = 0;
    while (!window.pdfjsLib && attempts < 20) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
    }

    // 【核心修复】: 即使检测到了 pdfjsLib，再多等 500ms，防止过早 detach 导致 Transport destroyed
    await new Promise(r => setTimeout(r, 500));

    leaf.detach();
    if (isTempFile) await app.vault.delete(triggerFile);
}
