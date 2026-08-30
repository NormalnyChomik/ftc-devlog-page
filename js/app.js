"use strict";

async function loadComponents() {
    const header = document.querySelector("views-header");
    const content = document.querySelector("views-content");

    header.innerHTML = await fetch("views/header.html")
        .then(response => response.text());

    content.innerHTML = await fetch("views/content.html")
        .then(response => response.text());
}

async function main() {
    const app = document.querySelector("#app-container");
    const loading = document.querySelector("#loading");

    await loadComponents();
    await loadDevLogs();

    app.classList.add("loaded");

    loading.classList.add("hidden");

    loading.addEventListener("transitionend", () => {
        loading.remove();
    }, { once: true });
}

main();
