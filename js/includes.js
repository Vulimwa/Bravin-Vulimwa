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

function getTransformParts(transform) {
  const translateMatch = transform.match(
    /translate3d\(([-\d.]+)px,\s*([-\d.]+)px,\s*([-\d.]+)px\)/,
  );
  const rotateMatch = transform.match(/rotate\(([-\d.]+)deg\)/);

  return {
    x: translateMatch ? Number(translateMatch[1]) : 0,
    y: translateMatch ? Number(translateMatch[2]) : 0,
    z: translateMatch ? Number(translateMatch[3]) : 0,
    rotate: rotateMatch ? Number(rotateMatch[1]) : 0,
  };
}

function initSharedMotion() {
  const badgeElements = Array.from(
    document.querySelectorAll(".pointer-events-none.fixed"),
  ).filter((element) => element.textContent.includes("YOU"));
  const floatTags = Array.from(document.querySelectorAll("[data-float-tag]"));

  if (!badgeElements.length && !floatTags.length) return;

  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 2;
  let pointerActive = false;

  const badges = badgeElements.map((element) => {
    const initial = getTransformParts(element.style.transform || "");
    element.style.cursor = "pointer";
    return {
      element,
      baseX: initial.x,
      baseY: initial.y,
      offsetX: 0,
      offsetY: 0,
    };
  });

  const tags = floatTags.map((element, index) => {
    const initial = getTransformParts(element.style.transform || "");
    return {
      element,
      baseX: initial.x,
      baseY: initial.y,
      baseRotate: initial.rotate,
      offsetX: 0,
      offsetY: 0,
      driftPhase: index * 0.9,
      bobDirection: index % 2 === 0 ? 1 : -1,
    };
  });

  const handlePointerMove = (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    pointerActive = true;
  };

  const handlePointerLeave = () => {
    pointerActive = false;
  };

  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerleave", handlePointerLeave);
  window.addEventListener("mouseout", (event) => {
    if (event.relatedTarget === null) {
      handlePointerLeave();
    }
  });

  let frameId = 0;

  const update = () => {
    const time = performance.now();

    badges.forEach((badge) => {
      const rect = badge.element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = pointerX - centerX;
      const dy = pointerY - centerY;
      const distance = Math.hypot(dx, dy) || 1;
      const influence = Math.max(0, 1 - distance / 220);
      const moveX = (dx / distance) * influence * 26;
      const moveY = (dy / distance) * influence * 26;

      badge.offsetX += (moveX - badge.offsetX) * 0.2;
      badge.offsetY += (moveY - badge.offsetY) * 0.2;

      badge.element.style.transform = `translate3d(${badge.baseX + badge.offsetX}px, ${badge.baseY + badge.offsetY}px, 0)`;
    });

    tags.forEach((tag) => {
      const rect = tag.element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = pointerX - centerX;
      const dy = pointerY - centerY;
      const distance = Math.hypot(dx, dy) || 1;
      const influence = Math.max(0, 1 - distance / 220);
      const repelX = (-dx / distance) * influence * 28;
      const repelY = (-dy / distance) * influence * 28;
      const floatY =
        Math.sin(time * 0.002 + tag.driftPhase) * 6 * tag.bobDirection;
      const driftX = Math.sin(time * 0.0017 + tag.driftPhase) * 1.2;

      tag.offsetX += (repelX + driftX - tag.offsetX) * 0.16;
      tag.offsetY += (repelY + floatY - tag.offsetY) * 0.16;

      tag.element.style.transform = `translate3d(${tag.baseX + tag.offsetX}px, ${tag.baseY + tag.offsetY}px, 0) rotate(${tag.baseRotate}deg)`;
    });

    if (
      pointerActive ||
      tags.some(
        (tag) => Math.abs(tag.offsetX) > 0.01 || Math.abs(tag.offsetY) > 0.01,
      )
    ) {
      frameId = window.requestAnimationFrame(update);
    }
  };

  const startMotion = () => {
    if (frameId) {
      window.cancelAnimationFrame(frameId);
    }
    frameId = window.requestAnimationFrame(update);
  };

  startMotion();
  window.addEventListener("resize", startMotion);
}

document.addEventListener("DOMContentLoaded", () => {
  initSharedMotion();

  // Live East Africa Time (EAT) clock
  function formatEAT(now) {
    // EAT is UTC+3
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const eat = new Date(utc + 3 * 3600000);
    const hh = String(eat.getHours()).padStart(2, "0");
    const mm = String(eat.getMinutes()).padStart(2, "0");
    const ss = String(eat.getSeconds()).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }

  function startEATClock() {
    const nodes = Array.from(
      document.querySelectorAll('[aria-label="Current time in Kenya"]'),
    );
    if (!nodes.length) return;

    function tick() {
      const now = new Date();
      const time = formatEAT(now);
      nodes.forEach((node) => {
        // keep any child markup (like the EAT label) but replace the numeric time
        const eatLabel = node.querySelector(".eat-label");
        if (eatLabel) {
          node.firstChild.textContent = time;
        } else {
          // replace inner content with time + span
          node.innerHTML = `${time}<span class="ml-1 not-italic opacity-60 eat-label">EAT</span>`;
        }
      });
    }

    tick();
    window.setInterval(tick, 1000);
  }

  startEATClock();

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
            pageName === "index.html" ? "/index.html" : "/index.html",
          )
          .replaceAll("{{ABOUT_HREF}}", "/about.html")
          .replaceAll("{{WORK_HREF}}", "/work.html")
          .replaceAll("{{WALL_OF_FAME_HREF}}", "/wall-of-fame.html");

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
