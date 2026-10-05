(() => {
  function issueUrl(issue, archiveBaseUrl) {
    const suppliedUrl = typeof issue?.url === "string" ? issue.url : "";
    const filename = typeof issue?.filename === "string" ? issue.filename.split("/").pop() : "";
    let candidate = suppliedUrl;
    if (!candidate && filename && archiveBaseUrl) {
      try {
        candidate = new URL(encodeURIComponent(filename), archiveBaseUrl).href;
      } catch {}
    }
    if (!candidate) return null;
    try {
      const url = new URL(candidate, location.origin);
      const trustedHosts = new Set([location.hostname, new URL(archiveBaseUrl || location.origin).hostname]);
      return (url.protocol === "https:" || (url.protocol === "http:" && url.hostname === location.hostname)) && trustedHosts.has(url.hostname) ? url.href : null;
    } catch {
      return null;
    }
  }

  function issueDate(value) {
    if (typeof value !== "string" || !value.trim()) return null;
    const label = value.trim();
    const monthYear = label.match(/^([A-Za-z]+)\s+(\d{4})$/);
    if (monthYear) {
      const month = new Date(`${monthYear[1]} 1, ${monthYear[2]} 00:00:00 UTC`).getUTCMonth();
      if (!Number.isNaN(month)) return { label, dateTime: `${monthYear[2]}-${String(month + 1).padStart(2, "0")}` };
    }
    const parsed = new Date(label);
    if (Number.isNaN(parsed.getTime())) return { label, dateTime: "" };
    return {
      label: new Intl.DateTimeFormat("en", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      }).format(parsed),
      dateTime: parsed.toISOString().slice(0, 10),
    };
  }

  for (const archive of document.querySelectorAll("[data-newsletter-archive]")) {
    const endpoint = archive.dataset.newsletterArchiveEndpoint;
    const archiveBaseUrl = archive.dataset.newsletterArchiveBaseUrl;
    const status = archive.querySelector("[data-newsletter-archive-status]");
    if (!endpoint || !(status instanceof HTMLElement)) continue;

    fetch(endpoint, { headers: { Accept: "application/json" } })
      .then((response) => {
        if (!response.ok) throw new Error("Archive request failed");
        return response.json();
      })
      .then((data) => {
        const issues = Array.isArray(data?.newsletters)
          ? data.newsletters.filter((issue) => issueUrl(issue, archiveBaseUrl))
          : [];
        archive.replaceChildren();
        archive.setAttribute("aria-busy", "false");
        if (issues.length === 0) {
          const empty = document.createElement("p");
          empty.className = "archive-issues__status";
          empty.textContent = "No issues have been published yet.";
          archive.append(empty);
          return;
        }

        const list = document.createElement("ol");
        list.className = "archive-issues__list compact-index";
        for (const issue of issues) {
          const item = document.createElement("li");
          const dateDetails = issueDate(issue.date);
          if (dateDetails) {
            const date = document.createElement("time");
            date.textContent = dateDetails.label;
            if (dateDetails.dateTime) date.dateTime = dateDetails.dateTime;
            item.append(date);
          } else {
            const datePlaceholder = document.createElement("span");
            datePlaceholder.setAttribute("aria-hidden", "true");
            item.append(datePlaceholder);
          }

          const link = document.createElement("a");
          link.href = issueUrl(issue, archiveBaseUrl);
          link.target = "_blank";
          link.rel = "external noopener noreferrer";
          link.textContent = typeof issue.title === "string" && issue.title.trim()
            ? issue.title.trim()
            : "Newsletter issue";
          item.append(link);
          list.append(item);
        }
        archive.append(list);
      })
      .catch(() => {
        archive.setAttribute("aria-busy", "false");
        status.textContent = "The archive could not be loaded. Please try again in a moment.";
      });
  }
})();
