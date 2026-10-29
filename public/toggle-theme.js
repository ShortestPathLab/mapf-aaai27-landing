// A saved choice takes precedence; new visitors start in dark mode.
let themeValue = "dark";
try {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light" || savedTheme === "dark") themeValue = savedTheme;
} catch {
  // The toggle still works when browser storage is unavailable.
}

function reflectPreference() {
  document.documentElement.setAttribute("data-theme", themeValue);
  document.documentElement.style.colorScheme = themeValue;

  const button = document.querySelector("#theme-btn");
  const label =
    themeValue === "dark" ? "Switch to light mode" : "Switch to dark mode";
  button?.setAttribute("aria-label", label);
  button?.setAttribute("title", label);

  if (document.body) {
    document
      .querySelector("meta[name='theme-color']")
      ?.setAttribute(
        "content",
        window.getComputedStyle(document.body).backgroundColor
      );
  }
}

// Apply before the body paints to avoid a flash of the wrong theme.
reflectPreference();
document.addEventListener("astro:after-swap", reflectPreference);

document.addEventListener("astro:page-load", () => {
  reflectPreference();
  document.querySelector("#theme-btn")?.addEventListener("click", () => {
    themeValue = themeValue === "light" ? "dark" : "light";
    try {
      localStorage.setItem("theme", themeValue);
    } catch {
      // Keep the current session usable even without persistent storage.
    }
    reflectPreference();
  });
});
