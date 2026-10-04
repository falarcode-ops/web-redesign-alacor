import React from 'react';
import { x, hasValidImage, groupProductsIntoFamilies } from '../../utils/helpers.js';

export const OFFICIAL_SUBLINE_ORDER = {
  'SEGURIDAD INDUSTRIAL': [
    'Protección cabeza',
    'Protección facial',
    'Protección visual',
    'Protección auditiva',
    'Protección respiratoria',
    'Protección manual',
    'Protección corporal y dérmica',
    'Protección corporal',
    'Primeros auxilios/Emergencias',
    'Primeros auxilios'
  ],
  'TRABAJO SEGURO EN ALTURAS': [
    'Líneas de vida',
    'Arneses',
    'Eslingas',
    'Mosquetones y conectores',
    'Frenos y bloques',
    'Accesorios'
  ],
  'CALZADO INDUSTRIAL': [
    'Botas de seguridad',
    'Calzado de trabajo',
    'Botas PVC / Caucho',
    'Botas tipo soldador'
  ],
  'DOTACIÓN': [
    'Overoles y trajes',
    'Camisas y pantalones',
    'Impermeables y abrigos',
    'Accesorios de dotación'
  ],
  'BLOQUEO Y ETIQUETADO': [
    'Sistemas LOTO',
    'Candados y bloqueos',
    'Bloqueos eléctricos',
    'Bloqueos de válvulas',
    'Kits y maletines LOTO'
  ],
  'SEÑALIZACIÓN': [
    'Dispositivos reflectivos',
    'Puntos ecológicos y residuos',
    'Mallas y barreras',
    'Cintas de demarcación',
    'Señales viales',
    'Conos y delineadores'
  ]
};

export function SubcategoryGrid({ categoryData, categoryKey }) {
  if (!categoryData || !categoryData.sublines) return null;

  const categoryTitle = (categoryData.title || categoryKey || '').trim().toUpperCase();
  const officialList = OFFICIAL_SUBLINE_ORDER[categoryTitle] || OFFICIAL_SUBLINE_ORDER[categoryKey] || [];

  const sublineKeys = Object.keys(categoryData.sublines).sort((a, b) => {
    const titleA = (categoryData.sublines[a]?.title || a).trim().toLowerCase();
    const titleB = (categoryData.sublines[b]?.title || b).trim().toLowerCase();

    const idxA = officialList.findIndex(
      (o) => o.toLowerCase() === titleA || titleA.includes(o.toLowerCase()) || o.toLowerCase().includes(titleA)
    );
    const idxB = officialList.findIndex(
      (o) => o.toLowerCase() === titleB || titleB.includes(o.toLowerCase()) || o.toLowerCase().includes(titleB)
    );

    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  if (sublineKeys.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {sublineKeys.map((subKey) => {
        const sub = categoryData.sublines[subKey];
        if (!sub) return null;

        const rawProds = sub.products || [];
        const families = groupProductsIntoFamilies(rawProds);
        const validProds = families.filter(
          (p) => hasValidImage(p) && p.isVisible !== false && p.isPublished !== false
        );

        if (validProds.length === 0) return null; // No mostrar subcategorías sin productos activos configurados

        const firstWithFullUrl = validProds.find(
          (p) => p.img && (p.img.startsWith('http://') || p.img.startsWith('https://'))
        );
        const imgPath = validProds.length > 0
          ? (firstWithFullUrl ? firstWithFullUrl.img : validProds[0].img)
          : (sub.img || '');

        return (
          <div
            key={subKey}
            onClick={() => {
              window.location.hash = `#/portafolio/${categoryKey}/${subKey}`;
            }}
            className="group border border-white/5 bg-white/2 hover:border-alacor-amber/50 hover:bg-white/5 rounded-2xl p-6 transition-all duration-300 shadow-xl cursor-pointer flex flex-col justify-between h-full hover:-translate-y-0.5 relative overflow-hidden"
          >
            <div>
              {imgPath ? (
                <div className="w-full h-36 rounded-xl overflow-hidden mb-4 border border-white/5 relative bg-white flex items-center justify-center p-2">
                  <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
                    <div className="absolute w-[100px] h-[100px] rounded-full pedestal-glow blur-xl opacity-20 group-hover:opacity-40 transition-all" />
                  </div>
                  <img
                    src={x(imgPath)}
                    alt={sub.title}
                    loading="lazy"
                    decoding="async"
                    onError={(evt) => {
                      evt.currentTarget.onerror = null;
                      const nextProd = validProds.find(
                        (p) => p.img !== imgPath && p.img && hasValidImage(p)
                      );
                      if (nextProd) {
                        evt.currentTarget.src = x(nextProd.img);
                      }
                    }}
                    className="max-h-[90%] max-w-[90%] object-contain group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ) : null}
              <h4 className="text-sm font-extrabold uppercase text-white mb-3 group-hover:text-alacor-amber transition-all duration-300 tracking-tight">
                {sub.title}
              </h4>
              <p className="text-[11px] text-gray-400 font-light leading-relaxed mb-6">
                {sub.description}
              </p>
            </div>
            <div className="flex items-center justify-between mt-8 border-t border-white/5 pt-4">
              <span className="text-[9px] bg-white/10 text-gray-300 px-2.5 py-1 rounded font-mono uppercase tracking-wider">
                {validProds.length}{' '}
                {validProds.length === 1 ? 'Producto' : 'Productos'}
              </span>
              <span className="text-xs font-bold text-alacor-amber group-hover:translate-x-1 transition-all">
                →
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default SubcategoryGrid;
