"use strict";

async function addLog(log, container) {
    const response = await fetch("views/log.template.html");
    const template = await response.text();

    const wrapper = document.createElement("div");
    wrapper.innerHTML = template;

    const element = wrapper.querySelector(".log");

    element.querySelector(".log-title").textContent = log.title;
    element.querySelector(".log-date").textContent = formatDate(log.date);

    const contentContainer = element.querySelector(".log-content-inner");

    renderLogContent(log.content, contentContainer);

    element.querySelector(".log-link").addEventListener("click", () => {
        toggleLog(element);
    });

    container.appendChild(element);
}

function renderLogContent(text, container) {
    const chapters = splitChapters(text);

    for (const chapter of chapters) {
        createChapter(
            chapter.title,
            chapter.content,
            container
        );
    }
}

function splitChapters(text) {
    const regex = /\[chapter\]([\s\S]*?)\[\/chapter\]/gi;
    const matches = [...text.matchAll(regex)];
    const chapters = [];

    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];

        const title = match[1].trim();

        const start = match.index + match[0].length;
        const end = i + 1 < matches.length
            ? matches[i + 1].index
            : text.length;

        const content = text
            .slice(start, end)
            .trim();

        chapters.push({
            title,
            content
        });
    }

    return chapters;
}

function createChapter(title, text, container) {
    const chapter = document.createElement("div");
    const summary = document.createElement("div");
    const content = document.createElement("pre");

    chapter.className = "chapter";
    summary.className = "chapter-summary";
    content.className = "chapter-content";

    summary.textContent = title;

    renderChapterContent(text, content);

    chapter.appendChild(summary);
    chapter.appendChild(content);

    container.appendChild(chapter);

    setupChapterAnimation(summary, content);
}

function renderChapterContent(text, content) {
    const assetRegex = /\[asset\/(.*?)\]/gi;

    let lastIndex = 0;
    let match;

    while ((match = assetRegex.exec(text)) !== null) {
        const before = text.slice(
            lastIndex,
            match.index
        );

        appendText(content, before);

        const image = createAsset(match[1]);

        content.appendChild(image);

        lastIndex = assetRegex.lastIndex;
    }

    appendText(
        content,
        text.slice(lastIndex)
    );
}

function appendText(container, text) {
    if (!text) {
        return;
    }

    const fragment = document.createDocumentFragment();
    const lines = text.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line) {
            const span = document.createElement("span");

            span.innerHTML = parseMarkup(line);

            fragment.appendChild(span);
        }

        if (i < lines.length - 1) {
            fragment.appendChild(document.createTextNode("\n"));
        }
    }

    container.appendChild(fragment);
}

function createAsset(path) {
    const image = document.createElement("img");

    image.className = "log-asset";
    image.src = `public/${path}`;
    image.alt = "";

    return image;
}

function parseMarkup(text) {
    let html = escapeHtml(text);

    html = html.replace(
        /\[center\]([\s\S]*?)\[\/center\]/gi,
        '<span class="text-center">$1</span>'
    );

    html = html.replace(
        /\[i\]([\s\S]*?)\[\/i\]/gi,
        "<em>$1</em>"
    );

    html = html.replace(
        /\[b\]([\s\S]*?)\[\/b\]/gi,
        "<strong>$1</strong>"
    );

    return html;
}

function escapeHtml(text) {
    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}

function toggleLog(element) {
    const content = element.querySelector(".log-content");

    if (element.classList.contains("open")) {
        closeLog(element, content);
    } else {
        openLog(element, content);
    }
}

function openLog(element, content) {
    element.classList.add("open");

    content.style.maxHeight = "0px";
    content.style.opacity = "1";
    content.style.paddingTop = "20px";
    content.style.paddingBottom = "20px";

    requestAnimationFrame(() => {
        content.style.maxHeight = `${content.scrollHeight}px`;
    });

    content.addEventListener("transitionend", function handler(event) {
        if (event.propertyName !== "max-height") {
            return;
        }

        if (element.classList.contains("open")) {
            content.style.maxHeight = "none";
        }

        content.removeEventListener("transitionend", handler);
    });
}

function closeLog(element, content) {
    content.style.maxHeight = `${content.scrollHeight}px`;

    requestAnimationFrame(() => {
        content.style.maxHeight = "0px";
        content.style.opacity = "0";
        content.style.paddingTop = "0px";
        content.style.paddingBottom = "0px";
    });

    element.classList.remove("open");
}

function setupChapterAnimation(summary, content) {
    summary.addEventListener("click", () => {
        if (content.classList.contains("open")) {
            closeChapter(content);
        } else {
            openChapter(content);
        }
    });
}

function openChapter(content) {
    content.classList.add("open");

    content.style.maxHeight = "0px";
    content.style.paddingTop = "0px";
    content.style.paddingBottom = "0px";
    content.style.opacity = "0";

    requestAnimationFrame(() => {
        const height = content.scrollHeight;

        content.style.maxHeight = `${height}px`;
        content.style.paddingTop = "15px";
        content.style.paddingBottom = "15px";
        content.style.opacity = "1";
    });

    content.addEventListener("transitionend", function handler(event) {
        if (event.propertyName !== "max-height") {
            return;
        }

        if (content.classList.contains("open")) {
            content.style.maxHeight = "none";
        }

        content.removeEventListener("transitionend", handler);
    });
}

function closeChapter(content) {
    content.style.maxHeight = `${content.scrollHeight}px`;

    requestAnimationFrame(() => {
        content.style.maxHeight = "0px";
        content.style.paddingTop = "0px";
        content.style.paddingBottom = "0px";
        content.style.opacity = "0";
    });

    content.classList.remove("open");
}

function formatDate(dateString) {
    const [year, month, day] = dateString
        .split("-")
        .map(Number);

    const date = new Date(year, month - 1, day);

    return new Intl.DateTimeFormat(undefined, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }).format(date);
}

async function addComingSoon(container) {
    const response = await fetch("views/coming-soon.html");
    const html = await response.text();

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;

    container.appendChild(wrapper.firstElementChild);
}

async function sortLogsByDate(logs, container) {
    logs.sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });

    for (const log of logs) {
        await addLog(log, container);
    }
}

async function loadDevLogs() {
    const container = document.querySelector("#devlogs-container");
    const cacheKey = "devlogs-cache";

    let logs = null;

    const cached = localStorage.getItem(cacheKey);

    if (cached) {
        try {
            logs = JSON.parse(cached);
        } catch {
            localStorage.removeItem(cacheKey);
        }
    }

    if (!logs) {
        const response = await fetch(
            "https://api.github.com/repos/NormalnyChomik/ftc-devlog-page/contents/public/devlogs"
        );

        const files = await response.json();

        logs = [];

        for (const file of files) {
            if (
                file.type !== "file" ||
                !file.name.endsWith(".txt")
            ) {
                continue;
            }

            const response = await fetch(
                `public/devlogs/${file.name}`
            );

            const text = await response.text();

            logs.push(parseLog(text));
        }

        localStorage.setItem(
            cacheKey,
            JSON.stringify(logs)
        );
    }

    await sortLogsByDate(logs, container);
    await addComingSoon(container);
}

function parseLog(text) {
    const log = {};
    const lines = text.split(/\r?\n/);

    let inContent = false;
    const content = [];

    for (const line of lines) {
        if (inContent) {
            content.push(line);
            continue;
        }

        if (line.trim().toLowerCase() === "content:") {
            inContent = true;
            continue;
        }

        const separator = line.indexOf(":");

        if (separator === -1) {
            continue;
        }

        const key = line
            .slice(0, separator)
            .trim()
            .toLowerCase();

        const value = line
            .slice(separator + 1)
            .trim();

        log[key] = value;
    }

    log.content = content.join("\n");

    return log;
}
