// Temporary diagnostic - tests all App.jsx imports
import React from "react";
import { SgsstSection } from "./components/Sgsst/SgsstSection.jsx";
import { SgsstPortalLoginModal } from "./components/Sgsst/SgsstPortalLoginModal.jsx";
import { ProductFamilyCard } from "./components/Catalog/ProductFamilyCard.jsx";
import { SubcategoryGrid } from "./components/Catalog/SubcategoryGrid.jsx";
import { calculateDIANDV, x, ee, groupProductsIntoFamilies } from "./utils/helpers.js";
import { S, ne, w, C, te } from "./data/catalogData.js";
import { fetchLiveCatalog } from "./services/catalogService.js";
import { submitQuoteRequest } from "./services/quoteService.js";

const checks = { SgsstSection, SgsstPortalLoginModal, ProductFamilyCard, SubcategoryGrid, calculateDIANDV, x, ee, groupProductsIntoFamilies, S, ne, w, C, te, fetchLiveCatalog, submitQuoteRequest };

Object.entries(checks).forEach(([name, val]) => {
  if (!val) console.error("UNDEFINED_IMPORT: " + name);
  else console.log("OK: " + name + " = " + typeof val);
});

export default function DiagnosticApp() {
  return React.createElement("div", { style: { color: "lime", fontFamily: "monospace", padding: 40 } },
    Object.entries(checks).map(([k, v]) =>
      React.createElement("div", { key: k }, (v ? "OK" : "UNDEFINED") + " " + k)
    )
  );
}
