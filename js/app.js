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

    //we clone the template div to generate our log containers
    const wrapper = document.createElement("div");
    wrapper.innerHTML = template;

    const element = wrapper.firstElementChild;

    element.querySelector(".log-title").textContent = log.title;
    element.querySelector(".log-date").textContent = log.date;
    element.href = `?page=${log.page}`;

    container.appendChild(element);
}

async function addComingSoon(container) {
    const comingSoonResponse = await fetch("views/coming-soon.html");
    const comingSoon = await comingSoonResponse.text();

    const wrapper = document.createElement("div");
    wrapper.innerHTML = comingSoon;

    container.appendChild(wrapper.firstElementChild);
}

async function loadDevLogs() {
    const container = document.querySelector("#devlogs-container");

    const logs = await fetch(
        "https://api.github.com/repos/NormalnyChomik/ftc-devlog-page/contents/public/logs"
    );

    const files = await logs.json()

    for (const file of files) {
        if (file.type !== "file" || !file.name.endsWith(".txt")) {
            continue;
        }

        const logResponse = await fetch(`public/logs/${file.name}`);
        const text = await logResponse.text();

        const log = parseLog(text);
        await addLog(log, container);
    }

    await addComingSoon(container);
}

function parseLog(text) {
    const log = {};

    for (const line of text.split("\n")) {
        const separator = line.indexOf(":");

        if (separator === -1) {
            continue;
        }

        const key = line.slice(0, separator).trim().toLowerCase();
        const value = line.slice(separator + 1).trim();

        log[key] = value;
    }

    return log;
}

async function main() {
    await loadComponents();
    await loadDevLogs();
}

main();