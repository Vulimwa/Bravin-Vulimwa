function renderAutoGrid() {
  document.querySelectorAll("[data-auto-grid]").forEach((root) => {
    const itemWidth = Number(root.getAttribute("data-item-width") || 130);
    const step = Number(root.getAttribute("data-step") || 100);
    const width = root.clientWidth || 0;

    if (!width) return;

    const count = Math.max(1, Math.ceil(width / itemWidth) + 2);
    const renderedCount = Number(root.dataset.renderedCount || 0);

    if (renderedCount === count) return;

    root.innerHTML = "";

    for (let index = 0; index < count; index += 1) {
      const value = index * step;
      const item = document.createElement("div");
      item.className = "relative h-full flex-shrink-0";
      item.style.width = `${itemWidth}px`;
      item.innerHTML = `
        <span
          class="absolute bottom-1 left-0 -translate-x-1/2 font-mono text-[10px] tabular-nums text-gray-400"
        >${value}</span
        ><span class="absolute left-0 top-0 h-2.5 w-px bg-gray-300"></span
        ><span class="absolute left-[26px] top-0 h-1.5 w-px bg-gray-200"></span
        ><span class="absolute left-[52px] top-0 h-1.5 w-px bg-gray-200"></span
        ><span class="absolute left-[78px] top-0 h-1.5 w-px bg-gray-200"></span
        ><span
          class="absolute left-[104px] top-0 h-1.5 w-px bg-gray-200"
        ></span>
      `;
      root.appendChild(item);
    }

    root.dataset.renderedCount = String(count);
  });
}

window.addEventListener("resize", renderAutoGrid);
renderAutoGrid();

document.addEventListener("DOMContentLoaded", () => {
  const includeTargets = document.querySelectorAll("[data-include]");

  includeTargets.forEach((element) => {
    const file = element.getAttribute("data-include");
    if (!file) return;

    fetch(file)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load ${file}: ${response.status}`);
        }
        return response.text();
      })
      .then((html) => {
        const currentPath = window.location.pathname.replace(/\\/g, "/");
        const normalizedPath = currentPath.endsWith("/")
          ? currentPath
          : `${currentPath}/`;
        const pageName =
          normalizedPath.split("/").filter(Boolean).pop() || "index.html";

        let resolvedHtml = html
          .replaceAll(
            "{{HOME_HREF}}",
            pageName === "index.html"
              ? "/pages/index.html"
              : "/pages/index.html",
          )
          .replaceAll("{{ABOUT_HREF}}", "/pages/about.html")
          .replaceAll("{{WORK_HREF}}", "/pages/work.html")
          .replaceAll("{{WALL_OF_FAME_HREF}}", "/pages/wall-of-fame.html");

        if (pageName === "about.html") {
          resolvedHtml = resolvedHtml.replaceAll(
            'data-nav-key="home"',
            'data-nav-key="home"',
          );
        }

        element.innerHTML = resolvedHtml;
        requestAnimationFrame(renderAutoGrid);
      })
      .catch((error) => {
        console.error(error);
      });
  });
});
