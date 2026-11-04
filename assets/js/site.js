// Elite Medical Care - site helpers (booking form and form redirects).
(function () {
  "use strict";

  // After a form is sent, FormSubmit redirects to this page. Build the address
  // from the current site so it works on any domain the site is published on.
  document.querySelectorAll('input[name="_next"]').forEach(function (input) {
    if (/^https?:$/.test(window.location.protocol)) {
      input.value = new URL("thank-you.html", window.location.href).href;
    }
  });

  // All forms: instead of sending an email, open WhatsApp with the details
  // already written; the visitor only has to press send.
  var WHATSAPP_NUMBER = "962799901515";
  var LABELS = {
    ar: {
      booking: "طلب حجز موعد - إيليت للرعاية الطبية",
      contact: "رسالة من موقع إيليت للرعاية الطبية",
      Service: "الخدمة", Doctor: "الطبيب", "Patient Name": "الاسم", Name: "الاسم",
      Email: "البريد الإلكتروني", Phone: "رقم الهاتف", "Appointment Date & Time": "موعد الحجز",
      "Appointment Date and Time": "موعد الحجز", message: "الرسالة"
    },
    en: {
      booking: "Appointment request - Elite Medical Care",
      contact: "Message from the Elite Medical Care website",
      Service: "Service", Doctor: "Doctor", "Patient Name": "Name", Name: "Name",
      Email: "Email", Phone: "Phone", "Appointment Date & Time": "Appointment date & time",
      "Appointment Date and Time": "Appointment date & time", message: "Message"
    }
  };

  document.querySelectorAll('form[action*="formsubmit.co"]').forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var labels = LABELS[window.eliteLanguage === "ar" ? "ar" : "en"];
      var lines = [labels[form.querySelector('[name="message"]') ? "contact" : "booking"], ""];

      Array.prototype.forEach.call(form.elements, function (field) {
        if (!field.name || field.type === "hidden" || field.type === "submit" || field.name.charAt(0) === "_") {
          return;
        }
        var value = field.tagName === "SELECT" && field.selectedIndex >= 0 && field.value
          ? field.options[field.selectedIndex].textContent
          : field.value;
        value = (value || "").trim();
        if (value) {
          lines.push((labels[field.name] || labels[field.name.charAt(0).toUpperCase() + field.name.slice(1)] || field.name) + ": " + value);
        }
      });

      var url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(lines.join("\n"));
      var opened = window.open(url, "_blank", "noopener");
      if (!opened) {
        window.location.href = url;
      }
    });
  });

  // Booking form: show the doctors of the selected service.
  // Keys are option values of #service-select; names are translation keys.
  var DOCTORS = {
    "Cardiology": [["doctor_1_name", "Dr. Abdullah Haidmous"]],
    "Pediatrics": [["doctor_3_name", "Dr. Yazan Mousa Maqdadi"]],
    "Obstetrics & Gynecology": [["doctor_20_name", "Dr. Muna Shaarawi"]],
    "Internal Medicine & Gastroenterology": [["doctor_15_name", "Dr. Yazeed Al Halayqa"]],
    "Internal Medicine & Nephrology": [["doctor_14_name", "Dr. Mohammed Thneibat"]],
    "Pulmonology & Allergy": [["doctor_13_name", "Dr. Ahmed Al-Khayat"]],
    "ENT": [["doctor_sara_name", "Dr. Sara Hassan"]],
    "Urology": [["doctor_16_name", "Dr. Mohammad Abu Ghali"]],
    "Orthopedics": [["doctor_17_name", "Dr. Naser Al-Rawashdeh"]],
    "General Medicine": [["doctor_19_name", "Dr. Ahmad Al-Dala'in"]],
    "Dentistry": [["doctor_11_name", "Dr. Hala Rabah"]]
  };

  var serviceSelect = document.getElementById("service-select");
  var doctorSelect = document.getElementById("doctor-select");
  if (!serviceSelect || !doctorSelect) {
    return;
  }

  function t(key, fallback) {
    var translations = window.eliteTranslations || {};
    return typeof translations[key] === "string" ? translations[key] : fallback;
  }

  function addOption(value, label, placeholder) {
    var option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    if (placeholder) {
      option.hidden = true;
      option.disabled = true;
      option.selected = true;
    }
    doctorSelect.appendChild(option);
  }

  function updateDoctors() {
    var previous = doctorSelect.value;
    doctorSelect.innerHTML = "";
    addOption("", t("choose_doctor", "Choose Doctor"), true);

    var doctors = DOCTORS[serviceSelect.value] || [];
    doctors.forEach(function (doctor) {
      addOption(doctor[1], t(doctor[0], doctor[1]));
    });
    if (serviceSelect.value) {
      addOption("Any available doctor", t("any_available_doctor", "Any available doctor"));
    }
    if (previous && Array.prototype.some.call(doctorSelect.options, function (o) { return o.value === previous; })) {
      doctorSelect.value = previous;
    } else if (doctors.length === 1) {
      doctorSelect.value = doctors[0][1];
    }
  }

  serviceSelect.addEventListener("change", updateDoctors);
  document.addEventListener("elite:languagechange", updateDoctors);
  updateDoctors();
})();
