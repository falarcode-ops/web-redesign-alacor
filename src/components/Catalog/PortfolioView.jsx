import React from 'react';
import { SubcategoryGrid } from './SubcategoryGrid.jsx';
import { ProductFamilyCard } from './ProductFamilyCard.jsx';
import { x, hasValidImage, groupProductsIntoFamilies } from '../../utils/helpers.js';

export function PortfolioView({
  catalog = {},
  selectedCategory = null,
  selectedSubcategory = null,
  searchQuery = '',
  setSearchQuery = () => {},
  selectedBrand = 'ALL',
  setSelectedBrand = () => {},
  searchResults = { matchedProducts: [], groupedProducts: [], categoryCounts: {} },
  highlightedFamilyId = null,
  hideNoImg = false,
  hideIncomplete = false,
  hasImage = () => true,
  isComplete = () => true,
  onViewSheet = () => {},
  onAddToCart = () => {},
  onQuoteCategory = () => {}
}) {
  const BRANDS = ['ALL', 'STEELPRO', 'ORBIT', 'INSAFE', 'KONDOR', 'BATA', 'BRAHMA'];

  const OFFICIAL_ORDER = [
    'SEGURIDAD INDUSTRIAL',
    'TRABAJO SEGURO EN ALTURAS',
    'CALZADO INDUSTRIAL',
    'DOTACIÓN',
    'BLOQUEO Y ETIQUETADO',
    'SEÑALIZACIÓN'
  ];

  // Renderizar estricta y únicamente las 6 Líneas Maestras Oficiales
  const mainCategoryKeys = OFFICIAL_ORDER.filter(
    (k) => catalog[k] && catalog[k].title
  );

  const renderIcon = (iconVal, sizeClasses = 'w-7 h-7') => {
    if (!iconVal) return null;
    if (typeof iconVal === 'string' && (iconVal.startsWith('/') || iconVal.startsWith('http') || iconVal.includes('.'))) {
      return (
        <img
          src={iconVal}
          alt="Icono de categoría"
          className={`${sizeClasses} object-contain`}
          loading="lazy"
        />
      );
    }

    const iconKey = String(iconVal).toLowerCase().trim();

    if (iconKey.includes('shield') || iconKey.includes('seguridad industrial') || iconKey === '🛡️') {
      return (
        <svg className={`${sizeClasses} text-alacor-amber fill-none stroke-current`} viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    }
    if (iconKey.includes('anchor') || iconKey.includes('altura') || iconKey === '🧗') {
      return (
        <svg className={`${sizeClasses} text-alacor-amber fill-none stroke-current`} viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="3" />
          <line x1="12" y1="22" x2="12" y2="8" />
          <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
        </svg>
      );
    }
    if (iconKey.includes('footprint') || iconKey.includes('calzado') || iconKey.includes('bota') || iconKey === '🥾') {
      return (
        <svg className={`${sizeClasses} text-alacor-amber fill-none stroke-current`} viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 16v-2.38C4 11.5 2.97 8.3 3 8c.03-.3 1.05-1.5 2-2 1.05-.55 2.5-.55 3.5 0 1 .5 2 1.7 2 2v8c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2z" />
          <path d="M14 20v-2.38c0-2.12-1.03-5.32-1-5.62.03-.3 1.05-1.5 2-2 1.05-.55 2.5-.55 3.5 0 1 .5 2 1.7 2 2v8c0 1.1-.9 2-2 2h-2.5c-1.1 0-2-.9-2-2z" />
        </svg>
      );
    }
    if (iconKey.includes('alert') || iconKey.includes('triangle') || iconKey.includes('señal') || iconKey === '⚠️') {
      return (
        <svg className={`${sizeClasses} text-alacor-amber fill-none stroke-current`} viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    }
    if (iconKey.includes('lock') || iconKey.includes('bloqueo') || iconKey === '🔒') {
      return (
        <svg className={`${sizeClasses} text-alacor-amber fill-none stroke-current`} viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );
    }
    if (iconKey.includes('shirt') || iconKey.includes('dotacion') || iconKey.includes('dotación') || iconKey === '👔') {
      return (
        <svg className={`${sizeClasses} text-alacor-amber fill-none stroke-current`} viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
        </svg>
      );
    }

    return (
      <span className={sizeClasses.includes('w-7') ? 'text-2xl' : 'text-base'}>
        {iconVal}
      </span>
    );
  };

  return (
    <section id="catalogo-section" className="relative py-24 bg-alacor-black border-t border-white/5 scroll-mt-20">
      <div className="container mx-auto px-6">
        {/* Encabezado del Portafolio */}
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-bold tracking-widest text-alacor-amber uppercase mb-2 block">
            NUESTROS PRODUCTOS
          </span>
          <h2 className="text-3xl lg:text-4xl font-black uppercase text-white tracking-tight">
            PORTAFOLIO DE SEGURIDAD INDUSTRIAL
          </h2>
          <p className="text-gray-400 mt-4 font-light text-sm md:text-base">
            Soluciones de protección de alto desempeño para los sectores de energía, minería, construcción e industria manufacturera. Consulte especificaciones técnicas, cotice en línea y garantice la máxima seguridad de su equipo de trabajo.
          </p>
        </div>

        {/* Barra de Búsqueda Global a Ancho Completo */}
        <div className="mb-10 p-3 sm:p-4 bg-white/2 border border-white/5 rounded-2xl backdrop-blur-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Buscar producto por nombre, referencia (Ej. AC502316), marca (Steelpro, Kondor, Insafe...) o características..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full px-5 py-3.5 pl-12 pr-10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-alacor-amber/50 transition-all font-light"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              🔍
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs bg-transparent border-none cursor-pointer p-1"
                aria-label="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* MODO BÚSQUEDA GLOBAL: Si hay texto en el buscador y no estamos en una subcategoría específica */}
        {searchQuery.trim().length > 0 && selectedSubcategory === null && (
          <div>
            {(() => {
              const q = searchQuery.toLowerCase().trim();
              let allCatalogProducts = [];

              // Recolectar productos de las líneas activas
              mainCategoryKeys.forEach((catKey) => {
                const category = catalog[catKey];
                if (category && category.sublines) {
                  Object.keys(category.sublines).forEach((subKey) => {
                    const subline = category.sublines[subKey];
                    if (subline && Array.isArray(subline.products)) {
                      subline.products.forEach((prod) => {
                        allCatalogProducts.push({
                          ...prod,
                          catKey,
                          subKey,
                          catTitle: category.title,
                          subTitle: subline.title,
                        });
                      });
                    }
                  });
                }
              });

              // Agrupar en familias y filtrar estrictamente por imágenes válidas
              const families = groupProductsIntoFamilies(allCatalogProducts);
              const searchMatches = families.filter((p) => {
                if (!p || p.isVisible === false || p.isPublished === false) return false;
                if (!hasValidImage(p)) return false;

                // Filtro de Marca si está seleccionada
                if (selectedBrand && selectedBrand !== 'ALL') {
                  const productBrand = (p.brand || '').toUpperCase();
                  if (productBrand !== selectedBrand.toUpperCase()) return false;
                }

                // Match de Búsqueda
                const matchTitle = (p.title || p.parentName || '').toLowerCase().includes(q);
                const matchRef = (p.ref || p.sku || p.familyKey || '').toLowerCase().includes(q);
                const matchBrand = (p.brand || '').toLowerCase().includes(q);
                const matchDesc = (p.description || '').toLowerCase().includes(q);
                const matchVariants = Array.isArray(p.variants) && p.variants.some((v) =>
                  (v.title || '').toLowerCase().includes(q) ||
                  (v.sku || '').toLowerCase().includes(q) ||
                  (v.ref || '').toLowerCase().includes(q) ||
                  (v.name || '').toLowerCase().includes(q)
                );

                return matchTitle || matchRef || matchBrand || matchDesc || matchVariants;
              });

              return (
                <div>
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 tracking-widest uppercase block mb-1">
                        RESULTADOS DE BÚSQUEDA
                      </span>
                      <h3 className="text-xl font-black text-white uppercase">
                        Mostrando {searchMatches.length} {searchMatches.length === 1 ? 'producto activo' : 'productos activos'} para "{searchQuery}"
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-xs text-alacor-amber hover:text-yellow-400 font-bold uppercase tracking-wider bg-transparent border-none cursor-pointer"
                    >
                      ✕ Limpiar Búsqueda
                    </button>
                  </div>

                  {searchMatches.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/2 max-w-md mx-auto">
                      <span className="text-4xl block mb-4" aria-hidden="true">
                        🔍
                      </span>
                      <h5 className="text-white font-bold uppercase mb-1">
                        Sin Coincidencias
                      </h5>
                      <p className="text-xs text-gray-400">
                        No se encontraron productos activos con imagen configurada que coincidan con su búsqueda.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                      {searchMatches.map((productGroup) => (
                        <ProductFamilyCard
                          key={productGroup.id || productGroup.familyKey || productGroup.ref}
                          family={productGroup}
                          onViewSheet={onViewSheet}
                          onAddToCart={onAddToCart}
                          showPrices={false}
                          isHighlighted={Boolean(
                            highlightedFamilyId &&
                            (highlightedFamilyId === productGroup.id ||
                             highlightedFamilyId === productGroup.familyKey ||
                             highlightedFamilyId === `fam_${productGroup.familyKey}` ||
                             highlightedFamilyId === productGroup.ref)
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* NIVEL 1: Selección de Línea Principal */}
        {selectedCategory === null && searchQuery.trim().length === 0 && (
          <div>
            <span className="text-[10px] font-bold text-gray-500 tracking-widest uppercase block mb-6">
              SELECCIONE UNA LÍNEA DE INTERÉS
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {mainCategoryKeys.map((catKey) => {
                const cat = catalog[catKey];
                if (!cat) return null;
                return (
                  <div
                    key={catKey}
                    onClick={() => {
                      window.location.hash = `#/portafolio/${catKey}`;
                    }}
                    className="group border border-white/5 bg-white/2 hover:border-alacor-amber/50 hover:bg-white/5 rounded-3xl p-6 transition-all duration-300 shadow-2xl cursor-pointer flex flex-col justify-between h-full hover:-translate-y-1 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-radial-gradient-vignette pedestal-glow opacity-10 pointer-events-none" />
                    <div>
                      {cat.img ? (
                        <div className="w-full aspect-[16/10] sm:aspect-[16/9] md:h-56 rounded-2xl overflow-hidden mb-6 border border-white/10 relative bg-black/40 shadow-inner">
                          <img
                            src={x(cat.img)}
                            alt={cat.title}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          <div className="absolute top-3 left-3 w-8 h-8 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-sm">
                            {renderIcon(cat.icon, 'w-4 h-4')}
                          </div>
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-8 group-hover:bg-alacor-amber group-hover:text-alacor-dark transition-all duration-300">
                          {renderIcon(cat.icon, 'w-7 h-7')}
                        </div>
                      )}

                      <h3 className="text-xl md:text-2xl font-black uppercase text-white mb-4 group-hover:text-alacor-amber transition-all duration-300 tracking-tight leading-tight">
                        {cat.title}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-400 font-light leading-relaxed mb-8">
                        {cat.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-alacor-amber uppercase group-hover:gap-3 transition-all duration-300 mt-4">
                      <span>Explorar Línea Completa</span>
                      <span>→</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* NIVEL 2: Selección de Subcategoría */}
        {selectedCategory !== null && selectedSubcategory === null && searchQuery.trim().length === 0 && (
          <div>
            {/* Breadcrumbs y Botón Volver */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-white/10">
              <nav aria-label="Migas de pan" className="flex items-center gap-2 text-xs text-gray-400 tracking-wider">
                <button
                  type="button"
                  onClick={() => {
                    window.location.hash = '#/portafolio';
                  }}
                  className="hover:text-white cursor-pointer transition-colors bg-transparent border-none p-0 text-xs text-gray-400"
                >
                  Portafolio
                </button>
                <span aria-hidden="true">/</span>
                <span className="text-alacor-amber font-semibold uppercase">
                  {catalog[selectedCategory]?.title || 'Categoría'}
                </span>
              </nav>

              <button
                type="button"
                onClick={() => {
                  window.location.hash = '#/portafolio';
                }}
                className="flex items-center gap-2 border border-white/15 bg-white/5 hover:bg-white/10 text-white font-extrabold px-5 py-2.5 rounded-full text-[10px] uppercase tracking-widest transition-all cursor-pointer active:scale-95"
              >
                ← Volver a Portafolio
              </button>
            </div>

            {/* Cuadrícula de Subcategorías Desacoplada */}
            <span className="text-[10px] font-bold text-gray-500 tracking-widest uppercase block mb-6">
              SELECCIONE UNA SUBCATEGORÍA DE INTERÉS
            </span>

            <SubcategoryGrid
              categoryData={catalog[selectedCategory]}
              categoryKey={selectedCategory}
            />
          </div>
        )}

        {/* NIVEL 3: Cuadrícula de Productos Maestros con Variantes COREPRICE */}
        {selectedCategory !== null && selectedSubcategory !== null && (
          <div>
            {/* Breadcrumbs y Botón Volver */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-white/10">
              <nav aria-label="Migas de pan" className="flex items-center gap-2 text-xs text-gray-400 tracking-wider">
                <button
                  type="button"
                  onClick={() => {
                    window.location.hash = '#/portafolio';
                  }}
                  className="hover:text-white cursor-pointer transition-colors bg-transparent border-none p-0 text-xs text-gray-400"
                >
                  Portafolio
                </button>
                <span aria-hidden="true">/</span>
                <button
                  type="button"
                  onClick={() => {
                    window.location.hash = `#/portafolio/${selectedCategory}`;
                  }}
                  className="hover:text-white cursor-pointer uppercase transition-colors bg-transparent border-none p-0 text-xs text-gray-400"
                >
                  {catalog[selectedCategory]?.title || 'Categoría'}
                </button>
                <span aria-hidden="true">/</span>
                <span className="text-alacor-amber font-semibold uppercase">
                  {catalog[selectedCategory]?.sublines?.[selectedSubcategory]?.title || 'Subcategoría'}
                </span>
              </nav>

              <button
                type="button"
                onClick={() => {
                  window.location.hash = `#/portafolio/${selectedCategory}`;
                }}
                className="flex items-center gap-2 border border-white/15 bg-white/5 hover:bg-white/10 text-white font-extrabold px-5 py-2.5 rounded-full text-[10px] uppercase tracking-widest transition-all cursor-pointer active:scale-95"
              >
                ← Volver a Subcategorías
              </button>
            </div>

            {/* Renderizado de Familias de Productos con Variantes de COREPRICE */}
            {(() => {
              const allRawProducts = catalog[selectedCategory]?.sublines?.[selectedSubcategory]?.products || [];
              const families = groupProductsIntoFamilies(allRawProducts);
              
              // Filtrado estricto: activo, visibilidad, imagen configurada, marca y búsqueda
              const filteredProducts = families.filter((p) => {
                if (!p || p.isVisible === false || p.isPublished === false) return false;
                if (!hasValidImage(p)) return false;
                
                // Filtro de Marca si está seleccionada
                if (selectedBrand && selectedBrand !== 'ALL') {
                  const productBrand = (p.brand || '').toUpperCase();
                  if (productBrand !== selectedBrand.toUpperCase()) return false;
                }

                // Filtro de Búsqueda si está activo dentro de la subcategoría
                if (searchQuery && searchQuery.trim().length > 0) {
                  const q = searchQuery.toLowerCase().trim();
                  const matchTitle = (p.title || p.parentName || '').toLowerCase().includes(q);
                  const matchRef = (p.ref || p.sku || p.familyKey || '').toLowerCase().includes(q);
                  const matchBrand = (p.brand || '').toLowerCase().includes(q);
                  const matchDesc = (p.description || '').toLowerCase().includes(q);
                  const matchVariants = Array.isArray(p.variants) && p.variants.some(v => 
                    (v.title || '').toLowerCase().includes(q) ||
                    (v.sku || '').toLowerCase().includes(q) ||
                    (v.ref || '').toLowerCase().includes(q) ||
                    (v.name || '').toLowerCase().includes(q)
                  );
                  if (!matchTitle && !matchRef && !matchBrand && !matchDesc && !matchVariants) return false;
                }

                return true;
              });

              if (filteredProducts.length === 0) {
                return (
                  <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/2 max-w-md mx-auto">
                    <span className="text-4xl block mb-4" aria-hidden="true">
                      📦
                    </span>
                    <h5 className="text-white font-bold uppercase mb-1">
                      Sin Productos Activos
                    </h5>
                    <p className="text-xs text-gray-400">
                      No hay productos activos con imagen configurada en esta subcategoría que coincidan con los filtros aplicados.
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                  {filteredProducts.map((productGroup) => (
                    <ProductFamilyCard
                      key={productGroup.id || productGroup.familyKey || productGroup.ref}
                      family={productGroup}
                      onViewSheet={onViewSheet}
                      onAddToCart={onAddToCart}
                      showPrices={false}
                      isHighlighted={Boolean(
                        highlightedFamilyId &&
                        (highlightedFamilyId === productGroup.id ||
                         highlightedFamilyId === productGroup.familyKey ||
                         highlightedFamilyId === `fam_${productGroup.familyKey}` ||
                         highlightedFamilyId === productGroup.ref)
                      )}
                    />
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </section>
  );
}

export default PortfolioView;
