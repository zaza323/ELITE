// Elite Medical Care - English / Arabic switcher.
//
// Every element with data-translate="key" receives the matching text from
// languages/<lang>.json. Inputs get a translated placeholder, and elements with
// data-translate-title="key" get a translated title attribute.

// Translate the hero before LayerSlider initializes. LayerSlider creates animated
// copies of its layers, so changing their text afterwards can leave both languages
// visible at the same time.
const initialLanguage = (() => {
  try {
    return localStorage.getItem("selectedLanguage") === "ar" ? "ar" : "en";
  } catch (error) {
    return "en";
  }
})();
document.documentElement.lang = initialLanguage;
document.documentElement.dir = initialLanguage === "ar" ? "rtl" : "ltr";
document.querySelectorAll(".vs-hero-carousel [data-en][data-ar]").forEach((element) => {
  element.textContent = element.dataset[initialLanguage];
});

document.addEventListener("DOMContentLoaded", () => {
  const supportedLanguages = new Set(["en", "ar"]);
  const ICON_TAGS = new Set(["I", "IMG", "SVG", "BR"]);
  const isIcon = (element) => ICON_TAGS.has(element.tagName.toUpperCase());

  function saveLanguage(language) {
    try {
      localStorage.setItem("selectedLanguage", language);
    } catch (error) {
      // Private browsing can block storage; the page still works.
    }
  }

  // Replace the visible text of an element while keeping its icons.
  function setText(element, value) {
    const children = Array.from(element.children);
    const contentChildren = children.filter((child) => !isIcon(child));
    const textNodes = Array.from(element.childNodes).filter((node) => node.nodeType === Node.TEXT_NODE);
    const hasOwnText = textNodes.some((node) => node.textContent.trim() !== "");

    // A wrapper such as <h3><a>Title</a></h3>: translate the inner element only,
    // otherwise the title is shown twice.
    if (!hasOwnText && contentChildren.length === 1 && !contentChildren[0].hasAttribute("data-translate")) {
      setText(contentChildren[0], value);
      return;
    }

    if (!children.length) {
      element.textContent = value;
      return;
    }

    textNodes.forEach((node) => node.remove());
    const first = element.firstElementChild;
    if (element.firstChild === first && isIcon(first)) {
      first.after(document.createTextNode(` ${value} `));
    } else {
      element.prepend(document.createTextNode(`${value} `));
    }
  }

  function applyTranslations(translations) {
    document.querySelectorAll("[data-translate]").forEach((element) => {
      if (element.closest(".vs-hero-carousel")) {
        return;
      }

      const value = translations[element.dataset.translate];
      if (typeof value !== "string") {
        return;
      }

      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        element.placeholder = value;
      } else {
        setText(element, value);
      }
    });

    document.querySelectorAll("[data-translate-title]").forEach((element) => {
      const value = translations[element.dataset.translateTitle];
      if (typeof value === "string") {
        element.title = value;
      }
    });
  }

  function setDirection(language) {
    const isArabic = language === "ar";
    let rtlStylesheet = document.getElementById("rtl-styles");

    if (isArabic && !rtlStylesheet) {
      rtlStylesheet = document.createElement("link");
      rtlStylesheet.id = "rtl-styles";
      rtlStylesheet.rel = "stylesheet";
      rtlStylesheet.href = "assets/css/rtl.css";
      document.head.appendChild(rtlStylesheet);
    } else if (!isArabic && rtlStylesheet) {
      rtlStylesheet.remove();
    }

    document.documentElement.lang = language;
    document.documentElement.dir = isArabic ? "rtl" : "ltr";
    document.body.dir = isArabic ? "rtl" : "ltr";
    document.body.dataset.lang = language;
    document.body.classList.toggle("rtl-active", isArabic);

    document.querySelectorAll(".form-group").forEach((formGroup) => {
      const icon = formGroup.querySelector(":scope > i");
      if (!icon) return;

      icon.style.left = isArabic ? "auto" : "15px";
      icon.style.right = isArabic ? "15px" : "auto";
    });
  }

  async function setLanguage(requestedLanguage) {
    const language = supportedLanguages.has(requestedLanguage) ? requestedLanguage : "en";
    setDirection(language);

    try {
      const response = await fetch(`languages/${language}.json`);
      if (!response.ok) {
        throw new Error(`Unable to load languages/${language}.json`);
      }

      const translations = await response.json();
      applyTranslations(translations);
      saveLanguage(language);
      window.eliteLanguage = language;
      window.eliteTranslations = translations;
      document.dispatchEvent(new CustomEvent("elite:languagechange", { detail: { language, translations } }));
    } catch (error) {
      console.error("Error loading language file:", error);
      if (language !== "en") {
        await setLanguage("en");
      }
    }
  }

  document.querySelectorAll(".language-option[data-lang]").forEach((option) => {
    option.addEventListener("click", (event) => {
      event.preventDefault();
      const language = supportedLanguages.has(option.dataset.lang) ? option.dataset.lang : "en";
      saveLanguage(language);

      // Rebuild the slider with the selected language instead of mutating the
      // animated layers that LayerSlider has already generated.
      if (document.querySelector(".vs-hero-carousel")) {
        window.location.reload();
        return;
      }

      setLanguage(language);
    });
  });

  setLanguage(initialLanguage);
});
