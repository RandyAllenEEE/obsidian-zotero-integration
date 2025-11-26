const fs = require('fs');
const path = require('path');

module.exports = {
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

    entry: async (params, settings) => {
        const { app } = params;
        
        // --- 参数初始化 ---
        const config = {
            dataDir: settings["zoteroDataDir"],
            apiKey: settings["apiKey"],
            apiUrl: settings["apiUrl"],
            model: settings["modelName"],
            maxPages: parseInt(settings["maxPages"]) || 10,
            maxText: parseInt(settings["maxTextLength"]) || 50000
        };

        if (!config.apiKey) {
            new Notice("❌ API Key 未配置，请在 QuickAdd 设置中填写");
            return;
        }

        const activeFile = app.workspace.getActiveFile();
        if (!activeFile) {
            new Notice("⚠️ 未检测到当前活动文件");
            return;
        }

        let fileContent = await app.vault.read(activeFile);
        
        // --- 核心逻辑修复 (严格匹配版) ---
        
        // 1. 提取 YAML 中的 latest_import_time
        // 匹配：latest_import_time: "2025-11-26 07:48:36" (支持带/不带引号)
        const yamlTimeMatch = fileContent.match(/^latest_import_time:\s*["']?([\d-:\s]+)["']?/m);
        
        // 2. 提取 Body 中的 First_Import_Time (严格匹配双冒号)
        // 匹配：First_Import_Time:: 2025-11-26 07:48:36
        // 不匹配：- First_Import_Time: ...
        const bodyTimeMatch = fileContent.match(/First_Import_Time::\s*([\d-:\s]+)/);

        if (yamlTimeMatch && bodyTimeMatch) {
            const yamlTime = yamlTimeMatch[1].trim();
            const bodyTime = bodyTimeMatch[1].trim();

            console.log(`🔍 [ZoteroAI] 时间校验: YAML[${yamlTime}] vs Body[${bodyTime}]`);

            // 如果两个时间不一致，说明是更新导入
            if (yamlTime !== bodyTime) {
                new Notice("🔄 检测到更新导入，跳过 AI 总结");
                return; 
            }
        } else {
            console.warn("⚠️ [ZoteroAI] 时间戳提取失败。YAML匹配:", yamlTimeMatch, "Body匹配:", bodyTimeMatch);
            new Notice("⚠️ 无法识别时间戳 (First_Import_Time::)，请检查模板格式");
            return;
        }

        new Notice("✨ 首次导入：正在初始化 AI 分析...");

        // 3. 提取 Zotero Link
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

        // 4. 读取 PDF
        const pdfBuffer = fs.readFileSync(pdfFullPath);
        
        if (!window.pdfjsLib) new Notice("⚙️ 正在唤醒 PDF 引擎...", 2000);
        
        const textContent = await smartExtractText(app, pdfBuffer, config.maxPages);

        if (!textContent || textContent.length < 100) {
            new Notice("⚠️ 无法提取文本或 PDF 为空");
            return;
        }

        // 5. 调用 AI
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

// 6. 写入文件
            fileContent = await app.vault.read(activeFile); 
            
            // 【核心修复】正则逻辑升级
            // 1. 寻找以 "## 概要" 开头的内容
            // 2. 并在遇到 "%% end notes %%" (优先) 或者 "# 标注"、"# 导入记录" 之前停止
            // 3. 这样就保护了 Zotero 的结束标签不被删除
            const newContent = fileContent.replace(
                /(## 概要[\s\S]*?)(?=(\s*%% end notes %%|\s*# 标注|\s*# 导入记录))/i, 
                aiText + "\n\n"
            );

            if (newContent !== fileContent) {
                await app.vault.modify(activeFile, newContent);
                new Notice("✅ AI 摘要已写入！");
            } else {
                new Notice("⚠️ 写入失败：未找到替换位置 (## 概要)");
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
    if (!window.pdfjsLib) return null;

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

    const leaf = app.workspace.getLeaf(true); 
    await leaf.openFile(triggerFile, { active: false }); 

    let attempts = 0;
    while (!window.pdfjsLib && attempts < 20) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
    }

    await new Promise(r => setTimeout(r, 500));

    leaf.detach();
    if (isTempFile) await app.vault.delete(triggerFile);
}
