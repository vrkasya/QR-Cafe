/* Meet in Coffee - Front-end mock logic (no backend)
   Uses localStorage to simulate: menu, categories, tables, orders, payments.
*/

(function () {
  const STORAGE_KEY = 'mic_demo_v1';

  const DEFAULT_STATE = {
    version: 1,
    cafeName: 'Meet in Coffee',
    categories: [
      { id: 1, nama: 'Kopi' },
      { id: 2, nama: 'Non-Kopi' },
      { id: 3, nama: 'Makanan' },
    ],
    tables: [
      { id: 1, nomor_meja: 'A1', qr_code: 'TABLE_A1' },
      { id: 2, nomor_meja: 'A2', qr_code: 'TABLE_A2' },
      { id: 3, nomor_meja: 'B1', qr_code: 'TABLE_B1' },
    ],
    menus: [
      {
        id: 1,
        nama_menu: 'Es Kopi Susu',
        harga: 18000,
        deskripsi: 'Kopi susu dingin dengan rasa seimbang.',
        gambar: '',
        stok: 50,
        id_kategori: 1,
      },
      {
        id: 2,
        nama_menu: 'Americano',
        harga: 15000,
        deskripsi: 'Kopi hitam menyegarkan.',
        gambar: '',
        stok: 40,
        id_kategori: 1,
      },
      {
        id: 3,
        nama_menu: 'Es Milo',
        harga: 20000,
        deskripsi: 'Minuman cokelat ala milo.',
        gambar: '',
        stok: 35,
        id_kategori: 2,
      },
      {
        id: 4,
        nama_menu: 'Lemon Tea',
        harga: 17000,
        deskripsi: 'Teh lemon segar.',
        gambar: '',
        stok: 30,
        id_kategori: 2,
      },
      {
        id: 5,
        nama_menu: 'Kentang Goreng',
        harga: 22000,
        deskripsi: 'Kentang goreng renyah.',
        gambar: '',
        stok: 45,
        id_kategori: 3,
      },
      {
        id: 6,
        nama_menu: 'Pisang Cokelat',
        harga: 25000,
        deskripsi: 'Pisang dengan topping cokelat.',
        gambar: '',
        stok: 25,
        id_kategori: 3,
      },
    ],
    orders: [],
    payments: [],
    now: 0,
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_STATE);
      const parsed = JSON.parse(raw);
      // quick guard
      if (!parsed || !parsed.version) return structuredClone(DEFAULT_STATE);
      return parsed;
    } catch (e) {
      return structuredClone(DEFAULT_STATE);
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function seedIfNeeded() {
    const state = loadState();
    // If orders empty, keep as-is.
    saveState(state);
    return state;
  }

  function getSelectedTableId() {
    return sessionStorage.getItem('mic_selected_table_id');
  }

  function setSelectedTableId(id) {
    sessionStorage.setItem('mic_selected_table_id', String(id));
  }

  function getSelectedTable() {
    const state = loadState();
    const id = getSelectedTableId();
    if (!id) return null;
    const table = state.tables.find(t => String(t.id) === String(id));
    return table || null;
  }

  function fmtIDR(n) {
    try {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(n);
    } catch {
      return 'Rp ' + Number(n).toLocaleString('id-ID');
    }
  }

  function calcOrderTotal(order) {
    return (order.details || []).reduce((sum, d) => sum + (d.subtotal || 0), 0);
  }

  function createOrderFromCart({ tableId, cart, customerName }) {
    const state = seedIfNeeded();

    const table = state.tables.find(t => String(t.id) === String(tableId));
    if (!table) throw new Error('Table not found');
    if (!cart || !cart.items || cart.items.length === 0) throw new Error('Cart empty');

    const nextId = (state.orders.reduce((m, o) => Math.max(m, o.id_pesanan || 0), 0) || 0) + 1;

    const details = cart.items.map(it => {
      const menu = state.menus.find(m => String(m.id) === String(it.id_menu));
      const jumlah = Number(it.jumlah || 0);
      const subtotal = Number(menu?.harga || 0) * jumlah;
      return {
        id_detail: Date.now() + Math.floor(Math.random() * 1000),
        id_pesanan: nextId,
        id_menu: it.id_menu,
        jumlah,
        subtotal,
      };
    });

    const tanggal = new Date().toISOString();

    const order = {
      id_pesanan: nextId,
      nomor_meja: table.nomor_meja,
      id_meja: table.id,
      tanggal,
      total: details.reduce((s, d) => s + d.subtotal, 0),
      status: 'Menunggu',
      customer_name: customerName || '',
      details,
    };

    state.orders.push(order);
    saveState(state);

    return order;
  }

  function updateOrderStatus(orderId, newStatus) {
    const state = seedIfNeeded();
    const order = state.orders.find(o => String(o.id_pesanan) === String(orderId));
    if (!order) return null;
    order.status = newStatus;
    saveState(state);
    return order;
  }

  function getOrderById(orderId) {
    const state = loadState();
    return state.orders.find(o => String(o.id_pesanan) === String(orderId)) || null;
  }

  function addToCart(menuId, jumlah) {
    const cart = loadCart();
    const q = Number(jumlah || 1);
    const idx = cart.items.findIndex(i => String(i.id_menu) === String(menuId));
    if (idx >= 0) {
      cart.items[idx].jumlah += q;
    } else {
      cart.items.push({ id_menu: menuId, jumlah: q });
    }
    saveCart(cart);
    return cart;
  }

  function setCartQty(menuId, jumlah) {
    const cart = loadCart();
    const q = Number(jumlah);
    const idx = cart.items.findIndex(i => String(i.id_menu) === String(menuId));
    if (idx < 0) return cart;
    if (q <= 0) {
      cart.items.splice(idx, 1);
    } else {
      cart.items[idx].jumlah = q;
    }
    saveCart(cart);
    return cart;
  }

  function removeFromCart(menuId) {
    const cart = loadCart();
    cart.items = (cart.items || []).filter(i => String(i.id_menu) !== String(menuId));
    saveCart(cart);
    return cart;
  }

  function clearCart() {
    saveCart({ items: [] });
  }

  function loadCart() {
    try {
      const raw = localStorage.getItem('mic_cart_v1');
      if (!raw) return { items: [] };
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.items)) return { items: [] };
      return parsed;
    } catch {
      return { items: [] };
    }
  }

  function saveCart(cart) {
    localStorage.setItem('mic_cart_v1', JSON.stringify(cart));
  }

  function cartWithComputedTotals() {
    const state = loadState();
    const cart = loadCart();
    const items = (cart.items || []).map(it => {
      const menu = state.menus.find(m => String(m.id) === String(it.id_menu));
      const harga = Number(menu?.harga || 0);
      const subtotal = harga * Number(it.jumlah || 0);
      return {
        id_menu: it.id_menu,
        jumlah: Number(it.jumlah || 0),
        harga,
        subtotal,
        nama_menu: menu?.nama_menu || 'Menu',
        id_kategori: menu?.id_kategori,
        gambar: menu?.gambar || '',
      };
    });
    const total = items.reduce((s, i) => s + i.subtotal, 0);
    return { items, total };
  }

  // Admin helpers
  function getOrders() {
    return loadState().orders;
  }

  function getPendingOrdersForTable(tableId) {
    const table = loadSelectedTableOrNull(tableId);
    if (!table) return [];
    const orders = loadState().orders;
    return orders
      .filter(o => String(o.id_meja) === String(table.id))
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  }

  function loadSelectedTableOrNull(tableId) {
    const state = loadState();
    const id = tableId || getSelectedTableId();
    if (!id) return null;
    return state.tables.find(t => String(t.id) === String(id)) || null;
  }

  function getCategories() {
    return loadState().categories;
  }

  function getTables() {
    return loadState().tables;
  }

  function getMenus() {
    return loadState().menus;
  }

  function getMenuById(id) {
    return loadState().menus.find(m => String(m.id) === String(id)) || null;
  }

  function resetDemoData() {
    saveState(structuredClone(DEFAULT_STATE));
    clearCart();
    sessionStorage.removeItem('mic_selected_table_id');
  }

  // Expose for HTML pages
  window.MIC = {
    fmtIDR,
    seedIfNeeded,
    getSelectedTable,
    setSelectedTableId,
    getCategories,
    getTables,
    getMenus,
    getMenuById,
    addToCart,
    setCartQty,
    removeFromCart,
    clearCart,
    cartWithComputedTotals,
    createOrderFromCart,
    getOrders,
    getPendingOrdersForTable,
    updateOrderStatus,
    getOrderById,
    resetDemoData,
  };
})();

