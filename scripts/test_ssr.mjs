import React from "react";
import ReactDOMServer from "react-dom/server";
import { SubcategoryGrid } from "../src/components/Catalog/SubcategoryGrid.jsx";
import { ProductFamilyCard } from "../src/components/Catalog/ProductFamilyCard.jsx";
import { SgsstSection } from "../src/components/Sgsst/SgsstSection.jsx";
import { SgsstPortalLoginModal } from "../src/components/Sgsst/SgsstPortalLoginModal.jsx";
import { S } from "../src/data/catalogData.js";
import { groupProductsIntoFamilies } from "../src/utils/helpers.js";

console.log("--- TESTING INDIVIDUAL COMPONENTS ---");

try {
  const cat = S["SEGURIDAD INDUSTRIAL"];
  const htmlGrid = ReactDOMServer.renderToString(React.createElement(SubcategoryGrid, { categoryData: cat, categoryKey: "SEGURIDAD INDUSTRIAL" }));
  console.log("OK SubcategoryGrid rendered. Length:", htmlGrid.length);
} catch (e) {
  console.error("FAIL SubcategoryGrid:", e);
}

try {
  const prods = S["SEGURIDAD INDUSTRIAL"]?.sublines?.["proteccion_cabeza"]?.products || [];
  const families = groupProductsIntoFamilies(prods);
  if (families.length > 0) {
    const htmlCard = ReactDOMServer.renderToString(React.createElement(ProductFamilyCard, {
      family: families[0],
      onViewSheet: () => {},
      onAddToCart: () => {},
      showPrices: true
    }));
    console.log("OK ProductFamilyCard rendered. Length:", htmlCard.length);
  }
} catch (e) {
  console.error("FAIL ProductFamilyCard:", e);
}

try {
  const htmlSgsst = ReactDOMServer.renderToString(React.createElement(SgsstSection, { onOpenPortalModal: () => {} }));
  console.log("OK SgsstSection rendered. Length:", htmlSgsst.length);
} catch (e) {
  console.error("FAIL SgsstSection:", e);
}

try {
  const htmlModal = ReactDOMServer.renderToString(React.createElement(SgsstPortalLoginModal, { isOpen: true, onClose: () => {} }));
  console.log("OK SgsstPortalLoginModal rendered. Length:", htmlModal.length);
} catch (e) {
  console.error("FAIL SgsstPortalLoginModal:", e);
}
