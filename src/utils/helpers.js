import { COREPRICE_BASE_URL } from '../config/api.js';

export function hasValidImage(item) {
  if (!item) return false;
  if (typeof item === 'string') {
    const s = item.trim();
    return s.length > 0 && !s.includes('default_epp') && s !== '/img/catalogo/default_epp.png';
  }
  const src = item.media?.variant_image_url || item.variant_image_url || item.media?.image_url || item.image_url || item.media?.main_image_url || item.main_image_url || item.mainImageUrl || item.img || item.local_image;
  if (src && typeof src === 'string') {
    const s = src.trim();
    if (s.length > 0 && !s.includes('default_epp') && s !== '/img/catalogo/default_epp.png') {
      return true;
    }
  }
  if (Array.isArray(item.variants) && item.variants.length > 0) {
    return item.variants.some((v) => hasValidImage(v));
  }
  return false;
}

export const x = (e) => {
  if (!e || typeof e !== 'string' || e.trim() === '' || e.includes('default_epp')) {
    return '/img/catalogo/default_epp.png';
  }
  let t = String(e).trim();
  if (t.startsWith('http://') || t.startsWith('https://')) return t;
  if (t.startsWith('/img/') || t.startsWith('img/')) return t.startsWith('/') ? t : '/' + t;
  if (t.startsWith('/api/media/')) return `${COREPRICE_BASE_URL}${t}`;
  
  let filename = t.split('/').pop();
  if (filename.includes('file=')) filename = filename.split('file=').pop();
  return `${COREPRICE_BASE_URL}/api/media/image?file=${filename}`;
};

export const ee = (e) => {
  if (!e) return e;
  try {
    let t = JSON.stringify(e);
    t = t.replace(/Certificación CorePrice Activa/gi, 'Certificación Homologada');
    t = t.replace(/CorePrice API/gi, 'Fábrica Homologada');
    t = t.replace(/CorePrice/gi, 'Alacor');
    return JSON.parse(t);
  } catch (err) {
    console.error('Error sanitizing catalog data:', err);
    return e;
  }
};

export function getProductImageUrl(item) {
  if (!item) return '/img/catalogo/default_epp.png';

  let src = typeof item === 'string'
    ? item
    : (item.media?.variant_image_url || item.variant_image_url || item.media?.image_url || item.image_url || item.media?.main_image_url || item.main_image_url || item.mainImageUrl || item.img || item.local_image || '');
    
  if (!src && Array.isArray(item.variants) && item.variants.length > 0) {
    const firstWithImg = item.variants.find(v => hasValidImage(v));
    if (firstWithImg) {
      src = firstWithImg.media?.variant_image_url || firstWithImg.variant_image_url || firstWithImg.media?.image_url || firstWithImg.image_url || firstWithImg.media?.main_image_url || firstWithImg.main_image_url || firstWithImg.mainImageUrl || firstWithImg.img || firstWithImg.local_image || '';
    }
  }

  if (!src || typeof src !== 'string' || !src.trim() || src.includes('default_epp')) {
    return '/img/catalogo/default_epp.png';
  }
  
  src = src.trim();

  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  
  if (src.startsWith('/api/media/')) {
    return `${COREPRICE_BASE_URL}${src}`;
  }

  if (src.startsWith('/img/')) {
    return src;
  }

  let filename = src.split('/').pop();
  if (filename.includes('file=')) filename = filename.split('file=').pop();
  
  return `${COREPRICE_BASE_URL}/api/media/image?file=${encodeURIComponent(filename)}`;
}

export function getTechnicalSheetUrl(item) {
  if (!item) return null;
  const raw = item.media?.technical_sheet_url || item.media?.pdf_url || item.technical_sheet_url || item.technicalSheetUrl || item.pdf || '';
  if (raw && typeof raw === 'string' && raw.trim().length > 0) {
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      return raw;
    }
    if (raw.startsWith('/api/media/')) {
      return `${COREPRICE_BASE_URL}${raw}`;
    }
    if (raw.startsWith('/')) {
      return raw;
    }
    return `${COREPRICE_BASE_URL}/api/media/pdf?file=${encodeURIComponent(raw)}`;
  }
  return null;
}

export const calculateDIANDV = (nit) => {
  if (!nit) return '';
  const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  const numStr = String(nit).replace(/\D/g, '');
  if (!numStr) return '';
  let sum = 0;
  for (let i = 0; i < numStr.length; i++) {
    sum += parseInt(numStr.charAt(numStr.length - 1 - i), 10) * weights[i];
  }
  const mod = sum % 11;
  return mod > 1 ? 11 - mod : mod;
};

/**
 * Agrupa productos por modelo/familia, consolidando variantes de talla, color u otros atributos.
 */
export function groupProductsIntoFamilies(productsList) {
  if (!Array.isArray(productsList) || productsList.length === 0) return [];

  const COLORS = ['AMARILLO', 'AZUL', 'BLANCO', 'ROJO', 'VERDE', 'NARANJA', 'GRIS', 'NEGRO', 'ROSADO', 'CAFÉ', 'TRANSPARENTE', 'VISONE', 'SIENA', 'MIEL', 'HABANO'];

  const normalizeFamilyName = (p) => {
    let t = (p.parentName || p.parent_name || p.title || p.name || '').trim();
    let ref = (p.ref || p.sku || p.base_sku || '').toUpperCase();
    let img = (p.img || '').toLowerCase();

    if (t.toUpperCase().includes('EVO PRO') || ref.includes('200350260008') || ref.includes('AAK4PAASU7B') || ref.includes('20035026001')) {
      return 'CASCO EVO PRO EJECUTIVO';
    }
    if (img.includes('bloque-auto-retractil') || ref.includes('500879') || ref.includes('501162') || ref.includes('500876') || ref.includes('500878')) {
      return 'BLOQUE AUTO-RETRÁCTIL';
    }
    if (img.includes('eco-rachet') || img.includes('eco_ratchet') || t.toUpperCase().includes('ECO RATCHET')) {
      return 'CASCO ECO RATCHET';
    }
    if (img.includes('luminer-capitan') || t.toUpperCase().includes('LUMINER CAPITAN')) {
      return 'CASCO TIPO I MINERO LUMINER CAPITÁN';
    }
    if (img.includes('mountain') || t.toUpperCase().includes('MOUNTAIN')) {
      return 'CASCO MOUNTAIN ABS CON BARBUQUEJO';
    }
    if (img.includes('eco-cremalera') || img.includes('eco_cremallera') || t.toUpperCase().includes('ECO CREMALLERA')) {
      return 'CASCO ECO CREMALLERA';
    }
    if (img.includes('luminer-ala') || t.toUpperCase().includes('LUMINER ALA')) {
      return 'CASCO LUMINER ALA ENTERIZA';
    }
    if (img.includes('minero-a-la-enteriza') || t.toUpperCase().includes('PORTALAMPARA')) {
      return 'CASCO MINERO ALA ENTERIZA CON PORTALÁMPARA';
    }
    if (t.toUpperCase().includes('SOLDADOR AMARILLO') || ref.includes('7KQA4WJPLNT') || img.includes('e68bb6fe8aaa40b68b0c662323dfec29')) {
      return 'GUANTE SOLDADOR AMARILLO - CERTIFICADO (STEELPRO)';
    }
    if (t.toUpperCase().includes('SOLDADOR AZUL') || ref.includes('300851160434') || img.includes('bf888c40864a468a8c0ad7d0c0f76567')) {
      return 'GUANTE SOLDADOR AZUL / NARANJA - CERTIFICADO (STEELPRO)';
    }
    if (t.toUpperCase().includes('SOLDADOR CARNAZA') || ref.includes('PWWJRKESU1A') || img.includes('7eb74c83e2994d42b5780b1bd2a105c6')) {
      return 'GUANTE SOLDADOR CARNAZA NARANJA SIN REFUERZO';
    }
    if (t.toUpperCase().includes('SOLDADOR 15') || ref.includes('AC300850670008') || ref.includes('300850670008') || img.includes('5b4b396037ac45a2b1e1c86f7d77fe0f')) {
      return 'GUANTE SOLDADOR 15" NARANJA NEGRO KEVLAR REFORZADO PALMA';
    }
    if (t.toUpperCase().includes('BARBUQUEJO')) {
      return 'BARBUQUEJO PARA CASCO TIPO I';
    }
    if (t.toUpperCase().includes('TAFILETE')) {
      return t.toUpperCase().replace(/\s*-\s*CERTIFICADO.*$/gi, '').trim();
    }

    // Si el título es solo un color o solo una talla/combinación (ej. "34.0", "34.0 / VISONE")
    if (COLORS.includes(t.toUpperCase()) || /^[\d\.\s\/\-_]+$/.test(t) || /^\d+(\.\d+)?(\s*\/\s*.*)?$/.test(t)) {
      if (p.description && p.description.length > 5 && !p.description.startsWith(t)) {
        return p.description.replace(/\s*-\s*Certificado.*$/gi, '').trim().toUpperCase();
      }
      let cleanImg = img.split('/').pop()
        .replace(/_[a-f0-9]{6}\.(png|jpg|jpeg|webp)/gi, '')
        .replace(/\.(png|jpg|jpeg|webp)/gi, '')
        .replace(/-(amarillo|azul|blanco|rojo|verde|naranja|gris|negro|rosado|visone|cafe|siena)/gi, '')
        .replace(/[-_]/g, ' ').toUpperCase().trim();
      return cleanImg || (p.brand ? `CALZADO INDUSTRIAL ${p.brand}` : 'PRODUCTO INDUSTRIAL');
    }

    let clean = t
      .replace(/\s*-\s*TALLA\s*\d+(\.\d+)?/gi, '')
      .replace(/\s*-\s*Certificado.*$/gi, '')
      .replace(/\s*-\s*000\d.*$/gi, '')
      .trim();

    COLORS.forEach(c => {
      const reg = new RegExp(' \\b' + c + '\\b', 'gi');
      clean = clean.replace(reg, '');
    });

    return clean.trim().toUpperCase() || 'PRODUCTO INDUSTRIAL';
  };

  const familiesMap = new Map();

  productsList.forEach((prod) => {
    if (!prod) return;

    const isExplicitInactive = prod.isPublished === false || prod.is_published === false || prod.is_active === false || prod.status === 'inactive' || prod.published === false || prod.active === false;
    if (isExplicitInactive) return;

    // REGLA COREPRICE: Solo incluir productos que tengan imagen configurada y activa (no genérica)
    if (!hasValidImage(prod)) {
      return;
    }

    const titleUpper = (prod.title || prod.name || prod.parentName || '').toUpperCase();
    const refUpper = (prod.ref || prod.sku || prod.base_sku || '').toUpperCase();

    if (refUpper.includes('AC200350260008') || refUpper.includes('200350260008') || titleUpper.includes('EVO PRO EJECUTIVO')) {
      return;
    }

    // Si ya viene empaquetado como objeto de familia con variants
    if (prod.familyKey && Array.isArray(prod.variants) && prod.variants.length > 0) {
      const validVariants = prod.variants.filter(v => hasValidImage(v) && v.isPublished !== false && v.is_published !== false);
      if (validVariants.length === 0) return;

      const key = String(prod.familyKey).toLowerCase().replace(/[^a-z0-9]/g, '_');
      if (!familiesMap.has(key)) {
        familiesMap.set(key, { ...prod, variants: validVariants });
      } else {
        const existing = familiesMap.get(key);
        if (!existing.img && prod.img) existing.img = prod.img;
        validVariants.forEach((v) => {
          const vSku = v.sku || v.ref;
          const alreadyExists = existing.variants.some((ev) => (ev.sku || ev.ref) === vSku);
          if (!alreadyExists) {
            existing.variants.push(v);
          }
        });
      }
      return;
    }

    // Normalización de variantes individuales
    const rawTitle = (prod.title || prod.name || '').trim();
    const parentName = (prod.parentName || prod.parent_name) || normalizeFamilyName(prod);
    
    // Extracción de atributos multivariante
    let variantAttrs = { ...(prod.variantAttributes || prod.variant_attributes || {}) };
    
    const tallaMatch = rawTitle.match(/\s*-\s*TALLA\s*(\d+(\.\d+)?)/i);
    if (tallaMatch && !variantAttrs['Talla']) {
      variantAttrs['Talla'] = tallaMatch[1];
    }

    if (Object.keys(variantAttrs).length === 0 && rawTitle) {
      const parts = rawTitle.split('/').map(p => p.trim());
      if (parts.length === 2) {
        variantAttrs['Talla'] = parts[0];
        variantAttrs['Color'] = parts[1];
      } else if (parts.length === 1 && /^[\d\.]+$/.test(parts[0])) {
        variantAttrs['Talla'] = parts[0];
      } else {
        COLORS.forEach(c => {
          if (rawTitle.toUpperCase().includes(c)) variantAttrs['Color'] = c;
        });
      }
    }

    const familyKey = (prod.parent_sku || prod.parentSku || parentName || prod.base_sku || prod.sku)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');

    const mappedVariant = {
      ...prod,
      ref: prod.sku || prod.ref || prod.id,
      sku: prod.sku || prod.ref || prod.id,
      base_sku: prod.base_sku || prod.sku,
      parent_sku: prod.parent_sku || null,
      title: parentName ? (rawTitle && rawTitle !== parentName ? `${parentName} - ${rawTitle}` : parentName) : rawTitle,
      parentName: parentName,
      variantAttributes: Object.keys(variantAttrs).length > 0 ? variantAttrs : null
    };

    if (!familiesMap.has(familyKey)) {
      const familyObj = {
        id: 'fam_' + familyKey,
        familyKey: familyKey,
        parentName: parentName,
        title: parentName,
        brand: prod.brand || 'STEELPRO',
        description: prod.description || `${parentName} homologado y certificado.`,
        img: prod.img || mappedVariant.img,
        standards: prod.standards || 'Certificación Homologada',
        variants: [mappedVariant]
      };
      familiesMap.set(familyKey, familyObj);
    } else {
      const existingFamily = familiesMap.get(familyKey);
      if (!existingFamily.img && mappedVariant.img) {
        existingFamily.img = mappedVariant.img;
      }
      const exists = existingFamily.variants.some((v) => (v.sku || v.ref) === (mappedVariant.sku || mappedVariant.ref));
      if (!exists) {
        existingFamily.variants.push(mappedVariant);
      }
    }
  });

  return Array.from(familiesMap.values()).filter(fam => hasValidImage(fam));
}
