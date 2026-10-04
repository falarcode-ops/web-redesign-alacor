import React, { useState } from 'react';
import { getProductImageUrl } from '../../utils/helpers.js';

export function formatAttributeVal(val) {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();
  str = str.replace(/CAF[\uFFFD]/gi, 'CAFÉ');
  if (/^\d+\.0+$/.test(str)) {
    return str.replace(/\.0+$/, '');
  }
  const num = Number(str);
  if (!isNaN(num) && Number.isInteger(num) && str.includes('.')) {
    return String(num);
  }
  return str;
}

function sortAttributeValues(values) {
  const sizeOrder = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', '5XL'];
  return values.slice().sort((a, b) => {
    const aStr = String(a).toUpperCase();
    const bStr = String(b).toUpperCase();
    const aIdx = sizeOrder.indexOf(aStr);
    const bIdx = sizeOrder.indexOf(bStr);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    
    const aNum = parseFloat(a);
    const bNum = parseFloat(b);
    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
    
    return aStr.localeCompare(bStr);
  });
}

export const ProductFamilyCard = ({ family, onViewSheet, onAddToCart, showPrices = false, isHighlighted = false }) => {
  const variants = (family && Array.isArray(family.variants) && family.variants.length > 0) 
    ? family.variants 
    : (family && family.product ? [family.product] : (family ? [family] : []));
  if (variants.length === 0) return null;

  let candidate = (family && (family.parentName || family.title)) || variants[0]?.parentName || variants[0]?.parent_name || '';
  if (!candidate || /^(XS|S|M|L|XL|XXL|2XL|3XL|34|35|36|37|38|39|40|41|42|43|44|45|NEGRO|BLANCO|AMARILLO|AZUL|ROJO|CLARO|OSCURO|GENERAL|ESTANDAR|ESTÁNDAR)$/i.test(candidate.trim())) {
    const vTitle = variants[0]?.title || variants[0]?.full_name || family?.name || '';
    if (vTitle && vTitle.includes(' - ')) {
      candidate = vTitle.split(' - ')[0].trim();
    } else if (vTitle && !/^(XS|S|M|L|XL|XXL|2XL|3XL)$/i.test(vTitle.trim())) {
      candidate = vTitle.trim();
    } else {
      candidate = family?.brand ? `EQUIPO INDUSTRIAL ${family.brand}` : 'PRODUCTO INDUSTRIAL';
    }
  }
  const familyName = candidate.trim().toUpperCase();
  const familyBrand = (family && family.brand) || variants[0]?.brand || 'STEELPRO';
  const familyDesc = (family && family.description && family.description.toUpperCase() !== 'ESTANDAR') ? family.description : `${familyName} marca ${familyBrand}. Cumple normas técnicas de protección.`;

  const [variantQtyMap, setVariantQtyMap] = useState(() => {
    const initial = {};
    variants.forEach(v => {
      const sku = v.ref || v.sku;
      if (sku) initial[sku] = 0;
    });
    return initial;
  });

  const [selectedSku, setSelectedSku] = useState(variants[0]?.ref || variants[0]?.sku || '');
  const [justAdded, setJustAdded] = useState(false);
  const activeProduct = variants.find(v => (v.ref || v.sku) === selectedSku) || variants[0] || {};

  const setVariantQty = (sku, count) => {
    if (!sku) return;
    setVariantQtyMap(prev => ({
      ...prev,
      [sku]: Math.max(0, count)
    }));
  };

  const activeSku = activeProduct.ref || activeProduct.sku || family.ref || family.sku || '';
  const activeQty = variantQtyMap[activeSku] || 0;

  const totalFamilyUnits = Object.values(variantQtyMap).reduce((sum, q) => sum + (q || 0), 0);

  const allAttributes = {};
  variants.forEach(v => {
    if (v.variantAttributes && typeof v.variantAttributes === 'object') {
      Object.keys(v.variantAttributes).forEach(key => {
        const raw = v.variantAttributes[key];
        if (raw === null || raw === undefined) return;
        const val = formatAttributeVal(raw);
        if (!val) return;
        const valUpper = val.toUpperCase().trim();
        const famUpper = familyName.toUpperCase().trim();
        // Omitir variantes artificiales o dummy
        if (
          valUpper === famUpper ||
          valUpper === 'ESTANDAR' ||
          valUpper === 'ESTÁNDAR' ||
          (key.toLowerCase() === 'variante' && (valUpper === famUpper || valUpper.includes(famUpper)))
        ) {
          return;
        }
        if (!allAttributes[key]) allAttributes[key] = new Set();
        allAttributes[key].add(val);
      });
    }
  });

  // Limpiar llaves vacías
  Object.keys(allAttributes).forEach(key => {
    if (allAttributes[key].size === 0) {
      delete allAttributes[key];
    }
  });

  const hasVariants = Object.keys(allAttributes).length > 0;

  const handleSelectAttribute = (attrName, attrValue) => {
    const formattedTarget = formatAttributeVal(attrValue);
    const targetAttrs = {
      ...(activeProduct.variantAttributes || {}),
      [attrName]: formattedTarget
    };
    
    let bestMatch = variants.find(v => {
      if (!v.variantAttributes) return false;
      return Object.keys(targetAttrs).every(k => formatAttributeVal(v.variantAttributes[k]) === formatAttributeVal(targetAttrs[k]));
    });
    
    if (!bestMatch) {
      bestMatch = variants.find(v => v.variantAttributes && formatAttributeVal(v.variantAttributes[attrName]) === formattedTarget);
    }
    
    if (bestMatch) {
      setSelectedSku(bestMatch.ref || bestMatch.sku);
    }
  };

  const getMeaningfulSuffix = (prodItem) => {
    if (!hasVariants || !prodItem || !prodItem.variantAttributes) return '';
    const validVals = Object.values(prodItem.variantAttributes).filter(v => {
      if (!v) return false;
      const u = String(v).toUpperCase().trim();
      return u !== 'ESTANDAR' && u !== 'ESTÁNDAR' && u !== familyName.toUpperCase().trim();
    });
    return validVals.length > 0 ? ' - ' + validVals.map(x => formatAttributeVal(x)).join(' / ') : '';
  };

  const handleAddToCart = () => {
    const itemsToAdd = variants.filter(v => {
      const sku = v.ref || v.sku;
      return (variantQtyMap[sku] || 0) > 0;
    });

    if (itemsToAdd.length === 0) {
      const sku = activeProduct.ref || activeProduct.sku || activeSku;
      const variantSuffix = getMeaningfulSuffix(activeProduct);
      onAddToCart({
        ...activeProduct,
        ref: sku,
        title: familyName + variantSuffix,
        quantity: 1,
        _batchMeta: { label: familyName + variantSuffix, totalQty: 1 },
        _suppressToast: false
      });
      return;
    }

    const batchLabel = itemsToAdd.length > 1
      ? `${itemsToAdd.length} variantes de ${familyName}`
      : familyName + getMeaningfulSuffix(itemsToAdd[0]);

    itemsToAdd.forEach((v, idx) => {
      const sku = v.ref || v.sku;
      const qty = variantQtyMap[sku];
      const variantSuffix = getMeaningfulSuffix(v);
      const isLast = idx === itemsToAdd.length - 1;
      onAddToCart({
        ...v,
        ref: sku,
        title: familyName + variantSuffix,
        quantity: qty,
        _suppressToast: !isLast,
        _batchMeta: isLast
          ? { label: batchLabel, totalQty: totalFamilyUnits }
          : null
      });
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const [imgLoaded, setImgLoaded] = useState(true);
  const imageTarget = activeProduct || family;
  const domId = family.id || (family.familyKey ? `fam_${family.familyKey}` : undefined);

  return (
    <div
      id={domId}
      data-family-id={family.id}
      data-family-key={family.familyKey}
      data-product-title={familyName}
      data-product-ref={activeSku}
      className={`border rounded-2xl p-6 shadow-2xl flex flex-col justify-between h-full group relative transition-all duration-500 ${
        isHighlighted
          ? 'border-alacor-amber ring-4 ring-alacor-amber shadow-[0_0_50px_rgba(245,158,11,0.7)] bg-alacor-amber/5 scale-[1.02] z-20'
          : 'border-white/5 bg-white/2 hover:border-alacor-amber/30'
      }`}
    >
      {isHighlighted && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-alacor-amber text-alacor-dark text-[10px] font-black uppercase px-4 py-1 rounded-full shadow-2xl flex items-center gap-1.5 z-30 animate-pulse tracking-wider whitespace-nowrap">
          <span>⭐</span>
          <span>Referencia Seleccionada</span>
        </div>
      )}
      <div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-center aspect-square mb-6 overflow-hidden relative group backdrop-blur-sm">
          <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
            <div className="absolute w-[180px] h-[180px] rounded-full pedestal-glow blur-2xl opacity-40 group-hover:opacity-65 transition-all" />
          </div>
          <div className="w-full h-full bg-white rounded-lg p-3 flex items-center justify-center relative z-10">
            <img
              src={getProductImageUrl(imageTarget)}
              alt={familyName}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onLoad={() => setImgLoaded(true)}
              onError={(evt) => {
                evt.currentTarget.onerror = null;
                evt.currentTarget.src = '/img/catalogo/default_epp.png';
              }}
              className="max-h-[90%] max-w-[90%] object-contain drop-shadow-2xl transform group-hover:scale-105 transition-all duration-500"
            />
          </div>
        </div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-alacor-amber tracking-widest uppercase block">
            {familyBrand}
          </span>
          {totalFamilyUnits > 0 && (
            <span className="text-[9.5px] font-extrabold bg-alacor-amber/20 text-alacor-amber border border-alacor-amber/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Total Modelo: {totalFamilyUnits} unid.
            </span>
          )}
        </div>
        <h4 className="text-xl font-black text-white uppercase leading-tight mb-3">
          {familyName}
        </h4>
        <div className="flex items-center text-[10px] bg-black/40 border border-white/5 rounded px-2.5 py-1.5 mb-4">
          <span className="font-bold text-gray-400 font-mono tracking-wider">
            REF: {activeSku}
          </span>
        </div>
        <p
          className="text-xs text-gray-300 font-light leading-relaxed mb-6 h-12 overflow-hidden text-ellipsis"
          title={familyDesc}
        >
          {familyDesc}
        </p>

        {Object.keys(allAttributes).length > 0 && (
          <div className="mb-6 space-y-3.5 border-t border-white/5 pt-4">
            {Object.keys(allAttributes).map(attrName => {
              const values = sortAttributeValues(Array.from(allAttributes[attrName]));
              const currentValue = activeProduct.variantAttributes ? formatAttributeVal(activeProduct.variantAttributes[attrName]) : null;

              return (
                <div key={attrName} className="space-y-1.5">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">
                    {attrName}: <span className="text-white font-medium">{currentValue || "N/A"}</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {values.map(val => {
                      const isSelected = currentValue === val;
                      const matchingVar = variants.find(v => v.variantAttributes && formatAttributeVal(v.variantAttributes[attrName]) === val);
                      const matchingSku = matchingVar ? (matchingVar.ref || matchingVar.sku) : null;
                      const varQty = matchingSku ? (variantQtyMap[matchingSku] || 0) : 0;

                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleSelectAttribute(attrName, val)}
                          className={`text-[9px] font-extrabold px-3 py-1.5 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? "bg-alacor-amber border-alacor-amber text-alacor-dark"
                              : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                          }`}
                        >
                          {val}
                          {varQty > 0 && (
                            <span className={`px-1.5 py-0.2 text-[8.5px] rounded-full font-mono font-black ${isSelected ? "bg-alacor-dark text-alacor-amber" : "bg-alacor-amber text-alacor-dark"}`}>
                              {varQty}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}



        <div className="flex items-center gap-3 border border-white/10 bg-black/40 rounded-xl px-3 py-2 mb-4">
          <div className="flex flex-col flex-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
              {hasVariants ? "Cantidad variante seleccionada" : "Cantidad a cotizar"}
            </span>
            <span className="text-[10px] font-extrabold text-alacor-amber truncate max-w-[160px]">
              {hasVariants && activeProduct.variantAttributes
                ? Object.values(activeProduct.variantAttributes).filter(v => {
                    if (!v) return false;
                    const u = String(v).toUpperCase().trim();
                    return u !== 'ESTANDAR' && u !== 'ESTÁNDAR' && u !== familyName.toUpperCase().trim();
                  }).map(v => formatAttributeVal(v)).join(' / ') || activeSku
                : activeSku}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setVariantQty(activeSku, activeQty - 1)}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white font-black text-base flex items-center justify-center cursor-pointer border-none transition-all"
          >
            −
          </button>
          <input
            type="number"
            min={0}
            value={activeQty}
            onChange={(ev) => setVariantQty(activeSku, parseInt(ev.target.value) || 0)}
            className="w-10 text-center text-sm font-black text-white bg-transparent border-none outline-none"
          />
          <button
            type="button"
            onClick={() => setVariantQty(activeSku, activeQty + 1)}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white font-black text-base flex items-center justify-center cursor-pointer border-none transition-all"
          >
            +
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-4">
        <button
          onClick={handleAddToCart}
          className={`font-black py-3 rounded-full text-[10px] uppercase tracking-widest transition-all text-center shadow cursor-pointer border-none flex items-center justify-center gap-1.5 ${
            justAdded
              ? "bg-green-500 text-black scale-[1.02]"
              : "bg-alacor-amber text-alacor-dark hover:bg-yellow-400"
          }`}
        >
          {justAdded
            ? "✓ ¡Añadido!"
            : totalFamilyUnits > 0
              ? `🛒 Añadir al Carrito (${totalFamilyUnits})`
              : `🛒 Añadir al Carrito`}
        </button>
        <button
          onClick={() => onViewSheet(activeProduct)}
          className="border border-white/15 bg-white/5 hover:bg-white/10 text-white font-extrabold py-3 rounded-full text-[10px] uppercase tracking-widest transition-all text-center cursor-pointer"
        >
          Ver Ficha
        </button>
      </div>
    </div>
  );
};

export default ProductFamilyCard;
