"use strict";

async function loadComponents() {
    const header = document.querySelector("views-header");
    const content = document.querySelector("views-content");

    header.innerHTML = await fetch("views/header.html")
        .then(response => response.text());

    content.innerHTML = await fetch("views/content.html")
        .then(response => response.text());
}

async function addLog(log, container) {
    const response = await fetch("views/log.template.html");
    const template = await response.text();

    const wrapper = document.createElement("div");
    wrapper.innerHTML = template;

    const element = wrapper.querySelector(".log");

    element.querySelector(".log-title").textContent = log.title;
    element.querySelector(".log-date").textContent = formatDate(log.date);

    const contentContainer = element.querySelector(".log-content-inner");

    const chapters = log.content.split(/\r?\n(?=\[.*?\])/);

    for (const chapterText of chapters) {
        const match = chapterText.match(/^\[(.*?)\]\r?\n?([\s\S]*)$/);

        if (!match) {
            continue;
        }

        const chapterTitle = match[1];
        const chapterContent = match[2].trim();

        const chapter = document.createElement("div");
        const summary = document.createElement("div");
        const content = document.createElement("pre");

        chapter.className = "chapter";
        summary.className = "chapter-summary";
        content.className = "chapter-content";

        summary.textContent = chapterTitle;
        content.textContent = chapterContent;

        chapter.appendChild(summary);
        chapter.appendChild(content);

        contentContainer.appendChild(chapter);

        setupChapterAnimation(summary, content);
    }

    element.querySelector(".log-link").addEventListener("click", () => {
        toggleLog(element);
    });

    container.appendChild(element);
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

    content.style.maxHeight = `${content.scrollHeight}px`;
    content.style.opacity = "1";
    content.style.paddingTop = "20px";
    content.style.paddingBottom = "20px";

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

    const height = content.scrollHeight + 50 //safety margin
    content.style.maxHeight = `${height}px`;
    content.style.paddingTop = "15px";
    content.style.paddingBottom = "15px";
    content.style.opacity = "1";

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
    const [year, month, day] = dateString.split("-").map(Number);

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
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);

        return dateB - dateA;
    });

    for (const log of logs) {
        await addLog(log, container);
    }
}

async function loadDevLogs() {
    const container = document.querySelector("#devlogs-container");

    const response = await fetch(
        "https://api.github.com/repos/NormalnyChomik/ftc-devlog-page/contents/public/devlogs"
    );

    const files = await response.json();
    const logs = [];

    for (const file of files) {
        if (file.type !== "file" || !file.name.endsWith(".txt")) {
            continue;
        }

        const response = await fetch(`public/devlogs/${file.name}`);
        const text = await response.text();

        logs.push(parseLog(text));
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

        const key = line.slice(0, separator).trim().toLowerCase();
        const value = line.slice(separator + 1).trim();

        log[key] = value;
    }

    log.content = content.join("\n");

    return log;
}

async function main() {
    await loadComponents();
    await loadDevLogs();

    document.querySelector("#app-container").classList.add("loaded");
}

main();
