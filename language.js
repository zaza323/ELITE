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

// Arabic: move the hero text block to the right side of the slide and give the
// title, description and button the same width so they share one right edge.
// The slider is laid out on a 1900px-wide canvas (data-container="1900").
if (initialLanguage === "ar") {
  const CANVAS = 1900;
  const WIDTHS = { style: 700, "data-ls-laptop": 800, "data-ls-tablet": 1000, "data-ls-mobile": 1700 };
  const mirror = (css, width) => {
    const match = /(^|;)\s*left:\s*(-?\d+)px/.exec(css || "");
    if (!match) return css;
    const left = parseInt(match[2], 10);
    const cleaned = css.replace(/(^|;)\s*(left|width|text-align):[^;]*/g, "$1");
    return `${cleaned}; left: ${CANVAS - left - width}px; width: ${width}px; text-align: right;`.replace(/;\s*;/g, ";");
  };
  // Arabic letters are taller: push the lines under the first title down a bit.
  const shiftTop = (css, by) => (css || "").replace(/(^|;)\s*top:\s*(-?\d+)px/, (m, sep, top) => `${sep} top: ${parseInt(top, 10) + by}px`);
  document.querySelectorAll(".vs-hero-carousel .ls-l").forEach((layer) => {
    const shift = layer.classList.contains("hero-title-secondary") ? 30
      : (layer.classList.contains("hero-description") || layer.classList.contains("ls-btn")) ? 50 : 0;
    Object.entries(WIDTHS).forEach(([attribute, width]) => {
      if (layer.hasAttribute(attribute)) {
        let css = mirror(layer.getAttribute(attribute), width);
        if (shift && attribute !== "data-ls-mobile") css = shiftTop(css, shift);
        layer.setAttribute(attribute, css);
      }
    });
  });
}

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

  // Each language file is downloaded once and kept in memory.
  const translationFiles = {};
  function loadTranslations(language) {
    if (!translationFiles[language]) {
      translationFiles[language] = fetch(`languages/${language}.json`).then((response) => {
        if (!response.ok) {
          throw new Error(`Unable to load languages/${language}.json`);
        }
        return response.json();
      });
      translationFiles[language].catch(() => delete translationFiles[language]);
    }
    return translationFiles[language];
  }

  // Only the most recent choice counts: if an earlier language file arrives
  // late (slow connection), it must not overwrite the language just picked.
  let latestRequest = 0;

  async function setLanguage(requestedLanguage) {
    const language = supportedLanguages.has(requestedLanguage) ? requestedLanguage : "en";
    const request = ++latestRequest;

    try {
      const translations = await loadTranslations(language);
      if (request !== latestRequest) {
        return;
      }
      setDirection(language);
      applyTranslations(translations);
      saveLanguage(language);
      window.eliteLanguage = language;
      window.eliteTranslations = translations;
      document.dispatchEvent(new CustomEvent("elite:languagechange", { detail: { language, translations } }));
    } catch (error) {
      console.error("Error loading language file:", error);
      if (language !== "en" && request === latestRequest) {
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

      // Close the mobile menu so the translated page is visible right away.
      const mobileMenu = option.closest(".vs-menu-wrapper");
      if (mobileMenu) {
        mobileMenu.classList.remove("vs-body-visible");
      }

      setLanguage(language);
    });
  });

  // Set the direction straight away (no waiting for the text file), then
  // fetch the other language in the background so switching is instant.
  setDirection(initialLanguage);
  setLanguage(initialLanguage).then(() => {
    loadTranslations(initialLanguage === "ar" ? "en" : "ar").catch(() => {});
  });
});
