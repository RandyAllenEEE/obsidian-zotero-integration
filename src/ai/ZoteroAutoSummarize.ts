import { App, Notice, TFile, requestUrl } from 'obsidian';
import { ZoteroConnectorSettings } from '../types';

export const summarizePdf = async (app: App, file: TFile, settings: ZoteroConnectorSettings) => {
    // Basic validation
    if (!settings.aiApiKey) {
        new Notice('❌ Zotero AI: API Key not configured.');
        return;
    }

    const fileContent = await app.vault.read(file);

    // 1. Parse PDF Path (Link Based Logic)
    // Matches: - **full-text pdf**: [optional](file:///path)
    const pdfLinkMatch = fileContent.match(/- \*\*full-text pdf\*\*:\s*(?:\[.*?\])?\((file:\/\/.+?)\)/i);

    if (!pdfLinkMatch || !pdfLinkMatch[1]) {
        return; // No PDF link found, silently exit (auto-trigger context)
    }

    let pdfPath = pdfLinkMatch[1];
    pdfPath = pdfPath.replace(/^file:\/\/\/?/, "");
    pdfPath = decodeURIComponent(pdfPath);
    // Windows drive letter fix: /C:/path -> C:/path
    if (/^[a-zA-Z]:/.test(pdfPath) === false && /^\/[a-zA-Z]:/.test(pdfPath)) {
        pdfPath = pdfPath.substring(1);
    }

    // Node fs is needed to read local file
    const fs = require('fs');
    if (!fs.existsSync(pdfPath)) {
        new Notice(`❌ Zotero AI: PDF not found at ${pdfPath}`);
        return;
    }

    // Check if summary already exists to avoid re-triggering?
    // The script used logic to update existing or create new.
    // If auto-trigger on open, we might want to check if "## AI 速读" exists and maybe skipped if present?
    // The user requirement says "replace the original anchor". 
    // IF the anchor exists, we proceed.

    if (!fileContent.includes(settings.aiSummaryAnchor || '%% AI Summary %%')) {
        return; // Anchor not found
    }

    new Notice("🚀 Zotero AI: Reading PDF...");

    const pdfBuffer = fs.readFileSync(pdfPath);
    const maxPages = settings.aiMaxPages || 10;
    const textContent = await smartExtractText(app, pdfBuffer, maxPages);

    if (!textContent || textContent.length < 100) {
        new Notice("⚠️ Zotero AI: Could not extract text from PDF.");
        return;
    }

    // 3. AI Call
    const prompt = settings.aiPrompt || `
        你是一位电力电子(Power Electronics)领域的资深研究员。请阅读附件摘要，为我（电气工程学生）生成一份专业的学术速读笔记。

        【Markdown 语法硬性要求】
        1. **公式规范**：所有数学符号/变量/公式必须用 LaTeX。
           - 行内：$V_{dc}$，$\eta$；独立：$$ P = UI $$
           - 禁止使用 unicode 字符表示数学含义。
        2. **结构规范**：
           - 仅使用 **H3 (###)** 及以下的层级作为章节标题。
           - 列表项使用 markdown bullet points (-) 或 有序列表1. 。
           - 关键概念加粗 (**bold**)。

        【自适应分析逻辑】
        请先判断文章是 **研究论文 (Research Paper)** 还是 **综述/教程 (Review/Tutorial)**，并采用对应的分析模板：

        ---
        **分支 A：如果是研究论文 (Research Paper)**
        侧重具体的拓扑、控制或应用。请包含但不限于：
        
        ### 核心贡献 (Core Contribution)
        - 一句话总结解决了什么痛点（Pain Point）。
        - 明确是提出了新拓扑、新控制还是新调制，并总结技术路线。
        - 提炼做出的创新和效果。

        ### 技术要点与方法 (Methodology)
        - 电路结构或控制环路特点。
        - **关键参数提取**：列出 $V_{in}/V_{out}$、$P_{rated}$、$f_{sw}$、$\eta$、器件类型(SiC/GaN)等。

        ### 创新与对比 (Innovation & Comparison)
        - 相比 SoA 方案的具体提升（效率/密度/成本）。

        ### 初步评价 (Critical Review)
        - 亮点（如波形干净、思路巧妙）或局限性。

        ---
        **分支 B：如果是综述或教程 (Review/Survey/Tutorial)**
        侧重技术总结和趋势。请包含但不限于：

        ### 综述范围 (Scope & Background)
        - 文章涵盖了哪类技术（如 "MMC 拓扑综述" 或 "宽禁带器件驱动综述"）。
        - 总结的时间跨度和技术维度。

        ### 分类体系 (Classification Taxonomy)
        - **(核心)** 文章是如何对现有技术进行分类的？（例如：按电平数分类、按隔离方式分类）。请清晰地梳理其分类逻辑。

        ### 主流路线对比 (Comparison of Methodologies)
        - 总结不同技术路线的优缺点对比（最好能总结出 tradeoff 关系，如：成本 vs 性能）。

        ### 挑战与趋势 (Challenges & Future Trends)
        - 领域内目前遗留的难点是什么？
        - 作者预测的未来发展方向。

        ---
        请根据文章实际内容自动选择上述一种模板进行输出，保持专业、简洁（简体中文）。
        `;

    const maxText = settings.aiMaxText || 50000;

    new Notice("🤖 Zotero AI: Analyzing...");

    try {
        const response = await requestUrl({
            url: settings.aiApiUrl || "https://open.cherryin.net/v1/chat/completions",
            method: "POST",
            headers: {
                "Authorization": `Bearer ${settings.aiApiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: settings.aiModel,
                messages: [
                    {
                        role: "user",
                        content: prompt + "\n\n论文内容摘要:\n" + textContent.substring(0, maxText)
                    }
                ]
            })
        });

        const aiText = response.json.choices[0].message.content;

        // 4. Update File
        // 4. Update File
        // We replace the Anchor with the content
        const anchor = settings.aiSummaryAnchor || '%% AI Summary %%';

        let newContent = fileContent.replace(anchor, `${aiText}\n\n`);

        if (newContent !== fileContent) {
            await app.vault.modify(file, newContent);
            new Notice("✅ Zotero AI: Summary generated.");
        }

    } catch (error) {
        console.error(error);
        new Notice("❌ Zotero AI Error: " + error.message);
    }
}

// Helper Functions
async function smartExtractText(app: App, arrayBuffer: Buffer, maxPagesConfig: number) {
    // @ts-ignore
    if (!window.pdfjsLib) {
        await silentWarmup(app);
    }
    // @ts-ignore
    if (!window.pdfjsLib) return null;

    try {
        // @ts-ignore
        const doc = await window.pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = "";
        const maxPages = Math.min(doc.numPages, maxPagesConfig);

        for (let i = 1; i <= maxPages; i++) {
            const page = await doc.getPage(i);
            const textContent = await page.getTextContent();
            // @ts-ignore
            fullText += textContent.items.map(item => item.str).join(" ") + "\n";
        }
        return fullText;
    } catch (e) {
        console.error("PDF Parse Error:", e);
        return null;
    }
}

async function silentWarmup(app: App) {
    const allFiles = app.vault.getFiles();
    let triggerFile = allFiles.find(f => f.extension === 'pdf');
    let isTempFile = false;

    if (!triggerFile) {
        try {
            const dummyPdfBase64 = "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDM+PnN0cmVhbQpxCnEKZW5kc3RyZWFtCmVuZG9iago0IDAgb2JqCjw8L1BhcmVudCAzIDAgUi9NZWRpYUJveFswIDAgNTk1LjI4IDg0MS44OV0vQ29udGVudHMgMiAwIFIvVHlwZS9QYWdlL1Jlc291cmNlczw8L1Byb2NTZXRbL1BERl0+Pj4+CmVuZG9iagozIDAgb2JqCjw8L0tpZHNbNCAwIFJdL1R5cGUvUGFnZXMvQ291bnQgMT4+CmVuZG9iago1IDAgb2JqCjw8L1Jvb3QgMyAwIFIvVHlwZS9DYXRhbG9nPj4KZW5kb2JqCjEgMCBvYmoKPDwvQ3JlYXRpb25EYXRlKEQ6MjAyMTAxMDEwMDAwMDBaKS9Nb2REYXRlKEQ6MjAyMTAxMDEwMDAwMDBaKS9Qcm9kdWNlcihQREYKitikPj4KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDI0NiAwMDAwMCBuIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAxODYgMDAwMDAgbiAKMDAwMDAwMDA2NiAwMDAwMCBuIAowMDAwMDAwMjEzIDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA2L0luZm8gMSAwIFIvUm9vdCA1IDAgUj4+CnN0YXJ0eHJlZgozMzcKJSVFT0YK";
            const buffer = new Uint8Array(Buffer.from(dummyPdfBase64, 'base64')).buffer;
            triggerFile = await app.vault.createBinary("obsidian-zotero-warmup.pdf", buffer);
            isTempFile = true;
        } catch (e) { return; }
    }

    const leaf = app.workspace.getLeaf(true);
    await leaf.openFile(triggerFile, { active: false });

    let attempts = 0;
    // @ts-ignore
    while (!window.pdfjsLib && attempts < 20) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
    }

    await new Promise(r => setTimeout(r, 500));

    leaf.detach();
    if (isTempFile) await app.vault.delete(triggerFile);
}
