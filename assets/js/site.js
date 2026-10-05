(() => {
  const root = document.documentElement;
  const themeButtons = [...document.querySelectorAll("[data-theme-toggle]")];
  const themeStorageKey = "starter-theme-v1";
  const darkModeQuery = typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;
  const reducedMotionQuery = typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;
  let selectedTheme = root.dataset.theme === "dark" ? "dark" : "light";
  let activeThemeTransition = null;

  function systemTheme() {
    return darkModeQuery?.matches ? "dark" : "light";
  }

  function syncThemeControls(theme) {
    const dark = theme === "dark";
    for (const button of themeButtons) {
      button.setAttribute("aria-checked", String(dark));
      button.setAttribute("aria-label", "Dark mode");
      button.title = dark ? "Switch to light theme" : "Switch to dark theme";
    }
  }

  function applyTheme(theme, persist = false) {
    selectedTheme = theme;
    root.dataset.theme = theme;
    if (persist) {
      try {
        localStorage.setItem(themeStorageKey, theme);
      } catch {}
    }
    syncThemeControls(theme);
  }

  function transitionTheme(theme, persist) {
    if (activeThemeTransition) {
      const previousTransition = activeThemeTransition;
      activeThemeTransition = null;
      previousTransition.skipTransition?.();
    }

    root.classList.remove("is-theme-transitioning");
    selectedTheme = theme;
    if (typeof document.startViewTransition !== "function" || reducedMotionQuery?.matches) {
      applyTheme(theme, persist);
      return;
    }

    root.classList.add("is-theme-transitioning");

    let transition;
    try {
      transition = document.startViewTransition(() => applyTheme(theme, persist));
    } catch {
      root.classList.remove("is-theme-transitioning");
      applyTheme(theme, persist);
      return;
    }

    activeThemeTransition = transition;
    transition.ready.catch(() => {});
    transition.finished
      .catch(() => {})
      .finally(() => {
        if (activeThemeTransition !== transition) return;
        activeThemeTransition = null;
        root.classList.remove("is-theme-transitioning");
      });
  }

  function hasSavedTheme() {
    try {
      const savedTheme = localStorage.getItem(themeStorageKey);
      return savedTheme === "dark" || savedTheme === "light";
    } catch {
      return false;
    }
  }

  syncThemeControls(selectedTheme);

  for (const button of themeButtons) {
    button.addEventListener("click", () => {
      const nextTheme = selectedTheme === "dark" ? "light" : "dark";
      transitionTheme(nextTheme, true);
    });
  }

  darkModeQuery?.addEventListener?.("change", (event) => {
    if (!hasSavedTheme()) applyTheme(event.matches ? "dark" : "light");
  });

  window.addEventListener("storage", (event) => {
    if (event.key !== themeStorageKey) return;
    const theme = event.newValue === "dark" || event.newValue === "light"
      ? event.newValue
      : systemTheme();
    applyTheme(theme);
  });

  const menu = document.querySelector("[data-mobile-menu]");
  const menuPanel = menu?.querySelector(".mobile-menu__panel");
  const menuOpenButtons = [...document.querySelectorAll("[data-menu-open]")];
  const menuCloseButton = document.querySelector("[data-menu-close]");
  const desktopMenuQuery = typeof window.matchMedia === "function"
    ? window.matchMedia("(min-width: 48rem)")
    : null;
  let menuInvoker = null;
  let menuCloseTimer = 0;
  let backdropPointerStarted = false;
  let menuScrollPosition = 0;
  let menuBodyStyles = null;

  function lockMenuScroll() {
    if (menuBodyStyles) return;
    menuScrollPosition = window.scrollY;
    menuBodyStyles = {
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };
    document.body.style.position = "fixed";
    document.body.style.top = `-${menuScrollPosition}px`;
    document.body.style.width = "100%";
  }

  function unlockMenuScroll() {
    if (!menuBodyStyles) return;
    const savedStyles = menuBodyStyles;
    menuBodyStyles = null;
    document.body.style.position = savedStyles.position;
    document.body.style.top = savedStyles.top;
    document.body.style.width = savedStyles.width;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, menuScrollPosition);
    root.style.scrollBehavior = previousScrollBehavior;
  }

  function finishMenuClose() {
    window.clearTimeout(menuCloseTimer);
    menuCloseTimer = 0;
    if (menu instanceof HTMLDialogElement && menu.open) menu.close();
  }

  function openMenu(invoker) {
    if (!(menu instanceof HTMLDialogElement) || menu.open || desktopMenuQuery?.matches) return;
    menuInvoker = invoker;
    invoker.setAttribute("aria-expanded", "true");
    menu.dataset.state = reducedMotionQuery?.matches ? "open" : "opening";
    lockMenuScroll();
    menu.showModal();
    menuCloseButton?.focus({ preventScroll: true });
    if (menu.dataset.state === "open") return;
    menuPanel?.getBoundingClientRect();
    requestAnimationFrame(() => {
      if (menu.open && menu.dataset.state === "opening") menu.dataset.state = "open";
    });
  }

  function closeMenu({ immediate = false } = {}) {
    if (!(menu instanceof HTMLDialogElement) || !menu.open) return;
    if (immediate || reducedMotionQuery?.matches) {
      finishMenuClose();
      return;
    }
    if (menu.dataset.state === "closing") return;
    menu.dataset.state = "closing";
    menuCloseTimer = window.setTimeout(finishMenuClose, 220);
  }

  for (const button of menuOpenButtons) {
    button.addEventListener("click", () => openMenu(button));
  }

  menuCloseButton?.addEventListener("click", () => closeMenu());
  menu?.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeMenu();
  });
  menu?.addEventListener("pointerdown", (event) => {
    backdropPointerStarted = event.target === menu;
  });
  menu?.addEventListener("pointerup", (event) => {
    if (backdropPointerStarted && event.target === menu) closeMenu();
    backdropPointerStarted = false;
  });
  menu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => closeMenu()));
  menu?.addEventListener("close", () => {
    window.clearTimeout(menuCloseTimer);
    menuCloseTimer = 0;
    delete menu.dataset.state;
    if (menuInvoker instanceof HTMLElement) {
      menuInvoker.setAttribute("aria-expanded", "false");
      if (!desktopMenuQuery?.matches && menuInvoker.isConnected) menuInvoker.focus({ preventScroll: true });
    }
    unlockMenuScroll();
    menuInvoker = null;
  });
  desktopMenuQuery?.addEventListener?.("change", (event) => {
    if (event.matches) closeMenu({ immediate: true });
  });

  const topicFilter = document.querySelector("[data-topic-filter]");
  const writingItems = [...document.querySelectorAll("[data-writing-index] > li")];
  const filterStatus = document.querySelector("[data-filter-status]");

  function applyTopic(topic, updateHistory = false) {
    if (!topicFilter || writingItems.length === 0) return;
    const normalizedTopic = topic || "all";
    let visibleCount = 0;
    for (const item of writingItems) {
      const topics = (item.dataset.topics ?? "").split(/\s+/).filter(Boolean);
      const visible = normalizedTopic === "all" || topics.includes(normalizedTopic);
      item.hidden = !visible;
      if (visible) visibleCount += 1;
    }
    for (const link of topicFilter.querySelectorAll("[data-topic]")) {
      if (link.dataset.topic === normalizedTopic) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    }
    if (filterStatus) {
      filterStatus.textContent = normalizedTopic === "all"
        ? ""
        : `${visibleCount} ${visibleCount === 1 ? "article" : "articles"} shown.`;
    }
    if (updateHistory) {
      const url = new URL(location.href);
      if (normalizedTopic === "all") url.searchParams.delete("topic");
      else url.searchParams.set("topic", normalizedTopic);
      history.pushState({ topic: normalizedTopic }, "", url);
    }
  }

  if (topicFilter && writingItems.length > 0) {
    const initialTopic = new URL(location.href).searchParams.get("topic") || "all";
    applyTopic(initialTopic);
    topicFilter.addEventListener("click", (event) => {
      const link = event.target.closest("[data-topic]");
      if (!(link instanceof HTMLAnchorElement)) return;
      event.preventDefault();
      applyTopic(link.dataset.topic || "all", true);
    });
    window.addEventListener("popstate", () => {
      applyTopic(new URL(location.href).searchParams.get("topic") || "all");
    });
  }

  for (const form of document.querySelectorAll("[data-newsletter-preview]")) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const message = form.querySelector("[data-newsletter-message]");
      if (!(input instanceof HTMLInputElement) || !(message instanceof HTMLElement)) return;
      if (!input.checkValidity()) {
        message.textContent = "Enter a valid email address.";
        input.reportValidity();
        return;
      }
      message.textContent = "Preview only — no subscription was created";
    });
  }

  const localHosts = ["localhost", "127.0.0.1"];

  for (const form of document.querySelectorAll("[data-newsletter-endpoint]")) {
    const note = form.querySelector("[data-newsletter-note]");
    const countEndpoint = form.dataset.newsletterCountEndpoint;
    if (note instanceof HTMLElement && countEndpoint && !localHosts.includes(location.hostname)) {
      fetch(countEndpoint)
        .then((response) => response.json())
        .then((data) => {
          if (!data || !data.display) return;
          note.insertBefore(document.createTextNode(`Join ${data.display} readers. `), note.firstChild);
        })
        .catch(() => {});
    }
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const message = form.querySelector("[data-newsletter-message]");
      const button = form.querySelector('button[type="submit"]');
      if (!(input instanceof HTMLInputElement) || !(message instanceof HTMLElement)) return;
      if (!input.checkValidity() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) {
        message.textContent = "Enter a valid email address.";
        input.reportValidity();
        return;
      }
      if (localHosts.includes(location.hostname)) {
        message.textContent = "Preview only — no subscription was created";
        return;
      }
      if (button instanceof HTMLButtonElement) {
        button.disabled = true;
        button.textContent = "Subscribing…";
      }
      fetch(form.dataset.newsletterEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: input.value.trim() }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data && data.success) {
            if (window.goatcounter && window.goatcounter.count) {
              window.goatcounter.count({ path: "/events/newsletter-subscribe", title: "Newsletter subscribe", event: true });
            }
            const controls = form.querySelector(".newsletter-preview__controls");
            if (controls instanceof HTMLElement) {
              controls.hidden = true;
              // The component's display rule otherwise overrides [hidden].
              controls.style.display = "none";
            }
            message.textContent = "Thanks for subscribing! You'll receive the next newsletter in your inbox.";
          } else {
            message.textContent = (data && data.error) || "Something went wrong. Please try again.";
            if (button instanceof HTMLButtonElement) {
              button.disabled = false;
              button.textContent = "Subscribe";
            }
          }
        })
        .catch(() => {
          message.textContent = "Something went wrong. Please try again later.";
          if (button instanceof HTMLButtonElement) {
            button.disabled = false;
            button.textContent = "Subscribe";
          }
        });
    });
  }

  const ambientVideos = [...document.querySelectorAll("[data-ambient-video]")];

  function syncAmbientVideos(reduceMotion) {
    for (const video of ambientVideos) {
      if (!(video instanceof HTMLVideoElement)) continue;
      if (reduceMotion) video.pause();
      else video.play().catch(() => {});
    }
  }

  if (ambientVideos.length > 0) {
    syncAmbientVideos(reducedMotionQuery?.matches ?? false);
    reducedMotionQuery?.addEventListener?.("change", (event) => syncAmbientVideos(event.matches));
  }

  for (const trigger of document.querySelectorAll("[data-lightbox-target]")) {
    trigger.addEventListener("click", () => {
      const id = trigger.getAttribute("data-lightbox-target");
      const dialog = id ? document.getElementById(id) : null;
      if (!(dialog instanceof HTMLDialogElement)) return;
      const image = dialog.querySelector("img");
      if (image instanceof HTMLImageElement && !image.src) image.src = dialog.dataset.hires ?? "";
      dialog.showModal();
    });
  }

  const article = document.querySelector(".article-body");
  if (article) {
    // Only overflowing blocks need an extra keyboard stop. Native scrolling
    // preserves code/table contents; MathJax keeps its own focus and a11y roles.
    const scrollRegions = new Map();
    let scrollFrame = 0;
    function inlineMathOverflows(element) {
      const formula = element.querySelector("mjx-math");
      if (!formula) return false;
      // Inline emphasis/link wrappers have no clientWidth. Measure the nearest
      // real content box, excluding its padding, rather than treating it as 0.
      let container = element.parentElement;
      while (container && container !== article && !container.clientWidth) container = container.parentElement;
      if (!container) return false;
      const style = getComputedStyle(container);
      const available = container.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      return formula.getBoundingClientRect().width > available + 1;
    }
    function updateScrollRegions() {
      scrollFrame = 0;
      for (const [element, label] of scrollRegions) {
        const math = element.matches("mjx-container");
        const inlineMath = math && element.getAttribute("display") !== "true";
        const overflowing = inlineMath
          ? inlineMathOverflows(element)
          : element.scrollWidth > element.clientWidth + 1;
        element.toggleAttribute("data-overflowing", overflowing);
        if (math) continue;
        if (overflowing) {
          element.setAttribute("tabindex", "0");
          element.setAttribute("role", "region");
          element.setAttribute("aria-label", label);
        } else {
          element.removeAttribute("tabindex");
          element.removeAttribute("role");
          element.removeAttribute("aria-label");
        }
      }
    }
    function scheduleScrollRegions() {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollRegions);
    }
    const scrollObserver = typeof ResizeObserver === "function"
      ? new ResizeObserver(scheduleScrollRegions) : null;
    function registerScrollRegion(element, label) {
      if (scrollRegions.has(element)) return;
      scrollRegions.set(element, label);
      scrollObserver?.observe(element);
    }
    article.querySelectorAll(".table-scroll").forEach((element, index) => {
      registerScrollRegion(element, `Table ${index + 1} (scroll horizontally)`);
    });
    article.querySelectorAll("pre").forEach((element, index) => {
      registerScrollRegion(element, `Code block ${index + 1} (scroll horizontally)`);
    });
    function registerMathRegions() {
      article.querySelectorAll("mjx-container").forEach((element) => registerScrollRegion(element, ""));
      scheduleScrollRegions();
    }
    function waitForMath() {
      window.MathJax?.startup?.promise?.then(registerMathRegions).catch(() => {});
    }
    document.getElementById("MathJax-script")?.addEventListener("load", waitForMath, { once: true });
    waitForMath();
    scrollObserver?.observe(article);
    window.addEventListener("resize", scheduleScrollRegions, { passive: true });
    document.fonts?.ready.then(scheduleScrollRegions);
    scheduleScrollRegions();

    const headings = [...article.querySelectorAll(":scope > h2[id], :scope > h3[id]")];
    const tocLinks = [...document.querySelectorAll("[data-desktop-toc] a, [data-mobile-toc] a")];
    const timelineGroups = [...document.querySelectorAll("[data-timeline-section]")];

    function sectionForHeading(heading) {
      if (heading.tagName === "H2") return heading.id;
      const index = headings.indexOf(heading);
      for (let position = index - 1; position >= 0; position -= 1) {
        if (headings[position].tagName === "H2") return headings[position].id;
      }
      return heading.id;
    }

    function updateTimeline(sectionID) {
      for (const group of timelineGroups) {
        const active = group.dataset.timelineSection === sectionID;
        group.classList.toggle("is-active", active);
        group.setAttribute("aria-hidden", String(!active));
      }
    }

    function setCurrentHeading(heading) {
      const activeIndex = headings.indexOf(heading);
      for (const link of tocLinks) {
        const id = decodeURIComponent(link.getAttribute("href")?.replace(/^#/, "") ?? "");
        const linkedIndex = headings.findIndex((candidate) => candidate.id === id);
        const current = linkedIndex === activeIndex;
        link.classList.toggle("is-current", current);
        link.classList.toggle("is-passed", linkedIndex >= 0 && linkedIndex < activeIndex);
        if (current) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      }
      updateTimeline(sectionForHeading(heading));
    }

    if (headings.length > 0) {
      const hashHeading = location.hash
        ? headings.find((heading) => heading.id === decodeURIComponent(location.hash.slice(1)))
        : null;
      setCurrentHeading(hashHeading ?? headings[0]);

      if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries) => {
          const candidates = entries
            .filter((entry) => entry.isIntersecting)
            .sort((left, right) => Math.abs(left.boundingClientRect.top) - Math.abs(right.boundingClientRect.top));
          if (candidates[0]) setCurrentHeading(candidates[0].target);
        }, { rootMargin: "-16% 0px -72% 0px", threshold: 0 });
        headings.forEach((heading) => observer.observe(heading));

        const finalContent = article.lastElementChild;
        if (finalContent) {
          const endObserver = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) setCurrentHeading(headings.at(-1));
          }, { threshold: 0.5 });
          endObserver.observe(finalContent);
        }
      }
    }

    document.querySelectorAll("[data-mobile-toc] a").forEach((link) => {
      link.addEventListener("click", () => {
        const disclosure = link.closest("details");
        if (disclosure instanceof HTMLDetailsElement) disclosure.open = false;
      });
    });
  }

  const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (finePointerQuery.matches) {
    const previewTriggers = [...document.querySelectorAll("[data-preview-trigger]")];
    let activeCard = null;
    let hideTimer = 0;

    function hidePreview(card = activeCard) {
      window.clearTimeout(hideTimer);
      if (!(card instanceof HTMLElement)) return;
      if (typeof card.hidePopover === "function" && card.matches(":popover-open")) card.hidePopover();
      card.removeAttribute("data-open");
      card.style.removeProperty("left");
      card.style.removeProperty("top");
      if (activeCard === card) activeCard = null;
    }

    function positionPreview(trigger, card) {
      const triggerRect = trigger.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const inset = 16;
      const gap = 10;
      const left = Math.min(
        Math.max(inset, triggerRect.left),
        window.innerWidth - cardRect.width - inset,
      );
      const roomBelow = window.innerHeight - triggerRect.bottom;
      const top = roomBelow >= cardRect.height + gap
        ? triggerRect.bottom + gap
        : Math.max(inset, triggerRect.top - cardRect.height - gap);
      card.style.left = `${Math.round(left)}px`;
      card.style.top = `${Math.round(top)}px`;
    }

    function showPreview(trigger) {
      window.clearTimeout(hideTimer);
      const cardID = trigger.getAttribute("aria-describedby");
      const card = cardID ? document.getElementById(cardID) : null;
      if (!(card instanceof HTMLElement)) return;
      if (activeCard && activeCard !== card) hidePreview(activeCard);
      try {
        if (typeof card.showPopover === "function") card.showPopover();
        else card.dataset.open = "true";
      } catch {
        card.dataset.open = "true";
      }
      activeCard = card;
      positionPreview(trigger, card);
    }

    for (const trigger of previewTriggers) {
      trigger.addEventListener("pointerenter", () => showPreview(trigger));
      trigger.addEventListener("pointerleave", () => {
        hideTimer = window.setTimeout(() => hidePreview(), 90);
      });
      trigger.addEventListener("focus", () => showPreview(trigger));
      trigger.addEventListener("blur", () => hidePreview());
      trigger.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          hidePreview();
          trigger.focus();
        }
      });
    }

    window.addEventListener("resize", () => hidePreview(), { passive: true });
    window.addEventListener("scroll", () => hidePreview(), { passive: true });
  }
})();
