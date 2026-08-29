"use strict"

async function loadComponents() {
    //keeping it extremely simple for development speed
    const header = document.querySelector("views-header");
    const content = document.querySelector("views-content");

    header.innerHTML = await fetch("views/header.html")
        .then(response => response.text());

    content.innerHTML = await fetch("views/content.html")
        .then(response => response.text());
}

async function addLog(log, container) {
    const templateResponse = await fetch("views/log.template.html");
    const template = await templateResponse.text();

    const wrapper = document.createElement("div");
    wrapper.innerHTML = template;

    const element = wrapper.querySelector(".log");

    element.querySelector(".log-title").textContent = log.title;
    element.querySelector(".log-date").textContent = formatDate(log.date);

    const contentContainer = element.querySelector(".log-content");

    const chapters = log.content.split(/\r?\n(?=\[.*?\])/);

    for (const chapter of chapters) {
        const match = chapter.match(/^\[(.*?)\]\r?\n?([\s\S]*)$/);

        if (!match) {
            continue;
        }

        const chapterTitle = match[1];
        const chapterContent = match[2].trim();

        const details = document.createElement("details");
        const summary = document.createElement("summary");
        const pre = document.createElement("pre");

        summary.textContent = chapterTitle;
        pre.textContent = chapterContent;

        details.appendChild(summary);
        details.appendChild(pre);
        contentContainer.appendChild(details);
    }

    element.querySelector(".log-link").addEventListener("click", () => {
        element.classList.toggle("open");
    });

    container.appendChild(element);
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
    const comingSoonResponse = await fetch("views/coming-soon.html");
    const comingSoon = await comingSoonResponse.text();

    const wrapper = document.createElement("div");
    wrapper.innerHTML = comingSoon;

    container.appendChild(wrapper.firstElementChild);
}

async function sortLogsByDate(logs, container) {
    logs.sort((a, b) => {
        const [dayA, monthA, yearA] = a.date.split("/");
        const [dayB, monthB, yearB] = b.date.split("/");

        const dateA = new Date(yearA, monthA - 1, dayA);
        const dateB = new Date(yearB, monthB - 1, dayB);

        return dateB - dateA;
    });

    for (const log of logs) {
        await addLog(log, container);
    }
}

async function loadDevLogs() {
    const container = document.querySelector("#devlogs-container");

    const logsResponse = await fetch(
        "https://api.github.com/repos/NormalnyChomik/ftc-devlog-page/contents/public/devlogs"
    );
    const logs = [];

    const files = await logsResponse.json()

    for (const file of files) {
        if (file.type !== "file" || !file.name.endsWith(".txt")) {
            continue;
        }

        const logResponse = await fetch(`public/devlogs/${file.name}`);
        const text = await logResponse.text();

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
}

main();