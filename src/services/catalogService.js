import { COREPRICE_BASE_URL, COREPRICE_API_URL, COREPRICE_TAXONOMY_URL } from '../config/api.js';
import { getProductImageUrl, getTechnicalSheetUrl, hasValidImage } from '../utils/helpers.js';

// Cache en memoria para Stale-While-Revalidate (TTL: 60 segundos)
let memoryCatalogCache = null;
let lastCatalogFetchTime = 0;
let memoryTaxonomyCache = null;
let lastTaxonomyFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000;

/**
 * Normaliza un texto para generar un slug de subcategoría limpio (sin tildes, minúsculas, con guiones bajos).
 */
export function toSlug(text) {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Metadatos estándar oficiales para las 6 Líneas Maestras de ALACOR S.A.S.
 */
export const OFFICIAL_LINES_META = {
  'SEGURIDAD INDUSTRIAL': {
    id: 'seguridad_industrial',
    title: 'SEGURIDAD INDUSTRIAL',
    icon: 'ShieldCheck',
    img: '/img/marketing/seguridad_industrial.png',
    description: 'Protección personal integral: cabeza, facial, visual, auditiva, respiratoria, manual, corporal y dérmica, y primeros auxilios con certificación vigente.'
  },
  'TRABAJO SEGURO EN ALTURAS': {
    id: 'trabajo_en_alturas',
    title: 'TRABAJO SEGURO EN ALTURAS',
    icon: 'Anchor',
    img: '/img/marketing/Trabajo_Alturas_final.png',
    description: 'Arneses de cuerpo entero, eslingas de posicionamiento e impacto, líneas de vida, conectores y frenos certificados bajo norma ANSI Z359.'
  },
  'CALZADO INDUSTRIAL': {
    id: 'calzado_industrial',
    title: 'CALZADO INDUSTRIAL',
    icon: 'Footprints',
    img: '/img/marketing/Calzado_Industrial.png',
    description: 'Botas de seguridad con puntera de composite/acero, calzado de trabajo ocupacional, botas dieléctricas y botas en PVC/caucho de alta resistencia.'
  },
  'SEÑALIZACIÓN': {
    id: 'senalizacion',
    title: 'SEÑALIZACIÓN',
    icon: 'AlertTriangle',
    img: '/img/marketing/Señalizacion_obra_vial2.png',
    description: 'Dispositivos reflectivos, puntos ecológicos y canecas de reciclaje, mallas, barreras, cintas de demarcación, conos y señalización vial normativa.'
  },
  'BLOQUEO Y ETIQUETADO': {
    id: 'bloqueo_y_etiquetado',
    title: 'BLOQUEO Y ETIQUETADO',
    icon: 'Lock',
    img: '/img/marketing/Seguridad.png',
    description: 'Sistemas de bloqueo y etiquetado industrial (LOTO): candados dieléctricos, bloqueos de válvulas, bloqueos eléctricos y maletines de consignación.'
  },
  'DOTACIÓN': {
    id: 'dotacion',
    title: 'DOTACIÓN',
    icon: 'Shirt',
    img: '/img/marketing/dotacion.png',
    description: 'Overoles y trajes de protección industrial, camisas y pantalones de dotación empresarial, impermeables, abrigos y accesorios corporativos.'
  }
};

/**
 * Consulta la taxonomía dinámica oficial desde COREPRICE (/api/taxonomy_config).
 * Implementa Stale-While-Revalidate con TTL de 60s.
 */
export async function fetchTaxonomyConfig() {
  const now = Date.now();
  if (memoryTaxonomyCache && (now - lastTaxonomyFetchTime) < CACHE_TTL_MS) {
    return memoryTaxonomyCache;
  }

  try {
    const res = await fetch(COREPRICE_TAXONOMY_URL, {
      headers: { 'Accept': 'application/json' }
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.taxonomy) {
        memoryTaxonomyCache = data.taxonomy;
        lastTaxonomyFetchTime = now;
        try {
          sessionStorage.setItem('alacor_taxonomy_cache', JSON.stringify(data.taxonomy));
        } catch (e) {}
        return data.taxonomy;
      }
    }
  } catch (err) {
    console.warn('Error fetching dynamic taxonomy, using cached/fallback:', err);
  }

  // Fallback desde sessionStorage si existe
  try {
    const cached = sessionStorage.getItem('alacor_taxonomy_cache');
    if (cached) return JSON.parse(cached);
  } catch (e) {}

  // Fallback por defecto si no hay conexión
  return {
    "SEGURIDAD INDUSTRIAL": [
      "Protección cabeza",
      "Protección facial",
      "Protección visual",
      "Protección auditiva",
      "Protección respiratoria",
      "Protección manual",
      "Protección corporal y dérmica",
      "Primeros auxilios/Emergencias"
    ],
    "TRABAJO SEGURO EN ALTURAS": [
      "Líneas de vida",
      "Arneses",
      "Eslingas",
      "Mosquetones y conectores",
      "Frenos y bloques",
      "Accesorios"
    ],
    "CALZADO INDUSTRIAL": [
      "Botas de seguridad",
      "Calzado de trabajo",
      "Botas PVC / Caucho",
      "Botas tipo soldador"
    ],
    "SEÑALIZACIÓN": [
      "Dispositivos reflectivos",
      "Puntos ecológicos y residuos",
      "Mallas y barreras",
      "Cintas de demarcación",
      "Señales viales",
      "Conos y delineadores"
    ],
    "BLOQUEO Y ETIQUETADO": [
      "Sistemas LOTO",
      "Candados y bloqueos",
      "Bloqueos eléctricos",
      "Bloqueos de válvulas",
      "Kits y maletines LOTO"
    ],
    "DOTACIÓN": [
      "Overoles y trajes",
      "Camisas y pantalones",
      "Impermeables y abrigos",
      "Accesorios de dotación"
    ]
  };
}

/**
 * Sincroniza en tiempo real el catálogo de productos con la API REST de COREPRICE (v1 catalog).
 * Revalida la taxonomía dinámica y mapea todas las familias de productos y variantes.
 */
export async function fetchLiveCatalog(baseCatalog = {}) {
  const now = Date.now();
  if (memoryCatalogCache && (now - lastCatalogFetchTime) < CACHE_TTL_MS) {
    return memoryCatalogCache;
  }

  try {
    const targetUrl = `${COREPRICE_API_URL}?limit=2000`;
    
    // Obtener taxonomía dinámica y catálogo en paralelo
    const [taxonomyTree, catRes] = await Promise.all([
      fetchTaxonomyConfig(),
      fetch(targetUrl, {
        headers: {
          'Accept': 'application/json',
          'X-API-KEY': 'cp-web-2026-integracion-alacor'
        }
      })
    ]);

    if (!catRes.ok) {
      console.warn(`COREPRICE API returned status ${catRes.status}`);
      return memoryCatalogCache || baseCatalog;
    }

    const catData = await catRes.json();
    const apiProducts = catData.data || catData;

    if (!Array.isArray(apiProducts)) {
      return memoryCatalogCache || baseCatalog;
    }

    // Inicializar el nuevo árbol estructurado con las 6 Líneas Maestras Oficiales
    const newCatalog = {};

    // 1. Construir esqueleto basado en taxonomía dinámica
    Object.keys(taxonomyTree).forEach((lineKey) => {
      const meta = OFFICIAL_LINES_META[lineKey] || {
        id: toSlug(lineKey),
        title: lineKey,
        icon: 'ShieldCheck',
        img: '/img/marketing/seguridad_industrial.png',
        description: `Línea especializada de ${lineKey}.`
      };

      newCatalog[lineKey] = {
        ...meta,
        sublines: {}
      };

      const sublinesList = taxonomyTree[lineKey] || [];
      sublinesList.forEach((subName) => {
        const subSlug = toSlug(subName);
        newCatalog[lineKey].sublines[subSlug] = {
          title: subName,
          description: `Equipos y accesorios homologados para ${subName}.`,
          products: []
        };
      });
    });

    // 2. Función auxiliar para resolver la Línea y Sublínea correcta de cada producto
    const getTargetSubline = (rawLine, rawSubline) => {
      const lNorm = (rawLine || '').trim().toUpperCase();
      const sNorm = (rawSubline || 'General').trim();
      const sSlug = toSlug(sNorm);

      // Excluir líneas no pertenecientes al portafolio de EPP
      if (lNorm.includes('ILUMINACION') || lNorm.includes('ILUMINACIÓN')) {
        return null;
      }

      // Resolver categoría
      let lineKey = null;
      if (lNorm.includes('BLOQUEO') || lNorm.includes('LOTO') || lNorm === 'SEGURIDAD') {
        lineKey = 'BLOQUEO Y ETIQUETADO';
      } else if (lNorm.includes('CALZADO')) {
        lineKey = 'CALZADO INDUSTRIAL';
      } else if (lNorm.includes('ALTURA')) {
        lineKey = 'TRABAJO SEGURO EN ALTURAS';
      } else if (lNorm.includes('SEGURIDAD INDUSTRIAL')) {
        lineKey = 'SEGURIDAD INDUSTRIAL';
      } else if (lNorm.includes('DOTACION') || lNorm.includes('DOTACIÓN')) {
        lineKey = 'DOTACIÓN';
      } else if (lNorm.includes('SENALIZACION') || lNorm.includes('SEÑALIZACIÓN')) {
        lineKey = 'SEÑALIZACIÓN';
      } else {
        lineKey = Object.keys(newCatalog).find((k) => k.toUpperCase() === lNorm);
      }

      if (!lineKey || !newCatalog[lineKey]) {
        return null;
      }

      if (!newCatalog[lineKey].sublines) {
        newCatalog[lineKey].sublines = {};
      }

      let sublinesObj = newCatalog[lineKey].sublines;
      
      // Mapeos defensivos para subcategorías fusionadas
      if (lineKey === 'CALZADO INDUSTRIAL' && (sSlug.includes('diel') || sNorm.toLowerCase().includes('diel'))) {
        return sublinesObj['botas_de_seguridad'] || sublinesObj[Object.keys(sublinesObj)[0]];
      }
      if (lineKey === 'DOTACIÓN' && sSlug.includes('chaleco')) {
        return sublinesObj['accesorios_de_dotacion'] || sublinesObj['overoles_y_trajes'];
      }

      let targetSub = sublinesObj[sSlug];

      if (!targetSub) {
        // Búsqueda por similitud de slug o título
        const foundKey = Object.keys(sublinesObj).find(
          (k) => k === sSlug || toSlug(sublinesObj[k].title) === sSlug
        );
        if (foundKey) {
          targetSub = sublinesObj[foundKey];
        } else {
          sublinesObj[sSlug] = {
            title: sNorm,
            description: `Equipos y accesorios homologados para ${sNorm}.`,
            products: []
          };
          targetSub = sublinesObj[sSlug];
        }
      }

      return targetSub;
    };

    // 3. Procesar cada producto e integrarlo en familias con variantes
    apiProducts.forEach((prod) => {
      const isInactive = prod.is_active === false || prod.status === 'inactive' || prod.published === false || prod.is_published === false;
      if (isInactive) return;

      const titleUpper = (prod.name || prod.full_name || '').toUpperCase();
      const refUpper = (prod.sku || prod.base_sku || '').toUpperCase();
      if (refUpper.includes('AC200350260008') || titleUpper.includes('EVO PRO EJECUTIVO')) return;

      const targetSubline = getTargetSubline(prod.line, prod.subline);
      if (!targetSubline) return;

      const imgUrl = getProductImageUrl(prod);
      const pdfUrl = getTechnicalSheetUrl(prod);

      // Identificación de Familia oficial desde COREPRICE
      const parentName = (prod.parent_name || prod.parentName || prod.full_name || prod.name || 'Producto Industrial').trim();
      const parentKey = (prod.parent_sku || prod.parentSku || parentName || prod.base_sku || prod.sku)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_');

      // Extracción y sanitización de atributos de variante (eliminando .0 en tallas numéricas)
      let rawAttrs = { ...(prod.variant_attributes || {}) };
      let variantAttrs = {};
      for (const [k, v] of Object.entries(rawAttrs)) {
        if (v === null || v === undefined) continue;
        let str = String(v).trim();
        str = str.replace(/CAF[\uFFFD]/gi, 'CAFÉ');
        if (/^\d+\.0+$/.test(str)) {
          str = str.replace(/\.0+$/, '');
        } else {
          const num = Number(str);
          if (!isNaN(num) && Number.isInteger(num) && str.includes('.')) {
            str = String(num);
          }
        }
        const strUpper = str.toUpperCase().trim();
        const parentUpper = parentName.toUpperCase().trim();
        if (strUpper === 'ESTANDAR' || strUpper === 'ESTÁNDAR' || strUpper === parentUpper) {
          continue;
        }
        if (k.toLowerCase() === 'variante' && (strUpper === parentUpper || strUpper.includes(parentUpper))) {
          continue;
        }
        variantAttrs[k] = str;
      }

      const mappedVariant = {
        sku: prod.sku,
        ref: prod.sku,
        base_sku: prod.base_sku || prod.sku,
        parent_sku: prod.parent_sku || null,
        title: prod.full_name || `${parentName} - ${prod.name}`,
        name: prod.name,
        parentName: parentName,
        brand: prod.brand || 'STEELPRO',
        standards: prod.standards || 'Certificación Homologada',
        description: prod.description || `${parentName} homologado y certificado.`,
        img: imgUrl,
        image_url: imgUrl,
        media: prod.media || null,
        pdf: pdfUrl,
        technical_sheet_url: pdfUrl,
        technicalSheetUrl: pdfUrl,
        price: prod.pricing?.price || null,
        isPublished: true,
        isVisible: true,
        specs: Array.isArray(prod.specs) && prod.specs.length > 0
          ? prod.specs
          : [
              { label: 'Marca', val: prod.brand || 'STEELPRO' },
              { label: 'Referencia', val: prod.sku },
              { label: 'Origen', val: 'Fábrica Homologada' }
            ],
        variantAttributes: Object.keys(variantAttrs).length > 0 ? variantAttrs : null
      };

      let existingParent = targetSubline.products.find((p) => p.familyKey === parentKey);

      if (!existingParent) {
        existingParent = {
          id: `cp_${parentKey}`,
          familyKey: parentKey,
          parent_sku: prod.parent_sku || prod.base_sku || prod.sku,
          ref: prod.parent_sku || prod.base_sku || prod.sku,
          sku: prod.parent_sku || prod.base_sku || prod.sku,
          parentName: parentName,
          title: parentName,
          name: parentName,
          brand: prod.brand || 'STEELPRO',
          description: prod.description || `${parentName} marca ${prod.brand || 'STEELPRO'}. Cumple normas técnicas de protección.`,
          img: imgUrl,
          image_url: imgUrl,
          media: prod.media || null,
          pdf: pdfUrl,
          technical_sheet_url: pdfUrl,
          technicalSheetUrl: pdfUrl,
          standards: prod.standards || 'Certificación Homologada',
          isVisible: true,
          isPublished: true,
          price: prod.pricing?.price || null,
          specs: mappedVariant.specs,
          variants: [mappedVariant]
        };
        targetSubline.products.push(existingParent);
      } else {
        if ((!existingParent.img || existingParent.img.includes('default_epp')) && imgUrl && !imgUrl.includes('default_epp')) {
          existingParent.img = imgUrl;
          existingParent.image_url = imgUrl;
          existingParent.media = prod.media || existingParent.media;
        } else if (prod.media?.main_image_url && !imgUrl.includes('default_epp')) {
          existingParent.img = imgUrl;
          existingParent.image_url = imgUrl;
          existingParent.media = prod.media;
        }
        if (!existingParent.pdf && pdfUrl) {
          existingParent.pdf = pdfUrl;
          existingParent.technical_sheet_url = pdfUrl;
          existingParent.technicalSheetUrl = pdfUrl;
        }
        if (!existingParent.variants.some((v) => v.sku === mappedVariant.sku)) {
          existingParent.variants.push(mappedVariant);
        }
      }
    });

    // 4. Backward-compatible aliases para navegación interna
    const segInd = newCatalog['SEGURIDAD INDUSTRIAL'];
    const alt = newCatalog['TRABAJO SEGURO EN ALTURAS'];
    const calz = newCatalog['CALZADO INDUSTRIAL'];
    const bloq = newCatalog['BLOQUEO Y ETIQUETADO'];
    const sen = newCatalog['SEÑALIZACIÓN'];
    const dot = newCatalog['DOTACIÓN'];

    Object.assign(newCatalog, {
      seguridad_industrial: segInd,
      trabajo_en_alturas: alt,
      calzado_industrial: calz,
      bloqueo_y_etiquetado: bloq,
      senalizacion: sen,
      dotacion: dot,
      // Compatibilidad con rutas antiguas
      SEGURIDAD: bloq,
      seguridad: bloq,
      loto: bloq,
      alturas: alt,
      calzado: calz,
      cabeza: segInd,
      facial: segInd,
      visual: segInd,
      auditiva: segInd,
      respiratoria: segInd,
      manual: segInd,
      corporal: segInd,
      emergencias: segInd,
      otros: segInd
    });

    // Actualizar cache SWR en memoria y sessionStorage
    memoryCatalogCache = newCatalog;
    lastCatalogFetchTime = now;
    try {
      sessionStorage.setItem('alacor_catalog_v2026_live', JSON.stringify(newCatalog));
    } catch (e) {}

    return newCatalog;
  } catch (err) {
    console.error('Error fetching live COREPRICE catalog:', err);
    return memoryCatalogCache || baseCatalog;
  }
}
