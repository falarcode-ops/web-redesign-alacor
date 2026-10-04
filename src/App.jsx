import React, { useState, useEffect, useRef, useMemo } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';
import { SgsstSection } from './components/Sgsst/SgsstSection.jsx';
import { SgsstPortalLoginModal } from './components/Sgsst/SgsstPortalLoginModal.jsx';
import { ProductFamilyCard } from './components/Catalog/ProductFamilyCard.jsx';
import { SubcategoryGrid } from './components/Catalog/SubcategoryGrid.jsx';
import { PortfolioView } from './components/Catalog/PortfolioView.jsx';
import { calculateDIANDV, x, ee, groupProductsIntoFamilies, hasValidImage } from './utils/helpers.js';
import { S, ne, w, C, te } from './data/catalogData.js';
import { fetchLiveCatalog } from './services/catalogService.js';
import { submitQuoteRequest } from './services/quoteService.js';

const _ = React;
const b = { jsx, jsxs, Fragment: React.Fragment };

const L = ({ text: e }) =>
  (0, b.jsxs)(`div`, {
    className: `group relative inline-block ml-1.5 align-middle select-none`,
    children: [
      (0, b.jsx)(`span`, {
        className: `w-3.5 h-3.5 bg-white/5 border border-white/20 hover:border-alacor-amber/50 text-gray-400 hover:text-alacor-amber rounded-full flex items-center justify-center text-[9px] font-extrabold cursor-help transition-all`,
        children: `?`,
      }),
      (0, b.jsxs)(`div`, {
        className: `absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-[#0e1622] border border-white/10 rounded-lg shadow-xl text-[10px] text-gray-300 font-medium normal-case leading-relaxed pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 text-left`,
        children: [
          e,
          (0, b.jsx)(`div`, {
            className: `absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#0e1622]`,
          }),
        ],
      }),
    ],
  });

const AlacorApp = function() {

  const handleAdminLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('alacor_admin_auth');
      sessionStorage.clear();
    }
    if (typeof $e === 'function') $e(false);
    if (typeof tt === 'function') tt('');
    if (typeof rt === 'function') rt('');
  };

  const changeAdminPassword = () => {
    const currentPass = prompt("Ingrese su contraseña actual (o por defecto alacor2026):");
    const storedPass = localStorage.getItem('alacor_admin_custom_password') || 'alacor2026';
    if (currentPass !== storedPass && currentPass !== 'alacor2026') {
      alert("Contraseña incorrecta.");
      return;
    }
    const newPass = prompt("Ingrese su nueva contraseña de Administrador:");
    if (newPass && newPass.trim().length >= 6) {
      localStorage.setItem('alacor_admin_custom_password', newPass.trim());
      alert("Contraseña de administración actualizada con éxito.");
      handleAdminLogout();
    } else {
      alert("La contraseña debe tener al menos 6 caracteres.");
    }
  };

  const [showShippingTermsModal, setShowShippingTermsModal] = useState(false);
  let [e, t] = (0, _.useState)(`alturas_EPP`),
    n = (0, _.useRef)(null),
    r = (0, _.useRef)(null),
    i = (0, _.useRef)(null),
    [a, o] = (0, _.useState)(() => {
      let e = localStorage.getItem(`alacor_demo_chapters_v4`);
      if (e)
        try {
          let t = JSON.parse(e);
          if (Array.isArray(t) && t.length > 0) return t;
        } catch (e) {
          console.warn(
            `Error reading demoChapters from v4 storage, resetting to default`,
            e,
          );
        }
      return ne;
    }),
    [s, c] = (0, _.useState)(() => a[0]?.key || `facial`),
    l = (e) => {
      (c(e),
        d(0),
        n.current &&
          (n.current.load(),
          n.current.play().catch((e) => console.log(`Play interrupted:`, e))));
    },
    [u, d] = (0, _.useState)(0),
    f = {
      facial: {
        videos: [
          { src: `/img/marketing/Proteccion_facial.mp4`, label: `Facial 360°` },
        ],
        descriptions: [
          `Policarbonato óptico Clase 1 con recubrimiento anti-empañamiento y filtración UV al 99.9%.`,
          `Careta Arco Eléctrico certificada NFPA 70E con atenuación ATPV 12 cal/cm².`,
          `Ribete estructural de aluminio que refuerza el contorno contra impactos de partículas.`,
          `Compatible con cascos dieléctricos Clase E para montaje directo sin herramientas.`,
          `Cumple ANSI Z87.1+ / CSA Z94.3 para ambientes industriales exigentes.`,
        ],
      },
      cabeza: {
        videos: [
          {
            src: `/img/marketing/Video protección Cabeza.mp4`,
            label: `Cabeza 360°`,
          },
        ],
        descriptions: [
          `Casquete en polietileno de alta densidad (HDPE) diseñado para mitigar impactos cenitales y laterales.`,
          `Clase dieléctrica E — certificado para soportar descargas eléctricas de hasta 20,000 V.`,
          `Suspensión de cremallera (tafilete) de 4 o 6 apoyos para distribución uniforme del impacto.`,
          `Ranuras laterales universales para acople de protectores auditivos y caretas faciales.`,
          `Cumple estrictamente con la norma ANSI/ISEA Z89.1 y resoluciones del Ministerio de Trabajo.`,
        ],
      },
      visual: {
        videos: [
          { src: `/img/marketing/Proteccion_visual.mp4`, label: `Visual 360°` },
        ],
        descriptions: [
          `Policarbonato óptico ultra-cristalino con recubrimiento Anti-Rayas y Anti-Empañamiento.`,
          `Patillas flexibles de goma antideslizante con ajuste de ángulo lateral.`,
          `Protección UV al 99.9% contra rayos UVA/UVB en entornos al aire libre y confinados.`,
          `Diseño deportivo de perfil bajo para uso continuo en jornadas industriales largas.`,
          `Cumple ANSI Z87.1+ para impactos de alta velocidad y partículas en suspensión.`,
        ],
      },
      auditiva: {
        videos: [
          {
            src: `/img/marketing/Proteccion_auditiva.mp4`,
            label: `Auditivo 360°`,
          },
        ],
        descriptions: [
          `Atenuación NRR 24 dB / SNR 29 dB — certificados para ambientes de ruido continuo.`,
          `Almohadillas de espuma viscoelástica de alta densidad para sellado periauricular.`,
          `Diadema ajustable multitalla con articulaciones de pivote de 360°.`,
          `Alta visibilidad con opciones en naranja neón and amarillo fluorescente.`,
          `Cumple ANSI S3.19 and EN 352-1 para entornos industriales de alto riesgo auditivo.`,
        ],
      },
      manual: {
        videos: [
          {
            src: `/img/marketing/Guantes_cuero.mp4`,
            label: `Guantes de Cuero`,
            descriptions: [
              `Cuero vacuno flor de primera selección con refuerzo de doble palma cosida.`,
              `Dorso de lona de algodón transpirable de alta densidad para confort en jornadas largas.`,
              `Protección mecánica EN 388 — resistencia a corte, abrasión y rasgado en trabajos pesados.`,
              `Puño rígido de seguridad con costura de tres hilos de alta resistencia al desgarre.`,
              `Ideal para construcción, manejo de perfiles metálicos y carga industrial pesada.`,
            ],
          },
          {
            src: `/img/marketing/Video Guantes de carnaza.mp4`,
            label: `Guantes de Carnaza`,
            descriptions: [
              `Guante de carnaza de cuero vacuno curtido de alta resistencia al desgarro.`,
              `Refuerzo de doble costura en puntos críticos para trabajo pesado de manipulación.`,
              `Forro interno suave para absorción de sudoración y mayor confort.`,
              `Excelente protección contra riesgos de abrasión, fricción e impactos mecánicos moderados.`,
              `Ideal para soldadura ligera, metalmecánica y manejo de herramientas pesadas.`,
            ],
          },
          {
            src: `/img/marketing/Guantes_Multiflex.mp4`,
            label: `Guantes Multiflex`,
            descriptions: [
              `Recubrimiento de nitrilo de doble inmersión para resistencia química superior.`,
              `Palma texturizada en seco y húmedo para agarre seguro en superficies resbaladizas.`,
              `Resistente a aceites, grasas, hidrocarburos y solventes de uso industrial.`,
              `Forro de algodón interior para absorción de humedad y comodidad prolongada.`,
              `Cumple EN 374 para resistencia a químicos y EN 388 para protección mecánica.`,
            ],
          },
        ],
        descriptions: [],
      },
      alturas: {
        videos: [
          { src: `/img/marketing/Trabajo_alturas.mp4`, label: `Alturas 360°` },
        ],
        descriptions: [
          `Arnés dieléctrico de cuerpo entero en X con 4 argollas — certificado ANSI Z359.11-2014.`,
          `Sistema de acolchado en espalda, hombros, cintura y perneras para máxima ergonomía.`,
          `Herrajes de nylon 66 con aislamiento eléctrico hasta 9 kV — sin conductividad metálica.`,
          `Eslingas de doble terminal con absorbedor de impacto integrado < 900 lbs (4 kN).`,
          `Líneas de vida horizontales portátiles para hasta 2 trabajadores simultáneos.`,
        ],
      },
      calzado: {
        videos: [
          {
            src: `/img/marketing/Botas_Seguridad.mp4`,
            label: `Calzado 360°`,
            descriptions: [
              `Calzado de seguridad industrial con puntera de composite ligera y ultra-resistente.`,
              `Suela de poliuretano de doble densidad resistente a hidrocarburos y aceites.`,
              `Propiedades dieléctricas certificadas para soportar tensiones de hasta 18 kV bajo norma ASTM.`,
              `Diseño ergonómico con plantilla confort de alta memoria para reducción de fatiga laboral.`,
              `Construcción en cuero flor de calibre superior con repelencia natural a líquidos.`,
            ],
          },
          {
            src: `/img/marketing/Botas_PVC.mp4`,
            label: `CalzadoPVC 360°`,
            descriptions: [
              `Construcción 100% impermeable: Inyección monopieza en compuesto de PVC de alta flexibilidad que garantiza total hermeticidad.`,
              `Suela autolimpiante de agarre superior: Diseño de suela con labrado profundo y canales anchos de evacuación.`,
              `Resistencia a químicos e hidrocarburos: Compuesto polimérico formulado específicamente para soportar la acción de grasas y aceites.`,
              `Puntera de seguridad certificada: Puntera de acero o composite reforzada y homologada bajo normas ASTM / EN.`,
              `Forro interno de secado rápido: Revestimiento textil transpirable que previene la fricción y regula la temperatura.`,
            ],
          },
        ],
        descriptions: [],
      },
    },
    [p, m] = (0, _.useState)(() => {
      let e = localStorage.getItem(`alacor_category_media_v4`);
      if (e)
        try {
          let t = JSON.parse(e);
          if (t.facial || t.cabeza || t.alturas) return t;
        } catch (e) {
          console.warn(
            `Error reading categoryMedia from v4 storage, resetting to default`,
            e,
          );
        }
      return f;
    }),
    [h, g] = (0, _.useState)(`facial`),
    [v, y] = (0, _.useState)(`__select__`),
    [re, ie] = (0, _.useState)(``),
    [ae, oe] = (0, _.useState)(``),
    [se, ce] = (0, _.useState)(``),
    [le, ue] = (0, _.useState)(null),
    [T, E] = (0, _.useState)(``),
    [de, fe] = (0, _.useState)(``),
    [pe, me] = (0, _.useState)(``),
    [he, D] = (0, _.useState)(`🛡️`),
    [ge, _e] = (0, _.useState)(``),
    [ve, ye] = (0, _.useState)(`/img/marketing/Proteccion_facial.mp4`),
    [be, xe] = (0, _.useState)(
      `/img/catalogo/Protecci_n_Visual_y_Facial_rep_Careta_Protecci_n_Facial_PET.jpg`,
    ),
    [Se, Ce] = (0, _.useState)(null),
    [we, Te] = (0, _.useState)(``),
    [Ee, De] = (0, _.useState)(``),
    [Oe, ke] = (0, _.useState)(``),
    [Ae, je] = (0, _.useState)(``),
    [Me, Ne] = (0, _.useState)(``),
    Pe = (e) => {
      e.preventDefault();
      let t = de.trim().toLowerCase(),
        n = pe.trim(),
        r = he.trim(),
        i = ge.trim(),
        s = ve.trim() || `/img/marketing/Proteccion_facial.mp4`,
        c =
          be.trim() ||
          `/img/catalogo/Protecci_n_Visual_y_Facial_rep_Careta_Protecci_n_Facial_PET.jpg`;
      if (!t || !n) {
        alert(`La clave y el título son obligatorios.`);
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(t)) {
        alert(`La clave solo debe contener letras, números o guiones bajos.`);
        return;
      }
      if (a.some((e) => e.key === t)) {
        alert(`Ya existe una categoría con esta clave.`);
        return;
      }
      let l = {
        key: t,
        title: n,
        icon: r,
        description: i,
        videoSrc: s,
        productImg: c,
      };
      o([...a, l]);
      let u = JSON.parse(JSON.stringify(p));
      ((u[t] = {
        videos: [{ src: s, label: `${n} 360°` }],
        descriptions: [i || `Especificación técnica para ${n}`],
      }),
        m(u),
        fe(``),
        me(``),
        D(`🛡️`),
        _e(``),
        ye(`/img/marketing/Proteccion_facial.mp4`),
        xe(
          `/img/catalogo/Protecci_n_Visual_y_Facial_rep_Careta_Protecci_n_Facial_PET.jpg`,
        ));
    },
    Fe = (e, t) => {
      let n = t === `up` ? e - 1 : e + 1;
      if (n < 0 || n >= a.length) return;
      let r = [...a],
        i = r[e];
      ((r[e] = r[n]), (r[n] = i), o(r));
    },
    Ie = (e) => {
      if (
        [
          `facial`,
          `cabeza`,
          `visual`,
          `auditiva`,
          `manual`,
          `alturas`,
          `calzado`,
        ].includes(e)
      ) {
        alert(`No se pueden eliminar las categorías principales del sistema.`);
        return;
      }
      if (
        window.confirm(
          `¿Está seguro de que desea eliminar la categoría "${e}"? Se borrarán también sus videos y especificaciones asociadas.`,
        )
      ) {
        let t = a.filter((t) => t.key !== e);
        o(t);
        let n = JSON.parse(JSON.stringify(p));
        (delete n[e],
          m(n),
          s === e && c(t[0]?.key || `facial`),
          h === e && g(t[0]?.key || `facial`));
      }
    },
    Le = (e) => {
      (Ce(e.key),
        Te(e.title),
        De(e.icon),
        ke(e.description),
        je(e.videoSrc || ``),
        Ne(e.productImg || ``));
    },
    Re = () => {
      if (!we.trim()) {
        alert(`El título es obligatorio.`);
        return;
      }
      (o(
        a.map((e) =>
          e.key === Se
            ? {
                ...e,
                title: we.trim(),
                icon: Ee.trim(),
                description: Oe.trim(),
                videoSrc: Ae.trim(),
                productImg: Me.trim(),
              }
            : e,
        ),
      ),
        Ce(null));
    },
    ze = [
      { src: `/img/marketing/Botas_PVC.mp4`, label: `CalzadoPVC 360°` },
      {
        src: `/img/marketing/Botas_Seguridad.mp4`,
        label: `Botas de Seguridad 360°`,
      },
      {
        src: `/img/marketing/Trabajo_alturas.mp4`,
        label: `Trabajo en Alturas 360°`,
      },
      {
        src: `/img/marketing/Proteccion_facial.mp4`,
        label: `Protección Facial 360°`,
      },
      {
        src: `/img/marketing/Video protección Cabeza.mp4`,
        label: `Protección Cabeza 360°`,
      },
      {
        src: `/img/marketing/Proteccion_visual.mp4`,
        label: `Protección Visual 360°`,
      },
      {
        src: `/img/marketing/Proteccion_auditiva.mp4`,
        label: `Protección Auditiva 360°`,
      },
      {
        src: `/img/marketing/Guantes_cuero.mp4`,
        label: `Guantes de Cuero 360°`,
      },
      {
        src: `/img/marketing/Guantes_Multiflex.mp4`,
        label: `Guantes Multiflex 360°`,
      },
      {
        src: `/img/marketing/Video árnes - trabajo en alturas.mp4`,
        label: `Video Arnés (Antiguo)`,
      },
      {
        src: `/img/marketing/Video protección Facial.mp4`,
        label: `Video Facial (Antiguo)`,
      },
      {
        src: `/img/marketing/Lentes de seguridad video álacor.mp4`,
        label: `Video Visual (Antiguo)`,
      },
      {
        src: `/img/marketing/Video protección Auditiva.mp4`,
        label: `Video Auditivo (Antiguo)`,
      },
      {
        src: `/img/marketing/Video Guantes de carnaza.mp4`,
        label: `Video Cuero (Antiguo)`,
      },
      {
        src: `/img/marketing/Video guantes nitrilfase.mp4`,
        label: `Video Multiflex (Antiguo)`,
      },
      {
        src: `/img/marketing/Banner_pagina_web.mp4`,
        label: `Banner Corporativo`,
      },
      {
        src: `/img/marketing/Catalogo Línea Quimica.mp4`,
        label: `Línea Química`,
      },
    ],
    Be = () => {
      let e = v === `__custom__` ? re.trim() : v;
      if (!e || e === `__select__`) {
        alert(
          `Por favor, seleccione un video válido de la lista o ingrese una ruta personalizada.`,
        );
        return;
      }
      let t = ae.trim();
      if (!t) {
        let n = ze.find((t) => t.src === e);
        n && (t = n.label);
      }
      if (!t) {
        alert(
          `Por favor, ingrese una etiqueta para el video (ej: Calzado Deportivo 360°).`,
        );
        return;
      }
      let n = JSON.parse(JSON.stringify(p));
      (n[h] || (n[h] = { videos: [], descriptions: [] }),
        n[h].videos.push({ src: e, label: t }),
        m(n),
        y(`__select__`),
        ie(``),
        oe(``));
    },
    Ve = (e, t) => {
      let n = JSON.parse(JSON.stringify(p));
      (n[e].videos.splice(t, 1), u >= n[e].videos.length && d(0), m(n));
    },
    He = () => {
      if (!se.trim()) return;
      let e = JSON.parse(JSON.stringify(p));
      e[h] || (e[h] = { videos: [], descriptions: [] });
      let t = e[h].videos || [];
      (t.length > 0 && u < t.length
        ? (t[u].descriptions || (t[u].descriptions = []),
          t[u].descriptions.push(se.trim()))
        : (e[h].descriptions || (e[h].descriptions = []),
          e[h].descriptions.push(se.trim())),
        m(e),
        ce(``));
    },
    Ue = (e, t) => {
      let n = JSON.parse(JSON.stringify(p)),
        r = n[e]?.videos || [];
      (r.length > 0 && u < r.length && r[u].descriptions
        ? r[u].descriptions.splice(t, 1)
        : n[e].descriptions.splice(t, 1),
        m(n));
    },
    We = (e, t) => {
      let n = JSON.parse(JSON.stringify(p)),
        r = n[e]?.videos || [];
      (r.length > 0 && u < r.length && r[u].descriptions
        ? (r[u].descriptions[t] = T)
        : (n[e].descriptions[t] = T),
        m(n),
        ue(null),
        E(``));
    },
    Ge = () => {
      window.confirm(
        `¿Restablecer todos los videos y especificaciones a los valores originales?`,
      ) && m(f);
    },
    [O, k] = (0, _.useState)(() => {
      // Clean legacy catalog versions from localStorage to avoid taxonomy mismatch or stale missing images
      try {
        ['alacor_catalog_v1', 'alacor_catalog_v2', 'alacor_catalog_v3', 'alacor_catalog_v2026_ssot', 'alacor_catalog_v2026_ssot_v2'].forEach(k => localStorage.removeItem(k));
      } catch (err) {}

      const cleanCatalogData = (source) => {
        let n = {};
        Object.keys(source).forEach((catKey) => {
          const cat = source[catKey];
          if (cat) {
            n[catKey] = { ...cat };
            if (cat.sublines) {
              const subMerged = {};
              Object.keys(cat.sublines).forEach((subKey) => {
                const sub = cat.sublines[subKey];
                if (sub) {
                  const cleanProds = (sub.products || []).filter(
                    (p) => hasValidImage(p) && p.isPublished !== false && p.is_published !== false
                  );
                  subMerged[subKey] = { ...sub, products: cleanProds };
                }
              });
              n[catKey].sublines = subMerged;
            }
          }
        });

        const segInd = n['SEGURIDAD INDUSTRIAL'] || n.seguridad_industrial || S['SEGURIDAD INDUSTRIAL'] || S.seguridad_industrial;
        const alt = n['TRABAJO SEGURO EN ALTURAS'] || n.trabajo_en_alturas || S['TRABAJO SEGURO EN ALTURAS'] || S.trabajo_en_alturas;
        const calz = n['CALZADO INDUSTRIAL'] || n.calzado_industrial || S['CALZADO INDUSTRIAL'] || S.calzado_industrial;
        const bloq = n['BLOQUEO Y ETIQUETADO'] || n.bloqueo_y_etiquetado || n['SEGURIDAD'] || n.seguridad || S['BLOQUEO Y ETIQUETADO'] || S['SEGURIDAD'];
        const sen = n['SEÑALIZACIÓN'] || n.senalizacion || S['SEÑALIZACIÓN'] || S.senalizacion;
        const dot = n['DOTACIÓN'] || n.dotacion || S['DOTACIÓN'] || S.dotacion;

        Object.assign(n, {
          seguridad_industrial: segInd,
          trabajo_en_alturas: alt,
          calzado_industrial: calz,
          bloqueo_y_etiquetado: bloq,
          senalizacion: sen,
          dotacion: dot,
          // Aliases de compatibilidad
          SEGURIDAD: bloq,
          seguridad: bloq,
          loto: bloq,
          cabeza: segInd,
          facial: segInd,
          visual: segInd,
          auditiva: segInd,
          respiratoria: segInd,
          manual: segInd,
          corporal: segInd,
          alturas: alt,
          calzado: calz,
          emergencias: segInd,
          otros: segInd
        });
        return n;
      };

      const initialClean = cleanCatalogData(S);
      return initialClean;
    }),
    [A, Ke] = (0, _.useState)(null),
    [qe, Je] = (0, _.useState)(null),
    [Ye, Xe] = (0, _.useState)(null),
    [isPortalModalOpen, setIsPortalModalOpen] = (0, _.useState)(!1),
    [catalogSearchQuery, setCatalogSearchQuery] = (0, _.useState)(``),
    [searchCategoryFilter, setSearchCategoryFilter] = (0, _.useState)(`ALL`),
    [selectedBrandFilter, setSelectedBrandFilter] = (0, _.useState)(`ALL`),
    [showLeadCaptureModal, setShowLeadCaptureModal] = (0, _.useState)(!1),
    [pendingItemAdded, setPendingItemAdded] = (0, _.useState)(null),
    [addedToastProduct, setAddedToastProduct] = (0, _.useState)(null),
    [highlightedFamilyId, setHighlightedFamilyId] = (0, _.useState)(null),
    [isHeaderSearchFocused, setIsHeaderSearchFocused] = (0, _.useState)(!1);

  // --- SEO DINÁMICO: Sincronización de Title, Meta Description y OpenGraph ---
  (0, _.useEffect)(() => {
    let title = "ALACOR S.A.S. | Equipos de Protección Personal EPP y Trabajo Seguro en Alturas en Colombia";
    let desc = "ALACOR S.A.S. es distribuidor mayorista líder de Equipos de Protección Personal (EPP), arneses certificados para trabajo en alturas (Res. 4272/2021), calzado de seguridad dieléctrico y sistemas de bloqueo LOTO en Colombia. Cotizaciones corporativas B2B inmediatas con fichas técnicas y facturación electrónica DIAN.";

    if (A && O && O[A]) {
      const catObj = O[A];
      const catTitle = catObj.title || A;
      if (qe && catObj.sublines && catObj.sublines[qe]) {
        const subTitle = catObj.sublines[qe].title || qe;
        title = `${subTitle} - ${catTitle} | ALACOR S.A.S.`;
        desc = `Catálogo mayorista de ${subTitle} en ${catTitle}. Equipos certificados con fichas técnicas oficiales y normas vigentes en Colombia. Cotiza formalmente con ALACOR S.A.S.`;
      } else {
        title = `${catTitle} - Equipos de Protección Certificados | ALACOR S.A.S. Colombia`;
        desc = `${catObj.description || `Distribuidor oficial de ${catTitle} en Colombia`}. Cumplimiento normativo ANSI, ASTM, EN ISO y Resolución 4272. Cotización B2B inmediata.`;
      }
    } else if (window.location.hash.includes('/sgsst')) {
      title = "Gestión Integral SG-SST y Consultoría de Seguridad | ALACOR S.A.S.";
      desc = "Implementación y auditoría de Sistemas de Gestión de Seguridad y Salud en el Trabajo (SG-SST) bajo Decreto 1072 y Res. 0312 en Colombia.";
    }

    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', desc);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', desc);
  }, [A, qe, O]);


  (0, _.useEffect)(() => {
    const syncCatalog = () => {
      fetchLiveCatalog(S).then(updatedCatalog => {
        if (updatedCatalog) {
          k(updatedCatalog);
        }
      }).catch(() => {});
    };

    syncCatalog();
    const interval = setInterval(syncCatalog, 30000);
    window.addEventListener('focus', syncCatalog);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', syncCatalog);
    };
  }, []);

  // Reset invalid category selections defensively
  (0, _.useEffect)(() => {
    if (A && !O[A]) {
      Ke(null);
      Je(null);
    }
  }, [A, O]);

  let searchResults = (0, _.useMemo)(() => {
    if (!catalogSearchQuery || !catalogSearchQuery.trim()) {
      return { matchedProducts: [], groupedProducts: [], categoryCounts: {} };
    }
    let rawTerms = catalogSearchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
    let allProducts = [];
    Object.keys(O).forEach((catKey) => {
      let category = O[catKey];
      if (category && category.sublines) {
        Object.keys(category.sublines).forEach((subKey) => {
          let subline = category.sublines[subKey];
          if (subline && Array.isArray(subline.products)) {
            subline.products.forEach((prod) => {
              if (hasValidImage(prod) && prod.isPublished !== false && prod.is_published !== false) {
                allProducts.push({
                  ...prod,
                  catKey,
                  subKey,
                  catTitle: category.title,
                  subTitle: subline.title,
                });
              }
            });
          }
        });
      }
    });

    let matched = allProducts.filter((prod) => {
      let searchStr = `${prod.title || ''} ${prod.ref || ''} ${prod.brand || ''} ${prod.standards || ''} ${prod.description || ''} ${prod.catTitle || ''} ${prod.subTitle || ''}`.toLowerCase();
      let matchesTerms = rawTerms.every((term) => searchStr.includes(term));
      let matchesCat = searchCategoryFilter === 'ALL' || prod.catKey === searchCategoryFilter;
      let matchesBrand = selectedBrandFilter === 'ALL' || (prod.brand && prod.brand.toUpperCase().includes(selectedBrandFilter.toUpperCase()));
      return matchesTerms && matchesCat && matchesBrand;
    });

    let counts = {};
    matched.forEach((p) => {
      counts[p.catKey] = (counts[p.catKey] || 0) + 1;
    });

    return { matchedProducts: matched, categoryCounts: counts };
  }, [catalogSearchQuery, searchCategoryFilter, selectedBrandFilter, O]);
  const catalogRef = (0, _.useRef)(O);
  (0, _.useEffect)(() => {
    catalogRef.current = O;
  }, [O]);

  (0, _.useEffect)(() => {
    const handleHash = (isUserAction = false) => {
      const hash = window.location.hash;
      if (!hash || hash === '#/') return;
      const parts = hash.split('/');
      if (parts[1] === 'portafolio') {
        const cat = parts[2] ? decodeURIComponent(parts[2]) : null;
        const sub = parts[3] ? decodeURIComponent(parts[3]) : null;
        const currentCat = catalogRef.current || S;
        if (cat && currentCat && currentCat[cat]) {
          Ke(cat);
          Je(sub && currentCat[cat].sublines && currentCat[cat].sublines[sub] ? sub : null);
        } else if (!cat) {
          Ke(null);
          Je(null);
        }
        if (isUserAction) {
          document.getElementById('catalogo-section')?.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    const onHashChange = () => handleHash(true);
    window.addEventListener('hashchange', onHashChange);
    handleHash(false);

    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  let [openFaqId, setOpenFaqId] = (0, _.useState)('faq_1'),
    [Ze, Qe] = (0, _.useState)(!1),
    [j, $e] = (0, _.useState)(!1),
    [et, tt] = (0, _.useState)(``),
    [nt, rt] = (0, _.useState)(``),
    [it, at] = (0, _.useState)(`seguridad`),
    [ot, st] = (0, _.useState)(`cabeza`),
    [ct, lt] = (0, _.useState)(`STEELPRO®`),
    [ut, dt] = (0, _.useState)(``),
    [ft, pt] = (0, _.useState)(``),
    [mt, ht] = (0, _.useState)(``),
    [gt, _t] = (0, _.useState)(
      `/img/catalogo/Calzado_de_Seguridad_rep_Bota_Acces_Graso__Principal_.png`,
    ),
    [vt, yt] = (0, _.useState)(``),
    [bt, xt] = (0, _.useState)(`Material`),
    [St, Ct] = (0, _.useState)(``),
    [wt, Tt] = (0, _.useState)(`Certificación`),
    [Et, Dt] = (0, _.useState)(``),
    [Ot, kt] = (0, _.useState)(`Características`),
    [At, jt] = (0, _.useState)(``),
    [Mt, Nt] = (0, _.useState)(`Uso Recomendado`),
    [Pt, Ft] = (0, _.useState)(``),
    [It, Lt] = (0, _.useState)(!1),
    [Rt, zt] = (0, _.useState)(``),
    [Bt, Vt] = (0, _.useState)(``),
    [Ht, Ut] = (0, _.useState)(``),
    [Wt, Gt] = (0, _.useState)(`🛡️`),
    [Kt, qt] = (0, _.useState)(``),
    [Jt, Yt] = (0, _.useState)(``),
    [Xt, Zt] = (0, _.useState)(`__new__`),
    [Qt, $t] = (0, _.useState)(``),
    [en, tn] = (0, _.useState)(`seguridad`),
    [nn, rn] = (0, _.useState)(``),
    [an, on] = (0, _.useState)(``),
    [sn, cn] = (0, _.useState)(``),
    [ln, un] = (0, _.useState)(`__new__`),
    [dn, fn] = (0, _.useState)(`seguridad`),
    [pn, mn] = (0, _.useState)(``),
    [hn, gn] = (0, _.useState)(
      () =>
        localStorage.getItem(`alacor_hero_video`) ||
        `/img/marketing/Banner_pagina_web.mp4`,
    ),
    [_n, vn] = (0, _.useState)(
      () =>
        localStorage.getItem(`alacor_hero_image`) ||
        `/img/marketing/hero_alacor_comercial.png`,
    ),
    [yn, bn] = (0, _.useState)(
      () =>
        localStorage.getItem(`alacor_hero_title`) ||
        `SEGURIDAD INDUSTRIAL DE ALTA GAMA`,
    ),
    [xn, Sn] = (0, _.useState)(
      () =>
        localStorage.getItem(`alacor_hero_subtitle`) ||
        `Distribuidor calificado y especializado en Equipos de Protección Personal (EPPs), Trabajo Seguro en Alturas, y Calzado Industrial Dieléctrico Certificado.`,
    ),
    [Cn, wn] = (0, _.useState)(`consejos`),
    [Tn, En] = (0, _.useState)(`all`),
    [Dn, On] = (0, _.useState)(``),
    [kn, An] = (0, _.useState)(!1),
    [jn, Mn] = (0, _.useState)(null),
    [M, Nn] = (0, _.useState)(() => {
      let e = localStorage.getItem(`alacor_cart`);
      return e ? JSON.parse(e) : [];
    }),
    [Pn, Fn] = (0, _.useState)(!1),
    [In, Ln] = (0, _.useState)(!1),
    [Rn, zn] = (0, _.useState)(() => {
      try {
        const raw = localStorage.getItem(`alacor_customer_profile`);
        if (raw) {
          const p = JSON.parse(raw);
          if (p.companyName && p.companyName !== `Persona Natural`) return p.companyName;
        }
      } catch(e) {}
      return ``;
    }),
    [Bn, Vn] = (0, _.useState)(``),
    [Hn, Un] = (0, _.useState)(() => {
      try {
        const raw = localStorage.getItem(`alacor_customer_profile`);
        if (raw) {
          const p = JSON.parse(raw);
          if (p.contactName) return p.contactName;
        }
        const name = localStorage.getItem(`alacor_chat_session_name`);
        if (name && !name.startsWith(`Visitante #`)) return name;
      } catch(e) {}
      return ``;
    }),
    [Wn, Gn] = (0, _.useState)(``),
    [Kn, qn] = (0, _.useState)(``),
    [Jn, Yn] = (0, _.useState)(``),
    [Xn, Zn] = (0, _.useState)(``),
    [Qn, $n] = (0, _.useState)(``),
    [er, tr] = (0, _.useState)(`google`),
    [nr, rr] = (0, _.useState)(``),
    [ir, ar] = (0, _.useState)(!1),
    [or, sr] = (0, _.useState)(!1),
    [isSubmittingQuote, setIsSubmittingQuote] = (0, _.useState)(!1),
    [quoteSuccessData, setQuoteSuccessData] = (0, _.useState)(null),
    [quoteErrorData, setQuoteErrorData] = (0, _.useState)(null),
    [copiedRadicado, setCopiedRadicado] = (0, _.useState)(!1),
    [cr, lr] = (0, _.useState)(`5 + 3`),
    [ur, dr] = (0, _.useState)(8),
    [fr, pr] = (0, _.useState)(``),
    [mr, hr] = (0, _.useState)(!1),
    [gr, setChatSessionId] = (0, _.useState)(() => {
      let e = localStorage.getItem(`alacor_chat_session_id`);
      return (
        e ||
          ((e = `SESS-` + Math.floor(1e3 + Math.random() * 9e3)),
          localStorage.setItem(`alacor_chat_session_id`, e)),
        e
      );
    }),
    [_r, vr] = (0, _.useState)(() => {
      let e = localStorage.getItem(`alacor_chat_session_name`);
      if (e && e !== `Visitante` && !e.startsWith(`Visitante #`)) return e;
      try {
        const profStr = localStorage.getItem(`alacor_customer_profile`);
        if (profStr) {
          const prof = JSON.parse(profStr);
          if (prof.contactName) {
            const formatted = prof.companyName && prof.companyName !== `Persona Natural`
              ? `${prof.contactName} (${prof.companyName})`
              : prof.contactName;
            localStorage.setItem(`alacor_chat_session_name`, formatted);
            return formatted;
          }
        }
      } catch(err) {}
      return e || `Visitante`;
    }),
    [yr, br] = (0, _.useState)(
      () => localStorage.getItem(`alacor_chat_human_transferred`) === `true`,
    ),
    [xr, Sr] = (0, _.useState)(
      `¡Hola! Bienvenido al chat de soporte técnico de ALACOR. ¿En qué podemos ayudarte hoy?`,
    ),
    [Cr, wr] = (0, _.useState)(!1),
    [Tr, Er] = (0, _.useState)(!1),
    [Dr, Or] = (0, _.useState)(!1),
    [kr, Ar] = (0, _.useState)(``),
    [jr, Mr] = (0, _.useState)(``),
    [Nr, Pr] = (0, _.useState)(``),
    [Fr, Ir] = (0, _.useState)(``),
    [Lr, Rr] = (0, _.useState)([]),
    [zr, Br] = (0, _.useState)(``),
    [Vr, Hr] = (0, _.useState)(null),
    [Ur, Wr] = (0, _.useState)([]),
    [trainedExamples, setTrainedExamples] = (0, _.useState)([]),
    [trainedSearch, setTrainedSearch] = (0, _.useState)(``),
    [trainedCatFilter, setTrainedCatFilter] = (0, _.useState)(`ALL`),
    [aiConfigData, setAiConfigData] = (0, _.useState)({ activeModel: `fallback_chain`, providers: [] }),
    [editingLlmProvider, setEditingLlmProvider] = (0, _.useState)(null),
    [isAddingLlm, setIsAddingLlm] = (0, _.useState)(!1),
    [llmForm, setLlmForm] = (0, _.useState)({ name: ``, provider: `GROQ`, model: `openai/gpt-oss-120b`, apiKey: ``, priority: 1, temperature: 0.5, enabled: !0 }),
    [llmTestResults, setLlmTestResults] = (0, _.useState)({}),
    [testingLlmId, setTestingLlmId] = (0, _.useState)(null),
    [aiConfigSaveMsg, setAiConfigSaveMsg] = (0, _.useState)(``),
    [showApiKeyMap, setShowApiKeyMap] = (0, _.useState)({}),
    [cartToast, setCartToast] = (0, _.useState)(null),
    [handoverForm, setHandoverForm] = (0, _.useState)({ name: ``, phone: ``, email: ``, company: ``, city: `` }),
    [showHandoverFormIdx, setShowHandoverFormIdx] = (0, _.useState)(null),
    [handoverSubmitting, setHandoverSubmitting] = (0, _.useState)(!1),
    [handoverCompleted, setHandoverCompleted] = (0, _.useState)(!1),
    [isChatLoading, setIsChatLoading] = (0, _.useState)(!1),
    [isChatBanned, setIsChatBanned] = (0, _.useState)(!1),
    [Gr, Kr] = (0, _.useState)(``),
    [qr, Jr] = (0, _.useState)(``),
    [Yr, Xr] = (0, _.useState)(`general`),
    [Zr, Qr] = (0, _.useState)(null),
    [$r, ei] = (0, _.useState)(``),
    [ti, ni] = (0, _.useState)(`trained`),
    [ri, ii] = (0, _.useState)({
      active: !1,
      step: 0,
      data: {},
      productContext: ``,
    }),
    [ai, oi] = (0, _.useState)(``),
    [si, ci] = (0, _.useState)(1),
    [li, ui] = (0, _.useState)(!0),
    [di, fi] = (0, _.useState)(null),
    [pi, mi] = (0, _.useState)(``),
    [hi, gi] = (0, _.useState)(``),
    [_i, vi] = (0, _.useState)(1),
    [yi, bi] = (0, _.useState)(!0),
    [xi, N] = (0, _.useState)([
      {
        sender: `assistant`,
        text: `¡Hola! Bienvenido al canal de asesoría técnica de ALACOR S.A.S. ¿Cómo podemos orientarte hoy con nuestras líneas de seguridad y EPP?`,
        customized: !0,
      },
    ]),
    [Si, Ci] = (0, _.useState)(``);
  ((0, _.useEffect)(() => {
    let e = setTimeout(() => {
      (r.current?.scrollIntoView({ behavior: `smooth`, block: `end` }),
        i.current && (i.current.scrollTop = i.current.scrollHeight));
    }, 100);
    return () => clearTimeout(e);
  }, [xi, mr]),
    (0, _.useEffect)(() => {
      fetch(`/api/chat/config`)
        .then((e) => e.json())
        .then((e) => {
          e &&
            (wr(e.enabled),
            Er((e.accounts && e.accounts.some((e) => e.enabled)) || !!e.chatId),
            e.welcomeMessage &&
              (Sr(e.welcomeMessage),
              N((t) =>
                t.length === 1 &&
                t[0].sender === `assistant` &&
                !t[0].customized
                  ? [
                      {
                        sender: `assistant`,
                        text: e.welcomeMessage,
                        customized: !0,
                      },
                    ]
                  : t,
              )));
        })
        .catch((e) => console.error(`Error fetching chat config:`, e));
    }, []),
    (0, _.useEffect)(() => {
      if (j) {
        fetch(`/api/chat/config?password=alacor2026`)
          .then((e) => e.json())
          .then((e) => {
            e &&
              (Or(e.enabled),
              Ar(e.welcomeMessage),
              Mr(e.botToken || ``),
              Pr(e.chatId || ``),
              Rr(e.accounts || []),
              Er(
                (e.accounts && e.accounts.some((e) => e.enabled)) || !!e.chatId,
              ));
          })
          .catch((e) => console.error(`Error fetching admin chat config:`, e));
        fetch(`/api/chat/ml-stats`)
          .then((e) => e.json())
          .then((e) => Hr(e))
          .catch(() => {});
        fetch(`/api/chat/unmatched`)
          .then((e) => e.json())
          .then((e) => Wr(e))
          .catch(() => {});
        fetch(`/api/chat/training-examples`)
          .then((e) => e.json())
          .then((e) => setTrainedExamples(Array.isArray(e) ? e : []))
          .catch(() => {});
        fetch(`/api/config/ai?password=alacor2026`)
          .then((e) => e.json())
          .then((data) => {
            if (data && Array.isArray(data.providers)) {
              setAiConfigData(data);
            }
          })
          .catch((e) => console.error(`Error fetching AI config:`, e));
      }
    }, [j]),
    (0, _.useEffect)(() => {
      const handleProfile = (e) => {
        if (e.detail && e.detail.contactName) {
          const formatted = e.detail.companyName && e.detail.companyName !== `Persona Natural`
            ? `${e.detail.contactName} (${e.detail.companyName})`
            : e.detail.contactName;
          vr(formatted);
          localStorage.setItem(`alacor_chat_session_name`, formatted);
        }
      };
      window.addEventListener(`alacor_profile_updated`, handleProfile);
      return () => window.removeEventListener(`alacor_profile_updated`, handleProfile);
    }, []),
    (0, _.useEffect)(() => {
      if (!mr) return;
      let e;
      try {
        ((e = new EventSource(`/api/chat/stream?sessionId=${gr}`)),
          (e.onmessage = (e) => {
            try {
              let t = JSON.parse(e.data);
              if (t.type === 'history') {
                if (Array.isArray(t.history) && t.history.length > 0) {
                  N((prev) => {
                    const welcome = prev[0];
                    const cleanHistory = t.history
                      .filter((h) => !h.text.startsWith('[BLOCKED]') && !h.text.startsWith('[ML]'))
                      .map((h) => ({
                        sender: h.sender === 'user' ? 'user' : 'assistant',
                        text: h.text
                          .replace(/^\[Bot\]:\s*/, '')
                          .replace(/^\[Asesor\]:\s*/, '')
                          .replace(/\[SET_PROFILE:[^\]]+\]/gi, '')
                          .replace(/\[TRANSFERIR_ASESOR\]/gi, '')
                          .replace(/\[IR_DIAGNOSTICO_0312\]/gi, '')
                          .trim(),
                      }))
                      .filter((h) => h.text.length > 0);
                    return welcome ? [welcome, ...cleanHistory] : cleanHistory;
                  });
                }
              } else if (t.banned === true) {
                try {
                  localStorage.setItem('alacor_chat_banned_until', String(Date.now() + 15 * 60 * 1000));
                } catch (e) {}
                setIsChatBanned(true);
                if (t.text || t.reply) {
                  const replyText = (t.text || t.reply)
                    .replace(/\[SET_PROFILE:[^\]]+\]/gi, '')
                    .replace(/\[TRANSFERIR_ASESOR\]/gi, '')
                    .trim();
                  N((prev) => [...prev, { sender: 'assistant', text: replyText }]);
                }
              } else if (t.text && t.sender !== 'user') {
                setIsChatLoading(false);
                N((prev) => {
                  const lastMsg = prev[prev.length - 1];
                  const cleanText = t.text
                    .replace(/^\[Bot\]:\s*/, '')
                    .replace(/^\[Asesor\]:\s*/, '')
                    .replace(/\[SET_PROFILE:[^\]]+\]/gi, '')
                    .replace(/\[TRANSFERIR_ASESOR\]/gi, '')
                    .replace(/\[IR_DIAGNOSTICO_0312\]/gi, '')
                    .trim();
                  if (!cleanText) return prev;
                  if (lastMsg && lastMsg.sender === 'assistant' && lastMsg.text === cleanText) {
                    return prev;
                  }
                  return [...prev, { sender: 'assistant', text: cleanText }];
                });
              }
            } catch (e) {
              console.error(`Error parsing SSE message:`, e);
            }
          }),
          (e.onerror = (e) => {
            console.error(`SSE Connection Error, retrying...`, e);
          }));
      } catch (e) {
        console.error(`Failed to create EventSource:`, e);
      }
      return () => {
        e && e.close();
      };
    }, [mr, gr]));
  let wi = () => {
      let e = Math.floor(Math.random() * 9) + 2,
        t = Math.floor(Math.random() * 9) + 2;
      (lr(`${e} + ${t}`), dr(e + t), pr(``));
    },
    [Ti, Ei] = (0, _.useState)(() => {
      let e = localStorage.getItem(`alacor_hide_no_img`);
      return e ? JSON.parse(e) : !0;
    }),
    [Di, Oi] = (0, _.useState)(() => {
      let e = localStorage.getItem(`alacor_hide_incomplete`);
      return e ? JSON.parse(e) : !0;
    }),
    ki = (e) => hasValidImage(e),
    Ai = (e) =>
      !(
        !e.title ||
        e.title.trim() === `` ||
        !e.description ||
        e.description.trim().length < 10 ||
        !e.brand ||
        e.brand.trim() === `` ||
        !e.ref ||
        e.ref.trim() === ``
      ),
    ji = (e, t, n) => {
      let r = JSON.parse(JSON.stringify(O));
      ((r[e].sublines[t].products = r[e].sublines[t].products.map((e) =>
        e.id === n ? { ...e, isVisible: e.isVisible === !1 } : e,
      )),
        k(r));
    };
  ((0, _.useEffect)(() => {
    localStorage.setItem(`alacor_hide_no_img`, JSON.stringify(Ti));
  }, [Ti]),
    (0, _.useEffect)(() => {
      localStorage.setItem(`alacor_hide_incomplete`, JSON.stringify(Di));
    }, [Di]));
  let [Mi, Ni] = (0, _.useState)(!1);
  ((0, _.useEffect)(() => {
    let e = [
      [`alacor_catalog_v3`, `alacor_catalog_v3_draft`],
      [`alacor_demo_chapters_v4`, `alacor_demo_chapters_v4_draft`],
      [`alacor_category_media_v4`, `alacor_category_media_v4_draft`],
      [`alacor_hero_video`, `alacor_hero_video_draft`],
      [`alacor_hero_image`, `alacor_hero_image_draft`],
      [`alacor_hero_title`, `alacor_hero_title_draft`],
      [`alacor_hero_subtitle`, `alacor_hero_subtitle_draft`],
    ];
    if (j) {
      e.forEach(([e, t]) => {
        if (localStorage.getItem(t) === null) {
          let n = localStorage.getItem(e);
          n !== null && localStorage.setItem(t, n);
        }
      });
      let t = localStorage.getItem(`alacor_catalog_v3_draft`);
      if (t)
        try {
          k(ee(JSON.parse(t)));
        } catch (e) {
          console.error(e);
        }
      let n = localStorage.getItem(`alacor_demo_chapters_v4_draft`);
      if (n)
        try {
          o(JSON.parse(n));
        } catch (e) {
          console.error(e);
        }
      let r = localStorage.getItem(`alacor_category_media_v4_draft`);
      if (r)
        try {
          m(JSON.parse(r));
        } catch (e) {
          console.error(e);
        }
      (gn(
        localStorage.getItem(`alacor_hero_video_draft`) ||
          localStorage.getItem(`alacor_hero_video`) ||
          `/img/marketing/Banner_pagina_web.mp4`,
      ),
        vn(
          localStorage.getItem(`alacor_hero_image_draft`) ||
            localStorage.getItem(`alacor_hero_image`) ||
            `/img/marketing/hero_alacor_comercial.png`,
        ),
        bn(
          localStorage.getItem(`alacor_hero_title_draft`) ||
            localStorage.getItem(`alacor_hero_title`) ||
            `SEGURIDAD INDUSTRIAL DE ALTA GAMA`,
        ),
        Sn(
          localStorage.getItem(`alacor_hero_subtitle_draft`) ||
            localStorage.getItem(`alacor_hero_subtitle`) ||
            `Distribuidor calificado y especializado en Equipos de Protección Personal (EPPs), Trabajo Seguro en Alturas, y Calzado Industrial Dieléctrico Certificado.`,
        ));
    } else {
      let e = localStorage.getItem(`alacor_catalog_v3`);
      if (e)
        try {
          k(ee(JSON.parse(e)));
        } catch (e) {
          console.error(e);
        }
      else k(S);
      let t = localStorage.getItem(`alacor_demo_chapters_v4`);
      if (t)
        try {
          o(JSON.parse(t));
        } catch (e) {
          console.error(e);
        }
      else o(ne);
      let n = localStorage.getItem(`alacor_category_media_v4`);
      if (n)
        try {
          m(JSON.parse(n));
        } catch (e) {
          console.error(e);
        }
      else m(f);
      (gn(
        localStorage.getItem(`alacor_hero_video`) ||
          `/img/marketing/Banner_pagina_web.mp4`,
      ),
        vn(
          localStorage.getItem(`alacor_hero_image`) ||
            `/img/marketing/hero_alacor_comercial.png`,
        ),
        bn(
          localStorage.getItem(`alacor_hero_title`) ||
            `SEGURIDAD INDUSTRIAL DE ALTA GAMA`,
        ),
        Sn(
          localStorage.getItem(`alacor_hero_subtitle`) ||
            `Distribuidor calificado y especializado en Equipos de Protección Personal (EPPs), Trabajo Seguro en Alturas, y Calzado Industrial Dieléctrico Certificado.`,
        ));
    }
  }, [j]),
    (0, _.useEffect)(() => {
      let e = j ? `alacor_catalog_v3_draft` : `alacor_catalog_v3`;
    // Catalog O not persisted to localStorage (avoids QuotaExceededError)
    }, [O, j]),
    (0, _.useEffect)(() => {
      let e = j ? `alacor_demo_chapters_v4_draft` : `alacor_demo_chapters_v4`;
      localStorage.setItem(e, JSON.stringify(a));
    }, [a, j]),
    (0, _.useEffect)(() => {
      let e = j ? `alacor_category_media_v4_draft` : `alacor_category_media_v4`;
      localStorage.setItem(e, JSON.stringify(p));
    }, [p, j]),
    (0, _.useEffect)(() => {
      let e = j ? `alacor_hero_video_draft` : `alacor_hero_video`;
      localStorage.setItem(e, hn);
    }, [hn, j]),
    (0, _.useEffect)(() => {
      let e = j ? `alacor_hero_image_draft` : `alacor_hero_image`;
      localStorage.setItem(e, _n);
    }, [_n, j]),
    (0, _.useEffect)(() => {
      let e = j ? `alacor_hero_title_draft` : `alacor_hero_title`;
      localStorage.setItem(e, yn);
    }, [yn, j]),
    (0, _.useEffect)(() => {
      let e = j ? `alacor_hero_subtitle_draft` : `alacor_hero_subtitle`;
      localStorage.setItem(e, xn);
    }, [xn, j]));
  let Pi = () => {
      for (let [e, t] of [
        [`alacor_catalog_v3`, `alacor_catalog_v3_draft`],
        [`alacor_demo_chapters_v4`, `alacor_demo_chapters_v4_draft`],
        [`alacor_category_media_v4`, `alacor_category_media_v4_draft`],
        [`alacor_hero_video`, `alacor_hero_video_draft`],
        [`alacor_hero_image`, `alacor_hero_image_draft`],
        [`alacor_hero_title`, `alacor_hero_title_draft`],
        [`alacor_hero_subtitle`, `alacor_hero_subtitle_draft`],
      ]) {
        let n = localStorage.getItem(e),
          r = localStorage.getItem(t);
        if (r !== null && n !== r) return !0;
      }
      return !1;
    },
    Fi = () => {
      ([
        [`alacor_catalog_v3_draft`, `alacor_catalog_v3`],
        [`alacor_demo_chapters_v4_draft`, `alacor_demo_chapters_v4`],
        [`alacor_category_media_v4_draft`, `alacor_category_media_v4`],
        [`alacor_hero_video_draft`, `alacor_hero_video`],
        [`alacor_hero_image_draft`, `alacor_hero_image`],
        [`alacor_hero_title_draft`, `alacor_hero_title`],
        [`alacor_hero_subtitle_draft`, `alacor_hero_subtitle`],
      ].forEach(([e, t]) => {
        let n = localStorage.getItem(e);
        n !== null && localStorage.setItem(t, n);
      }),
        Ni(!1),
        Qe(!0),
        alert(
          `¡Cambios publicados con éxito en producción para todos los usuarios!`,
        ));
    },
    Ii = () => {
      if (
        window.confirm(
          `¿Estás seguro de que deseas descartar todos los cambios realizados en el borrador? Se restaurará la versión actual de producción.`,
        )
      ) {
        [
          [`alacor_catalog_v3`, `alacor_catalog_v3_draft`],
          [`alacor_demo_chapters_v4`, `alacor_demo_chapters_v4_draft`],
          [`alacor_category_media_v4`, `alacor_category_media_v4_draft`],
          [`alacor_hero_video`, `alacor_hero_video_draft`],
          [`alacor_hero_image`, `alacor_hero_image_draft`],
          [`alacor_hero_title`, `alacor_hero_title_draft`],
          [`alacor_hero_subtitle`, `alacor_hero_subtitle_draft`],
        ].forEach(([e, t]) => {
          let n = localStorage.getItem(e);
          n === null ? localStorage.removeItem(t) : localStorage.setItem(t, n);
        });
        let e = localStorage.getItem(`alacor_catalog_v3`);
        if (e)
          try {
            k(JSON.parse(e));
          } catch (e) {
            console.error(e);
          }
        else k(S);
        let t = localStorage.getItem(`alacor_demo_chapters_v4`);
        if (t)
          try {
            o(JSON.parse(t));
          } catch (e) {
            console.error(e);
          }
        else o(ne);
        let n = localStorage.getItem(`alacor_category_media_v4`);
        if (n)
          try {
            m(JSON.parse(n));
          } catch (e) {
            console.error(e);
          }
        else m(f);
        (gn(
          localStorage.getItem(`alacor_hero_video`) ||
            `/img/marketing/Banner_pagina_web.mp4`,
        ),
          vn(
            localStorage.getItem(`alacor_hero_image`) ||
              `/img/marketing/hero_alacor_comercial.png`,
          ),
          bn(
            localStorage.getItem(`alacor_hero_title`) ||
              `SEGURIDAD INDUSTRIAL DE ALTA GAMA`,
          ),
          Sn(
            localStorage.getItem(`alacor_hero_subtitle`) ||
              `Distribuidor calificado y especializado en Equipos de Protección Personal (EPPs), Trabajo Seguro en Alturas, y Calzado Industrial Dieléctrico Certificado.`,
          ),
          Ni(!1),
          Qe(!0),
          alert(
            `Cambios descartados. Borrador sincronizado con la versión de producción.`,
          ));
      }
    };
  ((0, _.useEffect)(() => {
    localStorage.setItem(`alacor_cart`, JSON.stringify(M));
  }, [M]),
        (0, _.useEffect)(() => {
      if (O && O[it] && O[it].sublines) {
        let e = Object.keys(O[it].sublines)[0];
        if (e && ot !== e) {
          st(e);
        }
      }
    }, [it, O, ot]));
  let Li = (e) => {
      (e.preventDefault(),
        et === `alacor2026`
          ? ($e(!0), rt(``))
          : rt(`Contraseña incorrecta. Inténtelo de nuevo.`));
    },
    Ri = (e, openDrawer = false) => {
      if (!e) return;
      const targetSku = e.ref || e.sku;
      if (!targetSku) return;
      const addedQty = e.quantity || 1;
      const prodName = e.title || e.name || 'Producto';
      Nn((t) =>
        t.find((item) => item.sku === targetSku)
          ? t.map((item) =>
              item.sku === targetSku ? { ...item, quantity: item.quantity + addedQty } : item,
            )
          : [
              ...t,
              {
                sku: targetSku,
                name: prodName,
                brand: e.brand || 'STEELPRO',
                price: e.price || null,
                currency: e.currency || `COP`,
                img: e.img || '',
                quantity: addedQty,
              },
            ],
      );
      if (openDrawer || e._openCart) {
        Fn(!0);
      } else {
        setCartToast({ name: prodName, qty: addedQty });
        setTimeout(() => setCartToast(null), 3500);
      }
    },
    P = (e, t) => {
      Nn((n) =>
        n
          .map((n) => {
            if (n.sku === e) {
              let e = n.quantity + t;
              return e > 0 ? { ...n, quantity: e } : null;
            }
            return n;
          })
          .filter(Boolean),
      );
    },
    F = (e) => {
      Nn((t) => t.filter((t) => t.sku !== e));
    },
    zi = () => {
      M.length !== 0 && (Ln(!0), wi());
    },
    Bi = async (e) => {
      if ((e && e.preventDefault && e.preventDefault(), !Hn.trim())) {
        alert(`Por favor ingresa el nombre de contacto.`);
        return;
      }
      if (!Wn.trim() || !Wn.includes(`@`)) {
        alert(`Por favor ingresa un correo electrónico válido.`);
        return;
      }
      if (!Kn.trim()) {
        alert(`Por favor ingresa un número de teléfono.`);
        return;
      }
      if (!ir) {
        alert(
          `Debe aceptar la Política de Tratamiento de Datos Personales para cotizar.`,
        );
        return;
      }
      if (parseInt(fr) !== ur) {
        (alert(`El resultado del Captcha de seguridad es incorrecto.`), wi());
        return;
      }
      if (isSubmittingQuote) return;

      const formattedNit = Bn.trim() ? `${Bn.trim()}${calculateDIANDV(Bn) !== '' ? '-' + calculateDIANDV(Bn) : ''}` : '';

      let waFallbackText = `Hola ALACOR S.A.S., deseo solicitar una cotización formal. Aquí están mis datos:\n\n`;
      waFallbackText += `🏢 DATOS DEL CLIENTE / EMPRESA:\n`;
      Rn.trim() && (waFallbackText += `- Razón Social: ${Rn.trim()}\n`);
      formattedNit && (waFallbackText += `- NIT: ${formattedNit}\n`);
      waFallbackText += `- Contacto: ${Hn.trim()}\n`;
      waFallbackText += `- Email: ${Wn.trim()}\n`;
      waFallbackText += `- Teléfono: ${Kn.trim()}\n\n`;
      if (Jn.trim() || Xn.trim() || Qn.trim()) {
        waFallbackText += `🚚 DATOS DE LOGÍSTICA & FACTURACIÓN (OPCIONALES):\n`;
        Jn.trim() && (waFallbackText += `- Ciudad/Depto: ${Jn.trim()}\n`);
        Xn.trim() && (waFallbackText += `- Dirección de Entrega: ${Xn.trim()}\n`);
        Qn.trim() && (waFallbackText += `- Correo Facturación Electrónica: ${Qn.trim()}\n\n`);
      }
      waFallbackText += `📢 INFORMACIÓN COMERCIAL:\n`;
      waFallbackText += `- Cómo nos conoció: ${{ google: `Google / Buscador`, redes: `Redes Sociales`, recomendado: `Recomendado por colega`, correo: `Correo electrónico / Campaña`, otro: `Otro medio` }[er] || er}\n\n`;
      if (nr.trim()) {
        waFallbackText += `📝 REQUERIMIENTOS ESPECIALES / NOTAS:\n`;
        waFallbackText += `${nr.trim()}\n\n`;
      }
      waFallbackText += `🛒 PRODUCTOS SOLICITADOS:\n`;
      M.forEach((item) => {
        let n = ``;
        waFallbackText += `- ${item.quantity}x ${item.name} (REF: ${item.sku}) [${item.brand}]${n}\n`;
      });
      waFallbackText += `\nAcepto la Política de Tratamiento de Datos Personales (Ley 1581 de 2012).`;

      setIsSubmittingQuote(true);
      try {
        const result = await submitQuoteRequest({
          client: {
            companyName: Rn || null,
            nit: formattedNit || 'NATURAL',
            contactName: Hn,
            email: Wn,
            phone: Kn,
            city: Jn || null,
            address: Xn || null,
            billingEmail: Qn || null,
            howFound: er
          },
          items: M,
          notes: nr
        });

        setIsSubmittingQuote(false);

        if (result.success) {
          setQuoteSuccessData({
            requestNumber: result.requestNumber,
            client: {
              companyName: Rn || null,
              nit: formattedNit || null,
              contactName: Hn,
              email: Wn,
              phone: Kn,
              city: Jn || null,
              address: Xn || null,
              billingEmail: Qn || null
            },
            items: [...M],
            totalRefs: M.length,
            totalUnits: M.reduce((acc, curr) => acc + (curr.quantity || 1), 0),
            notes: nr || null
          });
          Nn([]);
          Ln(!1);
          Fn(!1);
          zn(``);
          Vn(``);
          Un(``);
          Gn(``);
          qn(``);
          Yn(``);
          Zn(``);
          $n(``);
          tr(`google`);
          rr(``);
          ar(!1);
          pr(``);
        } else {
          setQuoteErrorData({
            error: result.error || `No fue posible radicar la solicitud en Coralis CRM.`,
            waFallbackText
          });
        }
      } catch (err) {
        setIsSubmittingQuote(false);
        setQuoteErrorData({
          error: `Error de red o conexión al servidor de Coralis CRM.`,
          waFallbackText
        });
      }
    },
    Vi = (e, t) => {
      let n = [...xi, { sender: `user`, text: t }];
      (N(n),
        fetch(`/api/chat/send`, {
          method: `POST`,
          headers: { "Content-Type": `application/json` },
          body: JSON.stringify({
            sessionId: gr,
            text: `[Selección de Menú]: ${t}`,
            userName: _r,
          }),
        }).catch((e) => console.error(e)),
        setTimeout(() => {
          let t = ``,
            r = null;
          if (e === `restart_chat`) {
            Hi();
            return;
          }
          if (e === `menu_principal`)
            ((t = `¿En qué te puedo ayudar hoy?`),
              (r = [
                { id: `catalogo`, label: `🔍 Consultar Catálogo` },
                { id: `asesoria`, label: `🧗 Asesoría de EPP por Actividad` },
                { id: `carrito`, label: `🛒 Consultar mi Cotización` },
              ]));
          else if (e === `catalogo`)
            ((t = `¿Sobre cuál de nuestras líneas de producto deseas consultar?`),
              (r = [
                { id: `cat_cascos`, label: `🛡️ Cascos de Seguridad` },
                {
                  id: `cat_alturas`,
                  label: `🧗 Equipos de Trabajo en Alturas`,
                },
                {
                  id: `cat_calzado`,
                  label: `🥾 Calzado de Seguridad Dieléctrico`,
                },
                { id: `cat_guantes`, label: `🧤 Guantes y Protección Manual` },
                { id: `cat_facial`, label: `🥽 Protección Visual y Facial` },
                { id: `menu_principal`, label: `⬅️ Volver al Menú Principal` },
              ]));
          else if (e === `asesoria`)
            ((t = `Seleccione una actividad de riesgo para ver el equipamiento técnico obligatorio recomendado:`),
              (r = [
                { id: `trade_alturas_EPP`, label: `🧗 Trabajo en Alturas` },
                { id: `trade_soldadura`, label: `🔥 Soldadura y Corte` },
                { id: `trade_amoladora`, label: `⚙️ Uso de Amoladoras` },
                { id: `trade_electrico`, label: `⚡ Mantenimiento Eléctrico` },
                { id: `trade_quimico`, label: `🧪 Manejo de Químicos` },
                { id: `menu_principal`, label: `⬅️ Volver al Menú Principal` },
              ]));
          else if (e === `carrito`)
            ((t = `Tienes ${M.length} productos agregados a tu solicitud de cotización. ${M.length > 0 ? `¿Deseas solicitar cotización formal de estos elementos?` : `¿Te interesa consultar nuestro catálogo de productos?`}`),
              (r =
                M.length > 0
                  ? [
                      {
                        id: `checkout_cotizar`,
                        label: `🚀 Sí, Enviar mi Lista de Cotización`,
                      },
                      {
                        id: `menu_principal`,
                        label: `⬅️ Volver al Menú Principal`,
                      },
                    ]
                  : [
                      { id: `catalogo`, label: `🔍 Consultar Catálogo` },
                      {
                        id: `menu_principal`,
                        label: `⬅️ Volver al Menú Principal`,
                      },
                    ]));
          else if (e === `humano`)
            Tr
              ? ((t = `Te estoy conectando con un asesor técnico de nuestro equipo comercial. La conexión tomará entre 2 y 3 minutos, por favor permanece en línea.`),
                br(!0),
                localStorage.setItem(`alacor_chat_human_transferred`, `true`),
                fetch(`/api/chat/transfer`, {
                  method: `POST`,
                  headers: { "Content-Type": `application/json` },
                  body: JSON.stringify({
                    sessionId: gr,
                    userName: _r,
                    history: n,
                  }),
                }).catch((e) => console.error(e)))
              : ((t = `Lo sentimos, en este momento no hay asesores disponibles. Por favor, intenta comunicarte más tarde o escríbenos al correo electrónico info@alacor.com.co.`),
                (r = [
                  {
                    id: `menu_principal`,
                    label: `⬅️ Volver al Menú Principal`,
                  },
                  { id: `catalogo`, label: `🔍 Consultar Catálogo` },
                ]));
          else if (e === `cat_cascos`)
            ((t = `Alacor cuenta con Cascos de Seguridad Tipo I y Tipo II certificados contra impactos y descargas eléctricas:

- Referencia CA-100 (Steelpro®): Casco de 3 apoyos, suspensión de cremallera de ajuste rápido, certificado bajo norma ANSI Z89.1 Clase E (soporta hasta 20.000 V de corriente).
- Referencia CA-200 (Steelpro®): Casco ventilado ideal para exteriores donde no se requiere aislamiento dieléctrico.`),
              (r = [
                { id: `catalogo`, label: `🔍 Volver al Catálogo` },
                { id: `menu_principal`, label: `⬅️ Menú Principal` },
              ]));
          else if (e === `cat_alturas`)
            ((t = `Ofrecemos arneses certificados de alta gama para trabajos en alturas:

- Arnés Dieléctrico en X con Faja (Ref: AD-900): Diseñado para operarios de telecomunicaciones o redes eléctricas. Argollas recubiertas de nylon de alta resistencia dieléctrica.
- Arnés de Rescate de 5 o 7 Argollas con soporte lumbar y perneras acolchadas.
Todos nuestros equipos cumplen con normas de fabricación ANSI Z359.11 y están homologados.`),
              (r = [
                { id: `catalogo`, label: `🔍 Volver al Catálogo` },
                { id: `menu_principal`, label: `⬅️ Menú Principal` },
              ]));
          else if (e === `cat_calzado`)
            ((t = `Disponemos de las siguientes líneas de calzado de seguridad:

🔵 BOTAS DIELÉCTRICAS CERTIFICADAS (resistencia a voltaje probada):
- Bota Worker Dieléctrica: cuero graso, puntera composite certificada.
- Bota Jumbo Dieléctrica (Ref. 725500-007): caña alta, certificada para arco eléctrico.
- Bota Jumbo Dieléctrica Dama (Kondor): línea femenina certificada.
- Bota Mundial Negra Dieléctrica: cuero graso, puntera composite.
- Bota Safety Dieléctrica Café: cuero, puntera composite, antideslizante.
- Bota Quimera Woman Dieléctrica Composite: ergonómica para mujer.
- Tenis Dieléctrico Toryo Composite: calzado bajo para riesgo eléctrico moderado.

🟡 BOTAS CON PUNTERA COMPOSITE (no metálica, no conductora):
- Bota Fullrisk 802 Composite y Fullrisk 804 Composite.
- Bota KAIRI-PU con Puntera y YORK-PU con Puntera.

🟢 CALZADO PVC / CAUCHO (sin elementos metálicos):
- Bota Agro / Agrícola PVC, Workman Safety, Royal Argyll Safety y más.

También manejamos botas para soldador, petroleras, de seguridad en cuero y dotación femenina. ¿Le interesa alguna línea específica?`),
              (r = [
                { id: `catalogo`, label: `🔍 Volver al Catálogo` },
                { id: `menu_principal`, label: `⬅️ Menú Principal` },
              ]));
          else if (e === `cat_guantes`)
            ((t = `Nuestra línea de protección manual cuenta con guantes especializados de alta durabilidad:

- Guante de Carnaza Reforzado: Para manipulación de cargas pesadas, soldadura liviana o abrasión física.
- Guante Builder Látex: Excelente agarre antideslizante para construcción y manipulación de herramientas.
- Guante Nitrilfase / Nitrilo: Para manejo de químicos ligeros y grasas.`),
              (r = [
                { id: `catalogo`, label: `🔍 Volver al Catálogo` },
                { id: `menu_principal`, label: `⬅️ Menú Principal` },
              ]));
          else if (e === `cat_facial`)
            ((t = `Contamos con protección visual y facial con alta resistencia a impactos:

- Careta de Protección con Visor y Ribete (Ref: VI-900 Steelpro®): Visor de policarbonato óptico Clase 1, protección 99.9% UV y ajuste tafilete de cremallera.
- Monogafas y lentes de policarbonato con recubrimiento anti-empañante.`),
              (r = [
                { id: `catalogo`, label: `🔍 Volver al Catálogo` },
                { id: `menu_principal`, label: `⬅️ Menú Principal` },
              ]));
          else if (e.startsWith(`trade_`)) {
            let n = w[e.replace(`trade_`, ``)];
            ((t = n
              ? `**Requisitos de EPP para: ${n.title}**\n\n${n.description}\n\n**Equipos Requeridos:**\n${n.obligatory.map(
                  (e) => `✓ ${e}`,
                ).join(`
`)}`
              : `No se encontró información para esta labor.`),
              (r = [
                { id: `asesoria`, label: `🧗 Volver a Actividades` },
                { id: `menu_principal`, label: `⬅️ Menú Principal` },
              ]));
          } else if (e === `checkout_cotizar`)
            ((t = `Excelente. He cargado tu lista de cotización. Por favor completa los datos requeridos en el panel principal para procesar formalmente tu oferta.`),
              (r = [
                { id: `menu_principal`, label: `⬅️ Volver al Menú Principal` },
              ]),
              document
                .getElementById(`checkout-card`)
                ?.scrollIntoView({ behavior: `smooth` }));
          else if (e === `lead_first_time` || e === `lead_returning`) {
            let t =
              e === `lead_first_time` ? `Nuevo cliente` : `Cliente anterior`;
            (ii((e) => ({
              ...e,
              step: 1,
              data: { ...e.data, customerType: t },
            })),
              setTimeout(() => {
                N((e) => [
                  ...e,
                  { sender: `assistant`, text: `¿Cuál es su nombre completo?` },
                ]);
              }, 300));
            return;
          } else if (e === `lead_skip_company`) {
            (ii((e) => ({
              ...e,
              step: 3,
              data: { ...e.data, company: `Persona natural` },
            })),
              setTimeout(() => {
                N((e) => [
                  ...e,
                  {
                    sender: `assistant`,
                    text: `¿Cuál es su número de WhatsApp o correo electrónico para que nuestro asesor le contacte?`,
                  },
                ]);
              }, 300));
            return;
          }
          N((e) => [...e, { sender: `assistant`, text: t, options: r }]);
        }, 400));
    },
    Hi = () => {
      let newSessionId = `SESS-${Math.floor(1000 + Math.random() * 9000)}`;
      setChatSessionId(newSessionId);
      localStorage.setItem(`alacor_chat_session_id`, newSessionId);
      vr(`Visitante`);
      localStorage.setItem(`alacor_chat_session_name`, `Visitante`);
      Un(``);
      zn(``);
      localStorage.removeItem(`alacor_customer_profile`);
      localStorage.removeItem(`alacor_chat_human_transferred`);
      localStorage.removeItem(`alacor_chat_banned_until`);
      sessionStorage.removeItem(`alacor_chat_history`);
      try {
        window.dispatchEvent(new CustomEvent('alacor_profile_updated', {
          detail: { contactName: '', companyName: '', clientType: 'NATURAL', email: '', phone: '' }
        }));
      } catch(e) {}
      setShowHandoverFormIdx(null);
      setHandoverCompleted(false);
      setHandoverForm({ name: ``, phone: ``, email: ``, company: ``, city: `` });
      N([
        {
          sender: `assistant`,
          text: xr || `¡Hola! Bienvenido al canal de asesoría técnica de ALACOR S.A.S. ¿Cómo podemos orientarte hoy con nuestras líneas de seguridad y EPP?`,
          customized: !0,
        },
      ]);
      ii({
        active: !1,
        step: 0,
        context: ``,
        isQuantity: !1,
        data: { name: ``, contact: ``, company: ``, query: `` },
      });
      br(!1);
      setIsChatBanned(!1);
      fetch(`/api/chat/unban`, {
        method: `POST`,
        headers: { "Content-Type": `application/json` },
        body: JSON.stringify({ sessionId: newSessionId }),
      }).catch(() => {});
    },
    handleOpenProductFromChat = (prodNameOrRef) => {
      if (!prodNameOrRef) return;
      const clean = prodNameOrRef.toLowerCase().replace(/[\(\)\[\]\-]/g, ` `).replace(/\s+/g, ` `).trim();

      // 0. Direct SG-SST & Diagnostic routing
      const sgsstTerms = [`sgsst`, `sg sst`, `sg-sst`, `diagnostico`, `diagnóstico`, `0312`, `servicios sg sst`, `servicios sg-sst`, `portal sg sst`, `portal sg-sst`, `autodiagnostico`, `autodiagnóstico`];
      if (sgsstTerms.some((t) => clean.includes(t))) {
        hr(!1);
        window.dispatchEvent(new CustomEvent('alacor_open_diagnostic_0312'));
        return;
      }

      // 1. Direct Category & Subcategory routing for broad lines
      const categoryMap = [
        { terms: [`bota de seguridad`, `botas de seguridad`, `calzado industrial`, `calzado de seguridad`, `botas dielectricas`, `bota dielectrica`, `calzado`, `botas`], cat: `CALZADO INDUSTRIAL`, sub: `botas_de_seguridad` },
        { terms: [`botas de caucho`, `bota de caucho`, `botas pvc`, `bota pvc`, `botas pantaneras`, `caucho`], cat: `CALZADO INDUSTRIAL`, sub: `botas_pvc_caucho` },
        { terms: [`casco`, `cascos`, `proteccion cabeza`, `protección cabeza`, `seguridad en cabeza`, `cascos para obra civil e industria general`, `obra civil`], cat: `SEGURIDAD INDUSTRIAL`, sub: `proteccion_cabeza` },
        { terms: [`guante`, `guantes`, `proteccion manual`, `protección manual`, `guantes de cuero y trabajo pesado`, `guantes sinteticos`, `guantes sinteticos precision`, `guantes sintetico`, `guantes precision`], cat: `SEGURIDAD INDUSTRIAL`, sub: `proteccion_manual` },
        { terms: [`careta`, `caretas`, `proteccion facial`, `protección facial`, `visores`, `pantalla facial`], cat: `SEGURIDAD INDUSTRIAL`, sub: `proteccion_facial` },
        { terms: [`lente`, `lentes`, `gafas`, `monogafas`, `proteccion visual`, `protección visual`], cat: `SEGURIDAD INDUSTRIAL`, sub: `proteccion_visual` },
        { terms: [`arnes`, `arneses`, `alturas`, `trabajo seguro en alturas`, `trabajo en alturas`], cat: `TRABAJO SEGURO EN ALTURAS`, sub: `arneses` },
        { terms: [`eslinga`, `eslingas`], cat: `TRABAJO SEGURO EN ALTURAS`, sub: `eslingas` },
        { terms: [`lineas de vida`, `linea de vida`], cat: `TRABAJO SEGURO EN ALTURAS`, sub: `lineas_de_vida` },
        { terms: [`loto`, `bloqueo`, `candados`, `bloqueos electricos`, `sistemas loto`], cat: `BLOQUEO Y ETIQUETADO`, sub: `sistemas_loto` },
        { terms: [`dotacion`, `dotación`, `uniformes`, `camisas`, `impermeables`], cat: `DOTACIÓN`, sub: `overoles_y_trajes` }
      ];

      for (const mapping of categoryMap) {
        if (mapping.terms.some((t) => clean === t || (clean.includes(t) && clean.length <= t.length + 5))) {
          Ke(mapping.cat);
          Je(mapping.sub);
          setCatalogSearchQuery(``);
          Xe(null);
          window.location.hash = `#/portafolio/${encodeURIComponent(mapping.cat)}/${encodeURIComponent(mapping.sub)}`;
          setTimeout(() => {
            const el = document.getElementById(`catalogo-section`);
            if (el) el.scrollIntoView({ behavior: `smooth`, block: `start` });
          }, 250);
          return;
        }
      }

      // 2. Domain Inferred Category & Subline Bounding
      let preferredCat = null;
      let preferredSub = null;

      if (clean.includes(`guante`) || clean.includes(`vaqueta`) || clean.includes(`carnaza`) || clean.includes(`multiflex`) || clean.includes(`nitrilo`) || clean.includes(`latex`)) {
        preferredCat = `SEGURIDAD INDUSTRIAL`;
        preferredSub = `proteccion_manual`;
      } else if (clean.includes(`casco`) || clean.includes(`barbuquejo`) || clean.includes(`tafilete`) || clean.includes(`eco ratchet`) || clean.includes(`mountain`) || clean.includes(`luminer`)) {
        preferredCat = `SEGURIDAD INDUSTRIAL`;
        preferredSub = `proteccion_cabeza`;
      } else if (clean.includes(`lente`) || clean.includes(`gafa`) || clean.includes(`monogafa`) || clean.includes(`spy`) || clean.includes(`wolf`) || clean.includes(`rigel`) || clean.includes(`demon`) || clean.includes(`polaris`) || clean.includes(`top gun`) || clean.includes(`runner`) || clean.includes(`nitro`) || clean.includes(`zex`)) {
        preferredCat = `SEGURIDAD INDUSTRIAL`;
        preferredSub = `proteccion_visual`;
      } else if (clean.includes(`careta`) || clean.includes(`facial`) || clean.includes(`visor`)) {
        preferredCat = `SEGURIDAD INDUSTRIAL`;
        preferredSub = `proteccion_facial`;
      } else if (clean.includes(`arnes`) || clean.includes(`eslinga`) || clean.includes(`linea de vida`) || clean.includes(`mosqueton`) || clean.includes(`freno`) || clean.includes(`bloque retractil`)) {
        preferredCat = `TRABAJO SEGURO EN ALTURAS`;
        if (clean.includes(`eslinga`)) preferredSub = `eslingas`;
        else if (clean.includes(`linea`)) preferredSub = `lineas_de_vida`;
        else if (clean.includes(`mosqueton`) || clean.includes(`conector`)) preferredSub = `mosquetones_y_conectores`;
        else preferredSub = `arneses`;
      } else if (clean.includes(`bota`) || clean.includes(`calzado`) || clean.includes(`zapato`) || clean.includes(`tenis`)) {
        preferredCat = `CALZADO INDUSTRIAL`;
        if (clean.includes(`caucho`) || clean.includes(`pvc`) || clean.includes(`cerro`) || clean.includes(`machita`)) preferredSub = `botas_pvc_caucho`;
        else if (clean.includes(`soldador`)) preferredSub = `botas_tipo_soldador`;
        else if (clean.includes(`trabajo`) || clean.includes(`tenis`)) preferredSub = `calzado_de_trabajo`;
        else preferredSub = `botas_de_seguridad`;
      }

      const stopwords = [
        `con`, `para`, `del`, `los`, `las`, `una`, `uno`, `marca`, `epp`, `tipo`, `linea`, `elementos`,
        `bota`, `botas`, `casco`, `cascos`, `guante`, `guantes`, `arnes`, `arneses`, `careta`, `caretas`,
        `lente`, `lentes`, `dotacion`, `nacional`, `seguridad`, `industrial`,
        `general`, `obra`, `civil`, `industria`,
        `clase`, `ajuste`, `puntos`, `resistencia`, `proteccion`, `protección`,
        `steelpro`, `kondor`, `bata`, `brahma`, `insafe`, `orbit`, `armadura`, `alacor`
      ];

      const allSearchWords = clean.split(` `).filter((w) => w.length > 1);
      const distinctiveModelWords = allSearchWords.filter((w) => !stopwords.includes(w) && w.length >= 2);

      let bestFamily = null;
      let bestScore = -1;
      let matchedCat = null;
      let matchedSub = null;

      if (O && typeof O === `object`) {
        for (const catKey of Object.keys(O)) {
          if (preferredCat && catKey !== preferredCat) continue;
          const sublines = O[catKey]?.sublines || {};
          for (const subKey of Object.keys(sublines)) {
            if (preferredSub && subKey !== preferredSub) continue;
            const rawProds = sublines[subKey]?.products || [];
            const families = groupProductsIntoFamilies(rawProds);

            for (const fam of families) {
              const famName = (fam.parentName || fam.title || ``).toLowerCase();
              const famKey = (fam.familyKey || fam.id || ``).toLowerCase();
              const famBrand = (fam.brand || ``).toLowerCase();
              const fullText = `${famName} ${famKey} ${famBrand}`.replace(/[\(\)\[\]\-]/g, ` `);

              let score = 0;
              let distinctiveMatchedCount = 0;

              // Coincidencia exacta de nombre de familia
              if (famName === clean || famKey === clean || famName.includes(clean) || clean.includes(famName)) {
                score += 10000;
              }

              // Coincidencia por tokens de modelo distintivo (Cobalt, Silver, Quimera, Nazca, Mountain, Apollo, etc.)
              distinctiveModelWords.forEach((mWord) => {
                if (famName.includes(mWord) || famKey.includes(mWord)) {
                  score += 5000;
                  distinctiveMatchedCount++;
                } else if (fullText.includes(mWord)) {
                  score += 3000;
                  distinctiveMatchedCount++;
                } else if (Array.isArray(fam.variants) && fam.variants.some((v) => (v.title || ``).toLowerCase().includes(mWord) || (v.ref || ``).toLowerCase().includes(mWord) || (v.img || ``).toLowerCase().includes(mWord))) {
                  score += 2000;
                  distinctiveMatchedCount++;
                }
              });

              // Desempate por palabras comunes
              allSearchWords.forEach((w) => {
                if (famName.includes(w) || famKey.includes(w)) {
                  score += 5;
                }
              });

              // Solo califica si coincide con los tokens distintivos del modelo cuando existen
              const meetsDistinctiveCriteria = distinctiveModelWords.length === 0 || distinctiveMatchedCount > 0;

              if (score > bestScore && meetsDistinctiveCriteria && score >= 20) {
                bestScore = score;
                bestFamily = fam;
                matchedCat = catKey;
                matchedSub = subKey;
              }
            }
          }
        }
      }

      Xe(null);

      if (bestFamily && matchedCat && matchedSub) {
        Ke(matchedCat);
        Je(matchedSub);
        setCatalogSearchQuery(``);
        window.location.hash = `#/portafolio/${encodeURIComponent(matchedCat)}/${encodeURIComponent(matchedSub)}`;

        const famId = bestFamily.id || (bestFamily.familyKey ? `fam_${bestFamily.familyKey}` : null);
        setHighlightedFamilyId(famId);
        setTimeout(() => {
          setHighlightedFamilyId(null);
        }, 6000);

        setTimeout(() => {
          let card = document.getElementById(bestFamily.id) ||
                     document.getElementById(`fam_${bestFamily.familyKey}`) ||
                     document.querySelector(`[data-family-id="${bestFamily.id}"]`) || 
                     document.querySelector(`[data-family-key="${bestFamily.familyKey}"]`) ||
                     document.querySelector(`[data-product-title*="${bestFamily.parentName?.substring(0, 12)}"]`);
          if (card) {
            card.scrollIntoView({ behavior: `smooth`, block: `center` });
          } else {
            const el = document.getElementById(`catalogo-section`);
            if (el) el.scrollIntoView({ behavior: `smooth`, block: `start` });
          }
        }, 350);
      } else if (preferredCat && preferredSub) {
        Ke(preferredCat);
        Je(preferredSub);
        setCatalogSearchQuery(``);
        window.location.hash = `#/portafolio/${encodeURIComponent(preferredCat)}/${encodeURIComponent(preferredSub)}`;
        setTimeout(() => {
          const el = document.getElementById(`catalogo-section`);
          if (el) el.scrollIntoView({ behavior: `smooth`, block: `start` });
        }, 300);
      } else {
        const fallbackSearch = prodNameOrRef.replace(/\([^)]+\)/g, ``).trim();
        setCatalogSearchQuery(fallbackSearch);
        const el = document.getElementById(`catalogo-section`);
        if (el) el.scrollIntoView({ behavior: `smooth`, block: `start` });
      }
    },
    handleHandoverSubmit = (e) => {
      if (e) e.preventDefault();
      if (!handoverForm.name.trim() || !handoverForm.phone.trim()) {
        alert(`Por favor ingrese al menos su Nombre y Teléfono de Contacto para que el asesor pueda identificar su solicitud.`);
        return;
      }
      setHandoverSubmitting(!0);
      fetch(`/api/chat/transfer-with-context`, {
        method: `POST`,
        headers: { "Content-Type": `application/json` },
        body: JSON.stringify({
          sessionId: gr,
          leadData: handoverForm,
          history: xi
        })
      })
        .then((r) => r.json())
        .then((d) => {
          setHandoverSubmitting(!1);
          setHandoverCompleted(!0);
          br(!0);
          try {
            localStorage.setItem(`alacor_chat_human_transferred`, `true`);
          } catch(e) {}
          N((prev) => [
            ...prev,
            {
              sender: `assistant`,
              text: `🙌 ¡Perfecto, ${handoverForm.name}! Hemos transferido tu caso con todo el contexto a nuestro equipo de asesores comerciales. Un asesor responderá directamente por este chat en vivo para entregarte la cotización formal sin que tengas que repetir tu solicitud. Por favor mantén esta ventana activa.`
            }
          ]);
        })
        .catch((err) => {
          setHandoverSubmitting(!1);
          alert(`Hubo un error al transferir la información. Por favor intente nuevamente.`);
        });
    },
    Ui = (customText) => {
      const textToSend = typeof customText === 'string' ? customText : Si;
      if (!textToSend.trim()) return;
      let userText = textToSend.trim();
      Ci(``);
      hr(!0);
      setIsChatLoading(!0);

      let activeSessionId = gr;
      if (sessionStorage.getItem(`alacor_chat_ended`) === `true`) {
        activeSessionId = `SESS-${Math.floor(1000 + Math.random() * 9000)}`;
        setChatSessionId(activeSessionId);
        localStorage.setItem(`alacor_chat_session_id`, activeSessionId);
        sessionStorage.removeItem(`alacor_chat_ended`);
      }
      
      // Append user message locally
      N((prev) => [...prev, { sender: `user`, text: userText }]);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      // Direct backend dispatch (Single source of truth) with cart awareness
      fetch(`/api/chat/send`, {
        method: `POST`,
        headers: { "Content-Type": `application/json` },
        signal: controller.signal,
        body: JSON.stringify({
          sessionId: activeSessionId,
          text: userText,
          userName: _r,
          cartItems: M.map((item) => ({
            name: item.name,
            sku: item.sku,
            qty: item.quantity,
            brand: item.brand
          }))
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          clearTimeout(timeoutId);
          setIsChatLoading(!1);
          if (data && data.updatedUserName && data.updatedUserName !== _r) {
            vr(data.updatedUserName);
            localStorage.setItem(`alacor_chat_session_name`, data.updatedUserName);
          }
          if (data && data.sessionEnded) {
            br(!1);
            try {
              localStorage.removeItem(`alacor_chat_human_transferred`);
              sessionStorage.setItem(`alacor_chat_ended`, `true`);
            } catch(e) {}
          } else if (data && (data.humanTransferred || data.triggerTransfer)) {
            br(!0);
            try {
              localStorage.setItem(`alacor_chat_human_transferred`, `true`);
            } catch(e) {}
          }
          if (data && data.reply) {
            let cleanText = data.reply.replace(/^\[Bot\]:\s*/, ``).replace(/^\[Asesor\]:\s*/, ``);
            const profileMatch = cleanText.match(/\[SET_PROFILE:(.+?)\]/);
            if (profileMatch) {
              try {
                const params = Object.fromEntries(profileMatch[1].split('|').map(p => p.split('=')));
                const formattedName = params.name ? (params.company && params.company !== `Persona Natural` ? `${params.name} (${params.company})` : params.name) : '';
                if (formattedName) {
                  vr(formattedName);
                  localStorage.setItem(`alacor_chat_session_name`, formattedName);
                  Un(params.name);
                }
                if (params.company && params.company !== `Persona Natural`) {
                  zn(params.company);
                }
                const newProf = {
                  contactName: params.name || '',
                  companyName: params.company || '',
                  clientType: params.type || 'NATURAL',
                  email: params.email || '',
                  phone: params.phone || ''
                };
                localStorage.setItem(`alacor_customer_profile`, JSON.stringify(newProf));
                window.dispatchEvent(new CustomEvent('alacor_profile_updated', { detail: newProf }));
              } catch(e) {}
              cleanText = cleanText
                .replace(/\[SET_PROFILE:[^\]]+\]/gi, '')
                .replace(/\[TRANSFERIR_ASESOR\]/gi, '')
                .replace(/\[IR_DIAGNOSTICO_0312\]/gi, '')
                .trim();
            }

            N((prev) => {
              const lastMsg = prev[prev.length - 1];
              if (lastMsg && lastMsg.sender === `assistant` && lastMsg.text === cleanText) {
                return prev;
              }
              return [...prev, { sender: `assistant`, text: cleanText }];
            });
          } else if (data && data.error) {
            N((prev) => [...prev, { sender: `assistant`, text: data.error }]);
          }
        })
        .catch((err) => {
          clearTimeout(timeoutId);
          setIsChatLoading(!1);
          console.error(`Chat send error:`, err);
          const errorMsg = err.name === 'AbortError'
            ? 'El servidor tardó más de lo esperado en responder. Por favor reenvía tu consulta o reinicia la conversación con el botón 🔄.'
            : 'Lo sentimos, hubo un inconveniente temporal de conexión. Por favor reenvía tu consulta.';
          N((prev) => [...prev, { sender: `assistant`, text: errorMsg }]);
        });
    },
    Wi = (e) => {
      let t = e.toLowerCase(),
        n = ``,
        r = !0;
      if (
        /(.)\1{4,}/.test(t) ||
        /\b[^aeiou\s]{10,}\b/i.test(t) ||
        /(xyzabc|asdfgh|qwerty)/.test(t) ||
        /(<script|select \*|drop table|union select|javascript:)/i.test(t)
      )
        return {
          matched: !0,
          isIncoherent: !0,
          text: `⚠️ Se ha detectado una consulta incoherente o un posible intento de abuso. Por motivos de seguridad, esta sesión ha sido bloqueada y la conversación ha finalizado.`,
        };
      let i =
          t.includes(`precio`) ||
          t.includes(`costo`) ||
          t.includes(`cuánto`) ||
          t.includes(`cuanto`) ||
          t.includes(`vale`) ||
          t.includes(`valor`) ||
          t.includes(`econom`) ||
          t.includes(`barata`) ||
          t.includes(`barato`) ||
          t.includes(`económic`) ||
          t.includes(`economico`) ||
          t.includes(`más barata`) ||
          t.includes(`mas barata`) ||
          t.includes(`más barato`) ||
          t.includes(`mas barato`) ||
          t.includes(`más económ`) ||
          t.includes(`mas econom`) ||
          t.includes(`cotizar`) ||
          t.includes(`cotizacion`) ||
          t.includes(`cotización`) ||
          t.includes(`presupuest`) ||
          t.includes(`cuál es el precio`) ||
          t.includes(`cual es el precio`) ||
          t.includes(`cuesta`) ||
          t.includes(`cuestan`),
        a =
          /\b\d+\s*(par(es)?|unidad(es)?|pieza(s)?|set(s)?|kit(s)?|docena(s)?|equipos?|elementos?|puestos?)\b/.test(
            t,
          ) ||
          /\bnecesito\s+\d+/.test(t) ||
          /\bquiero\s+\d+/.test(t) ||
          /\bpedido\s+(de\s+)?\d+/.test(t) ||
          /\b(comprar|adquirir|solicitar)\s+\d+/.test(t) ||
          /\b\d+\s*(trabajadores?|operarios?|empleados?|personas?|personas)\b/.test(
            t,
          ),
        o = () =>
          t.includes(`bota`) || t.includes(`calzado`) || t.includes(`zapato`)
            ? `calzado de seguridad`
            : t.includes(`casco`)
              ? `cascos de seguridad`
              : t.includes(`arnés`) ||
                  t.includes(`arnes`) ||
                  t.includes(`altura`)
                ? `equipos para trabajo en alturas`
                : t.includes(`guante`)
                  ? `guantes de protección`
                  : t.includes(`careta`) ||
                      t.includes(`visor`) ||
                      t.includes(`gafa`)
                    ? `protección visual y facial`
                    : t.includes(`respirad`) ||
                        t.includes(`mascarilla`) ||
                        t.includes(`filtro`)
                      ? `protección respiratoria`
                      : t.includes(`auditivo`) ||
                          t.includes(`tapa`) ||
                          t.includes(`ruido`)
                        ? `protección auditiva`
                        : t.includes(`ropa`) ||
                            t.includes(`dotación`) ||
                            t.includes(`overol`)
                          ? `ropa y dotación`
                          : `EPP`;
      if (
        t.includes(`proveedor`) ||
        t.includes(`factura`) ||
        t.includes(`tesoreria`) ||
        t.includes(`tesorería`) ||
        t.includes(`cobro`) ||
        t.includes(`cuenta por cobrar`) ||
        t.includes(`cuentas por pagar`) ||
        t.includes(`cuenta por pagar`)
      )
        n = `Para consultas relacionadas con pagos a proveedores, radicación de facturas o temas administrativos, por favor comúníquese directamente vía correo electrónico al área de tesorería a: tesoreria@alacor.com.co`;
      else if (i || a)
        return {
          matched: !1,
          text: ``,
          startLeadCapture: !0,
          isQuantity: a && !i,
          productContext: o(),
        };
      else if (
        t.includes(`bota`) ||
        t.includes(`calzado`) ||
        t.includes(`zapato`) ||
        t.includes(`puntera`)
      )
        n = `Disponemos de las siguientes líneas de calzado de seguridad:

🔵 BOTAS DIELÉCTRICAS CERTIFICADAS:
- Bota Worker Dieléctrica: cuero graso, puntera composite certificada.
- Bota Jumbo Dieléctrica (Ref. 725500-007): caña alta, para arco eléctrico.
- Bota Jumbo Dieléctrica Dama (Kondor): línea femenina certificada.
- Bota Mundial Negra Dieléctrica, Bota Safety Dieléctrica Café.
- Bota Quimera Woman Dieléctrica Composite: ergonómica para mujer.
- Tenis Dieléctrico Toryo Composite: calzado bajo, riesgo moderado.

🟡 BOTAS CON PUNTERA COMPOSITE (no metálica, no conductora):
- Bota Fullrisk 802 y 804 Composite, KAIRI-PU, YORK-PU con puntera.

🟢 CALZADO PVC/CAUCHO SIN METAL:
- Bota Agro / Agrícola PVC, Workman Safety, Royal Argyll Safety.

También manejamos botas para soldador, petroleras y dotación femenina.`;
      else if (
        t.includes(`arnés`) ||
        t.includes(`arnes`) ||
        t.includes(`altura`) ||
        t.includes(`rescate`) ||
        t.includes(`eslinga`) ||
        t.includes(`vida`)
      )
        n = `Ofrecemos arneses certificados de alta gama para trabajos en alturas:

- Arnés Dieléctrico en X con Faja (Ref: AD-900): Diseñado para operarios de telecomunicaciones o redes eléctricas. Argollas recubiertas de nylon de alta resistencia dieléctrica.
- Arnés de Rescate de 5 o 7 Argollas con soporte lumbar y perneras acolchadas.
Todos nuestros equipos cumplen con normas de fabricación ANSI Z359.11 y están homologados.`;
      else if (
        t.includes(`casco`) ||
        t.includes(`cabeza`) ||
        t.includes(`impacto`) ||
        t.includes(`clase e`) ||
        ((t.includes(`dieléctric`) || t.includes(`dielectric`)) &&
          !t.includes(`arnes`) &&
          !t.includes(`arnés`) &&
          !t.includes(`bota`) &&
          !t.includes(`calzado`) &&
          !t.includes(`zapato`) &&
          !t.includes(`puntera`) &&
          !t.includes(`pie`))
      )
        n = `Alacor cuenta con Cascos de Seguridad Tipo I y Tipo II certificados contra impactos y descargas eléctricas:

- Referencia CA-100 (Steelpro®): Casco de 3 apoyos, suspensión de cremallera de ajuste rápido, certificado bajo norma ANSI Z89.1 Clase E (soporta hasta 20.000 V de corriente).
- Referencia CA-200 (Steelpro®): Casco ventilado ideal para exteriores donde no se requiere aislamiento dieléctrico.`;
      else if (
        t.includes(`guante`) ||
        t.includes(`nitrilo`) ||
        t.includes(`carnaza`) ||
        t.includes(`multiflex`) ||
        (t.includes(`mano`) &&
          (t.includes(`protec`) ||
            t.includes(`guant`) ||
            t.includes(`trabajo`)))
      ) {
        let e =
            t.includes(`obra`) ||
            t.includes(`construc`) ||
            t.includes(`alban`) ||
            t.includes(`mamposter`) ||
            t.includes(`herramienta`),
          r =
            t.includes(`químic`) ||
            t.includes(`quimic`) ||
            t.includes(`ácido`) ||
            t.includes(`acido`) ||
            t.includes(`solvent`) ||
            t.includes(`grasa`),
          i =
            t.includes(`sold`) ||
            t.includes(`calor`) ||
            t.includes(`horno`) ||
            t.includes(`fragua`) ||
            t.includes(`metal`),
          a =
            t.includes(`eléctric`) ||
            t.includes(`electric`) ||
            t.includes(`tensión`) ||
            t.includes(`tension`) ||
            t.includes(`voltaje`);
        n = e
          ? `⭐ Para operarios de construcción y obras civiles, la recomendación principal de ALACOR es:

- Guante Builder Látex: diseñado específicamente para construcción. Agarre antideslizante superior en superficies húmedas y secas, alta resistencia a la abrasión.

Para cargas pesadas o contacto con rebabas metálicas, complementar con:
- Guante de Carnaza Reforzado: alta durabilidad ante impacto y abrasión intensa.

Si desea una cotización por cantidad, nuestros asesores le pueden ayudar.`
          : r
            ? `⭐ Para manejo de químicos, grasas y solventes recomendamos:

- Guante Nitrilfase / Nitrilo: resistencia comprobada a químicos ligeros, ácidos débiles, aceites y grasas industriales. Excelente sensibilidad táctil.

Para químicos más agresivos consulte con nuestros asesores sobre guantes de PVC o Neopreno.`
            : i
              ? `⭐ Para soldadura y trabajos con altas temperaturas recomendamos:

- Guante de Carnaza Reforzado: fabricado en cuero de res curtido al vegetal, resistente al calor radiante, chispa y abrasión metálica. Estándar para soldadura liviana, amolado y trabajos de forja.`
              : a
                ? `Para trabajos en entornos eléctricos es importante distinguir el nivel de protección:

- Guante Dieléctrico (alta tensión): podemos gestionarlos bajo pedido especial.
- Para baja tensión o protección térmica secundaria se usa el Guante de Carnaza.

Consulte con nuestros asesores el nivel de riesgo eléctrico de su actividad.`
                : `Nuestra línea de protección manual cuenta con guantes especializados de alta durabilidad:

- Guante de Carnaza Reforzado: para cargas pesadas, soldadura liviana o abrasión física.
- Guante Builder Látex: agarre antideslizante para construcción y herramientas.
- Guante Nitrilfase / Nitrilo: para químicos ligeros y grasas.

¿Cuénteme el tipo de trabajo o industria? Así le recomiendo el más adecuado.`;
      } else
        t.includes(`careta`) ||
        t.includes(`visor`) ||
        t.includes(`facial`) ||
        t.includes(`monogafa`) ||
        t.includes(`lente`) ||
        /\bojo(s)?\b/.test(t)
          ? (n = `Contamos con protección visual y facial con alta resistencia a impactos:

- Careta de Protección con Visor y Ribete (Ref: VI-900 Steelpro®): Visor de policarbonato óptico Clase 1, protección 99.9% UV y ajuste tafilete de cremallera.
- Monogafas y lentes de policarbonato con recubrimiento anti-empañante.`)
          : t.includes(`filtro`) ||
              t.includes(`mascarilla`) ||
              t.includes(`respirador`) ||
              t.includes(`partícula`) ||
              /\bgas(es)?\b/.test(t) ||
              t.includes(`vapor`)
            ? (n = `Nuestra línea de protección respiratoria incluye:

- Filtro 2097 3M: Para material particulado con alivio de olores molestos por vapores orgánicos.
- Filtro 7093 P100 3M: Filtro de alta eficiencia para vapores, polvos y neblinas con acople de bayoneta.`)
            : t.includes(`hola`) ||
                t.includes(`buenos`) ||
                t.includes(`tardes`) ||
                t.includes(`dias`) ||
                t.includes(`asesor`) ||
                t.includes(`ayuda`)
              ? (n = `¡Hola! Bienvenido al canal de asistencia técnica de ALACOR S.A.S.
Te puedo brindar asesoría técnica sobre nuestros productos:
- Cascos de protección (CA-100 dieléctrico)
- Equipos para trabajo en alturas (arneses y eslingas)
- Calzado de seguridad industrial (botas de PVC e inyección)
- Guantes y protección manual
- Caretas y protección facial`)
              : ((r = !1),
                (n = `Gracias por tu consulta sobre EPPs en Alacor S.A.S. No logré identificar la referencia exacta del producto, pero te comento que distribuimos cascos certificados, calzado dieléctrico, guantes y arneses homologados.`));
      return {
        matched: r,
        text: n,
        startLeadCapture: !1,
        isQuantity: !1,
        productContext: ``,
      };
    },
    Gi = (e, t = !1) => {
      (ii({ active: !0, step: 0, data: {}, productContext: e }),
        N((t) => [
          ...t,
          {
            sender: `assistant`,
            text: `Para ayudarle con precios y disponibilidad de ${e}, con gusto le conectamos con un asesor comercial. \u00bfEsta sería la primera vez que nos contacta, o ya ha comprado con ALACOR antes?`,
            options: [
              { id: `lead_first_time`, label: `🆕 Primera vez` },
              { id: `lead_returning`, label: `🔄 Ya soy cliente` },
            ],
          },
        ]));
    },
    Ki = (e) => {
      let { step: t, data: n, productContext: r } = ri;
      if (t === 1) {
        let t = e.trim().split(` `)[0];
        (ii((t) => ({ ...t, step: 2, data: { ...t.data, name: e.trim() } })),
          N((e) => [
            ...e,
            {
              sender: `assistant`,
              text: `Gracias, ${t} 😊 \u00bfCuál es el nombre de su empresa u organización?`,
              options: [
                { id: `lead_skip_company`, label: `👤 Soy persona natural` },
              ],
            },
          ]));
      } else
        t === 2
          ? (ii((t) => ({
              ...t,
              step: 3,
              data: { ...t.data, company: e.trim() },
            })),
            N((e) => [
              ...e,
              {
                sender: `assistant`,
                text: `¿Cuál es su número de WhatsApp o correo electrónico para que nuestro asesor le contacte?`,
              },
            ]))
          : t === 3 && qi({ ...n, contact: e.trim() }, r);
    },
    qi = (e, t) => {
      ii({ active: !1, step: 0, data: {}, productContext: `` });
      let n = (e.name || `visitante`).split(` `)[0],
        r = new Date().toLocaleString(`es-CO`, { timeZone: `America/Bogota` }),
        i = `🎯 NUEVO LEAD — ALACOR S.A.S.\n👤 Nombre: ${e.name || `No indicado`}\n🏢 Empresa: ${e.company || `Persona natural`}\n📱 Contacto: ${e.contact || `No indicado`}\n📊 Tipo: ${e.customerType || `No especificado`}\n🛋️ Consulta: ${t || `Precios / cotización`}\n🕒 ${r}`;
      (N((t) => [
        ...t,
        {
          sender: `assistant`,
          text: `🙌 ¡Perfecto, ${n}! Sus datos han sido registrados correctamente.\n\nUn asesor comercial de ALACOR se comunicará con usted en breve al **${e.contact}**.\n\n¿Hay alguna otra consulta en la que pueda ayudarle mientras tanto?`,
          options: [
            { id: `menu_principal`, label: `⬅️ Volver al Menú Principal` },
            { id: `catalogo`, label: `🔍 Ver Catálogo` },
          ],
        },
      ]),
        fetch(`/api/chat/lead`, {
          method: `POST`,
          headers: { "Content-Type": `application/json` },
          body: JSON.stringify({
            sessionId: gr,
            lead: e,
            productContext: t,
            summary: i,
            userName: _r,
          }),
        }).catch(() => {}));
    };
  // Legacy auto-sync replaced by catalogService
  let Ji = () => {
      (Ir(``),
        fetch(`/api/chat/config`, {
          method: `POST`,
          headers: {
            "Content-Type": `application/json`,
            "X-Admin-Password": `alacor2026`,
          },
          body: JSON.stringify({
            botToken: jr,
            chatId: Nr,
            enabled: Dr,
            welcomeMessage: kr,
            accounts: Lr,
          }),
        })
          .then((e) => e.json())
          .then((e) => {
            e.success
              ? (wr(Dr),
                Sr(kr),
                Er(Lr.some((e) => e.enabled) || !!Nr),
                Ir(
                  `¡Configuración de chat guardada con éxito! El bot se ha reiniciado.`,
                ),
                setTimeout(() => Ir(``), 4e3))
              : alert(
                  `Error al guardar la configuración: ` +
                    (e.error || `error desconocido`),
                );
          })
          .catch((e) => {
            (console.error(e),
              alert(`Error al conectar con el servidor de chat.`));
          }));
    },
    Yi = (e) => {
      if ((e.preventDefault(), !zr.trim() || !ai.trim())) {
        alert(`El nombre del canal y el ID del chat son obligatorios.`);
        return;
      }
      let t = {
        id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: zr.trim(),
        chatId: ai.trim(),
        priority: Number(si) || 1,
        enabled: li,
      };
      (Rr((e) => [...e, t].sort((e, t) => e.priority - t.priority)),
        Br(``),
        oi(``),
        ci(
          (e) => (e.length > 0 ? Math.max(...e.map((e) => e.priority)) : 0) + 1,
        ),
        ui(!0));
    },
    Xi = (e) => {
      window.confirm(
        `¿Está seguro de que desea eliminar este canal de chat?`,
      ) && Rr((t) => t.filter((t) => t.id !== e));
    },
    Zi = (e) => {
      (fi(e.id), mi(e.name), gi(e.chatId), vi(e.priority), bi(e.enabled));
    },
    Qi = (e) => {
      if ((e.preventDefault(), !pi.trim() || !hi.trim())) {
        alert(`El nombre del canal y el ID del chat son obligatorios.`);
        return;
      }
      (Rr((e) =>
        e
          .map((e) =>
            e.id === di
              ? {
                  ...e,
                  name: pi.trim(),
                  chatId: hi.trim(),
                  priority: Number(_i) || 1,
                  enabled: yi,
                }
              : e,
          )
          .sort((e, t) => e.priority - t.priority),
      ),
        fi(null));
    },
    $i = async () => {
      Lt(!0);
      zt(`Conectando con el servidor de catálogo COREPRICE...`);
      try {
        const updated = await fetchLiveCatalog(S);
        if (updated) {
          k(updated);
          localStorage.setItem('alacor_catalog_v2026_ssot', JSON.stringify(updated));
          zt(`Catálogo sincronizado exitosamente con COREPRICE.`);
          alert(`Sincronización de catálogo exitosa con COREPRICE.`);
        } else {
          throw new Error('No se recibieron datos del catálogo');
        }
      } catch (e) {
        console.warn('Sync failed:', e);
        zt(`Catálogo activo con versión base SSOT.`);
      } finally {
        Lt(!1);
      }
    },
    ea = async (e, t = !1) => {
      try {
        const updated = await fetchLiveCatalog(S);
        if (updated) {
          k(updated);
          localStorage.setItem('alacor_catalog_v2026_ssot', JSON.stringify(updated));
        }
      } catch (err) {
        console.warn('ea sync failed', err);
      } finally {
        Lt(!1);
      }
    },
    ta = (e) => {
      if ((e.preventDefault(), !ut || !ft || !vt)) {
        alert(
          `Por favor complete los campos obligatorios (Título, Referencia, Descripción).`,
        );
        return;
      }
      let t = {
          id: `${it}_${ot}_${Date.now()}`,
          brand: ct,
          title: ut,
          ref: ft,
          standards: mt || `Certificación de Calidad Vigente`,
          img: gt,
          description: vt,
          specs: [
            { label: bt || `Material`, val: St || `No especificado` },
            { label: wt || `Certificación`, val: Et || `Cumple normativa` },
            { label: Ot || `Características`, val: At || `Alta resistencia` },
            { label: Mt || `Uso Recomendado`, val: Pt || `Uso industrial` },
          ],
        },
        n = JSON.parse(JSON.stringify(O));
      (n[it].sublines[ot].products.push(t),
        k(n),
        dt(``),
        pt(``),
        ht(``),
        yt(``),
        Ct(``),
        Dt(``),
        jt(``),
        Ft(``),
        alert(`¡Producto agregado con éxito al catálogo interactivo!`));
    },
    na = (e, t, n) => {
      if (
        window.confirm(
          `¿Está seguro de que desea eliminar este producto del catálogo?`,
        )
      ) {
        let r = JSON.parse(JSON.stringify(O));
        ((r[e].sublines[t].products = r[e].sublines[t].products.filter(
          (e) => e.id !== n,
        )),
          k(r));
      }
    },
    ra = () => {
      window.confirm(
        `¿Desea restablecer todo el catálogo a los productos originales de fábrica? Se perderán todos los cambios agregados.`,
      ) &&
        (k(S),
        Ke(null),
        Je(null),
        zt(``),
        alert(`¡El catálogo ha sido restablecido de fábrica!`));
    },
    ia = (e) => {
      if ((Zt(e), e === `__new__`)) (Vt(``), Ut(``), Gt(`🛡️`), qt(``), Yt(``));
      else {
        let t = O[e];
        t &&
          (Vt(e),
          Ut(t.title || ``),
          Gt(t.icon || `🛡️`),
          qt(t.description || ``),
          Yt(t.img || ``));
      }
    },
    aa = (e) => {
      if ((e.preventDefault(), !Bt.trim() || !Ht.trim())) {
        alert(
          `Por favor complete la clave y el título de la línea de negocio.`,
        );
        return;
      }
      let t = Bt.trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, ``);
      if (!t) {
        alert(
          `La clave de la línea debe contener solo letras, números o guiones bajos.`,
        );
        return;
      }
      let n = JSON.parse(JSON.stringify(O)),
        r = Xt !== `__new__`;
      if (!r && n[t]) {
        alert(`Esta clave de línea de negocio ya existe.`);
        return;
      }
      r
        ? ((n[t] = {
            ...n[t],
            title: Ht.trim(),
            icon: Wt.trim() || `🛡️`,
            img: Jt.trim(),
            description: Kt.trim(),
          }),
          k(n),
          alert(`Línea de negocio "${Ht}" actualizada con éxito.`))
        : ((n[t] = {
            title: Ht.trim(),
            icon: Wt.trim() || `🛡️`,
            img: Jt.trim(),
            description: Kt.trim() || `Línea de negocio corporativa.`,
            sublines: {},
          }),
          k(n),
          Vt(``),
          Ut(``),
          Gt(`🛡️`),
          qt(``),
          Yt(``),
          Zt(`__new__`),
          alert(`Línea de negocio "${Ht}" creada con éxito.`));
    },
    oa = (e) => {
      if ((e.preventDefault(), !Qt)) {
        alert(`Seleccione una línea de negocio para eliminar.`);
        return;
      }
      if ([`seguridad`, `calzado`, `alturas`].includes(Qt)) {
        alert(
          `No se pueden eliminar las líneas de negocio principales por defecto del sistema (Seguridad Industrial, Calzado o Alturas).`,
        );
        return;
      }
      let t = O[Qt]?.title || Qt;
      if (
        window.confirm(
          `¿Está seguro de que desea eliminar la línea de negocio "${t}"? Se perderán todas sus subcategorías y productos.`,
        )
      ) {
        let e = { ...O };
        (delete e[Qt],
          k(e),
          A === Qt && (Ke(null), Je(null)),
          it === Qt && at(Object.keys(e)[0] || ``),
          en === Qt && tn(Object.keys(e)[0] || ``),
          dn === Qt && fn(Object.keys(e)[0] || ``),
          $t(``),
          alert(`Línea de negocio "${t}" eliminada con éxito.`));
      }
    },
    sa = () => {
      for (let e of Object.keys(O)) {
        let t = O[e].sublines || {},
          n = Object.keys(t);
        if (n.length > 0) return `${e}|${n[0]}`;
      }
      return `__new__`;
    },
    ca = (e) => {
      if ((un(e), e === `__new__`)) (rn(``), on(``), cn(``));
      else {
        let [t, n] = e.split(`|`),
          r = O[t];
        if (r && r.sublines && r.sublines[n]) {
          let e = r.sublines[n];
          (tn(t), rn(n), on(e.title || ``), cn(e.description || ``));
        }
      }
    },
    la = (e) => {
      if ((e.preventDefault(), !en)) {
        alert(`Seleccione la línea de negocio padre.`);
        return;
      }
      if (!nn.trim() || !an.trim()) {
        alert(`Por favor complete la clave y el título de la subcategoría.`);
        return;
      }
      let t = nn
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, ``);
      if (!t) {
        alert(
          `La clave de la subcategoría debe contener solo letras, números o guiones bajos.`,
        );
        return;
      }
      let n = O[en];
      if (!n) {
        alert(`La línea de negocio padre seleccionada no existe.`);
        return;
      }
      let r = JSON.parse(JSON.stringify(O)),
        i = ln !== `__new__`;
      if (!i && n.sublines && n.sublines[t]) {
        alert(
          `Esta subcategoría ya existe en la línea de negocio seleccionada.`,
        );
        return;
      }
      if (i) {
        let [e, n] = ln.split(`|`);
        if (e !== en) {
          let i = r[e].sublines[n];
          (delete r[e].sublines[n],
            r[en].sublines || (r[en].sublines = {}),
            (r[en].sublines[t] = {
              ...i,
              title: an.trim(),
              description: sn.trim() || `Productos de esta categoría.`,
            }));
        } else
          r[en].sublines[n] = {
            ...r[en].sublines[n],
            title: an.trim(),
            description: sn.trim() || `Productos de esta categoría.`,
          };
        (k(r),
          un(`__new__`),
          rn(``),
          on(``),
          cn(``),
          alert(`Subcategoría "${an}" actualizada con éxito.`));
      } else
        (r[en].sublines || (r[en].sublines = {}),
          (r[en].sublines[t] = {
            title: an.trim(),
            description: sn.trim() || `Productos de esta categoría.`,
            products: [],
          }),
          k(r),
          rn(``),
          on(``),
          cn(``),
          alert(`Subcategoría "${an}" creada con éxito.`));
    },
    ua = (e) => {
      if ((e.preventDefault(), !dn || !pn)) {
        alert(`Seleccione la línea y la subcategoría para eliminar.`);
        return;
      }
      let t = O[dn];
      if (!t || !t.sublines || !t.sublines[pn]) {
        alert(`La subcategoría seleccionada no existe.`);
        return;
      }
      let n = t.sublines[pn].title || pn;
      if (
        window.confirm(
          `¿Está seguro de que desea eliminar la subcategoría "${n}" de la línea de negocio? Se perderán todos sus productos asociados.`,
        )
      ) {
        let e = JSON.parse(JSON.stringify(O));
        (delete e[dn].sublines[pn],
          k(e),
          A === dn && qe === pn && Je(null),
          it === dn &&
            ot === pn &&
            st(Object.keys(e[dn]?.sublines || {})[0] || ``),
          mn(``),
          alert(`Subcategoría "${n}" eliminada con éxito.`));
      }
    },
    I = (e) => {
      if (e) {
        rr(`Solicitud de cotización: ${e.title || ''} (REF: ${e.ref || ''}, Marca: ${e.brand || ''}, Estándar: ${e.standards || ''})`);
      }
      ar(!0);
    },
    da = (e) => {
      if (e) {
        const epps = Array.isArray(e.obligatory) ? e.obligatory.join(', ') : '';
        rr(`Asesoría técnica y cotización para actividad:\n- Actividad: ${e.title || ''}\n- Consulta: ${e.wpMessage || ''}\n- EPPs requeridos: ${epps}`);
      }
      ar(!0);
    },
    fa = () => {
      rr('Solicitud general de cotización de portafolio comercial');
      ar(!0);
    },
    pa = (e, t = `w-6 h-6`) => {
      if (!e) return null;
      if (e.startsWith(`/`) || e.startsWith(`http`) || e.includes(`.`))
        return (0, b.jsx)(`img`, {
          src: e,
          alt: `icon`,
          className: `${t} object-contain`,
        });
      let n = t
        .split(` `)
        .filter((e) => !e.startsWith(`w-`) && !e.startsWith(`h-`))
        .join(` `);
      return (0, b.jsx)(`span`, {
        className: `${t.includes(`w-6`) ? `text-xl` : `text-base`} ${n}`,
        children: e,
      });
    };
  return (0, b.jsxs)(`div`, {
    className: `min-h-screen bg-alacor-black text-gray-100 font-sans selection:bg-alacor-amber selection:text-alacor-dark overflow-x-hidden`,
    children: [
      (0, b.jsx)(`header`, {
        className: `fixed top-0 left-0 w-full z-50 bg-alacor-black/90 backdrop-blur-md border-b border-white/5 shadow-lg`,
        children: (0, b.jsxs)(`div`, {
          className: `container mx-auto px-6 py-4 flex justify-between items-center`,
          children: [
            (0, b.jsx)(`div`, {
              className: `flex items-center gap-3`,
              children: (0, b.jsx)(`img`, {
                src: `/img/marketing/logo_alacor_web_white2.PNG`,
                alt: `ALACOR`,
                className: `h-14 md:h-16 object-contain`,
              }),
            }),
            (0, b.jsxs)(`nav`, {
              className: `hidden lg:flex items-center gap-8 text-xs font-semibold tracking-widest text-gray-400 uppercase`,
              children: [
                (0, b.jsx)(`button`, {
                  onClick: () => {
                    ((window.location.hash = `#/portafolio`),
                      document
                        .getElementById(`catalogo-section`)
                        ?.scrollIntoView({ behavior: `smooth` }));
                  },
                  className: `hover:text-white focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-alacor-amber/50 px-2 py-1 rounded transition-colors text-white cursor-pointer border-none bg-transparent font-semibold uppercase text-xs tracking-widest`,
                  children: `Catálogo de Productos`,
                }),
                (0, b.jsx)(`button`, {
                  onClick: () =>
                    document
                      .getElementById(`sgsst-section`)
                      ?.scrollIntoView({ behavior: `smooth` }),
                  className: `hover:text-white focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-alacor-amber/50 px-2 py-1 rounded transition-colors cursor-pointer border-none bg-transparent font-semibold uppercase text-xs tracking-widest`,
                  children: `Servicios SG-SST`,
                }),
                (0, b.jsx)(`button`, {
                  onClick: () =>
                    document
                      .getElementById(`asesor-section`)
                      ?.scrollIntoView({ behavior: `smooth` }),
                  className: `hover:text-white focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-alacor-amber/50 px-2 py-1 rounded transition-colors cursor-pointer border-none bg-transparent font-semibold uppercase text-xs tracking-widest`,
                  children: `Guía de EPP por Actividad`,
                }),
                (0, b.jsx)(`button`, {
                  onClick: () =>
                    document
                      .getElementById(`seguridad-hub`)
                      ?.scrollIntoView({ behavior: `smooth` }),
                  className: `hover:text-white focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-alacor-amber/50 px-2 py-1 rounded transition-colors cursor-pointer border-none bg-transparent font-semibold uppercase text-xs tracking-widest`,
                  children: `Información y Consejos`,
                }),
                (0, b.jsx)(`button`, {
                  onClick: () =>
                    document
                      .getElementById(`faq-section`)
                      ?.scrollIntoView({ behavior: `smooth` }),
                  className: `hover:text-white focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-alacor-amber/50 px-2 py-1 rounded transition-colors cursor-pointer border-none bg-transparent font-semibold uppercase text-xs tracking-widest`,
                  children: `Preguntas Frecuentes`,
                }),
              ],
            }),
            (0, b.jsx)(`div`, {
              className: `flex items-center gap-4`,
              children: (0, b.jsxs)(`button`, {
                onClick: () => Fn(!0),
                className: `relative flex items-center justify-center p-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white cursor-pointer transition-all duration-300`,
                title: `Ver Carrito de Compras`,
                children: [
                  (0, b.jsx)(`span`, {
                    className: `text-base`,
                    children: `🛒`,
                  }),
                  M.length > 0 &&
                    (0, b.jsx)(`span`, {
                      className: `absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] font-black rounded-full w-5 h-5 flex items-center justify-center animate-pulse`,
                      children: M.reduce((e, t) => e + t.quantity, 0),
                    }),
                ],
              }),
            }),
          ],
        }),
      }),
      (0, b.jsxs)(`section`, {
        id: `hero`,
        className: `relative min-h-screen w-full flex items-center justify-center overflow-hidden pt-24 bg-gradient-to-b from-black to-alacor-black`,
        children: [
          (0, b.jsxs)(`div`, {
            className: `absolute inset-0 z-0`,
            children: [
              (0, b.jsx)(
                `video`,
                {
                  src: hn,
                  autoPlay: !0,
                  loop: !0,
                  muted: !0,
                  playsInline: !0,
                  className: `w-full h-full object-cover opacity-30 object-center filter brightness-50`,
                },
                hn,
              ),
              (0, b.jsx)(`div`, {
                className: `absolute inset-0 bg-gradient-to-t from-alacor-black via-alacor-black/80 to-transparent`,
              }),
              (0, b.jsx)(`div`, {
                className: `absolute inset-0 bg-radial-gradient-vignette pedestal-glow opacity-60`,
              }),
            ],
          }),
          (0, b.jsx)(`div`, {
            className: `relative z-10 container mx-auto px-6 max-w-4xl text-center py-20 flex flex-col items-center`,
            children: (0, b.jsxs)(`div`, {
              className: `max-w-3xl flex flex-col items-center`,
              children: [
                (0, b.jsx)(`span`, {
                  className: `text-xs font-bold tracking-[0.3em] text-alacor-amber uppercase mb-4 block`,
                  children: `PORTAL CORPORATIVO • ALACOR S.A.S.`,
                }),
                (0, b.jsx)(`h1`, {
                  className: `text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight uppercase mb-6`,
                  children: yn,
                }),
                (0, b.jsx)(`p`, {
                  className: `text-sm md:text-base text-gray-300 font-light tracking-wide mb-8 leading-relaxed max-w-2xl`,
                  children: xn,
                }),
                (0, b.jsxs)(`div`, {
                  className: `flex flex-col sm:flex-row gap-4 justify-center items-center`,
                  children: [
                    (0, b.jsx)(`button`, {
                      onClick: () => {
                        ((window.location.hash = `#/portafolio`),
                          document
                            .getElementById(`catalogo-section`)
                            ?.scrollIntoView({ behavior: `smooth` }));
                      },
                      className: `bg-alacor-amber text-alacor-dark font-black px-8 py-3.5 rounded-full text-xs uppercase tracking-widest hover:bg-yellow-400 transition-all text-center shadow-md cursor-pointer active:scale-95`,
                      children: `Ver Catálogo de Productos`,
                    }),
                    (0, b.jsx)(`button`, {
                      onClick: () =>
                        document
                          .getElementById(`asesor-section`)
                          ?.scrollIntoView({ behavior: `smooth` }),
                      className: `border border-white/20 bg-white/5 backdrop-blur-sm text-white font-black px-8 py-3.5 rounded-full text-xs uppercase tracking-widest hover:bg-white/10 transition-all text-center cursor-pointer active:scale-95`,
                      children: `Asesoría Técnica`,
                    }),
                  ],
                }),
              ],
            }),
          }),
          (0, b.jsxs)(`div`, {
            className: `absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-10 text-gray-600`,
            children: [
              (0, b.jsx)(`span`, {
                className: `text-[9px] tracking-widest uppercase font-bold text-gray-500`,
                children: `Explora nuestro portafolio`,
              }),
              (0, b.jsx)(`div`, {
                className: `w-4 h-7 border border-white/10 rounded-full flex justify-center p-0.5`,
                children: (0, b.jsx)(`div`, {
                  className: `w-1 h-1.5 bg-alacor-amber rounded-full animate-bounce`,
                }),
              }),
            ],
          }),
        ],
      }),
      (0, b.jsx)(PortfolioView, {
        catalog: O,
        selectedCategory: A,
        selectedSubcategory: qe,
        searchQuery: catalogSearchQuery,
        setSearchQuery: setCatalogSearchQuery,
        selectedBrand: selectedBrandFilter,
        setSelectedBrand: setSelectedBrandFilter,
        searchResults: searchResults,
        highlightedFamilyId: highlightedFamilyId,
        hideNoImg: Ti,
        hideIncomplete: Di,
        hasImage: ki,
        isComplete: Ai,
        onViewSheet: Xe,
        onAddToCart: Ri,
        onQuoteCategory: fa,
      }),
      (0, b.jsx)(SgsstSection, {
        onOpenPortalModal: () => setIsPortalModalOpen(!0),
      }),
      (0, b.jsx)(SgsstPortalLoginModal, {
        isOpen: isPortalModalOpen,
        onClose: () => setIsPortalModalOpen(!1),
      }),
      (0, b.jsx)(`section`, {
        id: `asesor-section`,
        className: `relative py-24 bg-alacor-black border-t border-white/5 scroll-mt-20`,
        children: (0, b.jsxs)(`div`, {
          className: `container mx-auto px-6`,
          children: [
            (0, b.jsxs)(`div`, {
              className: `max-w-3xl mb-16`,
              children: [
                (0, b.jsx)(`span`, {
                  className: `text-xs font-bold tracking-widest text-alacor-amber uppercase mb-2 block`,
                  children: `SOPORTE DE SEGURIDAD`,
                }),
                (0, b.jsx)(`h2`, {
                  className: `text-3xl lg:text-4xl font-black uppercase text-white tracking-tight`,
                  children: `ASESORÍA TÉCNICA ESPECIALIZADA`,
                }),
                (0, b.jsx)(`p`, {
                  className: `text-gray-400 mt-4 font-light text-sm md:text-base`,
                  children: `¿Busca el equipamiento adecuado para su actividad industrial? Presentamos nuestra guía interactiva de recomendación de productos para que pueda consultar el equipamiento técnico recomendado para cada tipo de labor.`,
                }),
              ],
            }),
            (0, b.jsxs)(`div`, {
              className: `grid grid-cols-1 lg:grid-cols-12 gap-16 items-start`,
              children: [
                (0, b.jsxs)(`div`, {
                  className: `lg:col-span-6 bg-white/2 border border-white/5 rounded-2xl p-6 md:p-8 backdrop-blur-md`,
                  children: [
                    (0, b.jsx)(`span`, {
                      className: `text-xs font-bold tracking-widest text-alacor-amber uppercase block mb-4`,
                      children: `SELECCIONE UNA ACTIVIDAD DE RIESGO`,
                    }),
                    (0, b.jsx)(`div`, {
                      className: `grid grid-cols-2 md:grid-cols-3 gap-3 mb-8`,
                      children: [
                        { key: `alturas_EPP`, title: `TRABAJOS EN ALTURAS` },
                        { key: `soldadura`, title: `SOLDADURA Y CORTE` },
                        { key: `amoladora`, title: `USO DE AMOLADORAS` },
                        { key: `electrico`, title: `MANTENIMIENTO ELÉCTRICO` },
                        { key: `quimico`, title: `MANEJO DE QUÍMICOS` },
                        { key: `albanileria`, title: `ALBAÑILERÍA Y OBRA` },
                      ].map((n) =>
                        (0, b.jsx)(
                          `button`,
                          {
                            onClick: () => t(n.key),
                            className: `p-3 rounded-lg border text-center transition-all cursor-pointer ${e === n.key ? `border-alacor-amber bg-alacor-amber/10 text-white font-semibold` : `border-white/5 bg-white/2 hover:bg-white/5 text-gray-400`}`,
                            children: (0, b.jsx)(`span`, {
                              className: `text-[11px] uppercase tracking-wide`,
                              children: n.title,
                            }),
                          },
                          n.key,
                        ),
                      ),
                    }),
                    (0, b.jsxs)(`div`, {
                      className: `bg-black/50 p-6 rounded-xl border border-white/5 mb-8`,
                      children: [
                        (0, b.jsx)(`span`, {
                          className: `text-[9px] text-alacor-amber font-bold tracking-widest uppercase block mb-2`,
                          children: `EPP OBLIGATORIOS REQUERIDOS`,
                        }),
                        (0, b.jsx)(`h4`, {
                          className: `text-lg font-extrabold text-white mb-4 uppercase`,
                          children: w[e]?.title || 'Equipos de Protección Industrial',
                        }),
                        (0, b.jsx)(`p`, {
                          className: `text-xs text-gray-400 mb-6 font-light leading-relaxed`,
                          children: w[e]?.description || 'Protección reglamentaria para el sector.',
                        }),
                        (0, b.jsx)(`ul`, {
                          className: `space-y-2.5 text-xs`,
                          children: (w[e]?.obligatory || []).map((e, t) =>
                            (0, b.jsxs)(
                              `li`,
                              {
                                className: `flex items-start gap-2.5 text-gray-300`,
                                children: [
                                  (0, b.jsx)(`span`, {
                                    className: `text-alacor-amber font-bold text-sm`,
                                    children: `✓`,
                                  }),
                                  (0, b.jsx)(`span`, {
                                    className: `leading-tight`,
                                    children: e,
                                  }),
                                ],
                              },
                              t,
                            ),
                          ),
                        }),
                      ],
                    }),
                    (0, b.jsx)(`button`, {
                      onClick: () => da(w[e]),
                      className: `w-full bg-alacor-amber text-alacor-dark font-black py-4 rounded-full text-xs uppercase tracking-widest hover:bg-yellow-400 transition-all text-center cursor-pointer border-none`,
                      children: `Solicitar Cotización de estos EPP`,
                    }),
                  ],
                }),
                (0, b.jsx)(`div`, {
                  className: `lg:col-span-6 flex flex-col justify-center items-center`,
                  children: (0, b.jsxs)(`div`, {
                    className: `bg-white/5 p-3 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md w-full max-w-md`,
                    children: [
                      (0, b.jsx)(`div`, {
                        className: `relative overflow-hidden rounded-lg`,
                        children: (0, b.jsx)(`img`, {
                          src: `/img/marketing/guia_epp.jpg`,
                          alt: `Guía Técnica ALACOR EPP`,
                          className: `w-full object-cover`,
                        }),
                      }),
                      (0, b.jsxs)(`div`, {
                        className: `p-4 bg-black/40 mt-2 rounded-lg border border-white/5 flex items-center justify-between text-xs`,
                        children: [
                          (0, b.jsxs)(`div`, {
                            children: [
                              (0, b.jsx)(`span`, {
                                className: `font-bold text-white uppercase block text-[10px] tracking-wider mb-0.5`,
                                children: `AFICHE CORPORATIVO`,
                              }),
                              (0, b.jsx)(`span`, {
                                className: `text-gray-400`,
                                children: `Guía rápida de referencia técnica`,
                              }),
                            ],
                          }),
                          (0, b.jsx)(`a`, {
                            href: `/img/marketing/guia_epp.jpg`,
                            download: `Guia_EPP_Alacor.jpg`,
                            className: `bg-white/10 text-white font-bold px-4 py-2 rounded text-[10px] hover:bg-white/20 transition-all uppercase tracking-widest decoration-none inline-block text-center`,
                            children: `Descargar Guía`,
                          }),
                        ],
                      }),
                    ],
                  }),
                }),
              ],
            }),
          ],
        }),
      }),
      Ye !== null &&
        (0, b.jsx)(`div`, {
          className: `fixed inset-0 z-50 overflow-hidden flex items-center justify-end bg-black/85 backdrop-blur-sm transition-all duration-300`,
          children: (0, b.jsxs)(`div`, {
            className: `w-full max-w-lg h-full bg-alacor-dark border-l border-white/10 p-8 flex flex-col justify-between shadow-2xl animate-slide-in overflow-y-auto`,
            children: [
              (0, b.jsxs)(`div`, {
                children: [
                  (0, b.jsxs)(`div`, {
                    className: `flex justify-between items-center mb-8 pb-4 border-b border-white/10`,
                    children: [
                      (0, b.jsx)(`h4`, {
                        className: `text-lg font-black uppercase text-white`,
                        children: `Ficha Técnica Homologada`,
                      }),
                      (0, b.jsx)(`button`, {
                        onClick: () => Xe(null),
                        className: `text-gray-400 hover:text-white font-extrabold text-xl p-2 cursor-pointer border-none bg-transparent`,
                        children: `✕`,
                      }),
                    ],
                  }),
                  (0, b.jsx)(`span`, {
                    className: `text-xs text-alacor-amber font-bold tracking-widest uppercase block mb-1`,
                    children: Ye.brand,
                  }),
                  (0, b.jsx)(`h3`, {
                    className: `text-2xl font-black uppercase text-white mb-6 leading-tight`,
                    children: Ye.title,
                  }),
                  (0, b.jsxs)(`div`, {
                    className: `space-y-6`,
                    children: [
                      (0, b.jsxs)(`div`, {
                        children: [
                          (0, b.jsx)(`h5`, {
                            className: `text-xs text-gray-400 font-black tracking-widest uppercase mb-2`,
                            children: `Protocolos de Ensayo Laboratorio`,
                          }),
                          (0, b.jsx)(`p`, {
                            className: `text-xs text-gray-200 bg-white/5 px-4 py-3 rounded-lg border border-white/5 leading-relaxed`,
                            children: `Certificaciones bajo estándares internacionales (ANSI, OSHA, ASTM, EN ISO). Suministramos equipos con certificados vigentes y trazabilidad serial de fabricación para verificar la calidad y el cumplimiento técnico de cada producto.`,
                          }),
                        ],
                      }),
                      (0, b.jsxs)(`div`, {
                        children: [
                          (0, b.jsx)(`h5`, {
                            className: `text-xs text-gray-400 font-black tracking-widest uppercase mb-3`,
                            children: `Detalle Técnico de Materiales`,
                          }),
                          (0, b.jsxs)(`div`, {
                            className: `space-y-2.5 bg-white/5 p-4 rounded-lg border border-white/5`,
                            children: [
                              Ye.specs &&
                                Ye.specs.map((e, t) =>
                                  (0, b.jsxs)(
                                    `div`,
                                    {
                                      className: `flex justify-between py-1.5 border-b border-white/5 last:border-none text-xs`,
                                      children: [
                                        (0, b.jsx)(`span`, {
                                          className: `text-[10px] text-gray-400 uppercase font-medium`,
                                          children: e.label,
                                        }),
                                        (0, b.jsx)(`span`, {
                                          className: `text-white font-bold`,
                                          children: e.val,
                                        }),
                                      ],
                                    },
                                    t,
                                  ),
                                ),
                              (0, b.jsxs)(`div`, {
                                className: `flex justify-between py-1.5 text-xs`,
                                children: [
                                  (0, b.jsx)(`span`, {
                                    className: `text-[10px] text-gray-400 uppercase font-medium`,
                                    children: `Norma de Ensayo`,
                                  }),
                                  (0, b.jsx)(`span`, {
                                    className: `text-green-400 font-bold`,
                                    children: Ye.standards,
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              (0, b.jsxs)(`div`, {
                className: `pt-6 border-t border-white/10 mt-8 space-y-3`,
                children: [
                  (0, b.jsxs)(`button`, {
                    onClick: () => {
                      (Ri(Ye), Xe(null));
                    },
                    className: `w-full bg-alacor-amber hover:bg-yellow-400 text-alacor-dark font-black py-4 rounded-full text-xs uppercase tracking-widest hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer shadow-lg border-none flex items-center justify-center gap-2`,
                    children: [
                      (0, b.jsx)(`span`, { children: `🛒` }),
                      (0, b.jsx)(`span`, { children: `Añadir a Lista de Cotización` }),
                    ],
                  }),
                  Ye.technicalSheetUrl &&
                    (0, b.jsx)(`a`, {
                      href: Ye.technicalSheetUrl,
                      target: `_blank`,
                      rel: `noreferrer`,
                      className: `flex items-center justify-center gap-2 border border-white/15 bg-white/5 hover:bg-white/10 text-white font-extrabold py-3.5 rounded-full text-xs uppercase tracking-widest transition-all text-center cursor-pointer no-underline`,
                      children: `📄 Descargar PDF Ficha Técnica`,
                    }),
                ],
              }),
            ],
          }),
        }),
      (0, b.jsx)(`section`, {
        id: `seguridad-hub`,
        className: `relative py-24 bg-alacor-black border-t border-white/5 scroll-mt-20`,
        children: (0, b.jsxs)(`div`, {
          className: `container mx-auto px-6`,
          children: [
            (0, b.jsxs)(`div`, {
              className: `max-w-3xl mb-12`,
              children: [
                (0, b.jsx)(`span`, {
                  className: `text-xs font-bold tracking-widest text-alacor-amber uppercase mb-2 block`,
                  children: `CENTRO DE RECURSOS`,
                }),
                (0, b.jsx)(`h2`, {
                  className: `text-3xl lg:text-4xl font-black uppercase text-white tracking-tight`,
                  children: `INFORMACIÓN TÉCNICA & CONSEJOS DE SEGURIDAD`,
                }),
                (0, b.jsx)(`p`, {
                  className: `text-gray-400 mt-4 font-light text-sm md:text-base`,
                  children: `Explore recomendaciones de inspección para sus equipos de protección, acceda a demostraciones técnicas de productos y novedades del sector curadas con Inteligencia Artificial.`,
                }),
              ],
            }),
            (0, b.jsx)(`div`, {
              className: `flex flex-wrap gap-2 md:gap-4 mb-10 border-b border-white/5 pb-4`,
              children: [
                {
                  id: `consejos`,
                  label: `💡 Consejos de Inspección`,
                  desc: `Revisión pre-uso`,
                },
                {
                  id: `noticias`,
                  label: `📰 Noticias del Sector`,
                  desc: `Curaduría con IA`,
                },
                {
                  id: `videos`,
                  label: `🎬 Demostraciones 360°`,
                  desc: `Videos de producto`,
                },
              ].map((e) =>
                (0, b.jsxs)(
                  `button`,
                  {
                    onClick: () => {
                      (wn(e.id),
                        e.id === `videos` &&
                          setTimeout(() => {
                            n.current?.load();
                          }, 50));
                    },
                    className: `flex-1 min-w-[200px] p-4 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all duration-300 cursor-pointer ${Cn === e.id ? `border-alacor-amber bg-alacor-amber/10 text-white font-semibold shadow-[0_0_24px_rgba(242,179,0,0.12)]` : `border-white/5 bg-white/2 hover:bg-white/5 text-gray-400`}`,
                    children: [
                      (0, b.jsx)(`span`, {
                        className: `text-xs md:text-sm font-black uppercase tracking-wider block`,
                        children: e.label,
                      }),
                      (0, b.jsx)(`span`, {
                        className: `text-[10px] text-gray-500 font-light block`,
                        children: e.desc,
                      }),
                    ],
                  },
                  e.id,
                ),
              ),
            }),
            (0, b.jsxs)(`div`, {
              className: `w-full mb-10`,
              children: [
                Cn === `consejos` &&
                  (0, b.jsx)(`div`, {
                    className: `grid grid-cols-1 md:grid-cols-2 gap-6`,
                    children: (Array.isArray(C) ? C : []).map((e) => {
                      let t = jn === e.id;
                      return (0, b.jsxs)(
                        `div`,
                        {
                          className: `bg-white/2 border rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between ${t ? `border-alacor-amber bg-alacor-amber/5` : `border-white/5 hover:border-white/10`}`,
                          children: [
                            (0, b.jsxs)(`div`, {
                              children: [
                                (0, b.jsxs)(`div`, {
                                  className: `flex items-center gap-3 mb-3`,
                                  children: [
                                    (0, b.jsx)(`span`, {
                                      className: `text-2xl`,
                                      children: e.icon,
                                    }),
                                    (0, b.jsx)(`h4`, {
                                      className: `text-base font-bold text-white uppercase tracking-wide`,
                                      children: e.title,
                                    }),
                                  ],
                                }),
                                (0, b.jsx)(`p`, {
                                  className: `text-xs text-gray-400 font-light mb-4`,
                                  children: e.short,
                                }),
                                t &&
                                  (0, b.jsxs)(`div`, {
                                    className: `space-y-3 mt-4 pt-4 border-t border-white/5 animate-fade-in text-left`,
                                    children: [
                                      (0, b.jsx)(`span`, {
                                        className: `text-[9px] text-alacor-amber font-black tracking-widest uppercase block mb-1`,
                                        children: `Checklist de Verificación Obligatorio:`,
                                      }),
                                      (0, b.jsx)(`ul`, {
                                        className: `space-y-2.5 text-xs text-gray-300`,
                                        children: e.steps.map((e, t) =>
                                          (0, b.jsxs)(
                                            `li`,
                                            {
                                              className: `flex items-start gap-2.5`,
                                              children: [
                                                (0, b.jsx)(`span`, {
                                                  className: `text-alacor-amber font-bold text-sm`,
                                                  children: `✓`,
                                                }),
                                                (0, b.jsx)(`span`, {
                                                  className: `leading-relaxed font-light`,
                                                  children: e,
                                                }),
                                              ],
                                            },
                                            t,
                                          ),
                                        ),
                                      }),
                                    ],
                                  }),
                              ],
                            }),
                            (0, b.jsx)(`button`, {
                              onClick: () => Mn(t ? null : e.id),
                              className: `mt-6 w-full py-2 bg-white/5 hover:bg-white/10 text-white font-extrabold text-[10px] rounded-xl uppercase tracking-widest transition-all cursor-pointer border-none`,
                              children: t
                                ? `▲ Colapsar Checklist`
                                : `▼ Ver Checklist de Inspección`,
                            }),
                          ],
                        },
                        e.id,
                      );
                    }),
                  }),
                Cn === `noticias` &&
                  (0, b.jsxs)(`div`, {
                    className: `space-y-8`,
                    children: [
                      (0, b.jsxs)(`div`, {
                        className: `bg-gradient-to-r from-alacor-amber/10 to-transparent border border-alacor-amber/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4`,
                        children: [
                          (0, b.jsxs)(`div`, {
                            className: `flex items-center gap-3`,
                            children: [
                              (0, b.jsx)(`span`, {
                                className: `text-2xl`,
                                children: `🤖`,
                              }),
                              (0, b.jsxs)(`div`, {
                                className: `text-left`,
                                children: [
                                  (0, b.jsx)(`span`, {
                                    className: `text-[9px] bg-alacor-amber text-alacor-dark font-black px-2 py-0.5 rounded uppercase tracking-wider mb-1 inline-block`,
                                    children: `Curado por IA`,
                                  }),
                                  (0, b.jsx)(`h4`, {
                                    className: `text-sm font-extrabold text-white uppercase leading-none`,
                                    children: `Noticias escaneadas automáticamente`,
                                  }),
                                  (0, b.jsx)(`p`, {
                                    className: `text-xs text-gray-400 font-light mt-1`,
                                    children: `Monitoreamos diariamente boletines de prensa oficiales usando modelos avanzados de IA.`,
                                  }),
                                ],
                              }),
                            ],
                          }),
                          (0, b.jsx)(`div`, {
                            className: `flex gap-2 flex-wrap`,
                            children: [
                              { id: `all`, label: `Todo` },
                              { id: `normativa`, label: `⚖️ Normas` },
                              { id: `prevencion`, label: `🛡️ Prevención` },
                              { id: `actualidad`, label: `📢 Actualidad` },
                            ].map((e) =>
                              (0, b.jsx)(
                                `button`,
                                {
                                  onClick: () => En(e.id),
                                  className: `px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border cursor-pointer transition-all ${Tn === e.id ? `bg-alacor-amber text-alacor-dark border-alacor-amber shadow` : `bg-white/5 text-gray-400 border-white/10 hover:bg-white/10`}`,
                                  children: e.label,
                                },
                                e.id,
                              ),
                            ),
                          }),
                        ],
                      }),
                      (0, b.jsx)(`div`, {
                        className: `grid grid-cols-1 md:grid-cols-2 gap-6 text-left`,
                        children: te
                          .filter((e) => Tn === `all` || e.category === Tn)
                          .map((e) =>
                            (0, b.jsxs)(
                              `div`,
                              {
                                className: `bg-white/2 border border-white/5 rounded-3xl p-6 flex flex-col justify-between hover:border-white/10 transition-all`,
                                children: [
                                  (0, b.jsxs)(`div`, {
                                    className: `space-y-3`,
                                    children: [
                                      (0, b.jsxs)(`div`, {
                                        className: `flex items-center justify-between`,
                                        children: [
                                          (0, b.jsx)(`span`, {
                                            className: `text-[9px] bg-white/10 text-gray-400 px-2 py-1 rounded-full font-bold uppercase tracking-wider`,
                                            children:
                                              e.category === `normativa`
                                                ? `⚖️ Normas`
                                                : e.category === `prevencion`
                                                  ? `🛡️ Prevención`
                                                  : `📢 Actualidad`,
                                          }),
                                          (0, b.jsx)(`span`, {
                                            className: `text-[10px] text-gray-500 font-light`,
                                            children: e.date,
                                          }),
                                        ],
                                      }),
                                      (0, b.jsx)(`h4`, {
                                        className: `text-sm font-bold text-white uppercase tracking-tight leading-snug line-clamp-2`,
                                        title: e.title,
                                        children: e.title,
                                      }),
                                      (0, b.jsx)(`p`, {
                                        className: `text-xs text-gray-400 font-light leading-relaxed`,
                                        children: e.summary,
                                      }),
                                      (0, b.jsxs)(`div`, {
                                        className: `flex items-center gap-2 pt-2 text-[10px] text-alacor-amber font-bold`,
                                        children: [
                                          (0, b.jsx)(`span`, {
                                            children: `Fuente:`,
                                          }),
                                          (0, b.jsx)(`span`, {
                                            className: `text-gray-300 font-semibold`,
                                            children: e.source,
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  (0, b.jsx)(`div`, {
                                    className: `pt-5 mt-4 border-t border-white/5`,
                                    children: (0, b.jsx)(`a`, {
                                      href: e.sourceUrl,
                                      target: `_blank`,
                                      rel: `noopener noreferrer`,
                                      className: `w-full bg-white/5 hover:bg-white/10 text-white font-extrabold py-2 px-4 rounded-xl text-[10px] uppercase tracking-widest transition-all text-center decoration-none inline-block border border-white/10 cursor-pointer`,
                                      children: `Leer Artículo Completo ↗`,
                                    }),
                                  }),
                                ],
                              },
                              e.id,
                            ),
                          ),
                      }),
                      (0, b.jsxs)(`div`, {
                        className: `bg-gradient-to-br from-alacor-amber/5 to-white/2 border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 text-left`,
                        children: [
                          (0, b.jsxs)(`div`, {
                            className: `text-left max-w-xl`,
                            children: [
                              (0, b.jsx)(`span`, {
                                className: `text-[9px] bg-alacor-amber/20 text-alacor-amber font-black px-2.5 py-1 rounded-full uppercase tracking-wider mb-2 inline-block`,
                                children: `Alertas de Productos`,
                              }),
                              (0, b.jsx)(`h4`, {
                                className: `text-md font-extrabold text-white uppercase leading-none`,
                                children: `Suscríbase a nuestro boletín de novedades`,
                              }),
                              (0, b.jsx)(`p`, {
                                className: `text-xs text-gray-400 mt-1.5 font-light leading-relaxed`,
                                children: `Reciba notificaciones sobre lanzamientos, guías de inspección de EPP y noticias técnicas del sector industrial en su correo.`,
                              }),
                            ],
                          }),
                          (0, b.jsx)(`div`, {
                            className: `w-full md:w-auto shrink-0 min-w-[300px]`,
                            children: kn
                              ? (0, b.jsx)(`div`, {
                                  className: `bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl p-4 text-center text-xs font-bold uppercase tracking-wider`,
                                  children: `✓ ¡Suscrito con éxito! Gracias por confiar en ALACOR.`,
                                })
                              : (0, b.jsxs)(`form`, {
                                  onSubmit: (e) => {
                                    if ((e.preventDefault(), Dn.trim())) {
                                      let e =
                                          localStorage.getItem(
                                            `alacor_subscribers`,
                                          ) || `[]`,
                                        t = JSON.parse(e);
                                      (t.includes(Dn.trim()) ||
                                        (t.push(Dn.trim()),
                                        localStorage.setItem(
                                          `alacor_subscribers`,
                                          JSON.stringify(t),
                                        )),
                                        An(!0),
                                        On(``));
                                    }
                                  },
                                  className: `flex gap-2`,
                                  children: [
                                    (0, b.jsx)(`input`, {
                                      type: `email`,
                                      required: !0,
                                      placeholder: `ejemplo@empresa.com`,
                                      value: Dn,
                                      onChange: (e) => On(e.target.value),
                                      className: `flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-alacor-amber`,
                                    }),
                                    (0, b.jsx)(`button`, {
                                      type: `submit`,
                                      className: `bg-alacor-amber text-alacor-dark font-black px-5 py-3 rounded-xl text-xs uppercase tracking-widest hover:bg-yellow-400 transition-all cursor-pointer border-none`,
                                      children: `Suscribirse`,
                                    }),
                                  ],
                                }),
                          }),
                        ],
                      }),
                    ],
                  }),
                Cn === `videos` &&
                  (0, b.jsxs)(`div`, {
                    className: `space-y-6`,
                    children: [
                      (0, b.jsxs)(`div`, {
                        className: `w-full bg-white/2 border border-white/5 rounded-3xl p-5 md:p-6 backdrop-blur-md`,
                        children: [
                          (0, b.jsxs)(`div`, {
                            className: `flex items-center justify-between mb-4`,
                            children: [
                              (0, b.jsx)(`span`, {
                                className: `text-[10px] text-alacor-amber font-black tracking-widest uppercase`,
                                children: `DEMOSTRACIONES MULTIMEDIA DE PRODUCTO`,
                              }),
                              (0, b.jsxs)(`div`, {
                                className: `flex items-center gap-2`,
                                children: [
                                  (0, b.jsx)(`div`, {
                                    className: `w-1.5 h-1.5 rounded-full bg-alacor-amber animate-ping`,
                                  }),
                                  (0, b.jsx)(`span`, {
                                    className: `text-[10px] text-gray-400 uppercase tracking-wider font-bold`,
                                    children: `EN VIVO`,
                                  }),
                                ],
                              }),
                            ],
                          }),
                          (() => {
                            let e = a.find((e) => e.key === s) || a[0] || {},
                              t = p[s]?.videos?.[u]?.src || e.videoSrc;
                            return (0, b.jsxs)(`div`, {
                              className: `grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch`,
                              children: [
                                (0, b.jsxs)(`div`, {
                                  className: `w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative bg-black flex flex-col justify-between min-h-[350px] aspect-[16/10]`,
                                  children: [
                                    (0, b.jsx)(
                                      `video`,
                                      {
                                        ref: n,
                                        src: t,
                                        controls: !0,
                                        autoPlay: !0,
                                        muted: !0,
                                        loop: !0,
                                        playsInline: !0,
                                        className: `absolute inset-0 w-full h-full object-cover`,
                                      },
                                      t,
                                    ),
                                    (0, b.jsxs)(`div`, {
                                      className: `absolute top-3 left-3 flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 z-10`,
                                      children: [
                                        pa(e.icon, `w-5 h-5`),
                                        (0, b.jsx)(`span`, {
                                          className: `text-[11px] font-black uppercase tracking-widest text-white`,
                                          children: e.title,
                                        }),
                                      ],
                                    }),
                                    (0, b.jsx)(`div`, {
                                      className: `absolute top-3 right-3 bg-alacor-amber/90 text-alacor-dark px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow z-10`,
                                      children: `🔄 Vista 360°`,
                                    }),
                                    (p[s]?.videos?.length || 0) > 1 &&
                                      (0, b.jsx)(`div`, {
                                        className: `absolute bottom-3 left-3 right-3 flex gap-2 flex-wrap z-10`,
                                        children: p[s].videos.map((e, t) =>
                                          (0, b.jsx)(
                                            `button`,
                                            {
                                              onClick: () => {
                                                (d(t),
                                                  setTimeout(() => {
                                                    (n.current?.load(),
                                                      n.current
                                                        ?.play()
                                                        .catch(() => {}));
                                                  }, 50));
                                              },
                                              className: `px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${u === t ? `bg-alacor-amber text-alacor-dark border-alacor-amber` : `bg-black/60 text-white border-white/20 hover:bg-white/10`}`,
                                              children: e.label,
                                            },
                                            t,
                                          ),
                                        ),
                                      }),
                                  ],
                                }),
                                (0, b.jsxs)(`div`, {
                                  className: `bg-alacor-amber rounded-2xl p-6 md:p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl min-h-[350px]`,
                                  children: [
                                    (0, b.jsx)(`div`, {
                                      className: `absolute -right-10 -top-10 w-40 h-40 bg-black/10 rounded-full pointer-events-none`,
                                    }),
                                    (0, b.jsx)(`div`, {
                                      className: `absolute -left-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full pointer-events-none`,
                                    }),
                                    (0, b.jsxs)(`div`, {
                                      className: `relative z-10 text-left`,
                                      children: [
                                        (0, b.jsx)(`span`, {
                                          className: `text-alacor-dark/60 text-[9px] font-black tracking-[0.3em] uppercase mb-2 block`,
                                          children: `ESPECIFICACIONES TÉCNICAS`,
                                        }),
                                        (0, b.jsx)(`h3`, {
                                          className: `text-2xl font-black text-alacor-dark uppercase tracking-tight mb-4`,
                                          children: e.title,
                                        }),
                                        (() => {
                                          let e = (p[s]?.videos || [])[u],
                                            t =
                                              e && e.descriptions
                                                ? e.descriptions
                                                : p[s]?.descriptions || [];
                                          return t.length > 0
                                            ? (0, b.jsx)(`ul`, {
                                                className: `space-y-3`,
                                                children: t.map((e, t) =>
                                                  (0, b.jsxs)(
                                                    `li`,
                                                    {
                                                      className: `flex items-start gap-2.5`,
                                                      children: [
                                                        (0, b.jsx)(`span`, {
                                                          className: `text-alacor-dark font-black text-sm leading-none mt-0.5 flex-shrink-0`,
                                                          children: `✓`,
                                                        }),
                                                        (0, b.jsx)(`span`, {
                                                          className: `text-xs text-alacor-dark/95 leading-relaxed font-semibold`,
                                                          children: e,
                                                        }),
                                                      ],
                                                    },
                                                    t,
                                                  ),
                                                ),
                                              })
                                            : (0, b.jsx)(`p`, {
                                                className: `text-alacor-dark/60 text-xs italic text-left`,
                                                children: `No hay especificaciones disponibles.`,
                                              });
                                        })(),
                                      ],
                                    }),
                                    (0, b.jsxs)(`div`, {
                                      className: `relative z-10 mt-6 pt-4 border-t border-alacor-dark/10 flex justify-between items-center text-[10px] text-alacor-dark/60 font-bold uppercase tracking-wider`,
                                      children: [
                                        (0, b.jsx)(`span`, {
                                          children: `ALACOR SEGURIDAD`,
                                        }),
                                        (0, b.jsx)(`span`, {
                                          children: `PRODUCTO ORIGINAL CERTIFICADO`,
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            });
                          })(),
                          (0, b.jsxs)(`div`, {
                            className: `flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 gap-2`,
                            children: [
                              (0, b.jsxs)(`span`, {
                                className: `text-xs text-gray-400 font-light italic`,
                                children: [
                                  `Categoría activa: `,
                                  (0, b.jsx)(`strong`, {
                                    className: `text-white not-italic`,
                                    children: (a.find((e) => e.key === s) || {})
                                      .title,
                                  }),
                                ],
                              }),
                              (0, b.jsx)(`span`, {
                                className: `text-[10px] text-alacor-amber font-extrabold uppercase tracking-widest block`,
                                children: `ALACOR S.A.S. • VISTA INTERACTIVA DE PRODUCTO`,
                              }),
                            ],
                          }),
                        ],
                      }),
                      (0, b.jsx)(`div`, {
                        className: `grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4`,
                        children: a.map((e) =>
                          (0, b.jsxs)(
                            `button`,
                            {
                              onClick: () => l(e.key),
                              className: `p-4 rounded-xl border text-left flex flex-col justify-between gap-3 transition-all duration-300 cursor-pointer ${s === e.key ? `border-alacor-amber bg-alacor-amber/10 text-white font-semibold shadow-[0_0_24px_rgba(242,179,0,0.18)]` : `border-white/5 bg-white/2 hover:bg-white/5 text-gray-400`}`,
                              children: [
                                (0, b.jsxs)(`div`, {
                                  className: `flex items-center justify-between w-full`,
                                  children: [
                                    pa(e.icon, `w-6 h-6`),
                                    (0, b.jsx)(`div`, {
                                      className: `w-1.5 h-1.5 rounded-full transition-all ${s === e.key ? `bg-alacor-amber animate-ping` : `bg-transparent`}`,
                                    }),
                                  ],
                                }),
                                (0, b.jsxs)(`div`, {
                                  className: `flex flex-col min-w-0`,
                                  children: [
                                    (0, b.jsx)(`span`, {
                                      className: `text-xs uppercase tracking-wider truncate font-bold`,
                                      title: e.title,
                                      children: e.title,
                                    }),
                                    (0, b.jsx)(`span`, {
                                      className: `text-[9px] text-gray-500 font-light truncate mt-0.5`,
                                      children: e.description,
                                    }),
                                  ],
                                }),
                              ],
                            },
                            e.key,
                          ),
                        ),
                      }),
                    ],
                  }),
              ],
            }),
            (0, b.jsx)(`div`, {
              className: `w-full bg-white/2 border border-white/5 rounded-3xl p-6 backdrop-blur-md text-left`,
              children: (0, b.jsxs)(`div`, {
                className: `flex gap-4 items-start`,
                children: [
                  (0, b.jsx)(`span`, {
                    className: `text-2xl mt-0.5`,
                    children: `⚠️`,
                  }),
                  (0, b.jsxs)(`div`, {
                    className: `space-y-2`,
                    children: [
                      (0, b.jsx)(`span`, {
                        className: `text-[10px] text-alacor-amber font-black tracking-widest uppercase block`,
                        children: `DESCARGO DE RESPONSABILIDAD LEGAL Y TÉCNICA`,
                      }),
                      (0, b.jsx)(`strong`, {
                        className: `font-bold text-white text-xs block uppercase`,
                        children: `Aviso Informativo sobre Checklists y Noticias de Productos`,
                      }),
                      (0, b.jsx)(`p`, {
                        className: `text-[11px] text-gray-400 font-light leading-relaxed`,
                        children: `Toda la información proporcionada en este Centro de Recursos (incluyendo checklists de inspección de EPP y novedades de la industria curadas por inteligencia artificial) es de carácter **meramente ilustrativo e informativo**. No constituye, bajo ninguna circunstancia, asesoramiento legal formal o una certificación técnica de cumplimiento de ninguna índole. El uso e inspección de los equipos de protección individual deben ceñirse estrictamente a los manuales del fabricante y a las auditorías formales realizadas por profesionales calificados. ALACOR S.A.S. facilita y enlaza las fuentes oficiales de referencia para que el usuario pueda contrastar y profundizar en los documentos técnicos de origen.`,
                      }),
                    ],
                  }),
                  (0, b.jsxs)(`div`, {
                    className: `mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-500`,
                    children: [
                      (0, b.jsx)(`span`, {
                        children: `ANSI Z89.1 • ANSI Z359.11 • EN 361`,
                      }),
                      (0, b.jsx)(`span`, {
                        className: `text-alacor-amber font-extrabold`,
                        children: `ALACOR S.A.S. 🛡️`,
                      }),
                    ],
                  }),
                ],
              }),
            }),
          ],
        }),
      }),
      /* --- Lead Pre-Capture Modal (B2B Contact Capture / Encuesta) --- */
      showLeadCaptureModal &&
        (0, b.jsx)(`div`, {
          className: `fixed inset-0 z-[110] overflow-y-auto flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in`,
          children: (0, b.jsxs)(`div`, {
            className: `w-full max-w-lg bg-[#0b1320] border border-alacor-amber/40 rounded-3xl p-6 md:p-8 shadow-2xl relative text-left`,
            children: [
              (0, b.jsx)(`button`, {
                onClick: () => setShowLeadCaptureModal(!1),
                className: `absolute top-4 right-4 text-gray-400 hover:text-white font-extrabold text-xl p-2 cursor-pointer border-none bg-transparent`,
                children: `✕`,
              }),
              (0, b.jsx)(`span`, {
                className: `text-[9px] bg-alacor-amber/20 text-alacor-amber font-black px-2.5 py-1 rounded-full uppercase tracking-wider mb-3 inline-block`,
                children: `SOLICITUD B2B / COTIZACIÓN DIRECTA`,
              }),
              (0, b.jsx)(`h3`, {
                className: `text-xl font-black text-white uppercase mb-2`,
                children: `Datos de Contacto Comercial`,
              }),
              (0, b.jsx)(`p`, {
                className: `text-xs text-gray-300 font-light mb-6 leading-relaxed`,
                children: `Para enviarle su oferta formal con precios corporativos, desgloses de impuestos y cotización de envío, ingrese sus datos de contacto por favor:`,
              }),
              (0, b.jsxs)(`form`, {
                onSubmit: (evt) => {
                  evt.preventDefault();
                  if (!Hn.trim() || !Wn.trim() || !Kn.trim()) {
                    alert("Por favor complete Nombre, Correo y Celular.");
                    return;
                  }
                  localStorage.setItem(`alacor_lead_company`, Rn);
                  const formattedLeadNit = Bn.trim() ? `${Bn.trim()}${calculateDIANDV(Bn) !== '' ? '-' + calculateDIANDV(Bn) : ''}` : '';
                  localStorage.setItem(`alacor_lead_nit`, formattedLeadNit);
                  localStorage.setItem(`alacor_lead_name`, Hn);
                  localStorage.setItem(`alacor_lead_email`, Wn);
                  localStorage.setItem(`alacor_lead_phone`, Kn);
                  localStorage.setItem(`alacor_lead_city`, Jn);
                  setShowLeadCaptureModal(!1);
                  if (pendingItemAdded) {
                    Ri(pendingItemAdded);
                    setPendingItemAdded(null);
                  } else {
                    Fn(!0);
                  }
                },
                className: `space-y-4`,
                children: [
                  (0, b.jsxs)(`div`, {
                    children: [
                      (0, b.jsx)(`label`, {
                        className: `block text-[10px] font-bold text-gray-400 uppercase mb-1`,
                        children: `Empresa / Razón Social (Opcional)`,
                      }),
                      (0, b.jsx)(`input`, {
                        type: `text`,
                        value: Rn,
                        onChange: (e) => zn(e.target.value),
                        placeholder: `Ej. Alacor Safe S.A.S.`,
                        className: `w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-alacor-amber transition-all`,
                      }),
                    ],
                  }),
                  (0, b.jsxs)(`div`, {
                    className: `grid grid-cols-2 gap-3`,
                    children: [
                      (0, b.jsxs)(`div`, {
                        children: [
                          (0, b.jsx)(`label`, {
                            className: `block text-[10px] font-bold text-gray-400 uppercase mb-1`,
                            children: `Nombre de Contacto *`,
                          }),
                          (0, b.jsx)(`input`, {
                            type: `text`,
                            required: !0,
                            value: Hn,
                            onChange: (e) => Un(e.target.value),
                            placeholder: `Carlos Pérez`,
                            className: `w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-alacor-amber transition-all`,
                          }),
                        ],
                      }),
                      (0, b.jsxs)(`div`, {
                        children: [
                          (0, b.jsx)(`label`, {
                            className: `block text-[10px] font-bold text-gray-400 uppercase mb-1`,
                            children: `NIT / Cédula (Opcional)`,
                          }),
                          (0, b.jsxs)(`div`, {
                            className: `flex gap-2 items-center`,
                            children: [
                              (0, b.jsx)(`input`, {
                                type: `text`,
                                value: Bn,
                                onChange: (e) => Vn(e.target.value.replace(/[^\d]/g, '')),
                                placeholder: `Ej. 900123456`,
                                className: `flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-alacor-amber transition-all`,
                              }),
                              (0, b.jsxs)(`div`, {
                                className: `flex items-center gap-1 bg-black/70 border border-white/10 px-2.5 py-2.5 rounded-xl select-none min-w-[48px] justify-center`,
                                title: `Dígito de Verificación (DV) DIAN generado automáticamente`,
                                children: [
                                  (0, b.jsx)(`span`, { className: `text-gray-500 text-xs font-bold font-mono`, children: `-` }),
                                  (0, b.jsx)(`span`, {
                                    className: `text-xs font-bold font-mono ${calculateDIANDV(Bn) !== '' ? 'text-alacor-amber' : 'text-gray-600'}`,
                                    children: calculateDIANDV(Bn) !== '' ? calculateDIANDV(Bn) : `DV`,
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                  (0, b.jsxs)(`div`, {
                    className: `grid grid-cols-2 gap-3`,
                    children: [
                      (0, b.jsxs)(`div`, {
                        children: [
                          (0, b.jsx)(`label`, {
                            className: `block text-[10px] font-bold text-gray-400 uppercase mb-1`,
                            children: `Correo Electrónico *`,
                          }),
                          (0, b.jsx)(`input`, {
                            type: `email`,
                            required: !0,
                            value: Wn,
                            onChange: (e) => Gn(e.target.value),
                            placeholder: `carlos@empresa.com`,
                            className: `w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-alacor-amber transition-all`,
                          }),
                        ],
                      }),
                      (0, b.jsxs)(`div`, {
                        children: [
                          (0, b.jsx)(`label`, {
                            className: `block text-[10px] font-bold text-gray-400 uppercase mb-1`,
                            children: `Celular / WhatsApp *`,
                          }),
                          (0, b.jsx)(`input`, {
                            type: `tel`,
                            required: !0,
                            value: Kn,
                            onChange: (e) => qn(e.target.value),
                            placeholder: `3101234567`,
                            className: `w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-alacor-amber transition-all`,
                          }),
                        ],
                      }),
                    ],
                  }),
                  (0, b.jsxs)(`div`, {
                    children: [
                      (0, b.jsx)(`label`, {
                        className: `block text-[10px] font-bold text-gray-400 uppercase mb-1`,
                        children: `Ciudad de Destino / Despacho`,
                      }),
                      (0, b.jsx)(`input`, {
                        type: `text`,
                        value: Jn,
                        onChange: (e) => Yn(e.target.value),
                        placeholder: `Ej. Bogotá, Medellín, Barranquilla...`,
                        className: `w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-alacor-amber transition-all`,
                      }),
                    ],
                  }),
                  (0, b.jsx)(`button`, {
                    type: `submit`,
                    className: `w-full bg-alacor-amber text-alacor-dark font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-lg cursor-pointer border-none mt-2`,
                    children: `Guardar Datos & Continuar 🚀`,
                  }),
                ],
              }),
            ],
          }),
        }),
      /* --- Modal Términos y Condiciones de Envío Nacional --- */
      showShippingTermsModal &&
        (0, b.jsx)(`div`, {
          className: `fixed inset-0 z-[120] overflow-y-auto flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in`,
          children: (0, b.jsxs)(`div`, {
            className: `w-full max-w-2xl bg-[#0e1622] border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl relative text-left text-gray-300 space-y-4 max-h-[85vh] overflow-y-auto`,
            children: [
              (0, b.jsx)(`button`, {
                onClick: () => setShowShippingTermsModal(!1),
                className: `absolute top-4 right-4 text-gray-400 hover:text-white font-extrabold text-xl p-2 cursor-pointer border-none bg-transparent`,
                children: `✕`,
              }),
              (0, b.jsx)(`span`, {
                className: `text-[9px] bg-alacor-amber/20 text-alacor-amber font-black px-2.5 py-1 rounded-full uppercase tracking-wider block w-max`,
                children: `POLÍTICA DE DESPACHOS Y COBERTURA LOGÍSTICA`,
              }),
              (0, b.jsx)(`h3`, {
                className: `text-2xl font-black text-white uppercase tracking-tight`,
                children: `Términos y Condiciones de Envío Nacional`,
              }),
              (0, b.jsxs)(`div`, {
                className: `space-y-3 text-xs leading-relaxed font-light border-t border-white/10 pt-4`,
                children: [
                  (0, b.jsxs)(`p`, {
                    children: [
                      (0, b.jsx)(`strong`, { className: `text-white font-bold`, children: `1. Cobertura Nacional:` }),
                      ` ALACOR S.A.S. despacha Equipos de Protección Personal (EPPs) y sistemas de seguridad industrial a todo el territorio colombiano a través de transportadoras aliadas certificadas.`,
                    ],
                  }),
                  (0, b.jsxs)(`p`, {
                    children: [
                      (0, b.jsx)(`strong`, { className: `text-white font-bold`, children: `2. Tiempos de Entrega:` }),
                      ` Ciudades principales (Bogotá, Medellín, Cali, Barranquilla): 24 a 48 horas hábiles. Ciudades intermedias y trayectos especiales: 48 a 72 horas hábiles tras la confirmación de pago o emisión de orden de compra corporativa.`,
                    ],
                  }),
                  (0, b.jsxs)(`p`, {
                    children: [
                      (0, b.jsx)(`strong`, { className: `text-white font-bold`, children: `3. Fletes y Costos de Transporte:` }),
                      ` Los costos de envío se cotizan formalmente según el peso, volumen y destino final de los equipos. Para compras superiores a montos corporativos acordados, el flete puede ser asumido por ALACOR S.A.S.`,
                    ],
                  }),
                ],
              }),
              (0, b.jsx)(`button`, {
                onClick: () => setShowShippingTermsModal(!1),
                className: `w-full bg-alacor-amber text-alacor-dark font-extrabold py-3 rounded-xl text-xs uppercase tracking-widest hover:bg-yellow-400 transition-all cursor-pointer border-none mt-4`,
                children: `Entendido y Acepto`,
              }),
            ],
          }),
        }),
      
      /* --- MÓDULO DE PREGUNTAS FRECUENTES (FAQ INDEXABLE Y ACCESIBLE) --- */
      (0, b.jsx)(`section`, {
        id: `faq-section`,
        className: `relative py-24 bg-gradient-to-b from-alacor-black to-black border-t border-white/5 scroll-mt-20`,
        children: (0, b.jsxs)(`div`, {
          className: `container mx-auto px-6 max-w-5xl`,
          children: [
            (0, b.jsxs)(`div`, {
              className: `text-center max-w-3xl mx-auto mb-16`,
              children: [
                (0, b.jsx)(`span`, {
                  className: `text-xs font-bold tracking-widest text-alacor-amber uppercase mb-2 block`,
                  children: `PREGUNTAS FRECUENTES • B2B & NORMATIVA`,
                }),
                (0, b.jsx)(`h2`, {
                  className: `text-3xl lg:text-4xl font-black uppercase text-white tracking-tight`,
                  children: `RESOLUCIÓN DE DUDAS TÉCNICAS Y COMERCIALES`,
                }),
                (0, b.jsx)(`p`, {
                  className: `text-gray-400 mt-4 font-light text-sm md:text-base leading-relaxed`,
                  children: `Información técnica y normativa verificada para Coordinadores de Compras y Jefes de SST. Cada respuesta cita su fuente oficial.`,
                }),
              ],
            }),
            (0, b.jsx)(`div`, {
              className: `space-y-4`,
              children: [
                {
                  id: `faq_1`,
                  tag: `Estadísticas Oficiales`,
                  q: `¿Cuántos accidentes laborales ocurren en Colombia y cuáles son los sectores más críticos?`,
                  a: `Según el Informe de Siniestralidad Laboral 2023 del Consejo Colombiano de Seguridad (CCS), elaborado con datos de Fasecolda, en Colombia se registraron 522.160 accidentes de trabajo durante ese año, con una tasa de 4,42 eventos por cada 100 trabajadores. Lo más alarmante: se presentaron 694 muertes laborales, la cifra más alta en los últimos siete años. Los sectores de construcción, explotación minera y atención en salud concentran la mayor mortalidad. Estos datos refuerzan la importancia de seleccionar EPP certificado y de mantener un SG-SST activo y documentado.`,
                  source: { label: `Fuente: CCS — Observatorio de Seguridad y Salud en el Trabajo 2023`, url: `https://ccs.org.co` },
                },
                {
                  id: `faq_2`,
                  tag: `Res. 4272 / Alturas`,
                  q: `¿Qué cambió en trabajo seguro en alturas con la Resolución 4272 de 2021 y qué EPP exige?`,
                  a: `La Resolución 4272 de 2021 del Ministerio del Trabajo derogó la Resolución 1409 de 2012 y entró en vigor el 27 de junio de 2022. Sus principales cambios: (1) Exige coordinador certificado de alturas en toda obra con trabajos a 2 metros o más. (2) Obliga a planes de rescate documentados antes de iniciar la tarea. (3) Los sistemas de protección contra caídas (arneses, eslingas, conectores y líneas de vida) deben tener certificación ANSI/ASSE Z359 o EN 361, con ficha técnica que incluya fecha de fabricación y registros de inspección periódica. (4) Todos los equipos deben retirarse del servicio tras sufrir una caída, sin importar si presentan daño visible.`,
                  source: { label: `Fuente: Resolución 4272 de 2021 — Alcaldía Mayor de Bogotá / SISJUR`, url: `https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=117625` },
                },
                {
                  id: `faq_3`,
                  tag: `Verificación de Proveedores`,
                  q: `¿Cómo verifico que el EPP que estoy comprando está realmente certificado y no me expone a sanciones?`,
                  a: `Un EPP legalmente válido en Colombia debe cumplir tres condiciones simultáneas: (1) Certificado de conformidad emitido por un organismo acreditado (ICONTEC, SGS, Bureau Veritas o Intertek), no una simple declaración del fabricante. (2) Ficha técnica con la norma específica aplicable: NTC para estándares nacionales, EN ISO o EN 166/EN 388/EN 361 para normas europeas, ANSI/ISEA para estándares americanos, o NIOSH para protección respiratoria. (3) Marcación permanente en el artículo con la norma y el lote de fabricación. Si el proveedor no entrega estos tres documentos por escrito con la orden de compra, el equipo no tiene respaldo legal ante una visita del Ministerio del Trabajo o una auditoría del SG-SST.`,
                  source: { label: `Fuente: MinTrabajo — Sistema de Gestión de Seguridad y Salud en el Trabajo`, url: `https://www.mintrabajo.gov.co/relaciones-laborales/riesgos-laborales/sistema-de-gestion-de-seguridad-y-salud-en-el-trabajo` },
                },
                {
                  id: `faq_4`,
                  tag: `Multas y Sanciones`,
                  q: `¿Cuáles son las multas reales por incumplir el SG-SST o suministrar EPP sin certificación?`,
                  a: `El Decreto 472 de 2015, reglamentario de la Ley 1562 de 2012, establece sanciones graduadas según el tamaño de la empresa y la gravedad de la infracción. Para empresas grandes (más de 201 trabajadores), el incumplimiento grave del SG-SST puede acarrear multas de hasta 500 SMMLV (aproximadamente $654 millones de pesos en 2024). Para empresas medianas (51-200 trabajadores), hasta 300 SMMLV. El suministro de EPP sin certificación, si deriva en un accidente, puede generar responsabilidad civil solidaria entre el empleador y el proveedor, y el cierre provisional del lugar de trabajo. El Ministerio del Trabajo puede iniciar investigación administrativa sin requerir denuncia previa.`,
                  source: { label: `Fuente: Decreto 472 de 2015 — Función Pública Colombia`, url: `https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=61099` },
                },
                {
                  id: `faq_5`,
                  tag: `Protección Respiratoria`,
                  q: `¿Qué diferencia hay entre un respirador N95, FFP2 y KN95, y cuál debo comprar para mi empresa?`,
                  a: `Los tres filtran al menos el 95% de partículas suspendidas, pero tienen origen normativo diferente con implicaciones legales distintas: N95 (certificación NIOSH, EE.UU. — organismo del CDC) es el estándar de referencia más auditado. FFP2 (norma EN 149:2001+A1:2009, Unión Europea) es válido para sectores de salud y construcción en Colombia bajo norma europea. KN95 (norma GB 2626, China) es aceptado en Colombia, pero solo si porta sello CE o certificación NIOSH verificable mediante número TC en la base de datos oficial del CDC. Un KN95 sin ese código de verificación es un equipo no certificado y no cumple con la Resolución 0312 de 2019 del Ministerio del Trabajo.`,
                  source: { label: `Fuente: NIOSH — Approved Particulate Filtering Facepiece Respirators (CDC.gov)`, url: `https://www.cdc.gov/niosh/topics/respirators/default.html` },
                },
                {
                  id: `faq_6`,
                  tag: `Búsqueda en Catálogo`,
                  q: `¿Cómo busco productos específicos en el catálogo?`,
                  a: `En la barra de búsqueda del catálogo puedes escribir directamente el nombre del producto (ej. guante carnaza, arnés multipropósito, respirador N95), el código de referencia (ej. AC502316) o cualquier característica técnica. El catálogo filtra los resultados en tiempo real entre más de 1.300 referencias activas, organizadas en 6 líneas industriales con sus subcategorías. Para navegar sin buscar, desplázate por las líneas de interés y selecciona la subcategoría que necesitas.`,
                },
                {
                  id: `faq_7`,
                  tag: `Guía de EPP`,
                  q: `¿Dónde consulto los elementos de protección obligatorios según la actividad de mis trabajadores?`,
                  a: `En la sección "Guía de EPP por Actividad" de la página web encontrarás matrices técnicas de protección organizadas por tipo de labor: trabajo en alturas, soldadura, manejo de sustancias químicas, excavación, obras civiles y mantenimiento eléctrico, entre otras. Cada actividad indica los EPP obligatorios asociados al riesgo, facilitando la elaboración de la matriz de peligros y la justificación de compras ante tu COPASST o auditoría del SG-SST.`,
                },
                {
                  id: `faq_8`,
                  tag: `Cotizador B2B`,
                  q: `¿Cómo armo y envío una solicitud de cotización formal?`,
                  a: `Selecciona los productos y las cantidades (incluyendo tallas o variantes cuando aplique) y agrégalos con el botón "Agregar a Cotización". Al abrir el panel lateral de cotización, ingresa los datos de tu empresa: razón social, NIT, nombre de contacto, correo corporativo, teléfono, ciudad y dirección de entrega. Al confirmar el envío, la solicitud queda radicada con un número de seguimiento oficial (REQ-...) y un asesor comercial la atiende en horario hábil.`,
                },
                {
                  id: `faq_9`,
                  tag: `Entrega de Cotización`,
                  q: `¿Por qué medio y en cuánto tiempo recibo la cotización económica formal?`,
                  a: `La cotización formal con precios corporativos, disponibilidad de inventario, tiempos de despacho y desgloses tributarios es elaborada por un asesor comercial asignado y se envía directamente al correo electrónico corporativo que registraste en la solicitud. El tiempo de respuesta estándar en días hábiles es de 1 a 2 horas. Si necesitas atención urgente o conocer el estado de tu solicitud, puedes consultarlo a través de nuestro Chatbot de Inteligencia Artificial integrado en la plataforma.`,
                },
                {
                  id: `faq_10`,
                  tag: `Portal SG-SST`,
                  q: `¿Cómo evalúo los estándares mínimos del SG-SST de mi empresa en esta plataforma?`,
                  a: `En la sección "Portal SG-SST" de la página web dispones de una herramienta interactiva de autodiagnóstico. Ingresando el número de trabajadores y el nivel de riesgo de tu empresa (I al V según el Decreto 1607 de 2002), el sistema identifica los estándares mínimos exigidos por la Resolución 0312 de 2019 del Ministerio del Trabajo y te permite solicitar acompañamiento técnico especializado para su implementación.`,
                },
              ].map((faq) => {
                const isOpen = openFaqId === faq.id;
                return (0, b.jsxs)(
                  `div`,
                  {
                    className: `border rounded-2xl transition-all duration-300 overflow-hidden ${isOpen ? `border-alacor-amber/50 bg-white/5` : `border-white/5 bg-white/2 hover:border-white/10`}`,
                    children: [
                      (0, b.jsxs)(`button`, {
                        type: `button`,
                        onClick: () => setOpenFaqId(isOpen ? null : faq.id),
                        className: `w-full p-6 text-left flex justify-between items-center gap-4 bg-transparent border-none cursor-pointer`,
                        children: [
                          (0, b.jsxs)(`div`, {
                            className: `space-y-1.5`,
                            children: [
                              (0, b.jsx)(`span`, {
                                className: `text-[9px] text-alacor-amber font-black tracking-widest uppercase block`,
                                children: faq.tag,
                              }),
                              (0, b.jsx)(`h4`, {
                                className: `text-sm md:text-base font-bold text-white tracking-tight`,
                                children: faq.q,
                              }),
                            ],
                          }),
                          (0, b.jsx)(`span`, {
                            className: `text-lg font-bold text-alacor-amber flex-shrink-0 transition-transform duration-300 ${isOpen ? `rotate-180` : ``}`,
                            children: `▾`,
                          }),
                        ],
                      }),
                      isOpen &&
                        (0, b.jsxs)(`div`, {
                          className: `px-6 pb-6 pt-3 border-t border-white/5 animate-fade-in text-left space-y-3`,
                          children: [
                            (0, b.jsx)(`p`, {
                              className: `text-xs md:text-sm text-gray-300 font-light leading-relaxed`,
                              children: faq.a,
                            }),
                            faq.source &&
                              (0, b.jsx)(`span`, {
                                title: faq.source.url,
                                className: `block text-[9px] text-gray-700 font-mono tracking-wide select-none cursor-default`,
                                children: faq.source.label,
                              }),
                          ],
                        }),
                    ],
                  },
                  faq.id,
                );
              }),
            }),
          ],
        }),
      }),

      (0, b.jsx)(`footer`, {
        className: `bg-black py-12 border-t border-white/5`,
        children: (0, b.jsxs)(`div`, {
          className: `container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-500`,
          children: [
            (0, b.jsxs)(`div`, {
              className: `flex items-center gap-2 w-full md:w-auto justify-start`,
              children: [
                (0, b.jsxs)(`button`, {
                  onClick: () => {
                    (Qe(!0), $e(!1), tt(``));
                  },
                  className: `group relative text-white/5 hover:text-alacor-amber transition cursor-pointer border-none bg-transparent p-1 text-[11px] flex items-center justify-center w-3 h-3`,
                  title: `Acceso Administrativo`,
                  children: [
                    (0, b.jsx)(`span`, {
                      className: `group-hover:hidden text-white/10`,
                      children: `|`,
                    }),
                    (0, b.jsx)(`span`, {
                      className: `hidden group-hover:inline`,
                      children: `🔒`,
                    }),
                  ],
                }),
                (0, b.jsx)(`p`, {
                  className: `text-xs md:text-sm text-gray-400 font-light`,
                  children: `© 2026 ALACOR S.A.S. Todos los derechos reservados. Distribuidor Autorizado.`,
                }),
              ],
            }),
            (0, b.jsxs)(`div`, {
              className: `flex flex-wrap gap-6 uppercase tracking-widest text-[10px] font-bold items-center md:pr-12 pr-6`,
              children: [
                (0, b.jsx)(`button`, {
                  onClick: () => setShowShippingTermsModal(!0),
                  className: `text-gray-400 hover:text-alacor-amber transition-colors cursor-pointer border-none bg-transparent uppercase tracking-widest text-[10px] font-bold p-0`,
                  children: `Términos de Envío`,
                }),
                (0, b.jsx)(`button`, {
                  onClick: () => sr(!0),
                  className: `text-gray-400 hover:text-alacor-amber transition-colors cursor-pointer border-none bg-transparent uppercase tracking-widest text-[10px] font-bold p-0`,
                  children: `Tratamiento de Datos`,
                }),
                (0, b.jsx)(`button`, {
                  onClick: () => document.getElementById(`asesor-section`)?.scrollIntoView({ behavior: `smooth` }),
                  className: `text-gray-400 hover:text-alacor-amber transition-colors cursor-pointer border-none bg-transparent uppercase tracking-widest text-[10px] font-bold p-0`,
                  children: `Guía de EPP`,
                }),
                (0, b.jsx)(`button`, {
                  onClick: () => document.getElementById(`sgsst-section`)?.scrollIntoView({ behavior: `smooth` }),
                  className: `text-gray-400 hover:text-alacor-amber transition-colors cursor-pointer border-none bg-transparent uppercase tracking-widest text-[10px] font-bold p-0`,
                  children: `Portal SG-SST`,
                }),
                (0, b.jsx)(`button`, {
                  onClick: () => document.getElementById(`faq-section`)?.scrollIntoView({ behavior: `smooth` }),
                  className: `text-gray-400 hover:text-alacor-amber transition-colors cursor-pointer border-none bg-transparent uppercase tracking-widest text-[10px] font-bold p-0`,
                  children: `Preguntas Frecuentes (FAQ)`,
                }),
              ],
            }),
          ],
        }),
      }),
      Ze &&
        (0, b.jsx)(`div`, {
          className: `fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-black/90 backdrop-blur-md transition-all duration-300`,
          children: (0, b.jsxs)(`div`, {
            className: `w-full max-w-4xl max-h-[90vh] bg-alacor-dialog border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl overflow-y-auto flex flex-col justify-between`,
            children: [
              (0, b.jsxs)(`div`, {
                className: `flex justify-between items-center pb-4 border-b border-white/10 mb-6`,
                children: [
                  (0, b.jsxs)(`div`, {
                    className: `flex flex-col gap-1 text-left`,
                    children: [
                      (0, b.jsxs)(`div`, {
                        className: `flex items-center gap-3`,
                        children: [
                          (0, b.jsx)(`span`, {
                            className: `text-2xl`,
                            children: `🔐`,
                          }),
                          (0, b.jsx)(`h3`, {
                            className: `text-xl font-black uppercase text-white tracking-wider leading-none`,
                            children: `Panel de Control Administrativo — ALACOR S.A.S.`,
                          }),
                        ],
                      }),
                      j &&
                        (0, b.jsx)(`div`, {
                          className: `pl-9 mt-1 flex items-center gap-2`,
                          children: Pi()
                            ? (0, b.jsxs)(`span`, {
                                className: `text-[9px] bg-yellow-500/20 text-yellow-400 font-bold px-2.5 py-1 rounded-full border border-yellow-500/30 flex items-center gap-1.5 animate-pulse uppercase tracking-wider`,
                                children: [
                                  (0, b.jsx)(`span`, {
                                    className: `w-1.5 h-1.5 rounded-full bg-yellow-400`,
                                  }),
                                  ` Cambios sin publicar en borrador`,
                                ],
                              })
                            : (0, b.jsxs)(`span`, {
                                className: `text-[9px] bg-green-500/20 text-green-400 font-bold px-2.5 py-1 rounded-full border border-green-500/30 flex items-center gap-1.5 uppercase tracking-wider`,
                                children: [
                                  (0, b.jsx)(`span`, {
                                    className: `w-1.5 h-1.5 rounded-full bg-green-400`,
                                  }),
                                  ` Borrador guardado y al día`,
                                ],
                              }),
                        }),
                    ],
                  }),
                  (0, b.jsxs)(`div`, {
                    className: `flex items-center gap-3`,
                    children: [
                      j &&
                        (0, b.jsx)(`button`, {
                          onClick: () => {
                            (Qe(!1), Ni(!0));
                          },
                          className: `bg-alacor-amber text-alacor-dark hover:bg-yellow-400 font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest transition-all cursor-pointer border-none flex items-center gap-1.5 shadow-md hover:scale-[1.02] active:scale-[0.98]`,
                          children: `👁️ Vista Previa`,
                        }),
                      (0, b.jsx)(`button`, {
                        onClick: () => Qe(!1),
                        className: `text-gray-400 hover:text-white font-extrabold text-sm p-2 cursor-pointer border-none bg-transparent`,
                        children: `✕ Cerrar`,
                      }),
                    ],
                  }),
                ],
              }),
              j
                ? (0, b.jsxs)(`div`, {
                    children: [
                      (0, b.jsxs)(`div`, {
                        className: `bg-alacor-card border border-alacor-amber/10 rounded-2xl p-5 mb-8 text-left`,
                        children: [
                          (0, b.jsxs)(`div`, {
                            children: [
                              (0, b.jsx)(`span`, {
                                className: `text-[9px] bg-alacor-amber/20 text-alacor-amber font-black px-2.5 py-1 rounded-full uppercase tracking-wider mb-2 inline-block`,
                                children: `Banner Principal`,
                              }),
                              (0, b.jsx)(`h4`, {
                                className: `text-md font-extrabold text-white uppercase leading-none mt-1`,
                                children: `Configuración del Banner Principal (Hero)`,
                              }),
                              (0, b.jsx)(`p`, {
                                className: `text-xs text-gray-500 mt-1 font-light`,
                                children: `Personaliza los textos, el video de fondo y la imagen comercial del banner de la página de inicio.`,
                              }),
                            ],
                          }),
                          (0, b.jsxs)(`div`, {
                            className: `grid grid-cols-1 md:grid-cols-2 gap-4 mt-5`,
                            children: [
                              (0, b.jsxs)(`div`, {
                                children: [
                                  (0, b.jsxs)(`label`, {
                                    className: `text-gray-500 text-[10px] uppercase block mb-1 flex items-center font-bold`,
                                    children: [
                                      `Título del Banner`,
                                      (0, b.jsx)(L, {
                                        text: `El encabezado principal visible en letras grandes en la página de inicio (ej: SEGURIDAD INDUSTRIAL DE ALTA GAMA).`,
                                      }),
                                    ],
                                  }),
                                  (0, b.jsx)(`input`, {
                                    type: `text`,
                                    value: yn,
                                    onChange: (e) => bn(e.target.value),
                                    className: `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-alacor-amber`,
                                    placeholder: `Título del Banner...`,
                                  }),
                                ],
                              }),
                              (0, b.jsxs)(`div`, {
                                children: [
                                  (0, b.jsxs)(`label`, {
                                    className: `text-gray-500 text-[10px] uppercase block mb-1 flex items-center font-bold`,
                                    children: [
                                      `Video de Fondo (Ruta)`,
                                      (0, b.jsx)(L, {
                                        text: `Ruta local o URL del video mp4 de fondo (ej: /img/marketing/Banner_pagina_web.mp4).`,
                                      }),
                                    ],
                                  }),
                                  (0, b.jsx)(`input`, {
                                    type: `text`,
                                    value: hn,
                                    onChange: (e) => gn(e.target.value),
                                    className: `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-alacor-amber font-mono`,
                                    placeholder: `Ruta del video mp4...`,
                                  }),
                                ],
                              }),
                              (0, b.jsxs)(`div`, {
                                className: `md:col-span-2`,
                                children: [
                                  (0, b.jsxs)(`label`, {
                                    className: `text-gray-500 text-[10px] uppercase block mb-1 flex items-center font-bold`,
                                    children: [
                                      `Subtítulo / Descripción`,
                                      (0, b.jsx)(L, {
                                        text: `Texto descriptivo secundario debajo del título (ej: Distribuidor calificado y especializado...).`,
                                      }),
                                    ],
                                  }),
                                  (0, b.jsx)(`textarea`, {
                                    value: xn,
                                    onChange: (e) => Sn(e.target.value),
                                    className: `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-alacor-amber h-16 resize-none`,
                                    placeholder: `Descripción del banner...`,
                                  }),
                                ],
                              }),
                              (0, b.jsxs)(`div`, {
                                className: `md:col-span-2`,
                                children: [
                                  (0, b.jsxs)(`label`, {
                                    className: `text-gray-500 text-[10px] uppercase block mb-1 flex items-center font-bold`,
                                    children: [
                                      `Imagen Comercial del Banner (Ruta)`,
                                      (0, b.jsx)(L, {
                                        text: `Ruta de la imagen de vista previa en la derecha del banner (ej: /img/marketing/hero_alacor_comercial.png).`,
                                      }),
                                    ],
                                  }),
                                  (0, b.jsx)(`input`, {
                                    type: `text`,
                                    value: _n,
                                    onChange: (e) => vn(e.target.value),
                                    className: `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-alacor-amber font-mono`,
                                    placeholder: `Ruta de la imagen comercial...`,
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                      (0, b.jsxs)(`div`, {
                        className: `bg-alacor-card border border-alacor-amber/10 rounded-2xl p-5 mb-8 mt-8 text-left`,
                        children: [
                          (0, b.jsxs)(`div`, {
                            children: [
                              (0, b.jsx)(`span`, {
                                className: `text-[9px] bg-alacor-amber/20 text-alacor-amber font-black px-2.5 py-1 rounded-full uppercase tracking-wider mb-2 inline-block`,
                                children: `Diseño Organizacional`,
                              }),
                              (0, b.jsx)(`h4`, {
                                className: `text-md font-extrabold text-white uppercase leading-none mt-1`,
                                children: `Gestión de Estructura (Líneas de Negocio y Categorías)`,
                              }),
                              (0, b.jsx)(`p`, {
                                className: `text-xs text-gray-500 mt-1 font-light`,
                                children: `Crea o elimina líneas de negocio corporativas y sus respectivas subcategorías en tiempo real.`,
                              }),
                            ],
                          }),
                          (0, b.jsxs)(`div`, {
                            className: `grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6`,
                            children: [
                              (0, b.jsxs)(`div`, {
                                className: `bg-white/2 border border-white/5 rounded-xl p-5 space-y-6`,
                                children: [
                                  (0, b.jsxs)(`div`, {
                                    children: [
                                      (0, b.jsxs)(`span`, {
                                        className: `text-[10px] text-alacor-amber font-black tracking-widest uppercase block mb-3 flex items-center`,
                                        children: [
                                          `📁 Configuración de Líneas de Negocio`,
                                          (0, b.jsx)(L, {
                                            text: `Administra las líneas de negocio de la página principal. Selecciona una línea existente para editar sus imágenes o crea una nueva.`,
                                          }),
                                        ],
                                      }),
                                      (0, b.jsxs)(`div`, {
                                        className: `flex bg-white/5 p-1 rounded-xl mb-4`,
                                        children: [
                                          (0, b.jsx)(`button`, {
                                            type: `button`,
                                            onClick: () => ia(`__new__`),
                                            className: `flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border-none text-center ${Xt === `__new__` ? `bg-alacor-amber text-alacor-dark shadow-md font-black` : `text-gray-400 hover:text-white bg-transparent`}`,
                                            children: `➕ Crear Nueva`,
                                          }),
                                          (0, b.jsx)(`button`, {
                                            type: `button`,
                                            onClick: () => {
                                              let e = Object.keys(O)[0];
                                              e && ia(e);
                                            },
                                            className: `flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border-none text-center ${Xt === `__new__` ? `text-gray-400 hover:text-white bg-transparent` : `bg-alacor-amber text-alacor-dark shadow-md font-black`}`,
                                            children: `✏️ Editar Existente`,
                                          }),
                                        ],
                                      }),
                                      Xt !== `__new__` &&
                                        (0, b.jsxs)(`div`, {
                                          className: `mb-4`,
                                          children: [
                                            (0, b.jsxs)(`label`, {
                                              className: `text-gray-500 text-[10px] uppercase block mb-1.5 flex items-center font-bold`,
                                              children: [
                                                `Seleccionar Línea a Editar`,
                                                (0, b.jsx)(L, {
                                                  text: `Elige cuál de las líneas de negocio existentes deseas modificar.`,
                                                }),
                                              ],
                                            }),
                                            (0, b.jsx)(`select`, {
                                              value: Xt,
                                              onChange: (e) =>
                                                ia(e.target.value),
                                              className: `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-alacor-amber cursor-pointer`,
                                              children: Object.keys(O).map(
                                                (e) =>
                                                  (0, b.jsxs)(
                                                    `option`,
                                                    {
                                                      value: e,
                                                      className: `bg-[#070b12]`,
                                                      children: [
                                                        O[e]?.title,
                                                        ` (`,
                                                        e,
                                                        `)`,
                                                      ],
                                                    },
                                                    e,
                                                  ),
                                              ),
                                            }),
                                          ],
                                        }),
                                      (0, b.jsxs)(`form`, {
                                        onSubmit: aa,
                                        className: `space-y-3.5`,
                                        children: [
                                          (0, b.jsx)(`span`, {
                                            className: `text-[10px] font-bold text-gray-400 uppercase block border-b border-white/5 pb-1`,
                                            children:
                                              Xt === `__new__`
                                                ? `Formulario: Nueva Línea`
                                                : `Formulario: Editar "${Ht}"`,
                                          }),
                                          (0, b.jsxs)(`div`, {
                                            className: `grid grid-cols-2 gap-3`,
                                            children: [
                                              (0, b.jsxs)(`div`, {
                                                children: [
                                                  (0, b.jsxs)(`label`, {
                                                    className: `text-gray-500 text-[10px] uppercase block mb-1 flex items-center font-bold`,
                                                    children: [
                                                      `Clave (ID único)`,
                                                      (0, b.jsx)(L, {
                                                        text: `Clave única en minúsculas (ej: alturas). No se puede modificar después de crear la línea.`,
                                                      }),
                                                    ],
                                                  }),
                                                  (0, b.jsx)(`input`, {
                                                    type: `text`,
                                                    placeholder: `ej: dotacion`,
                                                    value: Bt,
                                                    onChange: (e) =>
                                                      Vt(e.target.value),
                                                    disabled: Xt !== `__new__`,
                                                    className: `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-alacor-amber disabled:opacity-50 disabled:cursor-not-allowed font-mono`,
                                                  }),
                                                ],
                                              }),
                                              (0, b.jsxs)(`div`, {
                                                children: [
                                                  (0, b.jsxs)(`label`, {
                                                    className: `text-gray-500 text-[10px] uppercase block mb-1 flex items-center font-bold`,
                                                    children: [
                                                      `Título Público`,
                                                      (0, b.jsx)(L, {
                                                        text: `Nombre que se muestra públicamente en la tarjeta de la línea (ej: Seguridad Industrial).`,
                                                      }),
                                                    ],
                                                  }),
                                                  (0, b.jsx)(`input`, {
                                                    type: `text`,
                                                    placeholder: `ej: Dotación Industrial`,
                                                    value: Ht,
                                                    onChange: (e) =>
                                                      Ut(e.target.value),
                                                    className: `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-alacor-amber`,
                                                  }),
                                                ],
                                              }),
                                            ],
                                          }),
                                          (0, b.jsxs)(`div`, {
                                            className: `grid grid-cols-3 gap-3`,
                                            children: [
                                              (0, b.jsxs)(`div`, {
                                                className: `col-span-1`,
                                                children: [
                                                  (0, b.jsxs)(`label`, {
                                                    className: `text-gray-500 text-[10px] uppercase block mb-1 flex items-center font-bold`,
                                                    children: [
                                                      `Icono/Emoji`,
                                                      (0, b.jsx)(L, {
                                                        text: `Emoji descriptivo para la categoría (ej: 🛡️ o 🥾).`,
                                                      }),
                                                    ],
                                                  }),
                                                  (0, b.jsx)(`input`, {
                                                    type: `text`,
                                                    placeholder: `🛡️`,
                                                    value: Wt,
                                                    onChange: (e) =>
                                                      Gt(e.target.value),
                                                    className: `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-alacor-amber text-center`,
                                                  }),
                                                ],
                                              }),
                                              (0, b.jsxs)(`div`, {
                                                className: `col-span-2`,
                                                children: [
                                                  (0, b.jsxs)(`label`, {
                                                    className: `text-gray-500 text-[10px] uppercase block mb-1 flex items-center font-bold`,
                                                    children: [
                                                      `Imagen de Actividad (Ruta)`,
                                                      (0, b.jsx)(L, {
                                                        text: `Ruta de la foto o renderizado (ej: /img/marketing/trabajo_alturas.jpg) de un operario realizando la actividad.`,
                                                      }),
                                                    ],
                                                  }),
                                                  (0, b.jsx)(`input`, {
                                                    type: `text`,
                                                    placeholder: `ej: /img/marketing/calzado_industrial.jpg`,
                                                    value: Jt,
                                                    onChange: (e) =>
                                                      Yt(e.target.value),
                                                    className: `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-alacor-amber font-mono`,
                                                  }),
                                                ],
                                              }),
                                            ],
                                          }),
                                          (0, b.jsxs)(`div`, {
                                            children: [
                                              (0, b.jsxs)(`label`, {
                                                className: `text-gray-500 text-[10px] uppercase block mb-1 flex items-center font-bold`,
                                                children: [
                                                  `Descripción Corta`,
                                                  (0, b.jsx)(L, {
                                                    text: `Breve texto que describe el portafolio o alcance de esta línea de negocio.`,
                                                  }),
                                                ],
                                              }),
                                              (0, b.jsx)(`input`, {
                                                type: `text`,
                                                placeholder: `Breve descripción corporativa...`,
                                                value: Kt,
                                                onChange: (e) =>
                                                  qt(e.target.value),
                                                className: `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-alacor-amber`,
                                              }),
                                            ],
                                          }),
                                          (0, b.jsx)(`button`, {
                                            type: `submit`,
                                            className: `w-full bg-alacor-amber text-alacor-dark font-black py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-yellow-400 transition-all cursor-pointer border-none shadow-md`,
                                            children:
                                              Xt === `__new__`
                                                ? `➕ Crear Línea de Negocio`
                                                : `💾 Guardar Cambios en Línea`,
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  (0, b.jsxs)(`div`, {
                                    className: `border-t border-white/5 pt-4`,
                                    children: [
                                      (0, b.jsx)(`span`, {
                                        className: `text-[10px] font-bold text-gray-400 uppercase block mb-2`,
                                        children: `Eliminar Línea Existente`,
                                      }),
                                      (0, b.jsxs)(`div`, {
                                        className: `flex gap-3`,
                                        children: [
                                          (0, b.jsxs)(`select`, {
                                            value: Qt,
                                            onChange: (e) => $t(e.target.value),
                                            className: `flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-alacor-amber cursor-pointer`,
                                            children: [
                                              (0, b.jsx)(`option`, {
                                                value: ``,
                                                className: `bg-[#070b12]`,
                                                children: `— Seleccionar Línea —`,
                                              }),
                                              Object.keys(O).map((e) =>
                                                (0, b.jsxs)(
                                                  `option`,
                                                  {
                                                    value: e,
                                                    className: `bg-[#070b12]`,
                                                    children: [
                                                      O[e]?.title,
                                                      ` (`,
                                                      e,
                                                      `)`,
                                                    ],
                                                  },
                                                  e,
                                                ),
                                              ),
                                            ],
                                          }),
                                          (0, b.jsx)(`button`, {
                                            type: `button`,
                                            onClick: oa,
                                            className: `bg-red-600 hover:bg-red-500 text-white font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest transition-all cursor-pointer border-none`,
                                            children: `Eliminar`,
                                          }),
                                        ],
                                      }),
                                      (0, b.jsx)(`p`, {
                                        className: `text-[9px] text-gray-500 uppercase mt-2`,
                                        children: `🛡️ Las líneas principales (Seguridad Industrial, Calzado, Alturas) no pueden ser eliminadas.`,
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              (0, b.jsxs)(`div`, {
                                className: `bg-white/2 border border-white/5 rounded-xl p-5 space-y-6`,
                                children: [
                                  (0, b.jsxs)(`div`, {
                                    children: [
                                      (0, b.jsxs)(`span`, {
                                        className: `text-[10px] text-alacor-amber font-black tracking-widest uppercase block mb-3 flex items-center`,
                                        children: [
                                          `🌿 Configuración de Subcategorías`,
                                          (0, b.jsx)(L, {
                                            text: `Administra las subcategorías (líneas secundarias) de cada línea de negocio. Puedes crear una nueva o editar una existente.`,
                                          }),
                                        ],
                                      }),
                                      (0, b.jsxs)(`div`, {
                                        className: `flex bg-white/5 p-1 rounded-xl mb-4`,
                                        children: [
                                          (0, b.jsx)(`button`, {
                                            type: `button`,
                                            onClick: () => ca(`__new__`),
                                            className: `flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border-none text-center ${ln === `__new__` ? `bg-alacor-amber text-alacor-dark shadow-md font-black` : `text-gray-400 hover:text-white bg-transparent`}`,
                                            children: `➕ Crear Nueva`,
                                          }),
                                          (0, b.jsx)(`button`, {
                                            type: `button`,
                                            onClick: () => {
                                              ca(sa());
                                            },
                                            className: `flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border-none text-center ${ln === `__new__` ? `text-gray-400 hover:text-white bg-transparent` : `bg-alacor-amber text-alacor-dark shadow-md font-black`}`,
                                            children: `✏️ Editar Existente`,
                                          }),
                                        ],
                                      }),
                                      ln !== `__new__` &&
                                        (0, b.jsxs)(`div`, {
                                          className: `mb-4`,
                                          children: [
                                            (0, b.jsxs)(`label`, {
                                              className: `text-gray-500 text-[10px] uppercase block mb-1.5 flex items-center font-bold`,
                                              children: [
                                                `Seleccionar Subcategoría a Editar`,
                                                (0, b.jsx)(L, {
                                                  text: `Elige cuál de las subcategorías existentes deseas modificar.`,
                                                }),
                                              ],
                                            }),
                                            (0, b.jsx)(`select`, {
                                              value: ln,
                                              onChange: (e) =>
                                                ca(e.target.value),
                                              className: `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-alacor-amber cursor-pointer`,
                                              children: Object.keys(O).map(
                                                (e) =>
                                                  Object.keys(
                                                    O[e].sublines || {},
                                                  ).map((t) =>
                                                    (0, b.jsxs)(
                                                      `option`,
                                                      {
                                                        value: `${e}|${t}`,
                                                        className: `bg-[#070b12]`,
                                                        children: [
                                                          O[e]?.title,
                                                          ` ➔ `,
                                                          O[e]?.sublines?.[t]
                                                            ?.title || t,
                                                          ` (`,
                                                          t,
                                                          `)`,
                                                        ],
                                                      },
                                                      `${e}|${t}`,
                                                    ),
                                                  ),
                                              ),
                                            }),
                                          ],
                                        }),
                                      (0, b.jsxs)(`form`, {
                                        onSubmit: la,
                                        className: `space-y-3.5`,
                                        children: [
                                          (0, b.jsx)(`span`, {
                                            className: `text-[10px] font-bold text-gray-400 uppercase block border-b border-white/5 pb-1`,
                                            children:
                                              ln === `__new__`
                                                ? `Formulario: Nueva Subcategoría`
                                                : `Formulario: Editar "${an}"`,
                                          }),
                                          (0, b.jsxs)(`div`, {
                                            className: `grid grid-cols-2 gap-3`,
                                            children: [
                                              (0, b.jsxs)(`div`, {
                                                children: [
                                                  (0, b.jsxs)(`label`, {
                                                    className: `text-gray-500 text-[10px] uppercase block mb-1 flex items-center font-bold`,
                                                    children: [
                                                      `Línea Padre`,
                                                      (0, b.jsx)(L, {
                                                        text: `Línea de negocio a la que pertenece esta subcategoría.`,
                                                      }),
                                                    ],
                                                  }),
                                                  (0, b.jsx)(`select`, {
                                                    value: en,
                                                    onChange: (e) =>
                                                      tn(e.target.value),
                                                    className: `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-alacor-amber cursor-pointer`,
                                                    children: Object.keys(
                                                      O,
                                                    ).map((e) =>
                                                      (0, b.jsx)(
                                                        `option`,
                                                        {
                                                          value: e,
                                                          className: `bg-[#070b12]`,
                                                          children: O[e]?.title,
                                                        },
                                                        e,
                                                      ),
                                                    ),
                                                  }),
                                                ],
                                              }),
                                              (0, b.jsxs)(`div`, {
                                                children: [
                                                  (0, b.jsxs)(`label`, {
                                                    className: `text-gray-500 text-[10px] uppercase block mb-1 flex items-center font-bold`,
                                                    children: [
                                                      `Clave (ID único)`,
                                                      (0, b.jsx)(L, {
                                                        text: `Código identificador único en minúsculas y sin espacios (ej: cabeza). No modificable al editar.`,
                                                      }),
                                                    ],
                                                  }),
                                                  (0, b.jsx)(`input`, {
                                                    type: `text`,
                                                    placeholder: `ej: overoles`,
                                                    value: nn,
                                                    onChange: (e) =>
                                                      rn(e.target.value),
                                                    disabled: ln !== `__new__`,
                                                    className: `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-alacor-amber disabled:opacity-50 disabled:cursor-not-allowed font-mono`,
                                                  }),
                                                ],
                                              }),
                                            ],
                                          }),
                                          (0, b.jsxs)(`div`, {
                                            children: [
                                              (0, b.jsxs)(`label`, {
                                                className: `text-gray-500 text-[10px] uppercase block mb-1 flex items-center font-bold`,
                                                children: [
                                                  `Título Público de Subcategoría`,
                                                  (0, b.jsx)(L, {
                                                    text: `El nombre visible de la subcategoría en el catálogo público (ej: Protección Visual).`,
                                                  }),
                                                ],
                                              }),
                                              (0, b.jsx)(`input`, {
                                                type: `text`,
                                                placeholder: `ej: Overoles y Trajes`,
                                                value: an,
                                                onChange: (e) =>
                                                  on(e.target.value),
                                                className: `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-alacor-amber`,
                                              }),
                                            ],
                                          }),
                                          (0, b.jsxs)(`div`, {
                                            children: [
                                              (0, b.jsxs)(`label`, {
                                                className: `text-gray-500 text-[10px] uppercase block mb-1 flex items-center font-bold`,
                                                children: [
                                                  `Descripción corta`,
                                                  (0, b.jsx)(L, {
                                                    text: `Breve resumen técnico o alcance de esta categoría de productos.`,
                                                  }),
                                                ],
                                              }),
                                              (0, b.jsx)(`input`, {
                                                type: `text`,
                                                placeholder: `Descripción técnica para la web...`,
                                                value: sn,
                                                onChange: (e) =>
                                                  cn(e.target.value),
                                                className: `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-alacor-amber`,
                                              }),
                                            ],
                                          }),
                                          (0, b.jsx)(`button`, {
                                            type: `submit`,
                                            className: `w-full bg-alacor-amber text-alacor-dark font-black py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-yellow-400 transition-all cursor-pointer border-none shadow-md`,
                                            children:
                                              ln === `__new__`
                                                ? `➕ Crear Subcategoría`
                                                : `💾 Guardar Cambios en Subcategoría`,
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  (0, b.jsxs)(`div`, {
                                    className: `border-t border-white/5 pt-4`,
                                    children: [
                                      (0, b.jsx)(`span`, {
                                        className: `text-[10px] font-bold text-gray-400 uppercase block mb-2`,
                                        children: `Eliminar Subcategoría`,
                                      }),
                                      (0, b.jsxs)(`div`, {
                                        className: `grid grid-cols-2 gap-3 mb-3`,
                                        children: [
                                          (0, b.jsxs)(`div`, {
                                            children: [
                                              (0, b.jsx)(`label`, {
                                                className: `text-gray-500 text-[9px] uppercase block mb-1`,
                                                children: `Línea Padre`,
                                              }),
                                              (0, b.jsxs)(`select`, {
                                                value: dn,
                                                onChange: (e) => {
                                                  (fn(e.target.value), mn(``));
                                                },
                                                className: `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-alacor-amber cursor-pointer`,
                                                children: [
                                                  (0, b.jsx)(`option`, {
                                                    value: ``,
                                                    className: `bg-[#070b12]`,
                                                    children: `— Seleccionar Línea —`,
                                                  }),
                                                  Object.keys(O).map((e) =>
                                                    (0, b.jsx)(
                                                      `option`,
                                                      {
                                                        value: e,
                                                        className: `bg-[#070b12]`,
                                                        children: O[e]?.title,
                                                      },
                                                      e,
                                                    ),
                                                  ),
                                                ],
                                              }),
                                            ],
                                          }),
                                          (0, b.jsxs)(`div`, {
                                            children: [
                                              (0, b.jsx)(`label`, {
                                                className: `text-gray-500 text-[9px] uppercase block mb-1`,
                                                children: `Subcategoría`,
                                              }),
                                              (0, b.jsxs)(`select`, {
                                                value: pn,
                                                onChange: (e) =>
                                                  mn(e.target.value),
                                                className: `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-alacor-amber cursor-pointer`,
                                                children: [
                                                  (0, b.jsx)(`option`, {
                                                    value: ``,
                                                    className: `bg-[#070b12]`,
                                                    children: `— Seleccionar Subcategoría —`,
                                                  }),
                                                  dn &&
                                                    O[dn] &&
                                                    O[dn].sublines &&
                                                    Object.keys(
                                                      O[dn].sublines,
                                                    ).map((e) =>
                                                      (0, b.jsx)(
                                                        `option`,
                                                        {
                                                          value: e,
                                                          className: `bg-[#070b12]`,
                                                          children:
                                                            O[dn]?.sublines?.[e]
                                                              ?.title || e,
                                                        },
                                                        e,
                                                      ),
                                                    ),
                                                ],
                                              }),
                                            ],
                                          }),
                                        ],
                                      }),
                                      (0, b.jsx)(`button`, {
                                        type: `button`,
                                        onClick: ua,
                                        className: `w-full bg-red-600 hover:bg-red-500 text-white font-black py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all cursor-pointer border-none`,
                                        children: `Eliminar Subcategoría Seleccionada`,
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                      (0, b.jsxs)(`div`, {
                        className: `grid grid-cols-1 lg:grid-cols-12 gap-8 items-start`,
                        children: [
                          (0, b.jsxs)(`div`, {
                            className: `lg:col-span-7 bg-white/2 border border-white/5 rounded-2xl p-6 text-left`,
                            children: [
                              (0, b.jsx)(`span`, {
                                className: `text-[10px] text-alacor-amber font-black tracking-widest uppercase block mb-2`,
                                children: `GESTIÓN COMERCIAL`,
                              }),
                              (0, b.jsx)(`h4`, {
                                className: `text-md font-black text-white uppercase mb-6 pb-2 border-b border-white/5`,
                                children: `Agregar Nuevo Producto al Catálogo`,
                              }),
                              (0, b.jsxs)(`form`, {
                                onSubmit: ta,
                                className: `space-y-4 text-xs`,
                                children: [
                                  (0, b.jsxs)(`div`, {
                                    className: `grid grid-cols-1 md:grid-cols-2 gap-4`,
                                    children: [
                                      (0, b.jsxs)(`div`, {
                                        children: [
                                          (0, b.jsx)(`label`, {
                                            className: `text-gray-400 block mb-1.5 font-semibold`,
                                            children: `1. Línea Principal de Producto`,
                                          }),
                                          (0, b.jsx)(`select`, {
                                            value: it,
                                            onChange: (e) => at(e.target.value),
                                            className: `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-alacor-amber cursor-pointer`,
                                            children: Object.keys(O).map((e) =>
                                              (0, b.jsx)(
                                                `option`,
                                                {
                                                  value: e,
                                                  className: `bg-[#070b12] text-white`,
                                                  children: O[e]?.title,
                                                },
                                                e,
                                              ),
                                            ),
                                          }),
                                        ],
                                      }),
                                      (0, b.jsxs)(`div`, {
                                        children: [
                                          (0, b.jsx)(`label`, {
                                            className: `text-gray-400 block mb-1.5 font-semibold`,
                                            children: `2. Subcategoría / Sublínea`,
                                          }),
                                          (0, b.jsx)(`select`, {
                                            value: ot,
                                            onChange: (e) => st(e.target.value),
                                            className: `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-alacor-amber cursor-pointer`,
                                            children:
                                              O[it] &&
                                              O[it].sublines &&
                                              Object.keys(O[it].sublines).map(
                                                (e) =>
                                                  (0, b.jsx)(
                                                    `option`,
                                                    {
                                                      value: e,
                                                      className: `bg-[#070b12] text-white`,
                                                      children:
                                                        O[it]?.sublines?.[e]
                                                          ?.title || e,
                                                    },
                                                    e,
                                                  ),
                                              ),
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  (0, b.jsxs)(`div`, {
                                    className: `grid grid-cols-1 md:grid-cols-3 gap-4`,
                                    children: [
                                      (0, b.jsxs)(`div`, {
                                        children: [
                                          (0, b.jsx)(`label`, {
                                            className: `text-gray-400 block mb-1.5 font-semibold`,
                                            children: `Marca Fabricante`,
                                          }),
                                          (0, b.jsx)(`input`, {
                                            type: `text`,
                                            placeholder: `Ej: STEELPRO®`,
                                            value: ct,
                                            onChange: (e) => lt(e.target.value),
                                            className: `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none`,
                                          }),
                                        ],
                                      }),
                                      (0, b.jsxs)(`div`, {
                                        className: `md:col-span-2`,
                                        children: [
                                          (0, b.jsx)(`label`, {
                                            className: `text-gray-400 block mb-1.5 font-semibold`,
                                            children: `Título del Producto *`,
                                          }),
                                          (0, b.jsx)(`input`, {
                                            type: `text`,
                                            placeholder: `Ej: Casco de Seguridad Tipo I`,
                                            value: ut,
                                            onChange: (e) => dt(e.target.value),
                                            className: `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none`,
                                            required: !0,
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  (0, b.jsxs)(`div`, {
                                    className: `grid grid-cols-1 md:grid-cols-2 gap-4`,
                                    children: [
                                      (0, b.jsxs)(`div`, {
                                        children: [
                                          (0, b.jsx)(`label`, {
                                            className: `text-gray-400 block mb-1.5 font-semibold`,
                                            children: `Código Referencia *`,
                                          }),
                                          (0, b.jsx)(`input`, {
                                            type: `text`,
                                            placeholder: `Ej: CA-100 / BO-550`,
                                            value: ft,
                                            onChange: (e) => pt(e.target.value),
                                            className: `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none`,
                                            required: !0,
                                          }),
                                        ],
                                      }),
                                      (0, b.jsxs)(`div`, {
                                        children: [
                                          (0, b.jsx)(`label`, {
                                            className: `text-gray-400 block mb-1.5 font-semibold`,
                                            children: `Normas de Ensayo / Certificaciones`,
                                          }),
                                          (0, b.jsx)(`input`, {
                                            type: `text`,
                                            placeholder: `Ej: ANSI Z89.1 / ASTM F2413`,
                                            value: mt,
                                            onChange: (e) => ht(e.target.value),
                                            className: `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none`,
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  (0, b.jsxs)(`div`, {
                                    children: [
                                      (0, b.jsx)(`label`, {
                                        className: `text-gray-400 block mb-1.5 font-semibold`,
                                        children: `Imagen del Producto (Ruta del Servidor)`,
                                      }),
                                      (0, b.jsxs)(`select`, {
                                        value: gt,
                                        onChange: (e) => _t(e.target.value),
                                        className: `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none cursor-pointer`,
                                        children: [
                                          (0, b.jsx)(`option`, {
                                            value: `/img/catalogo/Calzado_de_Seguridad_rep_Bota_Acces_Graso__Principal_.png`,
                                            className: `bg-[#070b12]`,
                                            children: `Bota Cuero Graso (BO-550)`,
                                          }),
                                          (0, b.jsx)(`option`, {
                                            value: `/img/catalogo/Calzado_de_Seguridad_rep_Bota_Agricola__Principal_.png`,
                                            className: `bg-[#070b12]`,
                                            children: `Bota Pantanera PVC (BO-AGRI)`,
                                          }),
                                          (0, b.jsx)(`option`, {
                                            value: `/img/catalogo/Calzado_de_Seguridad_rep_Bota_Agro__Principal_.jpeg`,
                                            className: `bg-[#070b12]`,
                                            children: `Bota Agro PVC Caña Alta (BO-AGRO)`,
                                          }),
                                          (0, b.jsx)(`option`, {
                                            value: `/img/catalogo/Trabajo_en_Alturas_rep_Arnes_Dielectrico_En_X_Faja.png`,
                                            className: `bg-[#070b12]`,
                                            children: `Arnés Dieléctrico en X`,
                                          }),
                                          (0, b.jsx)(`option`, {
                                            value: `/img/catalogo/Trabajo_en_Alturas_rep_Arnes_de_rescate_5_argollas_soporte_lumbar.png`,
                                            className: `bg-[#070b12]`,
                                            children: `Arnés de Rescate 5 Argollas`,
                                          }),
                                          (0, b.jsx)(`option`, {
                                            value: `/img/catalogo/Trabajo_en_Alturas_rep_Arnes_de_rescate_7_argollas_diel_ctrico_con_faja.jpg`,
                                            className: `bg-[#070b12]`,
                                            children: `Arnés de Rescate 7 Argollas`,
                                          }),
                                          (0, b.jsx)(`option`, {
                                            value: `/img/catalogo/Protecci_n_Visual_y_Facial_rep_Careta_con_Visor__Con_Ribete__Principal_.png`,
                                            className: `bg-[#070b12]`,
                                            children: `Careta con Visor y Ribete`,
                                          }),
                                          (0, b.jsx)(`option`, {
                                            value: `/img/catalogo/Protecci_n_Visual_y_Facial_rep_Careta_Protecci_n_Facial_PET.jpg`,
                                            className: `bg-[#070b12]`,
                                            children: `Careta Facial PET`,
                                          }),
                                          (0, b.jsx)(`option`, {
                                            value: `/img/catalogo/Protecci_n_Visual_y_Facial_rep_CARETA_FACIAL_PARA_ARCO_ELECTRICO_12_CAL_CM2.jpg`,
                                            className: `bg-[#070b12]`,
                                            children: `Careta Arco Eléctrico 12 Cal`,
                                          }),
                                          (0, b.jsx)(`option`, {
                                            value: `/img/catalogo/Protecci_n_Auditiva_rep_FONO_ZEN7_HV_DIADEMA_NRR24dB_SNR29dB.jpg`,
                                            className: `bg-[#070b12]`,
                                            children: `Fonos Zen 7 High Visibility`,
                                          }),
                                          (0, b.jsx)(`option`, {
                                            value: `/img/catalogo/Protecci_n_Auditiva_rep_Fono_CM_501__Principal_.png`,
                                            className: `bg-[#070b12]`,
                                            children: `Fonos CM-501 Diadema`,
                                          }),
                                          (0, b.jsx)(`option`, {
                                            value: `/img/catalogo/Protecci_n_Auditiva_rep_Fono_CM_502__Principal_.png`,
                                            className: `bg-[#070b12]`,
                                            children: `Fonos CM-502 Diadema`,
                                          }),
                                          (0, b.jsx)(`option`, {
                                            value: `/img/catalogo/Protecci_n_Respiratoria_rep_FILTRO_7093__P100_.jpg`,
                                            className: `bg-[#070b12]`,
                                            children: `Filtro P100 7093`,
                                          }),
                                          (0, b.jsx)(`option`, {
                                            value: `/img/catalogo/Protecci_n_Respiratoria_rep_Filtro_2097_3M.jpg`,
                                            className: `bg-[#070b12]`,
                                            children: `Filtro Carbón Activo 2097`,
                                          }),
                                          (0, b.jsx)(`option`, {
                                            value: `/img/catalogo/Protecci_n_Manual_rep_Guante_Carnaza_Lona_Reforzado__Principal_.jpeg`,
                                            className: `bg-[#070b12]`,
                                            children: `Guante Carnaza y Lona`,
                                          }),
                                          (0, b.jsx)(`option`, {
                                            value: `/img/catalogo/Dotaci_n_y_Ropa_de_Trabajo_rep_Camisa_En_Jean_7_Onzas_Dama_Caballero____Principal_.PNG`,
                                            className: `bg-[#070b12]`,
                                            children: `Camisa Jean 7 Onzas`,
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  (0, b.jsxs)(`div`, {
                                    children: [
                                      (0, b.jsx)(`label`, {
                                        className: `text-gray-400 block mb-1.5 font-semibold`,
                                        children: `Descripción Comercial *`,
                                      }),
                                      (0, b.jsx)(`textarea`, {
                                        placeholder: `Redacte una descripción técnica y comercial convincente del producto...`,
                                        rows: `3`,
                                        value: vt,
                                        onChange: (e) => yt(e.target.value),
                                        className: `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none`,
                                        required: !0,
                                      }),
                                    ],
                                  }),
                                  (0, b.jsxs)(`div`, {
                                    className: `bg-black/40 p-4 rounded-xl border border-white/5`,
                                    children: [
                                      (0, b.jsx)(`span`, {
                                        className: `text-[9px] text-alacor-amber font-bold tracking-widest uppercase block mb-3`,
                                        children: `Especificaciones de Ficha Técnica (4 campos)`,
                                      }),
                                      (0, b.jsxs)(`div`, {
                                        className: `grid grid-cols-2 gap-3 mb-2.5`,
                                        children: [
                                          (0, b.jsx)(`input`, {
                                            type: `text`,
                                            value: bt,
                                            onChange: (e) => xt(e.target.value),
                                            className: `bg-white/2 border border-white/5 rounded px-2.5 py-1.5 text-[10px] text-gray-400 font-bold uppercase`,
                                            placeholder: `Etiqueta 1`,
                                          }),
                                          (0, b.jsx)(`input`, {
                                            type: `text`,
                                            value: St,
                                            onChange: (e) => Ct(e.target.value),
                                            className: `bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-[11px] text-white`,
                                            placeholder: `Valor 1`,
                                          }),
                                        ],
                                      }),
                                      (0, b.jsxs)(`div`, {
                                        className: `grid grid-cols-2 gap-3 mb-2.5`,
                                        children: [
                                          (0, b.jsx)(`input`, {
                                            type: `text`,
                                            value: wt,
                                            onChange: (e) => Tt(e.target.value),
                                            className: `bg-white/2 border border-white/5 rounded px-2.5 py-1.5 text-[10px] text-gray-400 font-bold uppercase`,
                                            placeholder: `Etiqueta 2`,
                                          }),
                                          (0, b.jsx)(`input`, {
                                            type: `text`,
                                            value: Et,
                                            onChange: (e) => Dt(e.target.value),
                                            className: `bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-[11px] text-white`,
                                            placeholder: `Valor 2`,
                                          }),
                                        ],
                                      }),
                                      (0, b.jsxs)(`div`, {
                                        className: `grid grid-cols-2 gap-3 mb-2.5`,
                                        children: [
                                          (0, b.jsx)(`input`, {
                                            type: `text`,
                                            value: Ot,
                                            onChange: (e) => kt(e.target.value),
                                            className: `bg-white/2 border border-white/5 rounded px-2.5 py-1.5 text-[10px] text-gray-400 font-bold uppercase`,
                                            placeholder: `Etiqueta 3`,
                                          }),
                                          (0, b.jsx)(`input`, {
                                            type: `text`,
                                            value: At,
                                            onChange: (e) => jt(e.target.value),
                                            className: `bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-[11px] text-white`,
                                            placeholder: `Valor 3`,
                                          }),
                                        ],
                                      }),
                                      (0, b.jsxs)(`div`, {
                                        className: `grid grid-cols-2 gap-3`,
                                        children: [
                                          (0, b.jsx)(`input`, {
                                            type: `text`,
                                            value: Mt,
                                            onChange: (e) => Nt(e.target.value),
                                            className: `bg-white/2 border border-white/5 rounded px-2.5 py-1.5 text-[10px] text-gray-400 font-bold uppercase`,
                                            placeholder: `Etiqueta 4`,
                                          }),
                                          (0, b.jsx)(`input`, {
                                            type: `text`,
                                            value: Pt,
                                            onChange: (e) => Ft(e.target.value),
                                            className: `bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-[11px] text-white`,
                                            placeholder: `Valor 4`,
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  (0, b.jsx)(`div`, {
                                    className: `pt-2`,
                                    children: (0, b.jsx)(`button`, {
                                      type: `submit`,
                                      className: `w-full bg-alacor-amber text-alacor-dark font-black py-4 rounded-xl text-xs uppercase tracking-widest hover:bg-yellow-400 transition-all cursor-pointer border-none shadow-md`,
                                      children: `➕ AGREGAR AL CATÁLOGO ACTIVO`,
                                    }),
                                  }),
                                ],
                              }),
                            ],
                          }),
                          (0, b.jsxs)(`div`, {
                            className: `lg:col-span-5 bg-white/2 border border-white/5 rounded-2xl p-6 text-left`,
                            children: [
                              (0, b.jsxs)(`div`, {
                                className: `flex justify-between items-center mb-6 pb-2 border-b border-b-white/5`,
                                children: [
                                  (0, b.jsxs)(`div`, {
                                    children: [
                                      (0, b.jsx)(`span`, {
                                        className: `text-[10px] text-alacor-amber font-black tracking-widest uppercase block mb-1`,
                                        children: `INVENTARIO COMERCIAL`,
                                      }),
                                      (0, b.jsx)(`h4`, {
                                        className: `text-md font-black text-white uppercase`,
                                        children: `Control de Catálogo y Calidad`,
                                      }),
                                    ],
                                  }),
                                  (0, b.jsx)(`button`, {
                                    onClick: ra,
                                    className: `bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white font-bold px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider transition-all border border-red-500/20 cursor-pointer`,
                                    children: `Restablecer Todo`,
                                  }),
                                ],
                              }),
                              (0, b.jsxs)(`div`, {
                                className: `bg-black/40 p-4 rounded-xl border border-white/5 mb-6 text-xs space-y-3`,
                                children: [
                                  (0, b.jsx)(`span`, {
                                    className: `text-[10px] text-alacor-amber font-bold tracking-widest uppercase block mb-1`,
                                    children: `Filtros de Calidad Automáticos`,
                                  }),
                                  (0, b.jsxs)(`div`, {
                                    className: `flex items-center justify-between gap-4`,
                                    children: [
                                      (0, b.jsx)(`span`, {
                                        className: `text-gray-300`,
                                        children: `Ocultar productos sin imagen real`,
                                      }),
                                      (0, b.jsx)(`button`, {
                                        type: `button`,
                                        onClick: () => Ei(!Ti),
                                        className: `w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none flex-shrink-0 cursor-pointer border-none ${Ti ? `bg-green-500` : `bg-white/10`}`,
                                        children: (0, b.jsx)(`div`, {
                                          className: `bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${Ti ? `translate-x-4` : `translate-x-0`}`,
                                        }),
                                      }),
                                    ],
                                  }),
                                  (0, b.jsxs)(`div`, {
                                    className: `flex items-center justify-between gap-4`,
                                    children: [
                                      (0, b.jsx)(`span`, {
                                        className: `text-gray-300`,
                                        children: `Ocultar con información incompleta`,
                                      }),
                                      (0, b.jsx)(`button`, {
                                        type: `button`,
                                        onClick: () => Oi(!Di),
                                        className: `w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none flex-shrink-0 cursor-pointer border-none ${Di ? `bg-green-500` : `bg-white/10`}`,
                                        children: (0, b.jsx)(`div`, {
                                          className: `bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${Di ? `translate-x-4` : `translate-x-0`}`,
                                        }),
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              (0, b.jsx)(`div`, {
                                className: `space-y-6 max-h-[450px] overflow-y-auto pr-2`,
                                children: Object.keys(O).map((e) => {
                                  let t = O[e];
                                  if (!t || !t.sublines) return null;
                                  return (0, b.jsxs)(
                                    `div`,
                                    {
                                      className: `space-y-3 pb-4 border-b border-white/5 last:border-none`,
                                      children: [
                                        (0, b.jsx)(`span`, {
                                          className: `text-[10px] font-black text-alacor-amber uppercase block tracking-wider`,
                                          children: t?.title || e,
                                        }),
                                        Object.keys(t.sublines).map((n) => {
                                          let r = t.sublines[n];
                                          if (!r) return null;
                                          return (0, b.jsxs)(
                                            `div`,
                                            {
                                              className: `pl-2 space-y-1.5`,
                                              children: [
                                                (0, b.jsxs)(`span`, {
                                                  className: `text-[9px] font-bold text-gray-500 uppercase block tracking-wide`,
                                                  children: [`└─ `, r.title],
                                                }),
                                                !r.products ||
                                                r.products.length === 0
                                                  ? (0, b.jsx)(`span`, {
                                                      className: `text-[10px] text-gray-600 block pl-4 italic`,
                                                      children: `Sin productos`,
                                                    })
                                                  : r.products.map((t) =>
                                                      (0, b.jsxs)(
                                                        `div`,
                                                        {
                                                          className: `flex justify-between items-center pl-4 py-1.5 hover:bg-white/5 rounded transition-all`,
                                                          children: [
                                                            (0, b.jsxs)(`div`, {
                                                              className: `truncate pr-2`,
                                                              children: [
                                                                (0, b.jsx)(
                                                                  `span`,
                                                                  {
                                                                    className: `text-white font-semibold text-xs block truncate leading-tight`,
                                                                    children:
                                                                      t.title,
                                                                  },
                                                                ),
                                                                (0, b.jsxs)(
                                                                  `span`,
                                                                  {
                                                                    className: `text-[9px] font-mono text-gray-500 block leading-tight`,
                                                                    children: [
                                                                      `REF: `,
                                                                      t.ref,
                                                                      t.isVisible ===
                                                                        !1 &&
                                                                        (0,
                                                                        b.jsx)(
                                                                          `span`,
                                                                          {
                                                                            className: `text-red-400 font-bold ml-1.5 uppercase`,
                                                                            children: `[OCULTO]`,
                                                                          },
                                                                        ),
                                                                      Ti &&
                                                                        !ki(
                                                                          t,
                                                                        ) &&
                                                                        (0,
                                                                        b.jsx)(
                                                                          `span`,
                                                                          {
                                                                            className: `text-yellow-500 font-bold ml-1.5 uppercase`,
                                                                            children: `[SIN IMAGEN]`,
                                                                          },
                                                                        ),
                                                                      Di &&
                                                                        !Ai(
                                                                          t,
                                                                        ) &&
                                                                        (0,
                                                                        b.jsx)(
                                                                          `span`,
                                                                          {
                                                                            className: `text-orange-400 font-bold ml-1.5 uppercase`,
                                                                            children: `[INCOMPLETO]`,
                                                                          },
                                                                        ),
                                                                    ],
                                                                  },
                                                                ),
                                                              ],
                                                            }),
                                                            (0, b.jsxs)(`div`, {
                                                              className: `flex gap-2 flex-shrink-0 items-center`,
                                                              children: [
                                                                (0, b.jsx)(
                                                                  `button`,
                                                                  {
                                                                    onClick:
                                                                      () =>
                                                                        ji(
                                                                          e,
                                                                          n,
                                                                          t.id,
                                                                        ),
                                                                    className: `${t.isVisible === !1 ? `text-gray-500 hover:text-gray-400` : `text-green-400 hover:text-green-300`} font-extrabold text-[10px] px-2 py-1 bg-white/5 hover:bg-white/10 rounded cursor-pointer border-none`,
                                                                    title:
                                                                      t.isVisible ===
                                                                      !1
                                                                        ? `Mostrar en la web`
                                                                        : `Ocultar en la web`,
                                                                    children:
                                                                      t.isVisible ===
                                                                      !1
                                                                        ? `👁️‍🗨️ OCULTO`
                                                                        : `👁️ VISIBLE`,
                                                                  },
                                                                ),
                                                                (0, b.jsx)(
                                                                  `button`,
                                                                  {
                                                                    onClick:
                                                                      () =>
                                                                        na(
                                                                          e,
                                                                          n,
                                                                          t.id,
                                                                        ),
                                                                    className: `text-red-500 hover:text-red-400 font-extrabold text-sm p-1.5 hover:bg-red-500/10 rounded cursor-pointer border-none bg-transparent`,
                                                                    title: `Eliminar producto`,
                                                                    children: `🗑️`,
                                                                  },
                                                                ),
                                                              ],
                                                            }),
                                                          ],
                                                        },
                                                        t.id,
                                                      ),
                                                    ),
                                              ],
                                            },
                                            n,
                                          );
                                        }),
                                      ],
                                    },
                                    e,
                                  );
                                }),
                              }),
                            ],
                          }),
                        ],
                      }),
                      (0, b.jsxs)(`div`, {
                        className: `bg-alacor-card border border-alacor-amber/10 rounded-2xl p-5 mb-8`,
                        children: [
                          (0, b.jsxs)(`div`, {
                            className: `flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5`,
                            children: [
                              (0, b.jsxs)(`div`, {
                                children: [
                                  (0, b.jsx)(`span`, {
                                    className: `text-[9px] bg-alacor-amber/20 text-alacor-amber font-black px-2.5 py-1 rounded-full uppercase tracking-wider mb-2 inline-block`,
                                    children: `Configuración de Demos 360°`,
                                  }),
                                  (0, b.jsx)(`h4`, {
                                    className: `text-md font-extrabold text-white uppercase leading-none mt-1`,
                                    children: `GESTIÓN DE VIDEOS Y ESPECIFICACIONES`,
                                  }),
                                  (0, b.jsx)(`p`, {
                                    className: `text-xs text-gray-500 mt-1 font-light`,
                                    children: `Administra los videos y textos del panel de demostraciones interactivas.`,
                                  }),
                                ],
                              }),
                              (0, b.jsx)(`button`, {
                                onClick: Ge,
                                className: `text-[9px] bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white font-bold px-3 py-2 rounded-lg uppercase tracking-wider transition-all border border-red-500/20 cursor-pointer flex-shrink-0`,
                                children: `Restablecer Defaults`,
                              }),
                            ],
                          }),
                          (0, b.jsxs)(`div`, {
                            className: `mb-5`,
                            children: [
                              (0, b.jsxs)(`label`, {
                                className: `text-gray-400 text-xs font-semibold block mb-1.5 flex items-center`,
                                children: [
                                  `Categoría a Configurar`,
                                  (0, b.jsx)(L, {
                                    text: `Selecciona la categoría interactiva 360° que deseas modificar. Todos los videos y especificaciones técnicas editados a continuación se aplicarán a esta categoría.`,
                                  }),
                                ],
                              }),
                              (0, b.jsx)(`select`, {
                                value: h,
                                onChange: (e) => {
                                  let t = e.target.value;
                                  (g(t), c(t), d(0), ue(null));
                                },
                                className: `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-alacor-amber cursor-pointer`,
                                children: a.map((e) =>
                                  (0, b.jsxs)(
                                    `option`,
                                    {
                                      value: e.key,
                                      className: `bg-[#070b12]`,
                                      children: [
                                        e.icon &&
                                        (e.icon.startsWith(`/`) ||
                                          e.icon.startsWith(`http`) ||
                                          e.icon.includes(`.`))
                                          ? `🖼️`
                                          : e.icon,
                                        ` `,
                                        e.title,
                                      ],
                                    },
                                    e.key,
                                  ),
                                ),
                              }),
                            ],
                          }),
                          (0, b.jsxs)(`div`, {
                            className: `grid grid-cols-1 lg:grid-cols-2 gap-5`,
                            children: [
                              (0, b.jsxs)(`div`, {
                                className: `bg-white/2 border border-white/5 rounded-xl p-4`,
                                children: [
                                  (0, b.jsxs)(`span`, {
                                    className: `text-[10px] text-alacor-amber font-black tracking-widest uppercase block mb-3 flex items-center`,
                                    children: [
                                      `🎬 Videos Asignados`,
                                      (0, b.jsx)(L, {
                                        text: `Muestra la lista de videos interactivos disponibles para esta categoría. El orden de los videos define cómo se presentan en la vista 360°.`,
                                      }),
                                    ],
                                  }),
                                  (0, b.jsxs)(`div`, {
                                    className: `space-y-2 mb-4 max-h-40 overflow-y-auto pr-1`,
                                    children: [
                                      (p[h]?.videos || []).map((e, t) =>
                                        (0, b.jsxs)(
                                          `div`,
                                          {
                                            onClick: () => {
                                              h === s && d(t);
                                            },
                                            className: `flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-all ${h === s && u === t ? `bg-alacor-amber/20 border border-alacor-amber/40 shadow-sm shadow-alacor-amber/5` : `bg-black/30 border border-transparent hover:bg-black/40`}`,
                                            children: [
                                              (0, b.jsxs)(`div`, {
                                                className: `truncate pr-2 min-w-0 flex-1`,
                                                children: [
                                                  (0, b.jsxs)(`div`, {
                                                    className: `flex items-center gap-2`,
                                                    children: [
                                                      (0, b.jsx)(`span`, {
                                                        className: `text-white font-bold text-xs block truncate`,
                                                        children: e.label,
                                                      }),
                                                      h === s &&
                                                        u === t &&
                                                        (0, b.jsx)(`span`, {
                                                          className: `text-[8px] bg-alacor-amber text-alacor-dark px-1.5 py-0.2 rounded font-black uppercase`,
                                                          children: `Activo`,
                                                        }),
                                                    ],
                                                  }),
                                                  (0, b.jsx)(`span`, {
                                                    className: `text-gray-500 font-mono text-[10px] truncate block`,
                                                    children: e.src,
                                                  }),
                                                ],
                                              }),
                                              (0, b.jsx)(`button`, {
                                                onClick: (e) => {
                                                  (e.stopPropagation(),
                                                    Ve(h, t));
                                                },
                                                className: `text-red-400 hover:text-red-300 flex-shrink-0 cursor-pointer border-none bg-transparent text-sm p-1 ml-2`,
                                                children: `🗑️`,
                                              }),
                                            ],
                                          },
                                          t,
                                        ),
                                      ),
                                      !p[h]?.videos?.length &&
                                        (0, b.jsx)(`p`, {
                                          className: `text-gray-600 text-xs italic text-center py-3`,
                                          children: `Sin videos asignados`,
                                        }),
                                    ],
                                  }),
                                  (0, b.jsxs)(`div`, {
                                    className: `space-y-2 border-t border-white/5 pt-3 text-left`,
                                    children: [
                                      (0, b.jsxs)(`label`, {
                                        className: `text-gray-400 text-[10px] font-bold uppercase block mb-1 flex items-center`,
                                        children: [
                                          `Añadir Video`,
                                          (0, b.jsx)(L, {
                                            text: `Selecciona un video precargado o escribe una ruta personalizada para añadir una nueva demostración 360° o ángulo de cámara.`,
                                          }),
                                        ],
                                      }),
                                      (0, b.jsxs)(`select`, {
                                        value: v,
                                        onChange: (e) => {
                                          let t = e.target.value;
                                          y(t);
                                          let n = ze.find((e) => e.src === t);
                                          oe(n ? n.label : ``);
                                        },
                                        className: `w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none cursor-pointer`,
                                        children: [
                                          (0, b.jsx)(`option`, {
                                            value: `__select__`,
                                            className: `bg-[#070b12]`,
                                            children: `— Seleccionar video —`,
                                          }),
                                          ze.map((e, t) =>
                                            (0, b.jsx)(
                                              `option`,
                                              {
                                                value: e.src,
                                                className: `bg-[#070b12]`,
                                                children: e.label,
                                              },
                                              t,
                                            ),
                                          ),
                                          (0, b.jsx)(`option`, {
                                            value: `__custom__`,
                                            className: `bg-[#070b12]`,
                                            children: `✏️ Ruta personalizada...`,
                                          }),
                                        ],
                                      }),
                                      v === `__custom__` &&
                                        (0, b.jsx)(`input`, {
                                          type: `text`,
                                          placeholder: `/img/marketing/mi_video.mp4`,
                                          value: re,
                                          onChange: (e) => ie(e.target.value),
                                          className: `w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none font-mono`,
                                        }),
                                      (0, b.jsx)(`input`, {
                                        type: `text`,
                                        placeholder: `Etiqueta del video (ej: Arnés Diélectrico X)`,
                                        value: ae,
                                        onChange: (e) => oe(e.target.value),
                                        className: `w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none`,
                                      }),
                                      (0, b.jsx)(`button`, {
                                        onClick: Be,
                                        className: `w-full bg-alacor-amber text-alacor-dark font-black py-2 rounded-lg text-[10px] uppercase tracking-widest hover:bg-yellow-400 transition-all cursor-pointer border-none`,
                                        children: `+ Agregar Video`,
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              (0, b.jsxs)(`div`, {
                                className: `bg-white/2 border border-white/5 rounded-xl p-4`,
                                children: [
                                  (0, b.jsxs)(`span`, {
                                    className: `text-[10px] text-alacor-amber font-black tracking-widest uppercase block mb-3 flex items-center`,
                                    children: [
                                      `📝 Especificaciones Técnicas `,
                                      (() => {
                                        let e = p[h]?.videos || [];
                                        return e.length > 1 && e[u]
                                          ? `(${e[u].label})`
                                          : ``;
                                      })(),
                                      (0, b.jsx)(L, {
                                        text: `Lista de características certificadas asociadas al video seleccionado. Se muestran en el recuadro amarillo al reproducir la demo.`,
                                      }),
                                    ],
                                  }),
                                  (0, b.jsx)(`div`, {
                                    className: `space-y-2 mb-4 max-h-52 overflow-y-auto pr-1`,
                                    children: (() => {
                                      let e = p[h]?.videos || [],
                                        t =
                                          e.length > 0 &&
                                          u < e.length &&
                                          e[u].descriptions
                                            ? e[u].descriptions
                                            : p[h]?.descriptions || [];
                                      return t.length === 0
                                        ? (0, b.jsx)(`p`, {
                                            className: `text-gray-600 text-xs italic text-center py-3`,
                                            children: `Sin especificaciones agregadas`,
                                          })
                                        : t.map((e, t) =>
                                            (0, b.jsx)(
                                              `div`,
                                              {
                                                className: `bg-black/30 rounded-lg px-3 py-2`,
                                                children:
                                                  le === t
                                                    ? (0, b.jsxs)(`div`, {
                                                        className: `space-y-2`,
                                                        children: [
                                                          (0, b.jsx)(
                                                            `textarea`,
                                                            {
                                                              value: T,
                                                              onChange: (e) =>
                                                                E(
                                                                  e.target
                                                                    .value,
                                                                ),
                                                              rows: 2,
                                                              className: `w-full bg-white/5 border border-alacor-amber/50 rounded px-2 py-1.5 text-white text-xs focus:outline-none resize-none`,
                                                            },
                                                          ),
                                                          (0, b.jsxs)(`div`, {
                                                            className: `flex gap-2`,
                                                            children: [
                                                              (0, b.jsx)(
                                                                `button`,
                                                                {
                                                                  onClick: () =>
                                                                    We(h, t),
                                                                  className: `flex-1 bg-alacor-amber text-alacor-dark font-black py-1 rounded text-[10px] uppercase cursor-pointer border-none`,
                                                                  children: `Guardar`,
                                                                },
                                                              ),
                                                              (0, b.jsx)(
                                                                `button`,
                                                                {
                                                                  onClick: () =>
                                                                    ue(null),
                                                                  className: `flex-1 bg-white/5 text-gray-400 font-bold py-1 rounded text-[10px] uppercase cursor-pointer border-none hover:bg-white/10`,
                                                                  children: `Cancelar`,
                                                                },
                                                              ),
                                                            ],
                                                          }),
                                                        ],
                                                      })
                                                    : (0, b.jsxs)(`div`, {
                                                        className: `flex items-start justify-between gap-2`,
                                                        children: [
                                                          (0, b.jsx)(`span`, {
                                                            className: `text-gray-300 text-xs leading-relaxed flex-1`,
                                                            children: e,
                                                          }),
                                                          (0, b.jsxs)(`div`, {
                                                            className: `flex gap-1.5 flex-shrink-0`,
                                                            children: [
                                                              (0, b.jsx)(
                                                                `button`,
                                                                {
                                                                  onClick:
                                                                    () => {
                                                                      (ue(t),
                                                                        E(e));
                                                                    },
                                                                  className: `text-alacor-amber hover:text-yellow-300 cursor-pointer border-none bg-transparent text-xs`,
                                                                  children: `✏️`,
                                                                },
                                                              ),
                                                              (0, b.jsx)(
                                                                `button`,
                                                                {
                                                                  onClick: () =>
                                                                    Ue(h, t),
                                                                  className: `text-red-400 hover:text-red-300 cursor-pointer border-none bg-transparent text-xs`,
                                                                  children: `🗑️`,
                                                                },
                                                              ),
                                                            ],
                                                          }),
                                                        ],
                                                      }),
                                              },
                                              t,
                                            ),
                                          );
                                    })(),
                                  }),
                                  (0, b.jsxs)(`div`, {
                                    className: `space-y-2 border-t border-white/5 pt-3 text-left`,
                                    children: [
                                      (0, b.jsxs)(`label`, {
                                        className: `text-gray-400 text-[10px] font-bold uppercase block mb-1 flex items-center`,
                                        children: [
                                          `Añadir Especificación`,
                                          (0, b.jsx)(L, {
                                            text: `Escribe una nueva característica (ej: 'Suela dieléctrica resistente a 18kV') para la ficha técnica del video activo actual.`,
                                          }),
                                        ],
                                      }),
                                      (0, b.jsx)(`textarea`, {
                                        placeholder: `Ej: Certificado ANSI Z359.11-2014 para trabajo en alturas...`,
                                        value: se,
                                        onChange: (e) => ce(e.target.value),
                                        rows: 2,
                                        className: `w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none resize-none`,
                                      }),
                                      (0, b.jsx)(`button`, {
                                        onClick: He,
                                        className: `w-full bg-alacor-amber text-alacor-dark font-black py-2 rounded-lg text-[10px] uppercase tracking-widest hover:bg-yellow-400 transition-all cursor-pointer border-none`,
                                        children: `+ Agregar Especificación`,
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                      (0, b.jsxs)(`div`, {
                        className: `bg-alacor-card border border-alacor-amber/10 rounded-2xl p-5 mb-8`,
                        children: [
                          (0, b.jsx)(`div`, {
                            className: `flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5`,
                            children: (0, b.jsxs)(`div`, {
                              children: [
                                (0, b.jsx)(`span`, {
                                  className: `text-[9px] bg-alacor-amber/20 text-alacor-amber font-black px-2.5 py-1 rounded-full uppercase tracking-wider mb-2 inline-block`,
                                  children: `Tabs e Iconos Interactivos`,
                                }),
                                (0, b.jsxs)(`h4`, {
                                  className: `text-md font-extrabold text-white uppercase leading-none mt-1 flex items-center`,
                                  children: [
                                    `GESTIÓN DE CATEGORÍAS 360°`,
                                    (0, b.jsx)(L, {
                                      text: `Administra las pestañas del reproductor 360°. Puedes crear, editar, reordenar y configurar iconos personalizados.`,
                                    }),
                                  ],
                                }),
                                (0, b.jsx)(`p`, {
                                  className: `text-xs text-gray-500 mt-1 font-light font-sans`,
                                  children: `Habilite, edite, ordene y configure las categorías de la sección de Demostraciones 360°.`,
                                }),
                              ],
                            }),
                          }),
                          (0, b.jsxs)(`div`, {
                            className: `grid grid-cols-1 lg:grid-cols-12 gap-6`,
                            children: [
                              (0, b.jsxs)(`div`, {
                                className: `lg:col-span-5 bg-white/2 border border-white/5 rounded-xl p-4`,
                                children: [
                                  (0, b.jsxs)(`span`, {
                                    className: `text-[10px] text-alacor-amber font-black tracking-widest uppercase block mb-3 flex items-center`,
                                    children: [
                                      `➕ Agregar Nueva Categoría`,
                                      (0, b.jsx)(L, {
                                        text: `Crea una nueva pestaña interactiva para el reproductor multimedia 360° en la página principal.`,
                                      }),
                                    ],
                                  }),
                                  (0, b.jsxs)(`form`, {
                                    onSubmit: Pe,
                                    className: `space-y-3 text-xs`,
                                    children: [
                                      (0, b.jsxs)(`div`, {
                                        children: [
                                          (0, b.jsxs)(`label`, {
                                            className: `text-gray-400 block mb-1 font-bold text-left flex items-center`,
                                            children: [
                                              `Clave Única (ID en minúsculas)`,
                                              (0, b.jsx)(L, {
                                                text: `Código único sin espacios ni mayúsculas (ej: 'respiratoria') que identifica la categoría en el sistema.`,
                                              }),
                                            ],
                                          }),
                                          (0, b.jsx)(`input`, {
                                            type: `text`,
                                            required: !0,
                                            placeholder: `ej: respiratoria`,
                                            value: de,
                                            onChange: (e) => fe(e.target.value),
                                            className: `w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-alacor-amber font-mono`,
                                          }),
                                        ],
                                      }),
                                      (0, b.jsxs)(`div`, {
                                        children: [
                                          (0, b.jsxs)(`label`, {
                                            className: `text-gray-400 block mb-1 font-bold text-left flex items-center`,
                                            children: [
                                              `Título de la Categoría`,
                                              (0, b.jsx)(L, {
                                                text: `El nombre visible de la categoría (ej: 'Protección Respiratoria') en el menú de pestañas.`,
                                              }),
                                            ],
                                          }),
                                          (0, b.jsx)(`input`, {
                                            type: `text`,
                                            required: !0,
                                            placeholder: `ej: Protección Respiratoria`,
                                            value: pe,
                                            onChange: (e) => me(e.target.value),
                                            className: `w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-alacor-amber`,
                                          }),
                                        ],
                                      }),
                                      (0, b.jsxs)(`div`, {
                                        className: `grid grid-cols-3 gap-2 text-left`,
                                        children: [
                                          (0, b.jsxs)(`div`, {
                                            className: `col-span-1`,
                                            children: [
                                              (0, b.jsxs)(`label`, {
                                                className: `text-gray-400 block mb-1 font-bold flex items-center`,
                                                children: [
                                                  `Icono`,
                                                  (0, b.jsx)(L, {
                                                    text: `Ingresa un emoji (ej: 😷) o escribe una ruta de imagen/SVG local o remota (ej: /img/mi-icono.svg) para usar un icono personalizado.`,
                                                  }),
                                                ],
                                              }),
                                              (0, b.jsx)(`input`, {
                                                type: `text`,
                                                required: !0,
                                                placeholder: `😷`,
                                                value: he,
                                                onChange: (e) =>
                                                  D(e.target.value),
                                                className: `w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-center text-white text-xs focus:outline-none focus:border-alacor-amber`,
                                              }),
                                            ],
                                          }),
                                          (0, b.jsxs)(`div`, {
                                            className: `col-span-2`,
                                            children: [
                                              (0, b.jsxs)(`label`, {
                                                className: `text-gray-400 block mb-1 font-bold flex items-center`,
                                                children: [
                                                  `Descripción Corta`,
                                                  (0, b.jsx)(L, {
                                                    text: `Breve texto explicativo secundario que se muestra debajo del título en la pestaña (ej: 'Respiradores y filtros').`,
                                                  }),
                                                ],
                                              }),
                                              (0, b.jsx)(`input`, {
                                                type: `text`,
                                                placeholder: `ej: Respiradores y filtros.`,
                                                value: ge,
                                                onChange: (e) =>
                                                  _e(e.target.value),
                                                className: `w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-alacor-amber`,
                                              }),
                                            ],
                                          }),
                                        ],
                                      }),
                                      (0, b.jsxs)(`div`, {
                                        className: `text-left bg-black/20 p-2.5 rounded-lg border border-white/5`,
                                        children: [
                                          (0, b.jsx)(`span`, {
                                            className: `text-[10px] text-gray-400 block mb-1.5 font-bold uppercase tracking-wider`,
                                            children: `💡 Paleta de Iconos Recomendados:`,
                                          }),
                                          (0, b.jsx)(`div`, {
                                            className: `flex gap-1.5 flex-wrap`,
                                            children: [
                                              `🛡️`,
                                              `🥽`,
                                              `🪖`,
                                              `🕶️`,
                                              `🎧`,
                                              `👂`,
                                              `🧤`,
                                              `🧗`,
                                              `🥾`,
                                              `😷`,
                                              `👕`,
                                              `⚡`,
                                              `🔥`,
                                              `🚨`,
                                              `🧼`,
                                              `🚧`,
                                              `📦`,
                                              `📐`,
                                            ].map((e) =>
                                              (0, b.jsx)(
                                                `button`,
                                                {
                                                  type: `button`,
                                                  onClick: () => D(e),
                                                  className: `w-7 h-7 rounded flex items-center justify-center text-sm border transition-all cursor-pointer ${he === e ? `bg-alacor-amber border-alacor-amber text-alacor-dark font-black scale-105` : `bg-white/5 border-white/10 text-white hover:bg-white/10`}`,
                                                  title: `Seleccionar ${e}`,
                                                  children: e,
                                                },
                                                e,
                                              ),
                                            ),
                                          }),
                                        ],
                                      }),
                                      (0, b.jsxs)(`div`, {
                                        children: [
                                          (0, b.jsxs)(`label`, {
                                            className: `text-gray-400 block mb-1 font-bold text-left flex items-center`,
                                            children: [
                                              `Video por Defecto (Ruta)`,
                                              (0, b.jsx)(L, {
                                                text: `El video inicial que se reproducirá automáticamente cuando el usuario haga clic en la pestaña de esta categoría.`,
                                              }),
                                            ],
                                          }),
                                          (0, b.jsx)(`select`, {
                                            value: ve,
                                            onChange: (e) => ye(e.target.value),
                                            className: `w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none cursor-pointer`,
                                            children: ze.map((e, t) =>
                                              (0, b.jsx)(
                                                `option`,
                                                {
                                                  value: e.src,
                                                  className: `bg-[#070b12]`,
                                                  children: e.label,
                                                },
                                                t,
                                              ),
                                            ),
                                          }),
                                        ],
                                      }),
                                      (0, b.jsxs)(`div`, {
                                        children: [
                                          (0, b.jsxs)(`label`, {
                                            className: `text-gray-400 block mb-1 font-bold text-left flex items-center`,
                                            children: [
                                              `Imagen de Producto Asociado`,
                                              (0, b.jsx)(L, {
                                                text: `Ruta de la imagen principal del producto en el catálogo (ej: /img/catalogo/respirador.jpg) para complementar la demo.`,
                                              }),
                                            ],
                                          }),
                                          (0, b.jsx)(`input`, {
                                            type: `text`,
                                            placeholder: `/img/catalogo/Protecci_n_Respiratoria_rep_FILTRO_7093__P100_.jpg`,
                                            value: be,
                                            onChange: (e) => xe(e.target.value),
                                            className: `w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-alacor-amber`,
                                          }),
                                        ],
                                      }),
                                      (0, b.jsx)(`button`, {
                                        type: `submit`,
                                        className: `w-full bg-alacor-amber text-alacor-dark font-black py-2.5 rounded-lg text-[10px] uppercase tracking-widest hover:bg-yellow-400 transition-all cursor-pointer border-none shadow-md`,
                                        children: `+ Crear Categoría 360°`,
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              (0, b.jsxs)(`div`, {
                                className: `lg:col-span-7 bg-white/2 border border-white/5 rounded-xl p-4`,
                                children: [
                                  (0, b.jsxs)(`span`, {
                                    className: `text-[10px] text-alacor-amber font-black tracking-widest uppercase block mb-3 flex items-center`,
                                    children: [
                                      `📋 Categorías Activas y Reordenamiento`,
                                      (0, b.jsx)(L, {
                                        text: `Listado de categorías activas en el reproductor. Utiliza ▲ y ▼ para cambiar su orden de visualización, o ✏️ para editarlas.`,
                                      }),
                                    ],
                                  }),
                                  (0, b.jsx)(`div`, {
                                    className: `space-y-2.5 max-h-[360px] overflow-y-auto pr-1`,
                                    children: a.map((e, t) => {
                                      let n = Se === e.key,
                                        r = [
                                          `facial`,
                                          `cabeza`,
                                          `visual`,
                                          `auditiva`,
                                          `manual`,
                                          `alturas`,
                                          `calzado`,
                                        ].includes(e.key);
                                      return (0, b.jsx)(
                                        `div`,
                                        {
                                          className: `bg-black/30 border rounded-xl p-3 flex flex-col gap-2 transition-all ${n ? `border-alacor-amber/50 bg-alacor-amber/5` : `border-white/5 hover:border-white/10`}`,
                                          children: n
                                            ? (0, b.jsxs)(`div`, {
                                                className: `space-y-2 text-xs text-left`,
                                                children: [
                                                  (0, b.jsxs)(`div`, {
                                                    className: `grid grid-cols-3 gap-2`,
                                                    children: [
                                                      (0, b.jsxs)(`div`, {
                                                        className: `col-span-1`,
                                                        children: [
                                                          (0, b.jsxs)(`label`, {
                                                            className: `text-gray-500 text-[9px] uppercase block flex items-center`,
                                                            children: [
                                                              `Icono`,
                                                              (0, b.jsx)(L, {
                                                                text: `Emoji o ruta local a tu imagen/SVG personalizada (ej. /img/mi-icono.svg).`,
                                                              }),
                                                            ],
                                                          }),
                                                          (0, b.jsx)(`input`, {
                                                            type: `text`,
                                                            value: Ee,
                                                            onChange: (e) =>
                                                              De(
                                                                e.target.value,
                                                              ),
                                                            className: `w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-center`,
                                                          }),
                                                        ],
                                                      }),
                                                      (0, b.jsxs)(`div`, {
                                                        className: `col-span-2`,
                                                        children: [
                                                          (0, b.jsxs)(`label`, {
                                                            className: `text-gray-500 text-[9px] uppercase block flex items-center`,
                                                            children: [
                                                              `Título`,
                                                              (0, b.jsx)(L, {
                                                                text: `Nombre de la categoría interactiva.`,
                                                              }),
                                                            ],
                                                          }),
                                                          (0, b.jsx)(`input`, {
                                                            type: `text`,
                                                            value: we,
                                                            onChange: (e) =>
                                                              Te(
                                                                e.target.value,
                                                              ),
                                                            className: `w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white`,
                                                          }),
                                                        ],
                                                      }),
                                                    ],
                                                  }),
                                                  (0, b.jsxs)(`div`, {
                                                    children: [
                                                      (0, b.jsxs)(`label`, {
                                                        className: `text-gray-500 text-[9px] uppercase block flex items-center`,
                                                        children: [
                                                          `Descripción`,
                                                          (0, b.jsx)(L, {
                                                            text: `Texto explicativo secundario de la pestaña.`,
                                                          }),
                                                        ],
                                                      }),
                                                      (0, b.jsx)(`input`, {
                                                        type: `text`,
                                                        value: Oe,
                                                        onChange: (e) =>
                                                          ke(e.target.value),
                                                        className: `w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white`,
                                                      }),
                                                    ],
                                                  }),
                                                  (0, b.jsxs)(`div`, {
                                                    className: `grid grid-cols-2 gap-2`,
                                                    children: [
                                                      (0, b.jsxs)(`div`, {
                                                        children: [
                                                          (0, b.jsxs)(`label`, {
                                                            className: `text-gray-500 text-[9px] uppercase block flex items-center`,
                                                            children: [
                                                              `Video`,
                                                              (0, b.jsx)(L, {
                                                                text: `Ruta del video interactivo por defecto para esta categoría.`,
                                                              }),
                                                            ],
                                                          }),
                                                          (0, b.jsx)(`input`, {
                                                            type: `text`,
                                                            value: Ae,
                                                            onChange: (e) =>
                                                              je(
                                                                e.target.value,
                                                              ),
                                                            className: `w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white font-mono`,
                                                          }),
                                                        ],
                                                      }),
                                                      (0, b.jsxs)(`div`, {
                                                        children: [
                                                          (0, b.jsxs)(`label`, {
                                                            className: `text-gray-500 text-[9px] uppercase block flex items-center`,
                                                            children: [
                                                              `Imagen Prod.`,
                                                              (0, b.jsx)(L, {
                                                                text: `Ruta de la imagen de producto en el catálogo.`,
                                                              }),
                                                            ],
                                                          }),
                                                          (0, b.jsx)(`input`, {
                                                            type: `text`,
                                                            value: Me,
                                                            onChange: (e) =>
                                                              Ne(
                                                                e.target.value,
                                                              ),
                                                            className: `w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white font-mono`,
                                                          }),
                                                        ],
                                                      }),
                                                    ],
                                                  }),
                                                  (0, b.jsxs)(`div`, {
                                                    className: `bg-black/20 p-2 rounded border border-white/5 text-left`,
                                                    children: [
                                                      (0, b.jsx)(`span`, {
                                                        className: `text-[9px] text-gray-500 block mb-1 font-bold uppercase tracking-wider`,
                                                        children: `💡 Paleta de Iconos Recomendados:`,
                                                      }),
                                                      (0, b.jsx)(`div`, {
                                                        className: `flex gap-1.5 flex-wrap`,
                                                        children: [
                                                          `🛡️`,
                                                          `🥽`,
                                                          `🪖`,
                                                          `🕶️`,
                                                          `🎧`,
                                                          `👂`,
                                                          `🧤`,
                                                          `🧗`,
                                                          `🥾`,
                                                          `😷`,
                                                          `👕`,
                                                          `⚡`,
                                                          `🔥`,
                                                          `🚨`,
                                                          `🧼`,
                                                          `🚧`,
                                                          `📦`,
                                                          `📐`,
                                                        ].map((e) =>
                                                          (0, b.jsx)(
                                                            `button`,
                                                            {
                                                              type: `button`,
                                                              onClick: () =>
                                                                De(e),
                                                              className: `w-6 h-6 rounded flex items-center justify-center text-xs border transition-all cursor-pointer ${Ee === e ? `bg-alacor-amber border-alacor-amber text-alacor-dark font-bold scale-105` : `bg-white/5 border-white/10 text-white hover:bg-white/10`}`,
                                                              title: `Seleccionar ${e}`,
                                                              children: pa(e),
                                                            },
                                                            e,
                                                          ),
                                                        ),
                                                      }),
                                                    ],
                                                  }),
                                                  (0, b.jsxs)(`div`, {
                                                    className: `flex gap-2 pt-1`,
                                                    children: [
                                                      (0, b.jsx)(`button`, {
                                                        type: `button`,
                                                        onClick: Re,
                                                        className: `flex-1 bg-green-500 text-alacor-dark font-black py-1.5 rounded text-[10px] uppercase cursor-pointer border-none`,
                                                        children: `Guardar`,
                                                      }),
                                                      (0, b.jsx)(`button`, {
                                                        type: `button`,
                                                        onClick: () => Ce(null),
                                                        className: `flex-1 bg-white/5 text-gray-400 font-bold py-1.5 rounded text-[10px] uppercase cursor-pointer border-none hover:bg-white/10`,
                                                        children: `Cancelar`,
                                                      }),
                                                    ],
                                                  }),
                                                ],
                                              })
                                            : (0, b.jsxs)(`div`, {
                                                className: `flex items-center justify-between gap-3 text-xs text-left`,
                                                children: [
                                                  (0, b.jsxs)(`div`, {
                                                    className: `flex items-center gap-2.5 min-w-0`,
                                                    children: [
                                                      pa(
                                                        e.icon,
                                                        `w-6 h-6 flex-shrink-0`,
                                                      ),
                                                      (0, b.jsxs)(`div`, {
                                                        className: `min-w-0`,
                                                        children: [
                                                          (0, b.jsxs)(`div`, {
                                                            className: `flex items-center gap-1.5 flex-wrap`,
                                                            children: [
                                                              (0, b.jsx)(
                                                                `strong`,
                                                                {
                                                                  className: `text-white font-bold block truncate`,
                                                                  children:
                                                                    e.title,
                                                                },
                                                              ),
                                                              (0, b.jsx)(
                                                                `span`,
                                                                {
                                                                  className: `text-[8px] font-mono bg-white/5 text-gray-500 px-1 rounded`,
                                                                  children:
                                                                    e.key,
                                                                },
                                                              ),
                                                              r &&
                                                                (0, b.jsx)(
                                                                  `span`,
                                                                  {
                                                                    className: `text-[8px] font-bold bg-alacor-amber/15 text-alacor-amber/80 px-1.5 py-0.2 rounded uppercase`,
                                                                    children: `Sistema`,
                                                                  },
                                                                ),
                                                            ],
                                                          }),
                                                          (0, b.jsx)(`span`, {
                                                            className: `text-[10px] text-gray-400 block truncate font-light mt-0.5`,
                                                            children:
                                                              e.description,
                                                          }),
                                                        ],
                                                      }),
                                                    ],
                                                  }),
                                                  (0, b.jsxs)(`div`, {
                                                    className: `flex items-center gap-1.5 flex-shrink-0`,
                                                    children: [
                                                      (0, b.jsx)(`button`, {
                                                        type: `button`,
                                                        disabled: t === 0,
                                                        onClick: () =>
                                                          Fe(t, `up`),
                                                        className: `text-gray-400 hover:text-white bg-white/5 disabled:opacity-20 disabled:hover:text-gray-400 p-1.5 rounded cursor-pointer border-none text-[10px]`,
                                                        title: `Subir posición`,
                                                        children: `▲`,
                                                      }),
                                                      (0, b.jsx)(`button`, {
                                                        type: `button`,
                                                        disabled:
                                                          t === a.length - 1,
                                                        onClick: () =>
                                                          Fe(t, `down`),
                                                        className: `text-gray-400 hover:text-white bg-white/5 disabled:opacity-20 disabled:hover:text-gray-400 p-1.5 rounded cursor-pointer border-none text-[10px]`,
                                                        title: `Bajar posición`,
                                                        children: `▼`,
                                                      }),
                                                      (0, b.jsx)(`button`, {
                                                        type: `button`,
                                                        onClick: () => Le(e),
                                                        className: `text-alacor-amber hover:text-yellow-300 p-1.5 bg-white/5 hover:bg-white/10 rounded cursor-pointer border-none text-[10px]`,
                                                        title: `Editar categoría`,
                                                        children: `✏️`,
                                                      }),
                                                      (0, b.jsx)(`button`, {
                                                        type: `button`,
                                                        disabled: r,
                                                        onClick: () =>
                                                          Ie(e.key),
                                                        className: `text-red-400 hover:text-red-300 disabled:opacity-25 disabled:cursor-not-allowed p-1.5 bg-white/5 hover:bg-white/10 rounded cursor-pointer border-none text-[10px]`,
                                                        title: r
                                                          ? `No se puede eliminar una categoría del sistema`
                                                          : `Eliminar categoría`,
                                                        children: `🗑️`,
                                                      }),
                                                    ],
                                                  }),
                                                ],
                                              }),
                                        },
                                        e.key,
                                      );
                                    }),
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                      (0, b.jsxs)(`div`, {
                        className: `bg-alacor-card border border-white/5 rounded-2xl p-5 mb-8 flex flex-col md:flex-row justify-between items-center gap-6`,
                        children: [
                          (0, b.jsxs)(`div`, {
                            className: `text-left`,
                            children: [
                              (0, b.jsx)(`span`, {
                                className: `text-[9px] bg-alacor-amber text-alacor-dark font-black px-2.5 py-1 rounded-full uppercase tracking-wider mb-2 inline-block`,
                                children: `Integración API Comercial`,
                              }),
                              (0, b.jsxs)(`h4`, {
                                className: `text-md font-extrabold text-white uppercase leading-none flex items-center`,
                                children: [
                                  `CONEXIÓN AUTOMATIZADA CON PORTAL DE INVENTARIOS`,
                                  (0, b.jsx)(L, {
                                    text: `Sincroniza en tiempo real referencias, marcas y costos comerciales desde el servidor central de forma 100% automatizada.`,
                                  }),
                                ],
                              }),
                              (0, b.jsx)(`p`, {
                                className: `text-xs text-gray-400 mt-1.5 font-light leading-relaxed`,
                                children: `Sincronice en tiempo real todas las referencias de inventario, marcas y costos comerciales aprobados desde el servidor central de forma 100% automatizada y clasificada.`,
                              }),
                            ],
                          }),
                          (0, b.jsxs)(`div`, {
                            className: `flex flex-col items-end gap-2 w-full md:w-auto`,
                            children: [
                              (0, b.jsx)(`button`, {
                                onClick: $i,
                                disabled: It,
                                className: `w-full md:w-auto bg-alacor-amber text-alacor-dark font-black px-6 py-3.5 rounded-full text-xs uppercase tracking-widest hover:bg-yellow-400 transition-all cursor-pointer border-none shadow flex items-center justify-center gap-2 ${It ? `opacity-50 cursor-not-allowed` : ``}`,
                                children: (0, b.jsx)(`span`, {
                                  children: It
                                    ? `⏳ CONECTANDO...`
                                    : `🔄 SINCRONIZAR CATÁLOGO`,
                                }),
                              }),
                              Rt &&
                                (0, b.jsx)(`span`, {
                                  className: `text-[10px] text-green-400 font-bold uppercase tracking-wide text-right`,
                                  children: Rt,
                                }),
                            ],
                          }),
                        ],
                      }),
                      (0, b.jsxs)(`div`, {
                        className: `bg-alacor-card border border-white/5 rounded-2xl p-5 mb-8 text-left`,
                        children: [
                          (0, b.jsxs)(`div`, {
                            className: `mb-4`,
                            children: [
                              (0, b.jsx)(`span`, {
                                className: `text-[9px] bg-alacor-amber/20 text-alacor-amber font-black px-2.5 py-1 rounded-full uppercase tracking-wider mb-2 inline-block`,
                                children: `Integración Telegram`,
                              }),
                              (0, b.jsx)(`h4`, {
                                className: `text-md font-extrabold text-white uppercase leading-none mt-1`,
                                children: `Configuración de Chat en Vivo (Telegram)`,
                              }),
                              (0, b.jsx)(`p`, {
                                className: `text-xs text-gray-500 mt-1 font-light font-sans`,
                                children: `Enlaza el chat de soporte técnico de tu web directamente con un grupo o chat de Telegram mediante un bot.`,
                              }),
                            ],
                          }),
                          Fr &&
                            (0, b.jsx)(`div`, {
                              className: `mb-4 bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-lg text-xs font-semibold`,
                              children: Fr,
                            }),
                          (0, b.jsxs)(`div`, {
                            className: `grid grid-cols-1 md:grid-cols-2 gap-4`,
                            children: [
                              (0, b.jsxs)(`div`, {
                                children: [
                                  (0, b.jsxs)(`label`, {
                                    className: `text-gray-500 text-[10px] uppercase block mb-1 flex items-center font-bold`,
                                    children: [
                                      `Token del Bot de Telegram:`,
                                      (0, b.jsx)(L, {
                                        text: `Obtenido a través de @BotFather en Telegram (ej: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ).`,
                                      }),
                                    ],
                                  }),
                                  (0, b.jsx)(`input`, {
                                    type: `text`,
                                    value: jr,
                                    onChange: (e) => Mr(e.target.value),
                                    placeholder: `Ingrese el Token del Bot`,
                                    className: `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-alacor-amber`,
                                  }),
                                ],
                              }),
                              (0, b.jsxs)(`div`, {
                                children: [
                                  (0, b.jsxs)(`label`, {
                                    className: `text-gray-500 text-[10px] uppercase block mb-1 flex items-center font-bold`,
                                    children: [
                                      `ID del Chat de Respaldo / Fallback (Opcional):`,
                                      (0, b.jsx)(L, {
                                        text: `El ID numérico del chat o grupo de respaldo (ej: -100123456789).`,
                                      }),
                                    ],
                                  }),
                                  (0, b.jsx)(`input`, {
                                    type: `text`,
                                    value: Nr,
                                    onChange: (e) => Pr(e.target.value),
                                    placeholder: `Ingrese el ID del Chat o Grupo de Respaldo`,
                                    className: `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-alacor-amber`,
                                  }),
                                ],
                              }),
                            ],
                          }),
                          (0, b.jsxs)(`div`, {
                            className: `mt-4`,
                            children: [
                              (0, b.jsxs)(`label`, {
                                className: `text-gray-500 text-[10px] uppercase block mb-1 flex items-center font-bold`,
                                children: [
                                  `Mensaje de Bienvenida del Chat:`,
                                  (0, b.jsx)(L, {
                                    text: `Mensaje inicial con el que el asistente recibirá a los clientes cuando abran el chat.`,
                                  }),
                                ],
                              }),
                              (0, b.jsx)(`textarea`, {
                                value: kr,
                                onChange: (e) => Ar(e.target.value),
                                rows: 2,
                                placeholder: `Ingrese el mensaje de bienvenida`,
                                className: `w-full bg-[#070b12] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-alacor-amber resize-none`,
                              }),
                            ],
                          }),
                          (0, b.jsxs)(`div`, {
                            className: `mt-6 border-t border-white/5 pt-5`,
                            children: [
                              (0, b.jsx)(`span`, {
                                className: `text-[10px] text-gray-400 font-extrabold uppercase block mb-2 tracking-wider`,
                                children: `👥 Canales de Soporte / Usuarios Destinatarios:`,
                              }),
                              Lr.length === 0
                                ? (0, b.jsx)(`div`, {
                                    className: `bg-black/20 p-4 rounded-xl border border-white/5 text-center text-xs text-gray-500 mb-4 font-light`,
                                    children: `No hay canales configurados. Agregue un canal de soporte a continuación.`,
                                  })
                                : (0, b.jsx)(`div`, {
                                    className: `flex flex-col gap-2 mb-4`,
                                    children: Lr.map((e, t) =>
                                      (0, b.jsxs)(
                                        `div`,
                                        {
                                          className: `bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3`,
                                          children: [
                                            (0, b.jsxs)(`div`, {
                                              className: `flex items-center gap-3`,
                                              children: [
                                                (0, b.jsxs)(`span`, {
                                                  className: `px-2 py-0.5 rounded text-[9px] font-black uppercase ${e.priority === 1 ? `bg-alacor-amber text-alacor-dark` : e.priority === 2 ? `bg-blue-500/20 text-blue-400 border border-blue-500/30` : `bg-white/5 text-gray-400`}`,
                                                  children: [
                                                    `Prio `,
                                                    e.priority,
                                                  ],
                                                }),
                                                (0, b.jsxs)(`div`, {
                                                  children: [
                                                    (0, b.jsx)(`strong`, {
                                                      className: `text-white text-xs block font-bold`,
                                                      children: e.name,
                                                    }),
                                                    (0, b.jsxs)(`span`, {
                                                      className: `text-[10px] font-mono text-gray-500`,
                                                      children: [
                                                        `Chat ID: `,
                                                        e.chatId,
                                                      ],
                                                    }),
                                                  ],
                                                }),
                                              ],
                                            }),
                                            (0, b.jsxs)(`div`, {
                                              className: `flex items-center gap-3 self-end sm:self-auto`,
                                              children: [
                                                (0, b.jsx)(`span`, {
                                                  className: `px-2 py-0.5 rounded-full text-[9px] font-bold ${e.enabled ? `bg-green-500/10 text-green-400 border border-green-500/20` : `bg-red-500/10 text-red-400 border border-red-500/20`}`,
                                                  children: e.enabled
                                                    ? `ACTIVO`
                                                    : `INACTIVO`,
                                                }),
                                                (0, b.jsxs)(`div`, {
                                                  className: `flex items-center gap-1.5`,
                                                  children: [
                                                    (0, b.jsx)(`button`, {
                                                      type: `button`,
                                                      onClick: () => Zi(e),
                                                      className: `text-alacor-amber hover:text-yellow-300 p-1.5 bg-white/5 hover:bg-white/10 rounded cursor-pointer border-none text-[10px]`,
                                                      title: `Editar canal`,
                                                      children: `✏️`,
                                                    }),
                                                    (0, b.jsx)(`button`, {
                                                      type: `button`,
                                                      onClick: () => Xi(e.id),
                                                      className: `text-red-400 hover:text-red-300 p-1.5 bg-white/5 hover:bg-white/10 rounded cursor-pointer border-none text-[10px]`,
                                                      title: `Eliminar canal`,
                                                      children: `🗑️`,
                                                    }),
                                                  ],
                                                }),
                                              ],
                                            }),
                                          ],
                                        },
                                        e.id || t,
                                      ),
                                    ),
                                  }),
                              (0, b.jsxs)(`div`, {
                                className: `bg-black/20 p-4 rounded-xl border border-white/5 text-left mb-4`,
                                children: [
                                  (0, b.jsx)(`span`, {
                                    className: `text-[9px] text-alacor-amber font-black block mb-3 uppercase tracking-wider`,
                                    children: di
                                      ? `✏️ Editar Canal Comercial`
                                      : `➕ Registrar Nuevo Canal Comercial`,
                                  }),
                                  (0, b.jsxs)(`div`, {
                                    className: `grid grid-cols-1 sm:grid-cols-3 gap-3`,
                                    children: [
                                      (0, b.jsxs)(`div`, {
                                        children: [
                                          (0, b.jsx)(`label`, {
                                            className: `text-gray-500 text-[9px] uppercase block mb-1 font-bold`,
                                            children: `Nombre del Agente/Canal:`,
                                          }),
                                          (0, b.jsx)(`input`, {
                                            type: `text`,
                                            value: di ? pi : zr,
                                            onChange: (e) =>
                                              di
                                                ? mi(e.target.value)
                                                : Br(e.target.value),
                                            placeholder: `Ej: Soporte Ventas`,
                                            className: `w-full bg-[#070b12] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-alacor-amber`,
                                          }),
                                        ],
                                      }),
                                      (0, b.jsxs)(`div`, {
                                        children: [
                                          (0, b.jsx)(`label`, {
                                            className: `text-gray-500 text-[9px] uppercase block mb-1 font-bold`,
                                            children: `ID del Chat Telegram:`,
                                          }),
                                          (0, b.jsx)(`input`, {
                                            type: `text`,
                                            value: di ? hi : ai,
                                            onChange: (e) =>
                                              di
                                                ? gi(e.target.value)
                                                : oi(e.target.value),
                                            placeholder: `Ej: -100123456789`,
                                            className: `w-full bg-[#070b12] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-alacor-amber`,
                                          }),
                                        ],
                                      }),
                                      (0, b.jsxs)(`div`, {
                                        className: `grid grid-cols-2 gap-2`,
                                        children: [
                                          (0, b.jsxs)(`div`, {
                                            children: [
                                              (0, b.jsx)(`label`, {
                                                className: `text-gray-500 text-[9px] uppercase block mb-1 font-bold`,
                                                children: `Prioridad:`,
                                              }),
                                              (0, b.jsx)(`input`, {
                                                type: `number`,
                                                min: `1`,
                                                value: di ? _i : si,
                                                onChange: (e) =>
                                                  di
                                                    ? vi(Number(e.target.value))
                                                    : ci(
                                                        Number(e.target.value),
                                                      ),
                                                className: `w-full bg-[#070b12] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-alacor-amber`,
                                              }),
                                            ],
                                          }),
                                          (0, b.jsx)(`div`, {
                                            className: `flex flex-col justify-end items-start pb-2`,
                                            children: (0, b.jsxs)(`label`, {
                                              className: `flex items-center gap-1.5 text-xs text-gray-300 font-semibold cursor-pointer select-none`,
                                              children: [
                                                (0, b.jsx)(`input`, {
                                                  type: `checkbox`,
                                                  checked: di ? yi : li,
                                                  onChange: (e) =>
                                                    di
                                                      ? bi(e.target.checked)
                                                      : ui(e.target.checked),
                                                  className: `w-3.5 h-3.5 accent-alacor-amber`,
                                                }),
                                                `Activo`,
                                              ],
                                            }),
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  (0, b.jsxs)(`div`, {
                                    className: `flex justify-end gap-2 mt-4 pt-3 border-t border-white/5`,
                                    children: [
                                      di &&
                                        (0, b.jsx)(`button`, {
                                          type: `button`,
                                          onClick: () => fi(null),
                                          className: `bg-white/5 hover:bg-white/10 text-white font-bold px-4 py-2 rounded-lg text-[10px] uppercase cursor-pointer border-none`,
                                          children: `Cancelar`,
                                        }),
                                      (0, b.jsx)(`button`, {
                                        type: `button`,
                                        onClick: (e) => {
                                          di ? Qi(e) : Yi(e);
                                        },
                                        className: `bg-alacor-amber text-alacor-dark font-black px-5 py-2 rounded-lg text-[10px] uppercase tracking-wider hover:bg-yellow-400 transition-all cursor-pointer border-none`,
                                        children: di
                                          ? `Guardar Cambios`
                                          : `Registrar Canal`,
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          }),
                          (0, b.jsxs)(`div`, {
                            className: `flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-5 pt-4 border-t border-white/5`,
                            children: [
                              (0, b.jsxs)(`div`, {
                                className: `flex items-center gap-2`,
                                children: [
                                  (0, b.jsx)(`input`, {
                                    type: `checkbox`,
                                    id: `chat-enabled-checkbox`,
                                    checked: Dr,
                                    onChange: (e) => Or(e.target.checked),
                                    className: `w-4 h-4 accent-alacor-amber cursor-pointer rounded`,
                                  }),
                                  (0, b.jsx)(`label`, {
                                    htmlFor: `chat-enabled-checkbox`,
                                    className: `text-xs text-gray-300 font-semibold cursor-pointer select-none`,
                                    children: `Habilitar Chat en Vivo (Integración con Telegram)`,
                                  }),
                                ],
                              }),
                              (0, b.jsx)(`button`, {
                                onClick: Ji,
                                className: `w-full md:w-auto bg-alacor-amber text-alacor-dark font-black px-6 py-3.5 rounded-full text-xs uppercase tracking-widest hover:bg-yellow-400 transition-all cursor-pointer border-none shadow`,
                                children: `Guardar Configuración de Chat`,
                              }),
                            ],
                          }),
                        ],
                      }),
                      /* --- SECCIÓN ADMINISTRATIVA: PASARELA DE MODELOS LLM & INFERENCIA --- */
                      (0, b.jsxs)(`div`, {
                        className: `bg-alacor-card border border-white/5 rounded-2xl p-5 mb-8 text-left`,
                        children: [
                          (0, b.jsxs)(`div`, {
                            className: `mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4`,
                            children: [
                              (0, b.jsxs)(`div`, {
                                children: [
                                  (0, b.jsxs)(`div`, {
                                    className: `flex items-center gap-2`,
                                    children: [
                                      (0, b.jsx)(`span`, {
                                        className: `text-alacor-amber text-lg`,
                                        children: `🧠`,
                                      }),
                                      (0, b.jsx)(`h4`, {
                                        className: `text-md font-extrabold text-white uppercase leading-none`,
                                        children: `Pasarela de Modelos LLM (Inferencia & RAG)`,
                                      }),
                                    ],
                                  }),
                                  (0, b.jsx)(`p`, {
                                    className: `text-xs text-gray-500 mt-1 font-light font-sans`,
                                    children: `Configure proveedores (Groq, GitHub, Gemini, OpenAI, Claude), claves API, prioridades y redundancia activa.`,
                                  }),
                                ],
                              }),
                              (0, b.jsxs)(`div`, {
                                className: `flex items-center gap-2 self-end sm:self-auto`,
                                children: [
                                  (0, b.jsx)(`button`, {
                                    type: `button`,
                                    onClick: () => {
                                      setIsAddingLlm(!isAddingLlm);
                                      setEditingLlmProvider(null);
                                      setLlmForm({
                                        name: ``,
                                        provider: `GROQ`,
                                        model: `openai/gpt-oss-120b`,
                                        apiKey: ``,
                                        priority:
                                          (aiConfigData.providers?.length ||
                                            0) + 1,
                                        temperature: 0.5,
                                        enabled: !0,
                                      });
                                    },
                                    className: `bg-white/5 hover:bg-white/10 text-white font-bold px-3 py-2 rounded-lg text-[10px] uppercase tracking-wider transition-all cursor-pointer border border-white/10`,
                                    children: isAddingLlm
                                      ? `✕ Cerrar Formulario`
                                      : `➕ Nuevo Proveedor`,
                                  }),
                                  (0, b.jsx)(`button`, {
                                    type: `button`,
                                    onClick: () => {
                                      fetch(
                                        `/api/config/ai?password=alacor2026`,
                                        {
                                          method: `POST`,
                                          headers: {
                                            "Content-Type": `application/json`,
                                            "x-admin-password": `alacor2026`,
                                          },
                                          body: JSON.stringify(aiConfigData),
                                        },
                                      )
                                        .then((e) => e.json())
                                        .then((data) => {
                                          if (data.success) {
                                            setAiConfigSaveMsg(
                                              `✅ Configuración de LLMs guardada exitosamente.`,
                                            );
                                            setTimeout(
                                              () => setAiConfigSaveMsg(``),
                                              4000,
                                            );
                                          } else {
                                            alert(`Error: ${data.error}`);
                                          }
                                        })
                                        .catch((err) =>
                                          alert(
                                            `Error de red: ${err.message}`,
                                          ),
                                        );
                                    },
                                    className: `bg-alacor-amber text-alacor-dark font-black px-4 py-2 rounded-lg text-[10px] uppercase tracking-wider hover:bg-yellow-400 transition-all cursor-pointer border-none shadow`,
                                    children: `💾 Guardar Configuración IA`,
                                  }),
                                ],
                              }),
                            ],
                          }),
                          aiConfigSaveMsg &&
                            (0, b.jsx)(`div`, {
                              className: `bg-green-500/10 border border-green-500/20 text-green-400 text-xs px-4 py-2.5 rounded-xl mb-4 font-semibold animate-fade-in`,
                              children: aiConfigSaveMsg,
                            }),
                          (0, b.jsxs)(`div`, {
                            className: `bg-black/30 p-3 rounded-xl border border-white/5 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`,
                            children: [
                              (0, b.jsxs)(`div`, {
                                children: [
                                  (0, b.jsx)(`span`, {
                                    className: `text-[10px] uppercase text-gray-400 font-bold block`,
                                    children: `Estrategia de Ejecución / Redundancia:`,
                                  }),
                                  (0, b.jsx)(`span`, {
                                    className: `text-xs text-gray-300 font-light`,
                                    children: `En caso de saturación o límite de cuota, el sistema ejecutará en milisegundos el siguiente proveedor en orden de prioridad.`,
                                  }),
                                ],
                              }),
                              (0, b.jsxs)(`select`, {
                                value:
                                  aiConfigData.activeModel || `fallback_chain`,
                                onChange: (e) =>
                                  setAiConfigData((prev) => ({
                                    ...prev,
                                    activeModel: e.target.value,
                                  })),
                                className: `bg-[#070b12] border border-white/10 text-white rounded-lg px-3 py-1.5 text-xs font-bold focus:border-alacor-amber outline-none`,
                                children: [
                                  (0, b.jsx)(`option`, {
                                    value: `fallback_chain`,
                                    children: `⚡ Cadena de Respaldo por Prioridad (Fallback Automático)`,
                                  }),
                                  (0, b.jsx)(`option`, {
                                    value: `single_model`,
                                    children: `🎯 Exclusivo Proveedor Prioridad #1`,
                                  }),
                                ],
                              }),
                            ],
                          }),
                          (isAddingLlm || editingLlmProvider) &&
                            (0, b.jsxs)(`div`, {
                              className: `bg-black/40 border border-alacor-amber/30 rounded-xl p-4 mb-5 space-y-3 animate-fade-in`,
                              children: [
                                (0, b.jsx)(`span`, {
                                  className: `text-[10px] text-alacor-amber font-black uppercase tracking-wider block`,
                                  children: editingLlmProvider
                                    ? `✏️ Editar Proveedor de IA`
                                    : `➕ Registrar Nuevo Proveedor de IA`,
                                }),
                                (0, b.jsxs)(`div`, {
                                  className: `grid grid-cols-1 sm:grid-cols-3 gap-3`,
                                  children: [
                                    (0, b.jsxs)(`div`, {
                                      children: [
                                        (0, b.jsx)(`label`, {
                                          className: `text-gray-500 text-[9px] uppercase block mb-1 font-bold`,
                                          children: `Nombre Descriptivo:`,
                                        }),
                                        (0, b.jsx)(`input`, {
                                          type: `text`,
                                          value: llmForm.name,
                                          onChange: (e) =>
                                            setLlmForm((prev) => ({
                                              ...prev,
                                              name: e.target.value,
                                            })),
                                          placeholder: `Ej: Groq GPT-OSS 120B Principal`,
                                          className: `w-full bg-[#070b12] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-alacor-amber`,
                                        }),
                                      ],
                                    }),
                                    (0, b.jsxs)(`div`, {
                                      children: [
                                        (0, b.jsx)(`label`, {
                                          className: `text-gray-500 text-[9px] uppercase block mb-1 font-bold`,
                                          children: `Plataforma / Proveedor:`,
                                        }),
                                        (0, b.jsxs)(`select`, {
                                          value: llmForm.provider,
                                          onChange: (e) => {
                                            const p = e.target.value;
                                            let defaultModel = `openai/gpt-oss-120b`;
                                            if (p === `GITHUB`)
                                              defaultModel = `gpt-4o-mini`;
                                            else if (p === `GEMINI`)
                                              defaultModel = `gemini-2.0-flash`;
                                            else if (p === `OPENAI`)
                                              defaultModel = `gpt-4o-mini`;
                                            else if (p === `CLAUDE`)
                                              defaultModel = `claude-3-5-haiku-20241022`;
                                            setLlmForm((prev) => ({
                                              ...prev,
                                              provider: p,
                                              model: defaultModel,
                                            }));
                                          },
                                          className: `w-full bg-[#070b12] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-alacor-amber`,
                                          children: [
                                            (0, b.jsx)(`option`, {
                                              value: `GROQ`,
                                              children: `GROQ (Ultra-rápido)`,
                                            }),
                                            (0, b.jsx)(`option`, {
                                              value: `GITHUB`,
                                              children: `GITHUB MODELS (Azure)`,
                                            }),
                                            (0, b.jsx)(`option`, {
                                              value: `GEMINI`,
                                              children: `GOOGLE GEMINI`,
                                            }),
                                            (0, b.jsx)(`option`, {
                                              value: `OPENAI`,
                                              children: `OPENAI`,
                                            }),
                                            (0, b.jsx)(`option`, {
                                              value: `CLAUDE`,
                                              children: `ANTHROPIC CLAUDE`,
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                    (0, b.jsxs)(`div`, {
                                      children: [
                                        (0, b.jsx)(`label`, {
                                          className: `text-gray-500 text-[9px] uppercase block mb-1 font-bold`,
                                          children: `Identificador del Modelo:`,
                                        }),
                                        (0, b.jsx)(`input`, {
                                          type: `text`,
                                          value: llmForm.model,
                                          onChange: (e) =>
                                            setLlmForm((prev) => ({
                                              ...prev,
                                              model: e.target.value,
                                            })),
                                          placeholder: `Ej: openai/gpt-oss-120b`,
                                          className: `w-full bg-[#070b12] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-alacor-amber`,
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                                (0, b.jsxs)(`div`, {
                                  className: `grid grid-cols-1 sm:grid-cols-12 gap-3 items-end`,
                                  children: [
                                    (0, b.jsxs)(`div`, {
                                      className: `sm:col-span-7`,
                                      children: [
                                        (0, b.jsx)(`label`, {
                                          className: `text-gray-500 text-[9px] uppercase block mb-1 font-bold`,
                                          children: `API Key / Token de Acceso:`,
                                        }),
                                        (0, b.jsx)(`input`, {
                                          type: `password`,
                                          value: llmForm.apiKey,
                                          onChange: (e) =>
                                            setLlmForm((prev) => ({
                                              ...prev,
                                              apiKey: e.target.value,
                                            })),
                                          placeholder: `gsk_..., ghp_..., sk-..., etc.`,
                                          className: `w-full bg-[#070b12] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-alacor-amber font-mono`,
                                        }),
                                      ],
                                    }),
                                    (0, b.jsxs)(`div`, {
                                      className: `sm:col-span-2`,
                                      children: [
                                        (0, b.jsx)(`label`, {
                                          className: `text-gray-500 text-[9px] uppercase block mb-1 font-bold`,
                                          children: `Prioridad:`,
                                        }),
                                        (0, b.jsx)(`input`, {
                                          type: `number`,
                                          min: `1`,
                                          max: `10`,
                                          value: llmForm.priority,
                                          onChange: (e) =>
                                            setLlmForm((prev) => ({
                                              ...prev,
                                              priority:
                                                Number(e.target.value) || 1,
                                            })),
                                          className: `w-full bg-[#070b12] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-alacor-amber`,
                                        }),
                                      ],
                                    }),
                                    (0, b.jsxs)(`div`, {
                                      className: `sm:col-span-3 flex items-center gap-2 pb-2`,
                                      children: [
                                        (0, b.jsx)(`input`, {
                                          type: `checkbox`,
                                          id: `llm-enabled-check`,
                                          checked: llmForm.enabled,
                                          onChange: (e) =>
                                            setLlmForm((prev) => ({
                                              ...prev,
                                              enabled: e.target.checked,
                                            })),
                                          className: `w-4 h-4 accent-alacor-amber cursor-pointer`,
                                        }),
                                        (0, b.jsx)(`label`, {
                                          htmlFor: `llm-enabled-check`,
                                          className: `text-xs text-gray-300 font-semibold cursor-pointer select-none`,
                                          children: `Proveedor Activo`,
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                                (0, b.jsxs)(`div`, {
                                  className: `flex justify-end gap-2 pt-2 border-t border-white/5`,
                                  children: [
                                    (0, b.jsx)(`button`, {
                                      type: `button`,
                                      onClick: () => {
                                        setIsAddingLlm(!1);
                                        setEditingLlmProvider(null);
                                      },
                                      className: `bg-white/5 hover:bg-white/10 text-white font-bold px-4 py-2 rounded-lg text-[10px] uppercase cursor-pointer border-none`,
                                      children: `Cancelar`,
                                    }),
                                    (0, b.jsx)(`button`, {
                                      type: `button`,
                                      onClick: () => {
                                        if (!llmForm.name || !llmForm.apiKey) {
                                          alert(
                                            `Por favor complete el nombre y la API Key.`,
                                          );
                                          return;
                                        }
                                        const provId = editingLlmProvider
                                          ? editingLlmProvider.id
                                          : `prov_${Date.now()}`;
                                        const newProv = {
                                          ...llmForm,
                                          id: provId,
                                          status: `LISTO`,
                                          errorCount: 0,
                                          lastError: null,
                                        };
                                        let updatedList = [];
                                        if (editingLlmProvider) {
                                          updatedList = (
                                            aiConfigData.providers || []
                                          ).map((p) =>
                                            p.id === editingLlmProvider.id
                                              ? newProv
                                              : p,
                                          );
                                        } else {
                                          updatedList = [
                                            ...(aiConfigData.providers || []),
                                            newProv,
                                          ];
                                        }
                                        updatedList.sort(
                                          (a, b) =>
                                            (Number(a.priority) || 1) -
                                            (Number(b.priority) || 1),
                                        );
                                        const newAiData = {
                                          ...aiConfigData,
                                          providers: updatedList,
                                        };
                                        setAiConfigData(newAiData);
                                        setIsAddingLlm(!1);
                                        setEditingLlmProvider(null);
                                        fetch(
                                          `/api/config/ai?password=alacor2026`,
                                          {
                                            method: `POST`,
                                            headers: {
                                              "Content-Type": `application/json`,
                                              "x-admin-password": `alacor2026`,
                                            },
                                            body: JSON.stringify(newAiData),
                                          },
                                        )
                                          .then((e) => e.json())
                                          .then((d) => {
                                            if (d.success) {
                                              setAiConfigSaveMsg(
                                                `✅ Proveedor guardado correctamente.`,
                                              );
                                              setTimeout(
                                                () => setAiConfigSaveMsg(``),
                                                3000,
                                              );
                                            }
                                          });
                                      },
                                      className: `bg-alacor-amber text-alacor-dark font-black px-5 py-2 rounded-lg text-[10px] uppercase tracking-wider hover:bg-yellow-400 transition-all cursor-pointer border-none`,
                                      children: editingLlmProvider
                                        ? `Guardar Cambios`
                                        : `Registrar Proveedor`,
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          (0, b.jsx)(`div`, {
                            className: `space-y-3`,
                            children:
                              (aiConfigData.providers || []).length === 0
                                ? (0, b.jsx)(`p`, {
                                    className: `text-gray-500 text-xs text-center py-6`,
                                    children: `No hay proveedores de IA registrados. Presione "Nuevo Proveedor" para agregar uno.`,
                                  })
                                : (aiConfigData.providers || []).map((prov) =>
                                    (0, b.jsxs)(
                                      `div`,
                                      {
                                        className: `bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all`,
                                        children: [
                                          (0, b.jsxs)(`div`, {
                                            className: `flex items-start gap-3 flex-1 min-w-0`,
                                            children: [
                                              (0, b.jsxs)(`span`, {
                                                className: `px-2 py-1 rounded text-[9px] font-black uppercase shrink-0 ${
                                                  prov.priority === 1
                                                    ? `bg-alacor-amber text-alacor-dark shadow-sm`
                                                    : prov.priority === 2
                                                      ? `bg-blue-500/20 text-blue-400 border border-blue-500/30`
                                                      : `bg-white/5 text-gray-400`
                                                }`,
                                                children: [
                                                  `Prio #`,
                                                  prov.priority,
                                                ],
                                              }),
                                              (0, b.jsxs)(`div`, {
                                                className: `flex-1 min-w-0`,
                                                children: [
                                                  (0, b.jsxs)(`div`, {
                                                    className: `flex items-center gap-2 flex-wrap`,
                                                    children: [
                                                      (0, b.jsx)(`span`, {
                                                        className: `px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                                                          prov.provider ===
                                                          `GROQ`
                                                            ? `bg-orange-500/20 text-orange-400 border border-orange-500/30`
                                                            : prov.provider ===
                                                                `GITHUB`
                                                              ? `bg-purple-500/20 text-purple-400 border border-purple-500/30`
                                                              : prov.provider ===
                                                                  `GEMINI`
                                                                ? `bg-blue-500/20 text-blue-400 border border-blue-500/30`
                                                                : prov.provider ===
                                                                    `CLAUDE`
                                                                  ? `bg-amber-500/20 text-amber-300 border border-amber-500/30`
                                                                  : `bg-green-500/20 text-green-400 border border-green-500/30`
                                                        }`,
                                                        children: prov.provider,
                                                      }),
                                                      (0, b.jsx)(`strong`, {
                                                        className: `text-white text-xs font-bold truncate`,
                                                        children: prov.name,
                                                      }),
                                                    ],
                                                  }),
                                                  (0, b.jsxs)(`div`, {
                                                    className: `flex items-center gap-3 text-[10px] text-gray-400 mt-1 flex-wrap font-mono`,
                                                    children: [
                                                      (0, b.jsxs)(`span`, {
                                                        className: `text-gray-300`,
                                                        children: [
                                                          `Modelo: `,
                                                          prov.model,
                                                        ],
                                                      }),
                                                      (0, b.jsxs)(`span`, {
                                                        children: [
                                                          `API Key: `,
                                                          showApiKeyMap[prov.id]
                                                            ? prov.apiKey
                                                            : prov.apiKey
                                                              ? `${prov.apiKey.substring(0, 6)}••••••••${prov.apiKey.slice(-4)}`
                                                              : `(Sin configurar)`,
                                                        ],
                                                      }),
                                                      (0, b.jsx)(`button`, {
                                                        type: `button`,
                                                        onClick: () =>
                                                          setShowApiKeyMap(
                                                            (prev) => ({
                                                              ...prev,
                                                              [prov.id]:
                                                                !prev[prov.id],
                                                            }),
                                                          ),
                                                        className: `text-[10px] text-alacor-amber hover:underline border-none bg-transparent cursor-pointer`,
                                                        children: showApiKeyMap[
                                                          prov.id
                                                        ]
                                                          ? `Ocultar`
                                                          : `Ver`,
                                                      }),
                                                    ],
                                                  }),
                                                  llmTestResults[prov.id] &&
                                                    (0, b.jsx)(`p`, {
                                                      className: `text-[10px] mt-1.5 font-semibold ${
                                                        llmTestResults[prov.id]
                                                          .success
                                                          ? `text-green-400`
                                                          : `text-red-400`
                                                      }`,
                                                      children:
                                                        llmTestResults[prov.id]
                                                          .msg,
                                                    }),
                                                ],
                                              }),
                                            ],
                                          }),
                                          (0, b.jsxs)(`div`, {
                                            className: `flex items-center gap-2 self-end md:self-center`,
                                            children: [
                                              (0, b.jsx)(`button`, {
                                                type: `button`,
                                                onClick: () => {
                                                  setTestingLlmId(prov.id);
                                                  fetch(
                                                    `/api/config/ai/test-provider?password=alacor2026`,
                                                    {
                                                      method: `POST`,
                                                      headers: {
                                                        "Content-Type": `application/json`,
                                                        "x-admin-password": `alacor2026`,
                                                      },
                                                      body: JSON.stringify({
                                                        providerId: prov.id,
                                                        providerData: prov,
                                                      }),
                                                    },
                                                  )
                                                    .then((e) => e.json())
                                                    .then((d) => {
                                                      if (d.success) {
                                                        setLlmTestResults(
                                                          (prev) => ({
                                                            ...prev,
                                                            [prov.id]: {
                                                              success: !0,
                                                              msg: `✅ Conexión Exitosa (Modelo: ${prov.model})`,
                                                            },
                                                          }),
                                                        );
                                                      } else {
                                                        setLlmTestResults(
                                                          (prev) => ({
                                                            ...prev,
                                                            [prov.id]: {
                                                              success: !1,
                                                              msg: `❌ Fallo: ${d.error || `No responde`}`,
                                                            },
                                                          }),
                                                        );
                                                      }
                                                    })
                                                    .catch((err) => {
                                                      setLlmTestResults(
                                                        (prev) => ({
                                                          ...prev,
                                                          [prov.id]: {
                                                            success: !1,
                                                            msg: `❌ Error de red: ${err.message}`,
                                                          },
                                                        }),
                                                      );
                                                    })
                                                    .finally(() =>
                                                      setTestingLlmId(null),
                                                    );
                                              },
                                              disabled:
                                                testingLlmId === prov.id,
                                              className: `text-[10px] bg-white/5 hover:bg-white/10 text-alacor-amber font-bold px-2.5 py-1.5 rounded-lg border border-white/10 cursor-pointer transition-all disabled:opacity-50`,
                                              children:
                                                testingLlmId === prov.id
                                                  ? `⏳ Probando...`
                                                  : `⚡ Probar`,
                                            }),
                                            (0, b.jsx)(`button`, {
                                              type: `button`,
                                              onClick: () => {
                                                const updated = (
                                                  aiConfigData.providers || []
                                                ).map((p) =>
                                                  p.id === prov.id
                                                    ? {
                                                        ...p,
                                                        enabled: !p.enabled,
                                                      }
                                                    : p,
                                                );
                                                const newAiData = {
                                                  ...aiConfigData,
                                                  providers: updated,
                                                };
                                                setAiConfigData(newAiData);
                                                fetch(
                                                  `/api/config/ai?password=alacor2026`,
                                                  {
                                                    method: `POST`,
                                                    headers: {
                                                      "Content-Type": `application/json`,
                                                      "x-admin-password": `alacor2026`,
                                                    },
                                                    body: JSON.stringify(
                                                      newAiData,
                                                    ),
                                                  },
                                                );
                                              },
                                              className: `px-2 py-1 rounded-md text-[9px] font-bold cursor-pointer border-none ${
                                                prov.enabled
                                                  ? `bg-green-500/15 text-green-400 border border-green-500/30`
                                                  : `bg-red-500/15 text-red-400 border border-red-500/30`
                                              }`,
                                              children: prov.enabled
                                                ? `ACTIVO`
                                                : `INACTIVO`,
                                            }),
                                            (0, b.jsx)(`button`, {
                                              type: `button`,
                                              onClick: () => {
                                                setEditingLlmProvider(prov);
                                                setLlmForm({
                                                  name: prov.name,
                                                  provider: prov.provider,
                                                  model: prov.model,
                                                  apiKey: prov.apiKey,
                                                  priority: prov.priority,
                                                  temperature:
                                                    prov.temperature || 0.5,
                                                  enabled: prov.enabled !== !1,
                                                });
                                                setIsAddingLlm(!1);
                                              },
                                              className: `text-alacor-amber hover:text-yellow-300 p-1.5 bg-white/5 hover:bg-white/10 rounded cursor-pointer border-none text-[10px]`,
                                              title: `Editar proveedor`,
                                              children: `✏️`,
                                            }),
                                            (0, b.jsx)(`button`, {
                                              type: `button`,
                                              onClick: () => {
                                                if (
                                                  confirm(
                                                    `¿Eliminar proveedor ${prov.name}?`,
                                                  )
                                                ) {
                                                  const filtered = (
                                                    aiConfigData.providers || []
                                                  ).filter(
                                                    (p) => p.id !== prov.id,
                                                  );
                                                  const newAiData = {
                                                    ...aiConfigData,
                                                    providers: filtered,
                                                  };
                                                  setAiConfigData(newAiData);
                                                  fetch(
                                                    `/api/config/ai?password=alacor2026`,
                                                    {
                                                      method: `POST`,
                                                      headers: {
                                                        "Content-Type": `application/json`,
                                                        "x-admin-password": `alacor2026`,
                                                      },
                                                      body: JSON.stringify(
                                                        newAiData,
                                                      ),
                                                    },
                                                  );
                                                }
                                              },
                                              className: `text-red-400 hover:text-red-300 p-1.5 bg-white/5 hover:bg-white/10 rounded cursor-pointer border-none text-[10px]`,
                                              title: `Eliminar proveedor`,
                                              children: `🗑️`,
                                            }),
                                          ],
                                        }),
                                      ],
                                    },
                                    prov.id,
                                  ),
                                ),
                          }),
                        ],
                      }),
                      (0, b.jsxs)(`div`, {
                        className: `bg-alacor-card border border-white/5 rounded-2xl p-5 mb-8 text-left`,
                        children: [
                          (0, b.jsxs)(`div`, {
                            className: `mb-4 flex items-center justify-between`,
                            children: [
                              (0, b.jsxs)(`div`, {
                                children: [
                                  (0, b.jsx)(`span`, {
                                    className: `text-alacor-amber text-lg`,
                                    children: `🤖`,
                                  }),
                                  (0, b.jsx)(`h4`, {
                                    className: `text-md font-extrabold text-white uppercase leading-none mt-1`,
                                    children: `Motor de Aprendizaje — Entrenamiento del Bot`,
                                  }),
                                  (0, b.jsx)(`p`, {
                                    className: `text-xs text-gray-500 mt-1 font-light font-sans`,
                                    children: `Enseña al asistente respuestas nuevas y revisa las consultas del catálogo.`,
                                  }),
                                ],
                              }),
                              (0, b.jsx)(`button`, {
                                onClick: () => {
                                  (fetch(`/api/chat/ml-stats`)
                                    .then((e) => e.json())
                                    .then((e) => Hr(e))
                                    .catch(() => {}),
                                    fetch(`/api/chat/unmatched`)
                                      .then((e) => e.json())
                                      .then((e) => Wr(e))
                                      .catch(() => {}),
                                    fetch(`/api/chat/training-examples`)
                                      .then((e) => e.json())
                                      .then((e) =>
                                        setTrainedExamples(
                                          Array.isArray(e) ? e : [],
                                        ),
                                      )
                                      .catch(() => {}));
                                },
                                className: `bg-white/5 hover:bg-white/10 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest transition-all cursor-pointer border border-white/10`,
                                children: `↻ Actualizar`,
                              }),
                            ],
                          }),
                          Vr &&
                            (0, b.jsx)(`div`, {
                              className: `grid grid-cols-3 gap-3 mb-5`,
                              children: [
                                [`Ejemplos`, Vr.totalExamples],
                                [`Categorías`, Vr.categories],
                                [`Pendientes`, Vr.unmatchedPending],
                              ].map(([e, t]) =>
                                (0, b.jsxs)(
                                  `div`,
                                  {
                                    className: `bg-white/5 rounded-xl p-3 text-center`,
                                    children: [
                                      (0, b.jsx)(`p`, {
                                        className: `text-alacor-amber font-black text-xl`,
                                        children: t,
                                      }),
                                      (0, b.jsx)(`p`, {
                                        className: `text-gray-400 text-[10px] uppercase tracking-wider mt-0.5`,
                                        children: e,
                                      }),
                                    ],
                                  },
                                  e,
                                ),
                              ),
                            }),
                          (0, b.jsx)(`div`, {
                            className: `flex flex-wrap gap-2 mb-4`,
                            children: [
                              [
                                `trained`,
                                `📚 Ejemplos Entrenados` +
                                  (trainedExamples.length > 0
                                    ? ` (${trainedExamples.length})`
                                    : ``),
                              ],
                              [
                                `unmatched`,
                                `📋 Sin respuesta` +
                                  (Ur.length > 0 ? ` (${Ur.length})` : ``),
                              ],
                              [`manual`, `✏️ Agregar ejemplo`],
                            ].map(([e, t]) =>
                              (0, b.jsx)(
                                `button`,
                                {
                                  onClick: () => ni(e),
                                  className: `text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer border-none ${ti === e ? `bg-alacor-amber text-alacor-dark` : `bg-white/5 text-gray-400 hover:bg-white/10`}`,
                                  children: t,
                                },
                                e,
                              ),
                            ),
                          }),
                          ti === `trained` &&
                            (0, b.jsxs)(`div`, {
                              className: `space-y-4`,
                              children: [
                                (0, b.jsxs)(`div`, {
                                  className: `flex flex-col sm:flex-row gap-2 items-center justify-between`,
                                  children: [
                                    (0, b.jsx)(`input`, {
                                      type: `text`,
                                      value: trainedSearch,
                                      onChange: (e) =>
                                        setTrainedSearch(e.target.value),
                                      placeholder: `🔍 Buscar en preguntas o respuestas...`,
                                      className: `w-full sm:w-72 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-alacor-amber`,
                                    }),
                                    (0, b.jsxs)(`div`, {
                                      className: `flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto py-1 max-w-full`,
                                      children: [
                                        (0, b.jsxs)(
                                          `button`,
                                          {
                                            onClick: () =>
                                              setTrainedCatFilter(`ALL`),
                                            className: `text-[9px] uppercase px-2.5 py-1 rounded-md font-bold transition-all border-none cursor-pointer ${trainedCatFilter === `ALL` ? `bg-alacor-amber text-alacor-dark` : `bg-white/5 text-gray-400 hover:bg-white/10`}`,
                                            children: [
                                              `Todos (`,
                                              trainedExamples.length,
                                              `)`,
                                            ],
                                          },
                                          `all`,
                                        ),
                                        [
                                          ...new Set(
                                            trainedExamples.map(
                                              (e) => e.category,
                                            ),
                                          ),
                                        ]
                                          .sort()
                                          .map((e) => {
                                            const t = trainedExamples.filter(
                                              (t) => t.category === e,
                                            ).length;
                                            return (0, b.jsxs)(
                                              `button`,
                                              {
                                                onClick: () =>
                                                  setTrainedCatFilter(e),
                                                className: `text-[9px] uppercase px-2.5 py-1 rounded-md font-bold transition-all border-none cursor-pointer whitespace-nowrap ${trainedCatFilter === e ? `bg-alacor-amber text-alacor-dark` : `bg-white/5 text-gray-400 hover:bg-white/10`}`,
                                                children: [e, ` (`, t, `)`],
                                              },
                                              e,
                                            );
                                          }),
                                      ],
                                    }),
                                  ],
                                }),
                                (0, b.jsx)(`div`, {
                                  className: `space-y-3 max-h-96 overflow-y-auto pr-1`,
                                  children: (() => {
                                    const e = trainedExamples.filter((e) => {
                                      const t =
                                          trainedCatFilter === `ALL` ||
                                          e.category === trainedCatFilter,
                                        n = (trainedSearch || ``)
                                          .toLowerCase()
                                          .trim(),
                                        s =
                                          !n ||
                                          (e.input || ``)
                                            .toLowerCase()
                                            .includes(n) ||
                                          (e.answer || ``)
                                            .toLowerCase()
                                            .includes(n) ||
                                          (e.category || ``)
                                            .toLowerCase()
                                            .includes(n);
                                      return t && s;
                                    });
                                    return e.length === 0
                                      ? (0, b.jsx)(`p`, {
                                          className: `text-gray-500 text-xs text-center py-6`,
                                          children:
                                            trainedExamples.length === 0
                                              ? `Cargando ejemplos de entrenamiento...`
                                              : `No se encontraron ejemplos con ese criterio de búsqueda.`,
                                        })
                                      : e.map((e) =>
                                          (0, b.jsxs)(
                                            `div`,
                                            {
                                              className: `bg-white/5 border border-white/10 rounded-xl p-4 space-y-2`,
                                              children: [
                                                (0, b.jsxs)(`div`, {
                                                  className: `flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2`,
                                                  children: [
                                                    (0, b.jsxs)(`div`, {
                                                      className: `flex items-center gap-2`,
                                                      children: [
                                                        (0, b.jsx)(`span`, {
                                                          className: `bg-white/10 text-alacor-amber px-2 py-0.5 rounded text-[10px] font-mono font-bold`,
                                                          children: e.id,
                                                        }),
                                                        (0, b.jsx)(`span`, {
                                                          className: `bg-alacor-amber/15 text-alacor-amber px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider`,
                                                          children: e.category,
                                                        }),
                                                      ],
                                                    }),
                                                    (0, b.jsx)(`span`, {
                                                      className: `text-gray-500 text-[10px]`,
                                                      children: e.addedAt
                                                        ? new Date(
                                                            e.addedAt,
                                                          ).toLocaleDateString(
                                                            `es-CO`,
                                                          )
                                                        : `Homologado`,
                                                    }),
                                                  ],
                                                }),
                                                (0, b.jsx)(`div`, {
                                                  children: (0, b.jsxs)(`p`, {
                                                    className: `text-white text-xs font-bold leading-snug`,
                                                    children: [
                                                      `❓ `,
                                                      e.input,
                                                    ],
                                                  }),
                                                }),
                                                (0, b.jsx)(`div`, {
                                                  className: `bg-black/40 border border-white/5 rounded-lg p-3 text-xs text-gray-300 whitespace-pre-line leading-relaxed`,
                                                  children: e.answer,
                                                }),
                                              ],
                                            },
                                            e.id,
                                          ),
                                        );
                                  })(),
                                }),
                              ],
                            }),
                          ti === `unmatched` &&
                            (0, b.jsx)(`div`, {
                              children:
                                Ur.length === 0
                                  ? (0, b.jsx)(`p`, {
                                      className: `text-gray-500 text-xs text-center py-6`,
                                      children: `✅ No hay consultas pendientes. Presiona Actualizar para cargar.`,
                                    })
                                  : (0, b.jsx)(`div`, {
                                      className: `space-y-3 max-h-80 overflow-y-auto pr-1`,
                                      children: Ur.map((e) =>
                                        (0, b.jsxs)(
                                          `div`,
                                          {
                                            className: `bg-white/5 border border-white/10 rounded-xl p-3`,
                                            children: [
                                              (0, b.jsxs)(`p`, {
                                                className: `text-white text-xs font-semibold mb-1`,
                                                children: [`❓ `, e.query],
                                              }),
                                              (0, b.jsxs)(`p`, {
                                                className: `text-gray-500 text-[10px] mb-2`,
                                                children: [
                                                  `Score: `,
                                                  e.score,
                                                  `% · `,
                                                  new Date(
                                                    e.timestamp,
                                                  ).toLocaleString(`es-CO`),
                                                ],
                                              }),
                                              (0, b.jsxs)(`div`, {
                                                className: `flex gap-2`,
                                                children: [
                                                  (0, b.jsx)(`button`, {
                                                    onClick: () => {
                                                      (Kr(e.query),
                                                        Qr(e.id),
                                                        ni(`manual`));
                                                    },
                                                    className: `text-[10px] bg-alacor-amber text-alacor-dark font-bold px-3 py-1 rounded-lg cursor-pointer border-none hover:bg-yellow-400 transition-all`,
                                                    children: `✏️ Responder`,
                                                  }),
                                                  (0, b.jsx)(`button`, {
                                                    onClick: () => {
                                                      fetch(
                                                        `/api/chat/feedback`,
                                                        {
                                                          method: `POST`,
                                                          headers: {
                                                            "Content-Type": `application/json`,
                                                          },
                                                          body: JSON.stringify({
                                                            unmatchedId: e.id,
                                                          }),
                                                        },
                                                      )
                                                        .then(() =>
                                                          Wr((t) =>
                                                            t.filter(
                                                              (t) =>
                                                                t.id !== e.id,
                                                            ),
                                                          ),
                                                        )
                                                        .catch(() => {});
                                                    },
                                                    className: `text-[10px] bg-white/5 text-gray-400 font-bold px-3 py-1 rounded-lg cursor-pointer border-none hover:bg-white/10 transition-all`,
                                                    children: `✕ Descartar`,
                                                  }),
                                                ],
                                              }),
                                            ],
                                          },
                                          e.id,
                                        ),
                                      ),
                                    }),
                            }),
                          ti === `manual` &&
                            (0, b.jsxs)(`div`, {
                              className: `space-y-3`,
                              children: [
                                (0, b.jsxs)(`div`, {
                                  children: [
                                    (0, b.jsx)(`label`, {
                                      className: `text-[10px] text-gray-400 uppercase tracking-widest block mb-1`,
                                      children: `Pregunta o frase del visitante`,
                                    }),
                                    (0, b.jsx)(`input`, {
                                      value: Gr,
                                      onChange: (e) => Kr(e.target.value),
                                      placeholder: `ej: ¿tienen botas para electricistas?`,
                                      className: `w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-alacor-amber`,
                                    }),
                                  ],
                                }),
                                (0, b.jsxs)(`div`, {
                                  children: [
                                    (0, b.jsx)(`label`, {
                                      className: `text-[10px] text-gray-400 uppercase tracking-widest block mb-1`,
                                      children: `Respuesta correcta del bot`,
                                    }),
                                    (0, b.jsx)(`textarea`, {
                                      value: qr,
                                      onChange: (e) => Jr(e.target.value),
                                      rows: 5,
                                      placeholder: `Escribe aquí la respuesta completa que el bot debe dar...`,
                                      className: `w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-alacor-amber resize-none`,
                                    }),
                                  ],
                                }),
                                (0, b.jsxs)(`div`, {
                                  children: [
                                    (0, b.jsx)(`label`, {
                                      className: `text-[10px] text-gray-400 uppercase tracking-widest block mb-1`,
                                      children: `Categoría`,
                                    }),
                                    (0, b.jsx)(`select`, {
                                      value: Yr,
                                      onChange: (e) => Xr(e.target.value),
                                      className: `w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-alacor-amber bg-[#0a0f1a]`,
                                      children: [
                                        `calzado_dielectrico`,
                                        `calzado_pvc`,
                                        `calzado_soldador`,
                                        `calzado_general`,
                                        `cascos_seguridad`,
                                        `alturas_arneses`,
                                        `guantes_proteccion`,
                                        `proteccion_visual_facial`,
                                        `proteccion_respiratoria`,
                                        `proteccion_auditiva`,
                                        `ropa_dotacion`,
                                        `precios_cotizacion`,
                                        `certificaciones`,
                                        `contacto_empresa`,
                                        `general`,
                                      ].map((e) =>
                                        (0, b.jsx)(
                                          `option`,
                                          {
                                            value: e,
                                            className: `bg-[#0a0f1a]`,
                                            children: e,
                                          },
                                          e,
                                        ),
                                      ),
                                    }),
                                  ],
                                }),
                                $r &&
                                  (0, b.jsx)(`p`, {
                                    className: `text-green-400 text-xs font-semibold`,
                                    children: $r,
                                  }),
                                (0, b.jsx)(`button`, {
                                  onClick: () => {
                                    if (!Gr.trim() || !qr.trim()) {
                                      ei(
                                        `⚠️ Completa la pregunta y la respuesta.`,
                                      );
                                      return;
                                    }
                                    fetch(`/api/chat/train`, {
                                      method: `POST`,
                                      headers: {
                                        "Content-Type": `application/json`,
                                      },
                                      body: JSON.stringify({
                                        input: Gr,
                                        answer: qr,
                                        category: Yr,
                                        unmatchedId: Zr,
                                      }),
                                    })
                                      .then((e) => e.json())
                                      .then((e) => {
                                        (Hr(e.stats),
                                          Kr(``),
                                          Jr(``),
                                          Qr(null),
                                          Wr((e) =>
                                            Zr
                                              ? e.filter((e) => e.id !== Zr)
                                              : e,
                                          ),
                                          ei(
                                            `✅ Ejemplo guardado. El modelo se actualizó automáticamente.`,
                                          ),
                                          setTimeout(() => ei(``), 4e3));
                                      })
                                      .catch(() =>
                                        ei(
                                          `❌ Error al guardar. Verifica que el servidor esté activo.`,
                                        ),
                                      );
                                  },
                                  className: `w-full md:w-auto bg-alacor-amber text-alacor-dark font-black px-6 py-3.5 rounded-full text-xs uppercase tracking-widest hover:bg-yellow-400 transition-all cursor-pointer border-none shadow`,
                                  children: `💾 Guardar Ejemplo y Reentrenar`,
                                }),
                              ],
                            }),
                        ],
                      }),
                    ],
                  })
                : (0, b.jsxs)(`div`, {
                    className: `max-w-md mx-auto py-12 text-center w-full`,
                    children: [
                      (0, b.jsx)(`span`, {
                        className: `text-4xl block mb-4`,
                        children: `🔑`,
                      }),
                      (0, b.jsx)(`h4`, {
                        className: `text-lg font-bold text-white uppercase mb-2`,
                        children: `Autenticación de Seguridad`,
                      }),
                      (0, b.jsx)(`p`, {
                        className: `text-xs text-gray-400 mb-6 font-light`,
                        children: `Ingrese la clave de administrador para gestionar el catálogo interactivo.`,
                      }),
                      (0, b.jsxs)(`form`, {
                        onSubmit: Li,
                        className: `space-y-4`,
                        children: [
                          (0, b.jsx)(`input`, {
                            type: `password`,
                            placeholder: `Contraseña del Administrador`,
                            value: et,
                            onChange: (e) => tt(e.target.value),
                            className: `w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-alacor-amber text-center font-mono`,
                            autoFocus: !0,
                          }),
                          nt &&
                            (0, b.jsx)(`p`, {
                              className: `text-red-400 text-[11px] font-bold`,
                              children: nt,
                            }),
                          (0, b.jsx)(`div`, {
                            className: `pt-2`,
                            children: (0, b.jsx)(`button`, {
                              type: `submit`,
                              className: `w-full bg-alacor-amber text-alacor-dark font-black py-3.5 rounded-xl text-xs uppercase tracking-widest hover:bg-yellow-400 transition-all cursor-pointer border-none`,
                              children: `Entrar al Panel`,
                            }),
                          }),
                          (0, b.jsx)(`p`, {
                            className: `text-[9px] text-gray-600 uppercase mt-4`,
                            children: `Clave por defecto: alacor2026`,
                          }),
                        ],
                      }),
                    ],
                  }),
              (0, b.jsxs)(`div`, {
                className: `pt-6 border-t border-white/10 mt-6 text-center text-[10px] text-gray-500 flex justify-between items-center`,
                children: [
                  (0, b.jsx)(`p`, {
                    children: `ALACOR S.A.S. • Panel Administrativo de Control Local • Todos los datos se almacenan en LocalStorage.`,
                  }),
                  j &&
                    (0, b.jsx)(`button`, {
                      onClick: () => $e(!1),
                      className: `bg-white/5 hover:bg-white/10 text-white font-extrabold px-3 py-1 rounded-lg text-[9px] uppercase tracking-widest transition-all cursor-pointer border-none`,
                      children: `Cerrar Sesión Admin`,
                    }),
                ],
              }),
            ],
          }),
        }),
      Pn &&
        (0, b.jsx)(`div`, {
          className: `fixed inset-0 z-50 overflow-hidden flex items-center justify-end bg-black/80 backdrop-blur-sm transition-all duration-300`,
          children: (0, b.jsxs)(`div`, {
            className: `w-full max-w-lg h-full bg-alacor-dark border-l border-white/10 p-8 flex flex-col justify-between shadow-2xl animate-slide-in overflow-y-auto`,
            children: [
              (0, b.jsxs)(`div`, {
                children: [
                  (0, b.jsxs)(`div`, {
                    className: `flex justify-between items-center mb-8 pb-4 border-b border-white/10`,
                    children: [
                      (0, b.jsx)(`h4`, {
                        className: `text-lg font-black uppercase text-white flex items-center gap-2`,
                        children: (0, b.jsx)(`span`, {
                          children: In
                            ? `📋 Solicitud de Cotización`
                            : `🛒 Carrito de Compras`,
                        }),
                      }),
                      (0, b.jsx)(`button`, {
                        onClick: () => {
                          (Fn(!1), Ln(!1));
                        },
                        className: `text-gray-400 hover:text-white font-extrabold text-xl p-2 cursor-pointer border-none bg-transparent`,
                        children: `✕`,
                      }),
                    ],
                  }),
                  In
                    ? (0, b.jsxs)(`form`, {
                        onSubmit: Bi,
                        className: `space-y-6`,
                        children: [
                          (0, b.jsxs)(`div`, {
                            className: `flex justify-between items-center bg-slate-900/80 p-3.5 rounded-xl border border-amber-500/20 mb-4 text-xs`,
                            children: [
                              (0, b.jsxs)(`div`, {
                                className: `flex items-center gap-2 text-gray-300 font-bold uppercase tracking-wider text-[11px]`,
                                children: [
                                  (0, b.jsx)(`span`, { children: `📋` }),
                                  (0, b.jsx)(`span`, { children: `Resumen de Cotización Formal:` }),
                                ],
                              }),
                              (0, b.jsxs)(`span`, {
                                className: `text-alacor-amber font-mono font-bold text-xs`,
                                children: [
                                  M.length,
                                  ` `,
                                  M.length === 1 ? `ref.` : `refs.`,
                                  ` (`,
                                  M.reduce((acc, i) => acc + (i.quantity || 1), 0),
                                  ` uds)`,
                                ],
                              }),
                            ],
                          }),
                          (0, b.jsxs)(`div`, {
                            className: `space-y-4`,
                            children: [
                              (0, b.jsxs)(`div`, {
                                children: [
                                  (0, b.jsx)(`label`, {
                                    className: `block text-[10px] font-bold text-gray-400 uppercase mb-1`,
                                    children: `Razón Social / Empresa (Opcional)`,
                                  }),
                                  (0, b.jsx)(`input`, {
                                    type: `text`,
                                    value: Rn,
                                    onChange: (e) => zn(e.target.value),
                                    placeholder: `Ej. Alacor Safe S.A.S.`,
                                    className: `w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-alacor-amber transition-colors`,
                                  }),
                                ],
                              }),
                              (0, b.jsxs)(`div`, {
                                children: [
                                  (0, b.jsx)(`label`, {
                                    className: `block text-[10px] font-bold text-gray-400 uppercase mb-1`,
                                    children: `NIT / Identificación Tributaria (Opcional)`,
                                  }),
                                  (0, b.jsxs)(`div`, {
                                    className: `flex gap-2 items-center`,
                                    children: [
                                      (0, b.jsx)(`input`, {
                                        type: `text`,
                                        value: Bn,
                                        onChange: (e) => Vn(e.target.value.replace(/[^\d]/g, '')),
                                        placeholder: `Ej. 900123456`,
                                        className: `flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-alacor-amber transition-colors`,
                                      }),
                                      (0, b.jsxs)(`div`, {
                                        className: `flex items-center gap-1 bg-black/60 border border-white/10 px-3 py-2.5 rounded-xl select-none min-w-[55px] justify-center`,
                                        title: `Dígito de Verificación (DV) DIAN generado automáticamente`,
                                        children: [
                                          (0, b.jsx)(`span`, { className: `text-gray-500 text-xs font-bold font-mono`, children: `-` }),
                                          (0, b.jsx)(`span`, {
                                            className: `text-xs font-bold font-mono ${calculateDIANDV(Bn) !== '' ? 'text-alacor-amber' : 'text-gray-600'}`,
                                            children: calculateDIANDV(Bn) !== '' ? calculateDIANDV(Bn) : `DV`,
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              (0, b.jsxs)(`div`, {
                                children: [
                                  (0, b.jsx)(`label`, {
                                    className: `block text-[10px] font-bold text-gray-400 uppercase mb-1`,
                                    children: `Nombre de Contacto *`,
                                  }),
                                  (0, b.jsx)(`input`, {
                                    type: `text`,
                                    required: !0,
                                    value: Hn,
                                    onChange: (e) => Un(e.target.value),
                                    placeholder: `Ej. Carlos Pérez`,
                                    className: `w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-alacor-amber transition-colors`,
                                  }),
                                ],
                              }),
                              (0, b.jsxs)(`div`, {
                                className: `grid grid-cols-2 gap-4`,
                                children: [
                                  (0, b.jsxs)(`div`, {
                                    children: [
                                      (0, b.jsx)(`label`, {
                                        className: `block text-[10px] font-bold text-gray-400 uppercase mb-1`,
                                        children: `Correo Electrónico *`,
                                      }),
                                      (0, b.jsx)(`input`, {
                                        type: `email`,
                                        required: !0,
                                        value: Wn,
                                        onChange: (e) => Gn(e.target.value),
                                        placeholder: `carlos@correo.com`,
                                        className: `w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-alacor-amber transition-colors`,
                                      }),
                                    ],
                                  }),
                                  (0, b.jsxs)(`div`, {
                                    children: [
                                      (0, b.jsx)(`label`, {
                                        className: `block text-[10px] font-bold text-gray-400 uppercase mb-1`,
                                        children: `Celular / Teléfono *`,
                                      }),
                                      (0, b.jsx)(`input`, {
                                        type: `tel`,
                                        required: !0,
                                        value: Kn,
                                        onChange: (e) => qn(e.target.value),
                                        placeholder: `Ej. 3101234567`,
                                        className: `w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-alacor-amber transition-colors`,
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              (0, b.jsxs)(`div`, {
                                className: `border-t border-white/5 pt-4`,
                                children: [
                                  (0, b.jsx)(`span`, {
                                    className: `text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2`,
                                    children: `Datos de Despacho (Opcionales)`,
                                  }),
                                  (0, b.jsxs)(`div`, {
                                    className: `grid grid-cols-2 gap-4 mb-3`,
                                    children: [
                                      (0, b.jsxs)(`div`, {
                                        children: [
                                          (0, b.jsx)(`label`, {
                                            className: `block text-[9px] font-bold text-gray-400 uppercase mb-1`,
                                            children: `Ciudad / Depto`,
                                          }),
                                          (0, b.jsx)(`input`, {
                                            type: `text`,
                                            value: Jn,
                                            onChange: (e) => Yn(e.target.value),
                                            placeholder: `Ej. Bogotá D.C.`,
                                            className: `w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-alacor-amber transition-colors`,
                                          }),
                                        ],
                                      }),
                                      (0, b.jsxs)(`div`, {
                                        children: [
                                          (0, b.jsx)(`label`, {
                                            className: `block text-[9px] font-bold text-gray-400 uppercase mb-1`,
                                            children: `Dirección de Entrega`,
                                          }),
                                          (0, b.jsx)(`input`, {
                                            type: `text`,
                                            value: Xn,
                                            onChange: (e) => Zn(e.target.value),
                                            placeholder: `Ej. Calle 10 #20-30`,
                                            className: `w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-alacor-amber transition-colors`,
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  (0, b.jsxs)(`div`, {
                                    children: [
                                      (0, b.jsx)(`label`, {
                                        className: `block text-[9px] font-bold text-gray-400 uppercase mb-1`,
                                        children: `Correo para Facturación Electrónica (Opcional)`,
                                      }),
                                      (0, b.jsx)(`input`, {
                                        type: `email`,
                                        value: Qn,
                                        onChange: (e) => $n(e.target.value),
                                        placeholder: `Ej. facturacion@empresa.com (si difiere del principal)`,
                                        className: `w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-alacor-amber transition-colors`,
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              (0, b.jsx)(`div`, {
                                className: `border-t border-white/5 pt-4`,
                                children: (0, b.jsxs)(`div`, {
                                  children: [
                                    (0, b.jsx)(`label`, {
                                      className: `block text-[10px] font-bold text-gray-400 uppercase mb-1`,
                                      children: `¿Cómo nos conoció? *`,
                                    }),
                                    (0, b.jsxs)(`select`, {
                                      value: er,
                                      onChange: (e) => tr(e.target.value),
                                      className: `w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-alacor-amber transition-colors`,
                                      children: [
                                        (0, b.jsx)(`option`, {
                                          value: `google`,
                                          children: `Google / Buscador`,
                                        }),
                                        (0, b.jsx)(`option`, {
                                          value: `redes`,
                                          children: `Redes Sociales`,
                                        }),
                                        (0, b.jsx)(`option`, {
                                          value: `recomendado`,
                                          children: `Recomendación de Colega`,
                                        }),
                                        (0, b.jsx)(`option`, {
                                          value: `correo`,
                                          children: `Correo Electrónico`,
                                        }),
                                        (0, b.jsx)(`option`, {
                                          value: `otro`,
                                          children: `Otro medio`,
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                              }),
                              (0, b.jsxs)(`div`, {
                                children: [
                                  (0, b.jsxs)(`div`, {
                                    className: `flex justify-between items-center mb-1`,
                                    children: [
                                      (0, b.jsx)(`label`, {
                                        className: `block text-[10px] font-bold text-gray-400 uppercase`,
                                        children: `Requerimientos Adicionales / Notas (Opcional)`,
                                      }),
                                      (0, b.jsxs)(`span`, {
                                        className: `text-[9px] font-mono ${(nr || '').length >= 300 ? 'text-red-400 font-bold' : 'text-gray-500'}`,
                                        children: [`${(nr || '').length}/300`],
                                      }),
                                    ],
                                  }),
                                  (0, b.jsx)(`textarea`, {
                                    value: nr,
                                    maxLength: 300,
                                    onChange: (e) => rr(e.target.value),
                                    placeholder: `Ej. Tallas especiales, requerimientos de entrega en obra, fichas técnicas específicas...`,
                                    rows: 2,
                                    className: `w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-alacor-amber transition-colors resize-none`,
                                  }),
                                ],
                              }),
                              (0, b.jsxs)(`div`, {
                                className: `border-t border-white/5 pt-4`,
                                children: [
                                  (0, b.jsx)(`label`, {
                                    className: `block text-[10px] font-bold text-gray-400 uppercase mb-1`,
                                    children: `Verificación de Seguridad *`,
                                  }),
                                  (0, b.jsxs)(`div`, {
                                    className: `flex gap-4 items-center`,
                                    children: [
                                      (0, b.jsxs)(`span`, {
                                        className: `text-xs font-mono text-alacor-amber bg-black/60 px-3 py-2 rounded-lg border border-white/5 select-none font-bold`,
                                        children: [`¿Cuánto es `, cr, `?`],
                                      }),
                                      (0, b.jsx)(`input`, {
                                        type: `number`,
                                        required: !0,
                                        value: fr,
                                        onChange: (e) => pr(e.target.value),
                                        placeholder: `Respuesta`,
                                        className: `w-28 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-alacor-amber transition-colors text-center font-bold`,
                                      }),
                                      (0, b.jsx)(`button`, {
                                        type: `button`,
                                        onClick: wi,
                                        className: `text-[10px] text-gray-400 hover:text-white cursor-pointer bg-transparent border-none`,
                                        title: `Cambiar pregunta`,
                                        children: `🔄`,
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              (0, b.jsxs)(`div`, {
                                className: `flex items-start gap-2.5 pt-2`,
                                children: [
                                  (0, b.jsx)(`input`, {
                                    type: `checkbox`,
                                    id: `habeasCheckbox`,
                                    checked: ir,
                                    onChange: (e) => ar(e.target.checked),
                                    className: `w-4 h-4 mt-0.5 accent-alacor-amber cursor-pointer rounded`,
                                  }),
                                  (0, b.jsxs)(`label`, {
                                    htmlFor: `habeasCheckbox`,
                                    className: `text-[10px] text-gray-400 leading-normal cursor-pointer select-none`,
                                    children: [
                                      `Acepto los términos de la`,
                                      ` `,
                                      (0, b.jsx)(`button`, {
                                        type: `button`,
                                        onClick: () => sr(!0),
                                        className: `text-alacor-amber hover:underline font-bold bg-transparent border-none p-0 cursor-pointer`,
                                        children: `Política de Tratamiento de Datos Personales (Habeas Data)`,
                                      }),
                                      ` `,
                                      `de ALACOR S.A.S. para ofertas y mercadeo.`,
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      })
                    : (0, b.jsxs)(`div`, {
                        className: `space-y-4`,
                        children: [
                          M.map((e) =>
                            (0, b.jsxs)(
                              `div`,
                              {
                                className: `flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5 items-center justify-between`,
                                children: [
                                  (0, b.jsxs)(`div`, {
                                    className: `flex gap-3 items-center`,
                                    children: [
                                      (0, b.jsx)(`div`, {
                                        className: `w-12 h-12 rounded bg-white flex items-center justify-center p-1 overflow-hidden`,
                                        children: (0, b.jsx)(`img`, {
                                          src: x(e.img),
                                          alt: e.name,
                                          className: `max-h-full max-w-full object-contain`,
                                        }),
                                      }),
                                      (0, b.jsxs)(`div`, {
                                        children: [
                                          (0, b.jsx)(`h5`, {
                                            className: `text-xs font-bold text-white uppercase truncate max-w-[180px]`,
                                            children: e.name,
                                          }),
                                          (0, b.jsxs)(`span`, {
                                            className: `text-[9px] text-gray-400 block uppercase`,
                                            children: [
                                              e.brand,
                                              ` (REF: `,
                                              e.sku,
                                              `)`,
                                            ],
                                          }),
                                          
                                        ],
                                      }),
                                    ],
                                  }),
                                  (0, b.jsxs)(`div`, {
                                    className: `flex items-center gap-3`,
                                    children: [
                                      (0, b.jsxs)(`div`, {
                                        className: `flex items-center border border-white/10 rounded-full bg-black/40 overflow-hidden`,
                                        children: [
                                          (0, b.jsx)(`button`, {
                                            onClick: () => P(e.sku, -1),
                                            className: `px-2.5 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/5 border-none bg-transparent cursor-pointer font-bold`,
                                            children: `-`,
                                          }),
                                          (0, b.jsx)(`span`, {
                                            className: `px-1 text-xs font-bold text-white font-mono`,
                                            children: e.quantity,
                                          }),
                                          (0, b.jsx)(`button`, {
                                            onClick: () => P(e.sku, 1),
                                            className: `px-2.5 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/5 border-none bg-transparent cursor-pointer font-bold`,
                                            children: `+`,
                                          }),
                                        ],
                                      }),
                                      (0, b.jsx)(`button`, {
                                        onClick: () => F(e.sku),
                                        className: `text-red-500 hover:text-red-400 p-2 cursor-pointer border-none bg-transparent text-sm`,
                                        title: `Eliminar producto`,
                                        children: `🗑️`,
                                      }),
                                    ],
                                  }),
                                ],
                              },
                              e.sku,
                            ),
                          ),
                          (0, b.jsxs)(`div`, {
                            className: `border-t border-white/10 pt-5 mt-6 space-y-3`,
                            children: [
                              (0, b.jsxs)(`div`, {
                                className: `flex justify-between items-center bg-slate-900/80 border border-amber-500/20 px-3.5 py-2.5 rounded-xl text-xs`,
                                children: [
                                  (0, b.jsxs)(`div`, {
                                    className: `flex items-center gap-2 text-gray-300 font-bold uppercase tracking-wider text-[11px]`,
                                    children: [
                                      (0, b.jsx)(`span`, { children: `📋` }),
                                      (0, b.jsx)(`span`, { children: `Solicitud de Cotización:` }),
                                    ],
                                  }),
                                  (0, b.jsxs)(`span`, {
                                    className: `text-alacor-amber font-mono font-bold text-xs`,
                                    children: [
                                      M.length,
                                      ` `,
                                      M.length === 1 ? `ref.` : `refs.`,
                                      ` (`,
                                      M.reduce((acc, i) => acc + (i.quantity || 1), 0),
                                      ` uds)`,
                                    ],
                                  }),
                                ],
                              }),
                              (0, b.jsxs)(`div`, {
                                className: `bg-white/[0.03] border border-white/10 rounded-xl p-3.5 space-y-2.5`,
                                children: [
                                  (0, b.jsxs)(`div`, {
                                    className: `flex items-center justify-between`,
                                    children: [
                                      (0, b.jsxs)(`span`, {
                                        className: `text-[10px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5`,
                                        children: [
                                          (0, b.jsx)(`span`, { children: `🚚` }),
                                          (0, b.jsx)(`span`, { children: `Política de Despacho Nacional` }),
                                        ],
                                      }),
                                      (0, b.jsx)(`span`, {
                                        className: `text-[9px] text-amber-400/90 font-medium`,
                                        children: `Cobertura 100% Colombia 🇨🇴`,
                                      }),
                                    ],
                                  }),
                                  (0, b.jsxs)(`div`, {
                                    className: `grid grid-cols-2 gap-2 text-[10px] text-gray-400`,
                                    children: [
                                      (0, b.jsxs)(`div`, {
                                        className: `bg-black/30 p-2.5 rounded-lg border border-white/5`,
                                        children: [
                                          (0, b.jsx)(`span`, {
                                            className: `block font-bold text-white mb-0.5`,
                                            children: `🏢 Principales:`,
                                          }),
                                          (0, b.jsx)(`span`, {
                                            className: `text-gray-300`,
                                            children: `24 a 48 hrs hábiles`,
                                          }),
                                        ],
                                      }),
                                      (0, b.jsxs)(`div`, {
                                        className: `bg-black/30 p-2.5 rounded-lg border border-white/5`,
                                        children: [
                                          (0, b.jsx)(`span`, {
                                            className: `block font-bold text-white mb-0.5`,
                                            children: `📦 Otras Ciudades:`,
                                          }),
                                          (0, b.jsx)(`span`, {
                                            className: `text-gray-300`,
                                            children: `48 a 72 hrs hábiles`,
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  (0, b.jsx)(`p`, {
                                    className: `text-[9px] text-gray-400 leading-relaxed italic`,
                                    children: `* Flete y embalaje industrial cotizados de acuerdo al volumen y peso de tu orden con transportadoras certificadas.`,
                                  }),
                                ],
                              }),
                              (0, b.jsxs)(`div`, {
                                className: `bg-white/[0.02] border border-white/5 rounded-xl p-3 flex items-center justify-between text-[10px] text-gray-300`,
                                children: [
                                  (0, b.jsxs)(`div`, {
                                    className: `flex items-center gap-2.5`,
                                    children: [
                                      (0, b.jsx)(`span`, { className: `text-lg`, children: `📄` }),
                                      (0, b.jsxs)(`div`, {
                                        children: [
                                          (0, b.jsx)(`span`, {
                                            className: `block font-bold text-white`,
                                            children: `Facturación Electrónica DIAN`,
                                          }),
                                          (0, b.jsx)(`span`, {
                                            className: `text-gray-400 text-[9px]`,
                                            children: `Fichas técnicas y certificados ANSI/EN/OSHA incluidos`,
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  (0, b.jsx)(`span`, {
                                    className: `bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2 py-1 rounded text-[9px] font-bold shrink-0`,
                                    children: `🛡️ Calidad Garantizada`,
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                ],
              }),
              (0, b.jsx)(`div`, {
                className: `pt-6 border-t border-white/10 mt-8 space-y-3`,
                children: In
                  ? (0, b.jsxs)(`div`, {
                      className: `flex gap-4`,
                      children: [
                        (0, b.jsx)(`button`, {
                          type: `button`,
                          onClick: () => Ln(!1),
                          className: `w-1/3 border border-white/10 bg-transparent text-gray-400 hover:text-white py-3.5 rounded-full text-xs uppercase tracking-widest transition-all cursor-pointer font-bold`,
                          children: `Atrás`,
                        }),
                        (0, b.jsx)(`button`, {
                          type: `button`,
                          disabled: isSubmittingQuote,
                          onClick: Bi,
                          className: `w-2/3 bg-alacor-amber text-alacor-dark font-black py-3.5 rounded-full text-xs uppercase tracking-widest hover:bg-yellow-400 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-alacor-amber/10 border-none flex items-center justify-center gap-2 ${isSubmittingQuote ? 'opacity-75 cursor-wait' : ''}`,
                          children: isSubmittingQuote
                            ? (0, b.jsxs)(`span`, {
                                className: `flex items-center gap-2 text-alacor-dark font-black`,
                                children: [
                                  (0, b.jsx)(`span`, { className: `animate-spin inline-block w-3.5 h-3.5 border-2 border-alacor-dark border-t-transparent rounded-full` }),
                                  `Radicando...`,
                                ],
                              })
                            : (0, b.jsx)(`span`, {
                                children: `📤 Enviar Cotización`,
                              }),
                        }),
                      ],
                    })
                  : (0, b.jsxs)(b.Fragment, {
                      children: [
                        (0, b.jsx)(`button`, {
                          onClick: zi,
                          className: `w-full bg-alacor-amber text-alacor-dark font-black py-4 rounded-full text-xs uppercase tracking-widest hover:bg-yellow-400 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-alacor-amber/10 border-none flex items-center justify-center gap-2`,
                          children: (0, b.jsx)(`span`, {
                            children: `📋 Solicitar Cotización`,
                          }),
                        }),
                        (0, b.jsx)(`button`, {
                          onClick: () => Nn([]),
                          className: `w-full border border-white/10 bg-transparent text-gray-400 hover:text-white py-3 rounded-full text-[10px] uppercase tracking-widest transition-all cursor-pointer`,
                          children: `Vaciar Carrito`,
                        }),
                      ],
                    }),
              }),
            ],
          }),
        }),
      or &&
        (0, b.jsx)(`div`, {
          className: `fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in`,
          children: (0, b.jsxs)(`div`, {
            className: `w-full max-w-2xl bg-[#0b1320] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative`,
            children: [
              (0, b.jsx)(`button`, {
                onClick: () => sr(!1),
                className: `absolute top-4 right-4 text-gray-400 hover:text-white font-extrabold text-xl p-2 cursor-pointer border-none bg-transparent`,
                children: `✕`,
              }),
              (0, b.jsx)(`span`, {
                className: `text-[9px] bg-alacor-amber/20 text-alacor-amber font-black px-2.5 py-1 rounded-full uppercase tracking-wider mb-3 inline-block`,
                children: `HABEAS DATA - COLOMBIA`,
              }),
              (0, b.jsx)(`h3`, {
                className: `text-xl font-black text-white uppercase mb-6`,
                children: `Política de Tratamiento de Datos Personales`,
              }),
              (0, b.jsxs)(`div`, {
                className: `text-xs text-gray-400 font-light leading-relaxed space-y-4 max-h-[300px] overflow-y-auto pr-2 mb-6`,
                children: [
                  (0, b.jsxs)(`p`, {
                    children: [
                      `De conformidad con la `,
                      (0, b.jsx)(`strong`, { children: `Ley 1581 de 2012` }),
                      ` y sus decretos reglamentarios, `,
                      (0, b.jsx)(`strong`, { children: `ALACOR S.A.S.` }),
                      `, en calidad de Responsable del Tratamiento, informa que los datos personales recopilados a través de esta solicitud serán incorporados en nuestras bases de datos comerciales de clientes y prospectos.`,
                    ],
                  }),
                  (0, b.jsx)(`p`, {
                    children: (0, b.jsx)(`strong`, {
                      children: `Finalidades del Tratamiento:`,
                    }),
                  }),
                  (0, b.jsxs)(`ul`, {
                    className: `list-disc pl-4 space-y-2`,
                    children: [
                      (0, b.jsx)(`li`, {
                        children: `Gestión comercial y elaboración de ofertas y cotizaciones técnicas de productos de seguridad.`,
                      }),
                      (0, b.jsx)(`li`, {
                        children: `Operaciones logísticas de despacho, facturación y recaudo.`,
                      }),
                      (0, b.jsx)(`li`, {
                        children: `Comunicación y contacto para responder a requerimientos comerciales.`,
                      }),
                      (0, b.jsx)(`li`, {
                        children: `Envío de boletines técnicos de protección, promociones, actualizaciones de catálogo y campañas de marketing.`,
                      }),
                    ],
                  }),
                  (0, b.jsxs)(`p`, {
                    children: [
                      (0, b.jsx)(`strong`, {
                        children: `Derechos del Titular:`,
                      }),
                      (0, b.jsx)(`br`, {}),
                      `Usted, como titular de los datos, tiene derecho a conocer, actualizar, rectificar y solicitar la supresión de sus datos personales, así como a revocar la autorización otorgada, dirigiéndose al correo de contacto de ALACOR S.A.S.`,
                    ],
                  }),
                  (0, b.jsx)(`p`, {
                    children: `Al marcar la casilla de aceptación en el formulario de cotización, autoriza el tratamiento libre, previo, expreso y voluntario de sus datos para las finalidades mencionadas.`,
                  }),
                ],
              }),
              (0, b.jsx)(`div`, {
                className: `flex justify-end`,
                children: (0, b.jsx)(`button`, {
                  onClick: () => {
                    (ar(!0), sr(!1));
                  },
                  className: `bg-alacor-amber text-alacor-dark font-black px-8 py-3 rounded-full text-xs uppercase tracking-widest hover:bg-yellow-400 transition-all cursor-pointer border-none`,
                  children: `Aceptar y Continuar`,
                }),
              }),
            ],
          }),
        }),
      quoteSuccessData &&
        (0, b.jsx)(`div`, {
          className: `fixed inset-0 z-[120] overflow-y-auto flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in`,
          children: (0, b.jsxs)(`div`, {
            className: `w-full max-w-lg bg-[#0b1320] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative text-center`,
            children: [
              (0, b.jsx)(`div`, {
                className: `w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-lg shadow-emerald-500/10`,
                children: `✅`,
              }),
              (0, b.jsx)(`span`, {
                className: `text-[10px] bg-emerald-500/20 text-emerald-400 font-black px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block`,
                children: `RADICACIÓN EXITOSA EN CORALIS CRM`,
              }),
              (0, b.jsx)(`h3`, {
                className: `text-xl md:text-2xl font-black text-white uppercase mb-2`,
                children: `¡Solicitud de Cotización Radicada!`,
              }),
              (0, b.jsx)(`p`, {
                className: `text-xs text-gray-400 mb-5 leading-relaxed`,
                children: `Tu requerimiento ha sido registrado formalmente en nuestro sistema comercial de ALACOR S.A.S.`,
              }),
              (0, b.jsxs)(`div`, {
                className: `bg-black/60 border border-alacor-amber/30 rounded-2xl p-4 mb-5 text-left`,
                children: [
                  (0, b.jsxs)(`div`, {
                    className: `flex items-center justify-between pb-3 border-b border-white/10 mb-3`,
                    children: [
                      (0, b.jsxs)(`div`, {
                        children: [
                          (0, b.jsx)(`span`, {
                            className: `text-[9px] font-bold text-gray-500 uppercase block tracking-wider`,
                            children: `Número de Radicado Oficial`,
                          }),
                          (0, b.jsx)(`span`, {
                            className: `text-lg font-mono font-black text-alacor-amber tracking-wider`,
                            children: quoteSuccessData.requestNumber,
                          }),
                        ],
                      }),
                      (0, b.jsx)(`button`, {
                        type: `button`,
                        onClick: () => {
                          navigator.clipboard.writeText(quoteSuccessData.requestNumber);
                          setCopiedRadicado(!0);
                          setTimeout(() => setCopiedRadicado(!1), 2500);
                        },
                        className: `text-[10px] bg-white/10 hover:bg-white/20 text-white font-bold px-3 py-1.5 rounded-lg border border-white/10 transition-all cursor-pointer flex items-center gap-1.5`,
                        children: copiedRadicado ? `✓ ¡Copiado!` : `📋 Copiar`,
                      }),
                    ],
                  }),
                  (0, b.jsxs)(`div`, {
                    className: `space-y-1.5 text-xs text-gray-300`,
                    children: [
                      (0, b.jsxs)(`div`, {
                        className: `flex justify-between text-[11px]`,
                        children: [
                          (0, b.jsx)(`span`, { className: `text-gray-500`, children: `Contacto:` }),
                          (0, b.jsxs)(`span`, {
                            className: `font-semibold text-white`,
                            children: [
                              quoteSuccessData.client.contactName,
                              quoteSuccessData.client.companyName ? ` (${quoteSuccessData.client.companyName})` : ``,
                            ],
                          }),
                        ],
                      }),
                      (0, b.jsxs)(`div`, {
                        className: `flex justify-between text-[11px]`,
                        children: [
                          (0, b.jsx)(`span`, { className: `text-gray-500`, children: `Correo:` }),
                          (0, b.jsx)(`span`, { className: `text-gray-300`, children: quoteSuccessData.client.email }),
                        ],
                      }),
                      (0, b.jsxs)(`div`, {
                        className: `flex justify-between text-[11px]`,
                        children: [
                          (0, b.jsx)(`span`, { className: `text-gray-500`, children: `Teléfono:` }),
                          (0, b.jsx)(`span`, { className: `text-gray-300`, children: quoteSuccessData.client.phone }),
                        ],
                      }),
                      (0, b.jsxs)(`div`, {
                        className: `flex justify-between text-[11px]`,
                        children: [
                          (0, b.jsx)(`span`, { className: `text-gray-500`, children: `Productos:` }),
                          (0, b.jsxs)(`span`, {
                            className: `text-alacor-amber font-bold`,
                            children: [`${quoteSuccessData.totalRefs} ref. (${quoteSuccessData.totalUnits} uds)`],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              (0, b.jsxs)(`div`, {
                className: `bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 mb-6 text-left flex items-start gap-3 text-[11px] text-amber-200/90`,
                children: [
                  (0, b.jsx)(`span`, { className: `text-lg shrink-0`, children: `⏱️` }),
                  (0, b.jsxs)(`div`, {
                    className: `leading-relaxed`,
                    children: [
                      (0, b.jsx)(`strong`, { className: `text-white block mb-0.5`, children: `Tiempo de Respuesta Estimado: 1 a 2 horas hábiles` }),
                      `Un asesor comercial asignado preparará tu cotización formal con disponibilidad, tiempos de despacho y fichas técnicas certificadas.`,
                    ],
                  }),
                ],
              }),
              (0, b.jsx)(`button`, {
                type: `button`,
                onClick: () => setQuoteSuccessData(null),
                className: `w-full bg-alacor-amber text-alacor-dark font-black py-3.5 rounded-full text-xs uppercase tracking-widest hover:bg-yellow-400 transition-all cursor-pointer border-none shadow-lg shadow-alacor-amber/10`,
                children: `Cerrar y Continuar en el Catálogo`,
              }),
            ],
          }),
        }),
      quoteErrorData &&
        (0, b.jsx)(`div`, {
          className: `fixed inset-0 z-[120] overflow-y-auto flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in`,
          children: (0, b.jsxs)(`div`, {
            className: `w-full max-w-md bg-[#0b1320] border border-red-500/20 rounded-3xl p-6 md:p-8 shadow-2xl text-center`,
            children: [
              (0, b.jsx)(`div`, {
                className: `w-14 h-14 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl`,
                children: `⚠️`,
              }),
              (0, b.jsx)(`h3`, {
                className: `text-xl font-black text-white uppercase mb-2`,
                children: `Falla de Conexión`,
              }),
              (0, b.jsx)(`p`, {
                className: `text-xs text-gray-400 mb-5 leading-relaxed`,
                children: quoteErrorData.error || `No fue posible conectar con el servidor de cotizaciones en este momento.`,
              }),
              (0, b.jsxs)(`div`, {
                className: `space-y-3`,
                children: [
                  (0, b.jsx)(`button`, {
                    type: `button`,
                    onClick: () => {
                      setQuoteErrorData(null);
                      Bi();
                    },
                    className: `w-full bg-alacor-amber text-alacor-dark font-black py-3 rounded-full text-xs uppercase tracking-widest hover:bg-yellow-400 transition-all cursor-pointer border-none`,
                    children: `🔄 Reintentar Envío`,
                  }),
                  (0, b.jsx)(`button`, {
                    type: `button`,
                    onClick: () => {
                      window.open(`https://wa.me/573502608925?text=${encodeURIComponent(quoteErrorData.waFallbackText)}`, `_blank`);
                      setQuoteErrorData(null);
                    },
                    className: `w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-full text-xs uppercase tracking-widest transition-all cursor-pointer border-none flex items-center justify-center gap-2`,
                    children: `💬 Contactar por WhatsApp (Contingencia)`,
                  }),
                  (0, b.jsx)(`button`, {
                    type: `button`,
                    onClick: () => setQuoteErrorData(null),
                    className: `w-full bg-transparent border border-white/10 text-gray-400 hover:text-white py-2.5 rounded-full text-xs uppercase tracking-widest transition-all cursor-pointer`,
                    children: `Cerrar`,
                  }),
                ],
              }),
            ],
          }),
        }),
      !mr &&
        (0, b.jsxs)(`button`, {
          onClick: () => hr(!0),
          className: `fixed bottom-6 right-6 z-40 bg-alacor-amber text-alacor-dark p-4 rounded-full shadow-2xl hover:bg-yellow-400 hover:scale-105 active:scale-95 transition-all duration-300 border-none cursor-pointer flex items-center justify-center`,
          style: { bottom: M.length > 0 && !Pn ? `88px` : `24px` },
          title: `Consultar Asesor Técnico Virtual`,
          children: [
            (0, b.jsx)(`span`, { className: `text-xl`, children: `💬` }),
            (0, b.jsx)(`span`, {
              className: `absolute -top-1.5 -right-1.5 bg-alacor-amber/20 text-alacor-amber text-[9px] font-black px-1.5 py-0.5 rounded-full border border-alacor-amber`,
              children: `AI`,
            }),
          ],
        }),
      mr &&
        (0, b.jsxs)(`div`, {
          className: `fixed bottom-6 right-6 z-50 w-[calc(100vw-32px)] sm:w-[420px] h-[580px] sm:h-[680px] max-h-[calc(100vh-48px)] bg-alacor-dark/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-between overflow-hidden animate-fade-in`,
          children: [
            (0, b.jsxs)(`div`, {
              className: `bg-[#0b1320] border-b border-white/5 p-4 flex justify-between items-center`,
              children: [
                (0, b.jsxs)(`div`, {
                  className: `flex items-center gap-2.5`,
                  children: [
                    (0, b.jsx)(`div`, {
                      className: `w-8 h-8 rounded-full bg-alacor-amber flex items-center justify-center text-base`,
                      children: `👤`,
                    }),
                    (0, b.jsxs)(`div`, {
                      className: `text-left`,
                      children: [
                        (0, b.jsx)(`span`, {
                          className: `text-xs font-black text-white uppercase block leading-none`,
                          children: `Asesoría Técnica`,
                        }),
                        (0, b.jsx)(`span`, {
                          className: `text-[9px] text-gray-500 font-bold block uppercase mt-0.5 font-sans`,
                          children: `ALACOR S.A.S. • En línea`,
                        }),
                      ],
                    }),
                  ],
                }),
                (0, b.jsxs)(`div`, {
                  className: `flex items-center gap-1`,
                  children: [
                    (0, b.jsx)(`button`, {
                      onClick: Hi,
                      title: `Reiniciar chat / Nueva sesión de prueba`,
                      className: `text-gray-400 hover:text-alacor-amber hover:bg-white/10 rounded-lg p-1.5 transition-all cursor-pointer bg-transparent border-none text-base flex items-center justify-center`,
                      children: `🔄`,
                    }),
                    (0, b.jsx)(`button`, {
                      onClick: () => hr(!1),
                      title: `Cerrar chat`,
                      className: `text-gray-400 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-all cursor-pointer bg-transparent border-none text-base flex items-center justify-center`,
                      children: `✕`,
                    }),
                  ],
                }),
              ],
            }),
            (0, b.jsxs)(`div`, {
              className: `bg-white/2 px-4 py-2 border-b border-white/5 flex items-center justify-between text-[10px] text-gray-400`,
              children: [
                (0, b.jsxs)(`span`, {
                  children: [
                    `Sesión: `,
                    (0, b.jsx)(`strong`, {
                      className: `text-gray-300 font-mono`,
                      children: gr,
                    }),
                  ],
                }),
                (0, b.jsxs)(`div`, {
                  className: `flex items-center gap-1.5 font-sans`,
                  children: [
                    (0, b.jsx)(`span`, { children: `Nombre:` }),
                    (0, b.jsx)(`input`, {
                      type: `text`,
                      value: _r,
                      onChange: (e) => {
                        let t = e.target.value;
                        (vr(t),
                          localStorage.setItem(`alacor_chat_session_name`, t));
                      },
                      className: `bg-black/30 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-white focus:outline-none focus:border-alacor-amber max-w-[120px]`,
                      placeholder: `Su Nombre`,
                    }),
                  ],
                }),
              ],
            }),
            (0, b.jsxs)(`div`, {
              ref: i,
              className: `flex-1 overflow-y-auto p-4 space-y-3.5 text-xs text-left`,
              children: [
                xi.map((e, t) =>
                  (0, b.jsx)(
                    `div`,
                    {
                      className: `flex ${e.sender === `user` ? `justify-end` : `justify-start`}`,
                      children: (0, b.jsxs)(`div`, {
                        className: `p-3.5 rounded-2xl max-w-[88%] leading-relaxed text-xs shadow-md ${e.sender === `user` ? `bg-alacor-amber text-alacor-dark font-medium rounded-tr-none` : `bg-[#161f2e] border border-white/10 text-gray-100 rounded-tl-none`}`,
                        children: [
                          (() => {
                            const isTransferIntake = e.text && e.text.includes(`[SOLICITAR_DATOS_TRANSFERENCIA]`);
                            const cleanMessageText = e.text ? e.text.replace(/\[SOLICITAR_DATOS_TRANSFERENCIA\]/g, ``).trim() : ``;

                            return (0, b.jsx)(`div`, {
                              className: `space-y-2`,
                              children: (0, b.jsx)(`div`, {
                                className: `space-y-1.5`,
                                children: (cleanMessageText || e.text || ``).split(`\n`).map((line, lIdx) => {
                                  if (!line.trim()) return (0, b.jsx)(`div`, { className: `h-1` }, lIdx);
                                  
                                  // Check for direct diagnostic action button
                                  const isDiagnosticLine = line.includes(`[IR_DIAGNOSTICO_0312]`) || 
                                                           line.includes(`(#sgsst-section)`) || 
                                                           line.toLowerCase().includes(`siguiente botón`) || 
                                                           line.toLowerCase().includes(`siguiente boton`) ||
                                                           line.toLowerCase().includes(`iniciar el autodiagnóstico`) ||
                                                           line.toLowerCase().includes(`iniciar el autodiagnostico`);

                                  if (isDiagnosticLine) {
                                    const cleanTextLine = line.replace(/\[IR_DIAGNOSTICO_0312\]/g, '').replace(/\(#sgsst-section\)/g, '').trim();
                                    return (0, b.jsxs)(`div`, {
                                      className: `pt-1.5 pb-0.5 space-y-2`,
                                      children: [
                                        cleanTextLine ? (0, b.jsx)(`div`, { className: `text-xs text-gray-200 leading-relaxed`, children: cleanTextLine }) : null,
                                        (0, b.jsxs)(`button`, {
                                          type: `button`,
                                          onClick: () => {
                                            hr(!1);
                                            window.dispatchEvent(new CustomEvent('alacor_open_diagnostic_0312'));
                                          },
                                          className: `w-full bg-gradient-to-r from-alacor-amber via-yellow-400 to-alacor-amber text-alacor-dark font-black py-2.5 px-3.5 rounded-xl border-none cursor-pointer flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition-all text-xs`,
                                          children: [
                                            (0, b.jsx)(`span`, { children: `📋` }),
                                            (0, b.jsx)(`span`, { children: `Iniciar Autodiagnóstico SG-SST (Res. 0312) →` }),
                                          ],
                                        })
                                      ]
                                    }, lIdx);
                                  }

                                  // Check for Client Type Option Buttons (Empresa / Particular)
                                  if (line.includes(`[OPCIONES_CLIENTE_TIPO]`)) {
                                    return (0, b.jsx)(`div`, {
                                      className: `pt-2 pb-1 flex flex-col sm:flex-row gap-2`,
                                      children: [
                                        (0, b.jsxs)(`button`, {
                                          type: `button`,
                                          onClick: () => Ui(`A nombre de una empresa`),
                                          className: `flex-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 font-bold py-2.5 px-3 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow transition-all active:scale-95 text-xs`,
                                          children: [
                                            (0, b.jsx)(`span`, { children: `🏢` }),
                                            (0, b.jsx)(`span`, { children: `A nombre de una Empresa` }),
                                          ]
                                        }),
                                        (0, b.jsxs)(`button`, {
                                          type: `button`,
                                          onClick: () => Ui(`Como particular`),
                                          className: `flex-1 bg-slate-700/60 hover:bg-slate-700 border border-slate-600/60 text-gray-200 font-bold py-2.5 px-3 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow transition-all active:scale-95 text-xs`,
                                          children: [
                                            (0, b.jsx)(`span`, { children: `👤` }),
                                            (0, b.jsx)(`span`, { children: `Como Particular` }),
                                          ]
                                        })
                                      ]
                                    }, lIdx);
                                  }

                                  // Check for Final Queue Option Buttons (Llamada / Seguir esperando / Finalizar)
                                  if (line.includes(`[OPCIONES_COLA_FINAL]`)) {
                                    return (0, b.jsx)(`div`, {
                                      className: `pt-2 pb-1 flex flex-col gap-2`,
                                      children: [
                                        (0, b.jsxs)(`button`, {
                                          type: `button`,
                                          onClick: () => Ui(`Deseo que me llamen por teléfono`),
                                          className: `w-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 font-bold py-2.5 px-3 rounded-xl cursor-pointer flex items-center justify-start gap-2 shadow transition-all active:scale-95 text-xs text-left`,
                                          children: [
                                            (0, b.jsx)(`span`, { children: `📞` }),
                                            (0, b.jsx)(`span`, { children: `Solicitar llamada telefónica` }),
                                          ]
                                        }),
                                        (0, b.jsxs)(`button`, {
                                          type: `button`,
                                          onClick: () => Ui(`Deseo seguir esperando en el chat`),
                                          className: `w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/40 text-blue-300 font-bold py-2.5 px-3 rounded-xl cursor-pointer flex items-center justify-start gap-2 shadow transition-all active:scale-95 text-xs text-left`,
                                          children: [
                                            (0, b.jsx)(`span`, { children: `⏳` }),
                                            (0, b.jsx)(`span`, { children: `Seguir esperando en el chat` }),
                                          ]
                                        }),
                                        (0, b.jsxs)(`button`, {
                                          type: `button`,
                                          onClick: () => Ui(`No deseo continuar, finalizar consulta`),
                                          className: `w-full bg-slate-700/60 hover:bg-slate-700 border border-slate-600/60 text-gray-300 font-bold py-2.5 px-3 rounded-xl cursor-pointer flex items-center justify-start gap-2 shadow transition-all active:scale-95 text-xs text-left`,
                                          children: [
                                            (0, b.jsx)(`span`, { children: `❌` }),
                                            (0, b.jsx)(`span`, { children: `No deseo continuar / Finalizar consulta` }),
                                          ]
                                        })
                                      ]
                                    }, lIdx);
                                  }

                                  // Check for Restart Chat Button ([RESTART_CHAT] / [FIN_CONVERSACION])
                                  if (line.includes(`[RESTART_CHAT]`) || line.includes(`[FIN_CONVERSACION]`)) {
                                    return (0, b.jsx)(`div`, {
                                      className: `pt-2 pb-1 flex justify-center`,
                                      children: (0, b.jsxs)(`button`, {
                                        type: `button`,
                                        onClick: () => Hi(),
                                        className: `bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 font-bold py-2 px-4 rounded-xl cursor-pointer flex items-center gap-2 shadow transition-all active:scale-95 text-xs`,
                                        children: [
                                          (0, b.jsx)(`span`, { children: `🔄` }),
                                          (0, b.jsx)(`span`, { children: `Iniciar nueva consulta` }),
                                        ]
                                      })
                                    }, lIdx);
                                  }

                                  // Highlight bold product names into interactive links (only if real product)
                                  const parts = line.split(/(\*\*[^*]+\*\*)/g);
                                  return (0, b.jsx)(`p`, {
                                    className: `leading-relaxed`,
                                    children: parts.map((part, pIdx) => {
                                      if (part.startsWith(`**`) && part.endsWith(`**`)) {
                                        const textContent = part.slice(2, -2);
                                        const upper = textContent.toUpperCase().trim();
                                        
                                        // Check if it is an SG-SST action link
                                        const isSgsstAction = upper.includes(`DIAGNÓSTICO 0312`) || 
                                                              upper.includes(`DIAGNOSTICO 0312`) ||
                                                              upper.includes(`AUTODIAGNÓSTICO`) || 
                                                              upper.includes(`AUTODIAGNOSTICO`) ||
                                                              upper.includes(`SERVICIOS SG-SST`) ||
                                                              upper.includes(`SERVICIOS SGSST`);
                                        if (isSgsstAction) {
                                          return (0, b.jsx)(`button`, {
                                            type: `button`,
                                            onClick: () => {
                                              hr(!1);
                                              window.dispatchEvent(new CustomEvent('alacor_open_diagnostic_0312'));
                                            },
                                            className: `text-alacor-amber font-bold underline hover:text-yellow-300 cursor-pointer bg-transparent border-none p-0 inline text-xs leading-relaxed text-left transition-colors`,
                                            children: textContent,
                                          }, pIdx);
                                        }

                                        const nonProdWords = [
                                          `CONSULTOR`, `DIAGNÓSTICO`, `DIAGNOSTICO`, `SGSST`, `SG-SST`, `SG‑SST`, 
                                          `0312`, `RESOLUCIÓN`, `RESOLUCION`, `SERVICIOS`, `ANÁLISIS`, `ANALISIS`, `ACOMPAÑAMIENTO`, 
                                          `NOMBRE`, `EMPRESA`, `TELÉFONO`, `TELEFONO`, `PASOS`, `PLAN`, `RESULTADOS`, `TALLA`
                                        ];
                                        const isNonProduct = nonProdWords.some((w) => upper.includes(w));
                                        const productKeys = [
                                          `CASCO`, `BOTA`, `GUANTE`, `CARETA`, `LENTE`, `ARNES`, `ARNÉS`, `ESLINGA`, 
                                          `LINTERNA`, `BLOQUEADOR`, `CANDADO`, `PINZA`, `FONO`, `RESPIRADOR`, `KIT`, 
                                          `CAMISA`, `CHAQUETA`, `IMPERMEABLE`, `BARBUQUEJO`, `LINEA DE VIDA`, `LÍNEA DE VIDA`, 
                                          `TIE-OFF`, `TIE OFF`, `MOSQUETÓN`, `MOSQUETON`, `STEELPRO`, `NACIONAL`, `KONDOR`, `BRAHMA`
                                        ];
                                        const isRealProduct = !isNonProduct && productKeys.some((p) => upper.includes(p));

                                        if (isRealProduct) {
                                          return (0, b.jsx)(`button`, {
                                            type: `button`,
                                            onClick: () => handleOpenProductFromChat(textContent),
                                            className: `text-alacor-amber font-bold underline hover:text-yellow-300 cursor-pointer bg-transparent border-none p-0 inline text-xs leading-relaxed text-left transition-colors`,
                                            children: textContent,
                                          }, pIdx);
                                        }
                                        return (0, b.jsx)(`strong`, {
                                          className: `text-white font-bold`,
                                          children: textContent,
                                        }, pIdx);
                                      }

                                      // Check if plain text includes "Realizar Diagnóstico 0312" or "Módulo de Autodiagnóstico 0312"
                                      if (/(Realizar Diagn[oó]stico 0312|M[oó]dulo de Autodiagn[oó]stico 0312|Servicios SG-SST)/i.test(part)) {
                                        const subParts = part.split(/(Realizar Diagn[oó]stico 0312|M[oó]dulo de Autodiagn[oó]stico 0312|Servicios SG-SST)/gi);
                                        return (0, b.jsx)(`span`, {
                                          children: subParts.map((sp, spIdx) => {
                                            if (/(Realizar Diagn[oó]stico 0312|M[oó]dulo de Autodiagn[oó]stico 0312|Servicios SG-SST)/i.test(sp)) {
                                              return (0, b.jsx)(`button`, {
                                                type: `button`,
                                                onClick: () => {
                                                  hr(!1);
                                                  window.dispatchEvent(new CustomEvent('alacor_open_diagnostic_0312'));
                                                },
                                                className: `text-alacor-amber font-bold underline hover:text-yellow-300 cursor-pointer bg-transparent border-none p-0 inline text-xs leading-relaxed text-left transition-colors`,
                                                children: sp,
                                              }, spIdx);
                                            }
                                            return (0, b.jsx)(`span`, { children: sp }, spIdx);
                                          })
                                        }, pIdx);
                                      }

                                      return (0, b.jsx)(`span`, { children: part }, pIdx);
                                    }),
                                  }, lIdx);
                                }),
                              }),
                            });
                          })(),
                        ],
                      }),
                    },
                    t,
                  ),
                ),
                isChatLoading &&
                  (0, b.jsx)(`div`, {
                    className: `flex justify-start animate-fade-in`,
                    children: (0, b.jsxs)(`div`, {
                      className: `p-3 rounded-2xl bg-[#161f2e] border border-white/10 text-alacor-amber flex items-center gap-2 text-xs`,
                      children: [
                        (0, b.jsx)(`span`, { className: `animate-spin text-sm`, children: `⚡` }),
                        (0, b.jsx)(`span`, { className: `text-[11px] text-gray-300 font-medium`, children: `Consultando catálogo técnico y normas...` }),
                      ],
                    }),
                  }),
                (0, b.jsx)(`div`, { ref: r }),
              ],
            }),
            M.length > 0 &&
              (0, b.jsxs)(`div`, {
                className: `px-3 py-2 bg-gradient-to-r from-alacor-amber/15 via-[#131c2a] to-alacor-amber/15 border-t border-white/10 flex items-center justify-between gap-2 animate-fade-in`,
                children: [
                  (0, b.jsxs)(`div`, {
                    className: `flex items-center gap-1.5 text-[11px] text-gray-200 font-medium`,
                    children: [
                      (0, b.jsx)(`span`, { className: `text-sm`, children: `🛒` }),
                      (0, b.jsxs)(`span`, {
                        children: [
                          `En cotización: `,
                          (0, b.jsxs)(`strong`, {
                            className: `text-alacor-amber font-bold`,
                            children: [M.reduce((acc, it) => acc + (it.quantity || 1), 0), ` und`],
                          }),
                        ],
                      }),
                    ],
                  }),
                  (0, b.jsxs)(`button`, {
                    type: `button`,
                    onClick: () => {
                      hr(!1);
                      Fn(!0);
                    },
                    className: `bg-alacor-amber hover:bg-yellow-400 text-alacor-dark text-[11px] font-black py-1.5 px-3 rounded-lg border-none cursor-pointer flex items-center gap-1.5 shadow-md transition-all active:scale-95`,
                    title: `Ir directamente al carrito para solicitar la cotización formal`,
                    children: [
                      (0, b.jsx)(`span`, { children: `📋` }),
                      (0, b.jsx)(`span`, { children: `Ir al Carrito a Cotizar` }),
                    ],
                  }),
                ],
              }),
            (0, b.jsxs)(`div`, {
              className: `p-3 bg-[#0b1320] border-t border-white/5 flex gap-2`,
              children: [
                (0, b.jsx)(`input`, {
                  type: `text`,
                  value: Si,
                  onChange: (e) => Ci(e.target.value),
                  onKeyDown: (e) => {
                    e.key === `Enter` && Ui();
                  },
                  placeholder: `Haz una pregunta sobre productos o EPP...`,
                  className: `flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-alacor-amber`,
                }),
                (0, b.jsx)(`button`, {
                  onClick: Ui,
                  className: `bg-alacor-amber text-alacor-dark font-black px-4 rounded-xl text-xs hover:bg-yellow-400 border-none cursor-pointer`,
                  children: `Enviar`,
                }),
              ],
            }),
            (0, b.jsx)(`div`, {
              className: `bg-white/2 border-t border-white/5 px-4 py-2 flex items-center justify-between text-[10px] text-gray-500`,
              children: (0, b.jsxs)(`span`, {
                className: `flex items-center gap-1.5 font-sans`,
                children: [
                  (0, b.jsx)(`span`, {
                    className: `w-1.5 h-1.5 rounded-full bg-alacor-amber animate-pulse`,
                  }),
                  `Asistente Digital Activo`,
                ],
              }),
            }),
          ],
        }),
      M.length > 0 &&
        !Pn &&
        (0, b.jsxs)(`button`, {
          onClick: () => Fn(!0),
          className: `fixed bottom-6 right-6 z-40 bg-green-500 text-alacor-dark p-4 rounded-full shadow-2xl hover:bg-green-400 hover:scale-105 active:scale-95 transition-all duration-300 border-none cursor-pointer flex items-center justify-center animate-bounce`,
          title: `Ver Carrito de Compras`,
          children: [
            (0, b.jsx)(`span`, { className: `text-xl`, children: `🛒` }),
            (0, b.jsx)(`span`, {
              className: `absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-black rounded-full w-5.5 h-5.5 flex items-center justify-center border-2 border-alacor-dark`,
              children: M.reduce((e, t) => e + t.quantity, 0),
            }),
          ],
        }),
      Mi &&
        (0, b.jsx)(`div`, {
          className: `fixed bottom-0 left-0 w-full z-50 p-4 md:p-6 bg-gradient-to-t from-black/95 via-black/90 to-transparent`,
          children: (0, b.jsxs)(`div`, {
            className: `max-w-7xl mx-auto bg-alacor-black/90 backdrop-blur-xl border border-alacor-amber/25 rounded-2xl md:rounded-full p-4 md:px-8 md:py-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.9)] transition-all duration-300 animate-fade-in`,
            children: [
              (0, b.jsxs)(`div`, {
                className: `flex items-center gap-3 text-left`,
                children: [
                  (0, b.jsxs)(`span`, {
                    className: `relative flex h-3 w-3`,
                    children: [
                      (0, b.jsx)(`span`, {
                        className: `animate-ping absolute inline-flex h-full w-full rounded-full bg-alacor-amber opacity-75`,
                      }),
                      (0, b.jsx)(`span`, {
                        className: `relative inline-flex rounded-full h-3 w-3 bg-alacor-amber`,
                      }),
                    ],
                  }),
                  (0, b.jsxs)(`div`, {
                    children: [
                      (0, b.jsxs)(`p`, {
                        className: `text-xs font-black uppercase text-white tracking-wider flex items-center gap-2 leading-none`,
                        children: [
                          (0, b.jsx)(`span`, {
                            children: `Modo Vista Previa Activo`,
                          }),
                          (0, b.jsx)(`span`, {
                            className: `bg-alacor-amber/10 text-alacor-amber border border-alacor-amber/20 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest leading-none`,
                            children: `Borrador`,
                          }),
                        ],
                      }),
                      (0, b.jsx)(`p`, {
                        className: `text-[10px] text-gray-400 font-medium mt-1`,
                        children: `Estás visualizando los cambios no publicados. Los usuarios públicos no verán estos cambios hasta que los publiques.`,
                      }),
                    ],
                  }),
                ],
              }),
              (0, b.jsxs)(`div`, {
                className: `flex flex-wrap items-center gap-3 w-full md:w-auto justify-end`,
                children: [
                  (0, b.jsxs)(`button`, {
                    onClick: () => {
                      (Qe(!0), Ni(!1));
                    },
                    className: `flex-1 md:flex-none border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white font-extrabold px-5 py-2.5 rounded-full text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 border-solid`,
                    children: [
                      (0, b.jsx)(`span`, { children: `⚙️` }),
                      (0, b.jsx)(`span`, { children: `Volver al Panel` }),
                    ],
                  }),
                  (0, b.jsxs)(`button`, {
                    onClick: Ii,
                    className: `flex-1 md:flex-none border border-red-500/20 hover:border-red-500/40 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 font-extrabold px-5 py-2.5 rounded-full text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 border-solid`,
                    children: [
                      (0, b.jsx)(`span`, { children: `🗑️` }),
                      (0, b.jsx)(`span`, { children: `Descartar Cambios` }),
                    ],
                  }),
                  (0, b.jsxs)(`button`, {
                    onClick: Fi,
                    className: `flex-1 md:flex-none bg-alacor-amber text-alacor-dark font-black px-6 py-2.5 rounded-full text-[10px] uppercase tracking-widest hover:bg-yellow-400 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-alacor-amber/50 transition-all shadow-lg shadow-alacor-amber/20 duration-300 cursor-pointer flex items-center justify-center gap-2 border-none`,
                    children: [
                      (0, b.jsx)(`span`, { children: `🚀` }),
                      (0, b.jsx)(`span`, { children: `Publicar a Producción` }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),
      cartToast &&
        (0, b.jsxs)(`div`, {
          className: `fixed bottom-6 right-6 z-50 bg-[#0c1524] border border-alacor-amber/60 rounded-2xl p-4 shadow-2xl flex items-center gap-3 animate-slide-in backdrop-blur-xl`,
          children: [
            (0, b.jsx)(`span`, { className: `text-xl`, children: `🛒` }),
            (0, b.jsxs)(`div`, {
              className: `text-left`,
              children: [
                (0, b.jsx)(`p`, {
                  className: `text-xs font-bold text-white leading-tight`,
                  children: `¡Añadido al Carrito!`,
                }),
                (0, b.jsxs)(`p`, {
                  className: `text-[10px] text-gray-400 truncate max-w-[200px]`,
                  children: [cartToast.qty, `x `, cartToast.name],
                }),
              ],
            }),
            (0, b.jsx)(`button`, {
              type: `button`,
              onClick: () => {
                setCartToast(null);
                Fn(!0);
              },
              className: `ml-2 bg-alacor-amber text-alacor-dark font-black px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider hover:bg-yellow-400 transition-all border-none cursor-pointer`,
              children: `Ver Carrito`,
            }),
          ],
        }),
    ],
  });
};

export default AlacorApp;
