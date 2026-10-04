import React, { useState } from 'react';
import { calculateDIANDV } from '../../utils/helpers.js';

export const SgsstPortalLoginModal = ({ isOpen, onClose }) => {
  const [nit, setNit] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const dv = calculateDIANDV(nit);

  const handleLogin = (e) => {
    e.preventDefault();
    const targetUrl = 'https://coralis.alacor.net/dashboard';
    window.open(targetUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0a1118] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl text-left">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl font-bold bg-transparent border-none cursor-pointer"
        >
          ✕
        </button>
        <span className="text-[10px] font-black tracking-widest text-alacor-amber uppercase block mb-1">
          PORTAL CLIENTES ALACOR SG-SST
        </span>
        <h3 className="text-xl font-black text-white uppercase mb-2">
          Acceso al Sistema de Gestión
        </h3>
        <p className="text-xs text-gray-400 mb-6 font-light leading-relaxed">
          Ingresa con el NIT de tu empresa para gestionar la matriz de riesgos, plan de trabajo y documentación de SST.
        </p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1">
              NIT de la Empresa
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                required
                placeholder="Ej. 900123456"
                value={nit}
                onChange={(e) => setNit(e.target.value.replace(/[^\d]/g, ''))}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-alacor-amber transition-all"
              />
              <div className="flex items-center gap-1 bg-white/10 border border-white/10 px-3 py-2.5 rounded-xl select-none min-w-[55px] justify-center" title="Dígito de Verificación (DV) DIAN generado automáticamente">
                <span className="text-gray-500 text-xs font-bold font-mono">-</span>
                <span className={`text-xs font-bold font-mono ${calculateDIANDV(nit) !== '' ? 'text-alacor-amber' : 'text-gray-500'}`}>
                  {calculateDIANDV(nit) !== '' ? calculateDIANDV(nit) : 'DV'}
                </span>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Contraseña / Token de Acceso
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-alacor-amber transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-alacor-amber text-alacor-dark font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-lg cursor-pointer border-none mt-2"
          >
            Ingresar al Portal SG-SST
          </button>
        </form>
      </div>
    </div>
  );
};

export default SgsstPortalLoginModal;
