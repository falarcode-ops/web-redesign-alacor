import { CORALIS_QUOTE_URL } from '../config/api.js';

/**
 * Submits a quote request to CORALIS CRM API and returns the official request number.
 */
export async function submitQuoteRequest({ client, items, notes }) {
  try {
    const formattedNotes = notes ? String(notes).substring(0, 300) : null;
    const estimatedTotal = items.reduce((acc, i) => acc + (i.price || 0) * (i.quantity || 1), 0);

    const payload = {
      client: {
        company_name: client.companyName || null,
        nit: client.nit || 'NATURAL',
        contact_name: client.contactName,
        email: client.email,
        phone: client.phone,
        city: client.city || null,
        address: client.address || null,
        billing_email: client.billingEmail || client.billingAddress || null,
        how_found: client.howFound || null,
        source: 'web_catalog_cart'
      },
      status: 'FORMAL_QUOTE_REQUEST',
      notes: formattedNotes,
      items: items.map(i => ({
        sku: i.sku,
        name: i.name || i.title || 'Producto',
        brand: i.brand || 'N/A',
        quantity: i.quantity || 1,
        unit_price: i.price || 0
      })),
      estimated_total: estimatedTotal
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(CORALIS_QUOTE_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      let errorDetail = 'Error al registrar en Coralis CRM';
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.detail) errorDetail = errorJson.detail;
        else if (errorJson.message) errorDetail = errorJson.message;
      } catch (e) {}
      return { success: false, error: errorDetail };
    }

    const data = await response.json();
    return {
      success: true,
      requestNumber: data.request_number || `SOL-${Date.now().toString().slice(-4)}`,
      requestId: data.request_id || null,
      message: data.message || 'Solicitud de cotización registrada exitosamente en Coralis CRM',
      data
    };
  } catch (err) {
    console.error('Error submitting quote to Coralis:', err);
    return {
      success: false,
      error: err.name === 'AbortError' ? 'Tiempo de espera agotado al conectar con Coralis CRM.' : (err.message || 'Error de conexión')
    };
  }
}

/**
 * Sends background notification for abandoned cart recovery if contact data exists.
 */
export async function submitAbandonedCartQuote({ client, items, notes }) {
  try {
    if (!client?.email && !client?.phone) return;
    const payload = {
      client: {
        company_name: client.companyName || null,
        nit: client.nit || 'NATURAL',
        contact_name: client.contactName || 'Visitante Catálogo',
        email: client.email || null,
        phone: client.phone || null,
        city: client.city || null,
        address: client.address || null,
        billing_email: client.billingEmail || null,
        how_found: client.howFound || null,
        source: 'web_catalog_cart'
      },
      status: 'ABANDONED_CART',
      notes: notes ? String(notes).substring(0, 300) : null,
      items: (items || []).map(i => ({
        sku: i.sku,
        name: i.name || i.title || 'Producto',
        brand: i.brand || 'N/A',
        quantity: i.quantity || 1,
        unit_price: i.price || 0
      })),
      estimated_total: (items || []).reduce((acc, i) => acc + (i.price || 0) * (i.quantity || 1), 0)
    };

    fetch(CORALIS_QUOTE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  } catch (err) {}
}
