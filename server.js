import express from 'express';
import fs from 'fs/promises';
import path from 'path';

const app = express();
const PORT = 4000;
const DB_DIR = path.resolve('./data');
const MENU_FILE = path.join(DB_DIR, 'menu.json');
const BRAND_FILE = path.join(DB_DIR, 'brand.json');

const defaultMenu = [
    { id: 1, name: 'Espresso', category: 'cafe', price: '$2.00', desc: 'Bold and rich single-origin espresso shot.', liked: false, image: '' },
    { id: 2, name: 'Cappuccino', category: 'cafe', price: '$3.20', desc: 'Velvety espresso with steamed milk and foam.', liked: false, image: '' },
    { id: 3, name: 'Latte', category: 'cafe', price: '$3.50', desc: 'Smooth espresso balanced with creamy milk.', liked: false, image: '' },
    { id: 4, name: 'Caramel Macchiato', category: 'cafe', price: '$3.90', desc: 'Sweet caramel touch over fresh espresso.', liked: false, image: '' },
    { id: 5, name: 'Classic Milk Tea', category: 'milktea', price: '$3.50', desc: 'Creamy black tea with rich milk flavor.', liked: false, image: '' },
    { id: 6, name: 'Taro Milk Tea', category: 'milktea', price: '$4.00', desc: 'Soft purple taro blended into sweet milk tea.', liked: false, image: '' },
    { id: 7, name: 'Matcha Latte', category: 'milktea', price: '$4.20', desc: 'Premium green tea whisked with smooth milk.', liked: false, image: '' },
    { id: 8, name: 'Iced Lemon Tea', category: 'drink', price: '$2.80', desc: 'Refreshing citrus tea served chilled.', liked: false, image: '' },
    { id: 9, name: 'Fruit Smoothie', category: 'drink', price: '$4.50', desc: 'Cold blended fruit beverage with natural sweetness.', liked: false, image: '' },
    { id: 10, name: 'Hot Chocolate', category: 'hot', price: '$3.20', desc: 'Warm cocoa drink topped with whipped cream.', liked: false, image: '' },
    { id: 11, name: 'Ginger Tea', category: 'hot', price: '$2.60', desc: 'Comforting herbal tea with fresh ginger.', liked: false, image: '' },
    { id: 12, name: 'Americano', category: 'cafe', price: '$2.80', desc: 'Espresso shots mellowed with hot water.', liked: false, image: '' },
];

const defaultBrand = {
    name: 'Sophanit Cafe',
    caption: 'Fresh drinks • Fast order • Cozy vibes',
};

app.use(express.json());
app.use(express.static(path.resolve('./dist')));

async function ensureDataFiles() {
    await fs.mkdir(DB_DIR, { recursive: true });
    try {
        await fs.access(MENU_FILE);
    } catch {
        await fs.writeFile(MENU_FILE, JSON.stringify(defaultMenu, null, 2), 'utf8');
    }
    try {
        await fs.access(BRAND_FILE);
    } catch {
        await fs.writeFile(BRAND_FILE, JSON.stringify(defaultBrand, null, 2), 'utf8');
    }
}

async function readJson(filePath, fallback) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch {
        return fallback;
    }
}

async function writeJson(filePath, value) {
    await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
}

app.get('/api/menu', async(req, res) => {
    const menu = await readJson(MENU_FILE, defaultMenu);
    res.json(menu);
});

app.put('/api/menu', async(req, res) => {
    const menu = req.body;
    if (!Array.isArray(menu)) {
        return res.status(400).json({ error: 'Menu must be an array' });
    }
    await writeJson(MENU_FILE, menu);
    res.json({ success: true });
});

app.get('/api/brand', async(req, res) => {
    const brand = await readJson(BRAND_FILE, defaultBrand);
    res.json(brand);
});

app.put('/api/brand', async(req, res) => {
    const brand = req.body;
    if (!brand || typeof brand !== 'object') {
        return res.status(400).json({ error: 'Brand must be an object' });
    }
    await writeJson(BRAND_FILE, brand);
    res.json({ success: true });
});

app.listen(PORT, async() => {
    await ensureDataFiles();
    console.log(`Server is running at http://localhost:${PORT}`);
});