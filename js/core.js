/* ------------------------------------
   🔃 UPDATE ALL TYPE + PRODUCT DROPDOWNS
------------------------------------ */
function updateTypeDropdowns() {

  // STOCK — Type dropdown (Add form)
  const ptype = document.querySelector('#ptype');
  if (ptype) {
    ptype.innerHTML =
      `<option value="">Select Type</option>` +
      window.types
        .map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`)
        .join('');
  }

  // STOCK — Filter dropdown
  const filter = document.querySelector('#filterType');
  if (filter) {
    filter.innerHTML =
      `<option value="all">All</option>` +
      window.types
        .map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`)
        .join('');
  }

  // SALES — Type dropdown
  const saleType = document.querySelector('#saleType');
  if (saleType) {
    saleType.innerHTML =
      `<option value="">Select Type</option>` +
      window.types
        .map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`)
        .join('');
  }

  // SALES — Product dropdown (type|||product)
  const saleProduct = document.querySelector('#saleProduct');
  if (saleProduct) {

    const products = window.stock.map(
      s => `${s.type}|||${s.name}`
    );

    const unique = [...new Set(products)];

    saleProduct.innerHTML =
      `<option value="">Select Product</option>` +
      unique
        .map(p => {
          const [type, name] = p.split("|||");
          return `<option value="${p}">${esc(type)} — ${esc(name)}</option>`;
        })
        .join('');
  }

  // WANTING — Type dropdown
  const wantType = document.querySelector('#wantType');
  if (wantType) {
    wantType.innerHTML =
      `<option value="">Select Type</option>` +
      window.types
        .map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`)
        .join('');
  }
}

window.updateTypeDropdowns = updateTypeDropdowns;
