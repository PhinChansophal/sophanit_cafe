import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'sophanitCafeMenuData';
const BRAND_KEY = 'sophanitCafeBrand';
const API_MENU = '/api/menu';
const API_BRAND = '/api/brand';
const EDIT_PASSWORD = '123456';
const abaQr = new URL('../image/ABA.png', import.meta.url).href;
const acQr = new URL('../image/AC.png', import.meta.url).href;

const defaultBrand = {
  name: 'Sophanit Cafe',
  caption: 'Fresh drinks • Fast order • Cozy vibes',
};

const categoryNames = {
  cafe: 'Cafe',
  milktea: 'Milk Tea',
  drink: 'Drink',
  hot: 'Hot',
};

function createProductImage(name, category) {
  const colors = {
    cafe: '#3f2a1d',
    milktea: '#8c4b2b',
    drink: '#2b6a4f',
    hot: '#a3552f',
  };
  const color = colors[category] || '#3f2a1d';
  const safeName = name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
      <rect width="300" height="200" rx="24" fill="${color}"/>
      <circle cx="235" cy="62" r="32" fill="rgba(255,255,255,0.16)"/>
      <rect x="42" y="50" width="144" height="98" rx="18" fill="rgba(255,255,255,0.18)"/>
      <path d="M82 96c18-24 54-24 72 0" stroke="#fff" stroke-width="8" stroke-linecap="round" fill="none"/>
      <path d="M80 90h76" stroke="#fff" stroke-width="8" stroke-linecap="round"/>
      <text x="150" y="166" text-anchor="middle" font-family="Segoe UI, Arial" font-size="24" fill="white">${safeName}</text>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const defaultMenuData = [
  { id: 1, name: 'Espresso', category: 'cafe', price: '$2.00', desc: 'Bold and rich single-origin espresso shot.', liked: false, image: createProductImage('Espresso', 'cafe') },
  { id: 2, name: 'Cappuccino', category: 'cafe', price: '$3.20', desc: 'Velvety espresso with steamed milk and foam.', liked: false, image: createProductImage('Cappuccino', 'cafe') },
  { id: 3, name: 'Latte', category: 'cafe', price: '$3.50', desc: 'Smooth espresso balanced with creamy milk.', liked: false, image: createProductImage('Latte', 'cafe') },
  { id: 4, name: 'Caramel Macchiato', category: 'cafe', price: '$3.90', desc: 'Sweet caramel touch over fresh espresso.', liked: false, image: createProductImage('Caramel Macchiato', 'cafe') },
  { id: 5, name: 'Classic Milk Tea', category: 'milktea', price: '$3.50', desc: 'Creamy black tea with rich milk flavor.', liked: false, image: createProductImage('Classic Milk Tea', 'milktea') },
  { id: 6, name: 'Taro Milk Tea', category: 'milktea', price: '$4.00', desc: 'Soft purple taro blended into sweet milk tea.', liked: false, image: createProductImage('Taro Milk Tea', 'milktea') },
  { id: 7, name: 'Matcha Latte', category: 'milktea', price: '$4.20', desc: 'Premium green tea whisked with smooth milk.', liked: false, image: createProductImage('Matcha Latte', 'milktea') },
  { id: 8, name: 'Iced Lemon Tea', category: 'drink', price: '$2.80', desc: 'Refreshing citrus tea served chilled.', liked: false, image: createProductImage('Iced Lemon Tea', 'drink') },
  { id: 9, name: 'Fruit Smoothie', category: 'drink', price: '$4.50', desc: 'Cold blended fruit beverage with natural sweetness.', liked: false, image: createProductImage('Fruit Smoothie', 'drink') },
  { id: 10, name: 'Hot Chocolate', category: 'hot', price: '$3.20', desc: 'Warm cocoa drink topped with whipped cream.', liked: false, image: createProductImage('Hot Chocolate', 'hot') },
  { id: 11, name: 'Ginger Tea', category: 'hot', price: '$2.60', desc: 'Comforting herbal tea with fresh ginger.', liked: false, image: createProductImage('Ginger Tea', 'hot') },
  { id: 12, name: 'Americano', category: 'cafe', price: '$2.80', desc: 'Espresso shots mellowed with hot water.', liked: false, image: createProductImage('Americano', 'cafe') },
];

function loadBrandData() {
  try {
    const stored = window.localStorage.getItem(BRAND_KEY);
    if (!stored) return { ...defaultBrand };
    return JSON.parse(stored);
  } catch {
    return { ...defaultBrand };
  }
}

function saveBrandDataLocal(brand) {
  window.localStorage.setItem(BRAND_KEY, JSON.stringify(brand));
}

function loadMenuData() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultMenuData.map((item) => ({ ...item }));

    const parsed = JSON.parse(stored);
    return parsed.map((item) => ({
      ...item,
      image: item.image || createProductImage(item.name, item.category),
      liked: Boolean(item.liked),
    }));
  } catch {
    return defaultMenuData.map((item) => ({ ...item }));
  }
}

function saveMenuDataLocal(menu) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(menu));
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function normalizeMenuData(menu) {
  return menu.map((item) => ({
    ...item,
    image: item.image || createProductImage(item.name, item.category),
    liked: Boolean(item.liked),
  }));
}

async function fetchServerData(url, fallback) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Server response was not ok');
    return await response.json();
  } catch {
    return fallback;
  }
}

function parsePrice(price) {
  const normalized = String(price).replace(/[^0-9.-]+/g, '');
  const numeric = parseFloat(normalized);
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatCurrency(value) {
  return `$${value.toFixed(2)}`;
}

function App() {
  const [menuData, setMenuData] = useState([]);
  const [brandData, setBrandData] = useState(defaultBrand);
  const [brandName, setBrandName] = useState(defaultBrand.name);
  const [brandCaption, setBrandCaption] = useState(defaultBrand.caption);
  const [brandTelegram, setBrandTelegram] = useState('');
  const [brandPhone, setBrandPhone] = useState('');
  const [brandLocation, setBrandLocation] = useState('');
  const [brandFacebook, setBrandFacebook] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCategory, setCurrentCategory] = useState('all');
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [currentOrderItem, setCurrentOrderItem] = useState(null);
  const [selectedSize, setSelectedSize] = useState('Regular');
  const [selectedSweetness, setSelectedSweetness] = useState('Normal');
  const [cartItems, setCartItems] = useState([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTarget, setAuthTarget] = useState(null);
  const [authItem, setAuthItem] = useState(null);
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editItemId, setEditItemId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editCategory, setEditCategory] = useState('cafe');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addPrice, setAddPrice] = useState('');
  const [addCaption, setAddCaption] = useState('');
  const [addImage, setAddImage] = useState('');
  const [addCategory, setAddCategory] = useState('cafe');
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    async function initializeData() {
      const localMenu = loadMenuData();
      const localBrand = loadBrandData();

      setMenuData(localMenu);
      setBrandData(localBrand);
      setBrandName(localBrand.name || defaultBrand.name);
      setBrandCaption(localBrand.caption || defaultBrand.caption);
      setBrandTelegram(localBrand.telegram || '');
      setBrandPhone(localBrand.phone || '');
      setBrandLocation(localBrand.location || '');
      setBrandFacebook(localBrand.facebook || '');

      const serverMenu = await fetchServerData(API_MENU, null);
      if (Array.isArray(serverMenu)) {
        const normalizedMenu = normalizeMenuData(serverMenu);
        setMenuData(normalizedMenu);
        saveMenuDataLocal(normalizedMenu);
      }

      const serverBrand = await fetchServerData(API_BRAND, null);
      if (serverBrand && typeof serverBrand === 'object') {
        setBrandData(serverBrand);
        setBrandName(serverBrand.name || defaultBrand.name);
        setBrandCaption(serverBrand.caption || defaultBrand.caption);
        setBrandTelegram(serverBrand.telegram || '');
        setBrandPhone(serverBrand.phone || '');
        setBrandLocation(serverBrand.location || '');
        setBrandFacebook(serverBrand.facebook || '');
        saveBrandDataLocal(serverBrand);
      }

      if (!Array.isArray(serverMenu) || !serverBrand || typeof serverBrand !== 'object') {
        setServerError('Server unavailable. App continues using local data until the backend reconnects.');
      }
    }

    initializeData();
  }, []);

  async function persistMenuData(menu) {
    setMenuData(menu);
    saveMenuDataLocal(menu);

    try {
      const response = await fetch(API_MENU, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menu),
      });

      if (!response.ok) {
        throw new Error('Menu save failed');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error('Menu save failed');
      }

      setServerError('');
    } catch {
      setServerError('Unable to save menu to server. Changes remain locally until the backend is available.');
    }
  }

  async function persistBrandData(brand) {
    setBrandData(brand);
    setBrandName(brand.name || defaultBrand.name);
    setBrandCaption(brand.caption || defaultBrand.caption);
    saveBrandDataLocal(brand);

    try {
      const response = await fetch(API_BRAND, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brand),
      });

      if (!response.ok) {
        throw new Error('Brand save failed');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error('Brand save failed');
      }

      setServerError('');
    } catch {
      setServerError('Unable to save brand to server. Changes remain locally until the backend is available.');
    }
  }

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === STORAGE_KEY) {
        try {
          const parsed = JSON.parse(event.newValue || '[]');
          setMenuData(parsed.map((item) => ({
            ...item,
            image: item.image || createProductImage(item.name, item.category),
            liked: Boolean(item.liked),
          })));
        } catch {
          // ignore malformed storage data
        }
      }

      if (event.key === BRAND_KEY) {
        try {
          const parsed = JSON.parse(event.newValue || '{}');
          setBrandData(parsed);
          setBrandName(parsed.name || defaultBrand.name);
          setBrandCaption(parsed.caption || defaultBrand.caption);
          setBrandTelegram(parsed.telegram || '');
          setBrandPhone(parsed.phone || '');
          setBrandLocation(parsed.location || '');
          setBrandFacebook(parsed.facebook || '');
        } catch {
          // ignore malformed storage data
        }
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const filteredGroups = useMemo(() => {
    const groups = {};
    menuData.forEach((item) => {
      const matchesCategory = currentCategory === 'all' || item.category === currentCategory;
      const searchableText = `${item.name} ${item.desc}`.toLowerCase();
      const matchesSearch = searchableText.includes(searchQuery.trim().toLowerCase());
      if (matchesCategory && matchesSearch) {
        if (!groups[item.category]) groups[item.category] = [];
        groups[item.category].push(item);
      }
    });
    return groups;
  }, [menuData, currentCategory, searchQuery]);

  const matchCount = Object.values(filteredGroups).reduce((sum, items) => sum + items.length, 0);

  function openModal(item) {
    setCurrentOrderItem(item);
    setSelectedSize('Regular');
    setSelectedSweetness('Normal');
    setIsChoiceModalOpen(true);
  }

  function closeModal() {
    setCurrentOrderItem(null);
    setIsChoiceModalOpen(false);
  }

  function confirmOrderSelection() {
    if (!currentOrderItem) return;
    const priceValue = parsePrice(currentOrderItem.price) + (selectedSize === 'Large' ? 0.5 : 0);
    setCartItems((prev) => [
      ...prev,
      {
        name: currentOrderItem.name,
        size: selectedSize,
        sweetness: selectedSweetness,
        priceValue,
      },
    ]);
    closeModal();
    setIsPaymentModalOpen(true);
  }

  function openEditModal(item) {
    setAuthTarget('item');
    setAuthItem(item);
    setAuthPassword('');
    setAuthError('');
    setIsAuthModalOpen(true);
  }

  function openBrandAuthModal() {
    setAuthTarget('brand');
    setAuthItem(null);
    setAuthPassword('');
    setAuthError('');
    setIsAuthModalOpen(true);
  }

  function closeAuthModal() {
    setIsAuthModalOpen(false);
    setAuthTarget(null);
    setAuthItem(null);
    setAuthPassword('');
    setAuthError('');
  }

  function handleAuthSubmit() {
    if (authPassword.trim() !== EDIT_PASSWORD) {
      setAuthError('Incorrect password');
      return;
    }

    if (authTarget === 'item' && authItem) {
      setEditItemId(authItem.id);
      setEditName(authItem.name);
      setEditPrice(authItem.price);
      setEditCaption(authItem.desc);
      setEditImage(authItem.image || '');
      setEditCategory(authItem.category);
      setIsEditModalOpen(true);
    }

    if (authTarget === 'brand') {
      setBrandName(brandData.name || defaultBrand.name);
      setBrandCaption(brandData.caption || defaultBrand.caption);
      setBrandTelegram(brandData.telegram || '');
      setBrandPhone(brandData.phone || '');
      setBrandLocation(brandData.location || '');
      setBrandFacebook(brandData.facebook || '');
      setIsBrandModalOpen(true);
    }

    closeAuthModal();
  }

  function closeEditModal() {
    setIsEditModalOpen(false);
  }

  function saveItemEdit() {
    if (!editItemId) return;
    const updatedMenu = menuData.map((item) => (item.id === editItemId
      ? {
          ...item,
          name: editName.trim() || item.name,
          price: editPrice.trim() || item.price,
          desc: editCaption.trim() || item.desc,
          category: editCategory || item.category,
          image: editImage.trim() || createProductImage(editName.trim() || item.name, editCategory || item.category),
        }
      : item));
    persistMenuData(updatedMenu);
    closeEditModal();
  }

  async function handleImageUpload(event, setter) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setter(dataUrl);
    } catch {
      // ignore unsupported or failed image reads
    }
  }

  function openAddModal() {
    setAddName('');
    setAddPrice('');
    setAddCaption('');
    setAddImage('');
    setAddCategory('cafe');
    setIsAddModalOpen(true);
  }

  function closeAddModal() {
    setIsAddModalOpen(false);
  }

  function saveNewItem() {
    const newItem = {
      id: Date.now(),
      name: addName.trim() || 'New Item',
      category: addCategory || 'cafe',
      price: addPrice.trim() || '$0.00',
      desc: addCaption.trim() || 'Freshly added menu item.',
      liked: false,
      image: addImage.trim() || createProductImage(addName.trim() || 'New Item', addCategory || 'cafe'),
    };
    persistMenuData([...menuData, newItem]);
    closeAddModal();
  }

  function openBrandModal() {
    openBrandAuthModal();
  }

  function closeBrandModal() {
    setIsBrandModalOpen(false);
  }

  function saveBrandEdit() {
    const updatedBrand = {
      name: brandName.trim() || defaultBrand.name,
      caption: brandCaption.trim() || defaultBrand.caption,
      telegram: brandTelegram.trim() || '',
      phone: brandPhone.trim() || '',
      location: brandLocation.trim() || '',
      facebook: brandFacebook.trim() || '',
    };
    persistBrandData(updatedBrand);
    closeBrandModal();
  }

  function deleteMenuItem(itemId) {
    persistMenuData(menuData.filter((item) => item.id !== itemId));
  }

  function toggleLike(itemId) {
    persistMenuData(menuData.map((item) => (item.id === itemId ? { ...item, liked: !item.liked } : item)));
  }

  function closePaymentModal() {
    setIsPaymentModalOpen(false);
  }

  function getCartTotal() {
    return cartItems.reduce((sum, item) => sum + item.priceValue, 0);
  }

  return (
    <>
      <header>
        <h1>{brandData.name || defaultBrand.name}</h1>
        <p>{brandData.caption || defaultBrand.caption}</p>
      </header>
      {serverError && <div className="server-error">{serverError}</div>}

      <div className="controls-wrapper">
        <div className="search-row">
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-bar"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="button" className="action-btn add-btn" onClick={openAddModal}>
            Add Item
          </button>
          <button type="button" className="action-btn secondary-btn" onClick={openBrandModal}>
            Edit Brand
          </button>
        </div>

        <div className="category-tabs">
          <button type="button" className={`tab ${currentCategory === 'all' ? 'active' : ''}`} onClick={() => setCurrentCategory('all')}>
            All Items
          </button>
          <button type="button" className={`tab ${currentCategory === 'cafe' ? 'active' : ''}`} onClick={() => setCurrentCategory('cafe')}>
            Cafe
          </button>
          <button type="button" className={`tab ${currentCategory === 'milktea' ? 'active' : ''}`} onClick={() => setCurrentCategory('milktea')}>
            Milk Tea
          </button>
          <button type="button" className={`tab ${currentCategory === 'drink' ? 'active' : ''}`} onClick={() => setCurrentCategory('drink')}>
            Drink
          </button>
          <button type="button" className={`tab ${currentCategory === 'hot' ? 'active' : ''}`} onClick={() => setCurrentCategory('hot')}>
            Hot
          </button>
        </div>
      </div>

      <div className="menu-container">
        {matchCount === 0 ? (
          <div className="no-results">No menu items found matching your criteria.</div>
        ) : (
          Object.entries(filteredGroups).map(([category, items]) => (
            <div className="category-group" key={category}>
              <h2 className="category-title">{categoryNames[category]}</h2>
              {items.map((item) => (
                <div className="menu-card" key={item.id}>
                  <div className="item-card-content">
                    <img className="item-image" src={item.image || createProductImage(item.name, item.category)} alt={item.name} />
                    <div className="item-text">
                      <div className="item-header">
                        <div>
                          <div className="item-name">{item.name}</div>
                          <div className="item-desc">{item.desc}</div>
                        </div>
                        <div className="item-price">{item.price}</div>
                      </div>
                    </div>
                  </div>
                  <div className="card-actions">
                    <button className="action-btn order-btn" type="button" onClick={() => openModal(item)}>
                      Order
                    </button>
                    <button className="action-btn edit-btn" type="button" onClick={() => openEditModal(item)}>
                      Edit
                    </button>
                    <button className={`action-btn like-btn ${item.liked ? 'liked' : ''}`} type="button" onClick={() => toggleLike(item.id)}>
                      {item.liked ? '♥ Liked' : '♡ Like'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {isChoiceModalOpen && currentOrderItem && (
        <div className="modal open" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal-content">
            <div className="modal-title">{currentOrderItem.name}</div>
            <div className="modal-desc">{currentOrderItem.desc}</div>

            <div className="option-group">
              <span className="option-label">Select Size</span>
              <div className="radio-options">
                <label className="radio-btn">
                  <input type="radio" name="size" value="Regular" checked={selectedSize === 'Regular'} onChange={() => setSelectedSize('Regular')} />
                  <span>Regular</span>
                </label>
                <label className="radio-btn">
                  <input type="radio" name="size" value="Large" checked={selectedSize === 'Large'} onChange={() => setSelectedSize('Large')} />
                  <span>Large (+$0.50)</span>
                </label>
              </div>
            </div>

            <div className="option-group">
              <span className="option-label">Sweetness Level</span>
              <div className="radio-options">
                <label className="radio-btn">
                  <input type="radio" name="sweet" value="Normal" checked={selectedSweetness === 'Normal'} onChange={() => setSelectedSweetness('Normal')} />
                  <span>100%</span>
                </label>
                <label className="radio-btn">
                  <input type="radio" name="sweet" value="Less" checked={selectedSweetness === 'Less'} onChange={() => setSelectedSweetness('Less')} />
                  <span>50%</span>
                </label>
                <label className="radio-btn">
                  <input type="radio" name="sweet" value="None" checked={selectedSweetness === 'None'} onChange={() => setSelectedSweetness('None')} />
                  <span>0%</span>
                </label>
              </div>
            </div>

            <button className="close-btn" type="button" onClick={confirmOrderSelection}>Add to Order</button>
          </div>
        </div>
      )}

      {isAuthModalOpen && (
        <div className="modal open" onClick={(e) => e.target === e.currentTarget && closeAuthModal()}>
          <div className="modal-content">
            <div className="modal-title">Access Required</div>
            <div className="modal-desc">Enter the edit password to continue.</div>
            <div className="option-group">
              <label className="option-label" htmlFor="authPasswordInput">Password</label>
              <input
                id="authPasswordInput"
                className="input-field"
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAuthSubmit();
                  }
                }}
                placeholder="Enter password"
              />
            </div>
            {authError && <div className="modal-desc" style={{ color: '#b24a13', marginBottom: 0 }}>{authError}</div>}
            <div className="edit-actions">
              <button className="action-btn secondary-btn" type="button" onClick={closeAuthModal}>Cancel</button>
              <button className="action-btn order-btn" type="button" onClick={handleAuthSubmit}>Continue</button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="modal open" onClick={(e) => e.target === e.currentTarget && closeEditModal()}>
          <div className="modal-content">
            <div className="modal-title">Edit Item</div>
            <div className="option-group">
              <label className="option-label" htmlFor="editNameInput">Name</label>
              <input id="editNameInput" className="input-field" type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="option-group">
              <label className="option-label" htmlFor="editPriceInput">Price</label>
              <input id="editPriceInput" className="input-field" type="text" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
            </div>
            <div className="option-group">
              <label className="option-label" htmlFor="editCaptionInput">Caption</label>
              <textarea id="editCaptionInput" className="input-field" rows="3" value={editCaption} onChange={(e) => setEditCaption(e.target.value)} />
            </div>
            <div className="option-group">
              <label className="option-label" htmlFor="editImageInput">Image</label>
              <div className="upload-row">
                <input id="editImageInput" className="input-field" type="text" value={editImage} onChange={(e) => setEditImage(e.target.value)} placeholder="Paste image URL or use upload below" />
                <input id="editImageUpload" className="upload-file" type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setEditImage)} />
                <div className="image-preview">
                  <img src={editImage || createProductImage(editName.trim() || 'Preview', editCategory || 'cafe')} alt="Item preview" />
                </div>
                <div className="upload-hint">Upload a local image or paste a URL. The image is saved with the item and will stay after refresh.</div>
              </div>
            </div>
            <div className="option-group">
              <label className="option-label" htmlFor="editCategorySelect">Category</label>
              <select id="editCategorySelect" className="input-field" value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                <option value="cafe">Cafe</option>
                <option value="milktea">Milk Tea</option>
                <option value="drink">Drink</option>
                <option value="hot">Hot</option>
              </select>
            </div>
            <div className="edit-actions">
              <button className="action-btn secondary-btn" type="button" onClick={closeEditModal}>Cancel</button>
              <button className="action-btn order-btn" type="button" onClick={saveItemEdit}>Save</button>
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="modal open" onClick={(e) => e.target === e.currentTarget && closeAddModal()}>
          <div className="modal-content">
            <div className="modal-title">Add New Item</div>
            <div className="option-group">
              <label className="option-label" htmlFor="addNameInput">Name</label>
              <input id="addNameInput" className="input-field" type="text" value={addName} onChange={(e) => setAddName(e.target.value)} />
            </div>
            <div className="option-group">
              <label className="option-label" htmlFor="addPriceInput">Price</label>
              <input id="addPriceInput" className="input-field" type="text" value={addPrice} onChange={(e) => setAddPrice(e.target.value)} />
            </div>
            <div className="option-group">
              <label className="option-label" htmlFor="addCaptionInput">Caption</label>
              <textarea id="addCaptionInput" className="input-field" rows="3" value={addCaption} onChange={(e) => setAddCaption(e.target.value)} />
            </div>
            <div className="option-group">
              <label className="option-label" htmlFor="addImageInput">Image</label>
              <div className="upload-row">
                <input id="addImageInput" className="input-field" type="text" value={addImage} onChange={(e) => setAddImage(e.target.value)} placeholder="Paste image URL or use upload below" />
                <input id="addImageUpload" className="upload-file" type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setAddImage)} />
                <div className="image-preview">
                  <img src={addImage || createProductImage(addName.trim() || 'Preview', addCategory || 'cafe')} alt="New item preview" />
                </div>
                <div className="upload-hint">Upload a local image or paste a URL. The image will be saved in the app storage.</div>
              </div>
            </div>
            <div className="option-group">
              <label className="option-label" htmlFor="addCategorySelect">Category</label>
              <select id="addCategorySelect" className="input-field" value={addCategory} onChange={(e) => setAddCategory(e.target.value)}>
                <option value="cafe">Cafe</option>
                <option value="milktea">Milk Tea</option>
                <option value="drink">Drink</option>
                <option value="hot">Hot</option>
              </select>
            </div>
            <div className="edit-actions">
              <button className="action-btn secondary-btn" type="button" onClick={closeAddModal}>Cancel</button>
              <button className="action-btn order-btn" type="button" onClick={saveNewItem}>Create Item</button>
            </div>
          </div>
        </div>
      )}

      {isBrandModalOpen && (
        <div className="modal open" onClick={(e) => e.target === e.currentTarget && closeBrandModal()}>
          <div className="modal-content">
            <div className="modal-title">Edit Brand</div>
            <div className="option-group">
              <label className="option-label" htmlFor="brandNameInput">Brand Name</label>
              <input id="brandNameInput" className="input-field" type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)} />
            </div>
            <div className="option-group">
              <label className="option-label" htmlFor="brandCaptionInput">Caption</label>
              <input id="brandCaptionInput" className="input-field" type="text" value={brandCaption} onChange={(e) => setBrandCaption(e.target.value)} />
            </div>
            <div className="option-group">
              <label className="option-label" htmlFor="brandTelegramInput">Telegram</label>
              <input id="brandTelegramInput" className="input-field" type="text" value={brandTelegram} onChange={(e) => setBrandTelegram(e.target.value)} placeholder="t.me/yourhandle" />
            </div>
            <div className="option-group">
              <label className="option-label" htmlFor="brandPhoneInput">Phone</label>
              <input id="brandPhoneInput" className="input-field" type="text" value={brandPhone} onChange={(e) => setBrandPhone(e.target.value)} placeholder="+855 12 345 678" />
            </div>
            <div className="option-group">
              <label className="option-label" htmlFor="brandLocationInput">Location</label>
              <input id="brandLocationInput" className="input-field" type="text" value={brandLocation} onChange={(e) => setBrandLocation(e.target.value)} placeholder="City, Street address" />
            </div>
            <div className="option-group">
              <label className="option-label" htmlFor="brandFacebookInput">Facebook Page</label>
              <input id="brandFacebookInput" className="input-field" type="text" value={brandFacebook} onChange={(e) => setBrandFacebook(e.target.value)} placeholder="facebook.com/yourpage" />
            </div>
            <div className="edit-actions">
              <button className="action-btn secondary-btn" type="button" onClick={closeBrandModal}>Cancel</button>
              <button className="action-btn order-btn" type="button" onClick={saveBrandEdit}>Save</button>
            </div>
          </div>
        </div>
      )}

      {isListModalOpen && (
        <div className="modal open" onClick={(e) => e.target === e.currentTarget && setIsListModalOpen(false)}>
          <div className="modal-content">
            <div className="modal-title">Menu List</div>
            <div className="option-group">
              <button className="action-btn order-btn" type="button" onClick={openAddModal}>Add New Item</button>
            </div>
            <div>
              {menuData.map((item) => (
                <div className="list-row" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <div className="list-item-meta">{item.category.toUpperCase()} · {item.price}</div>
                  </div>
                  <div className="list-actions">
                    <button className="action-btn edit-btn" type="button" onClick={() => openEditModal(item)}>Edit</button>
                    <button className="action-btn secondary-btn" type="button" onClick={() => deleteMenuItem(item.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="edit-actions">
              <button className="action-btn secondary-btn" type="button" onClick={() => setIsListModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {isPaymentModalOpen && (
        <div className="modal open" onClick={(e) => e.target === e.currentTarget && closePaymentModal()}>
          <div className="modal-content">
            <div className="modal-title">Bank QR Payment</div>
            <div className="modal-desc">
              Your order total is <strong>{formatCurrency(getCartTotal())}</strong>
            </div>
            <div className="order-summary">
              <div className="order-summary-title">Current order</div>
              <div className="order-summary-list">
                {cartItems.length === 0 ? (
                  <div className="order-summary-item"><span>No items yet</span><span>$0.00</span></div>
                ) : (
                  cartItems.map((item, index) => (
                    <div className="order-summary-item" key={`${item.name}-${index}`}>
                      <span>{item.name} · {item.size} · {item.sweetness}</span>
                      <strong>{formatCurrency(item.priceValue)}</strong>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="payment-options">
              <div className="payment-card aba">
                <h3>ABA</h3>
                <p>Scan with ABA Mobile or ABA Pay.</p>
                <div className="payment-qr">
                  <img src={abaQr} alt="ABA QR code" />
                </div>
              </div>
              <div className="payment-card ac">
                <h3>AC</h3>
                <p>Scan with ACLEDA Mobile or KHQR.</p>
                <div className="payment-qr">
                  <img src={acQr} alt="ACLEDA QR code" />
                </div>
              </div>
            </div>
            <div className="edit-actions">
              <button className="action-btn secondary-btn" type="button" onClick={closePaymentModal}>Close</button>
            </div>
          </div>
        </div>
      )}
      <footer className="app-footer">
        <div className="footer-inner">
          <div className="footer-left">
            {brandTelegram && (
              <a href={brandTelegram.startsWith('http') ? brandTelegram : `https://${brandTelegram}`} target="_blank" rel="noreferrer" className="footer-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M21 3L3 10.5l4.5 1.5L18 6.5 14 15l1.5 5L21 3z" fill="#3f2a1d" opacity="0.9"/>
                </svg>
                <span>Telegram</span>
              </a>
            )}
            {brandPhone && (
              <a href={`tel:${brandPhone}`} className="footer-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M6.6 10.2a15.05 15.05 0 006.2 6.2l2.1-2.1a1 1 0 011.05-.24c1.12.45 2.33.69 3.58.69a1 1 0 011 1V20a1 1 0 01-1 1C9.94 21 3 14.06 3 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.24 2.46.69 3.58a1 1 0 01-.24 1.05l-2.35 2.57z" fill="#3f2a1d"/>
                </svg>
                <span>{brandPhone}</span>
              </a>
            )}
            {brandLocation && (
              <span className="footer-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#3f2a1d"/>
                  <circle cx="12" cy="9" r="2.2" fill="#fff"/>
                </svg>
                <span>{brandLocation}</span>
              </span>
            )}
            {brandFacebook && (
              <a href={brandFacebook.startsWith('http') ? brandFacebook : `https://${brandFacebook}`} target="_blank" rel="noreferrer" className="footer-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M22 12a10 10 0 10-11.5 9.9v-7h-2.2V12h2.2V9.8c0-2.2 1.3-3.4 3.3-3.4.96 0 1.96.17 1.96.17v2.15h-1.1c-1.08 0-1.4.66-1.4 1.33V12h2.38l-.38 2.9H14.3v7A10 10 0 0022 12z" fill="#3f2a1d"/>
                </svg>
                <span>Facebook</span>
              </a>
            )}
          </div>
          <div className="footer-right">
            <button className="action-btn secondary-btn" type="button" onClick={openBrandModal}>Edit Contact</button>
          </div>
        </div>
      </footer>
    </>
  );
}

export default App;
