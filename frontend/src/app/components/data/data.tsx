import { Product
 } from "../types/Product";
import { Customer
 } from "../types/Customer";

 import { Supplier } from "../types/Supplier";
 import { PurchaseInvoice } from "../types/PurchaseInvoice";
 import { SaleInvoice } from "../types/SaleInvoice";


export const PRODUCTS: Product[] = [
  { id: "1",  sku: "DAI-FTX25K", brand: "Daikin",      model: "FTX25KV1B",        type: "Split",    costPrice: 485,  sellingPrice: 780,  stock: 42 },
  { id: "2",  sku: "CAR-24XP5",  brand: "Carrier",     model: "24XPA548A003",     type: "Central",  costPrice: 1250, sellingPrice: 1890, stock: 8  },
  { id: "3",  sku: "LG-S18EQ",   brand: "LG",          model: "S18EQ Dual Inv.",  type: "Split",    costPrice: 390,  sellingPrice: 620,  stock: 67 },
  { id: "4",  sku: "MIT-MSZ18",  brand: "Mitsubishi",  model: "MSZ-AP18VGK",      type: "Split",    costPrice: 710,  sellingPrice: 1100, stock: 3  },
  { id: "5",  sku: "SAM-AR18T",  brand: "Samsung",     model: "AR18TXHQBWK",      type: "Split",    costPrice: 420,  sellingPrice: 680,  stock: 29 },
  { id: "6",  sku: "TRN-4TTR4",  brand: "Trane",       model: "4TTR4036A1",       type: "Central",  costPrice: 1680, sellingPrice: 2450, stock: 0  },
  { id: "7",  sku: "DAI-FTX35K", brand: "Daikin",      model: "FTX35KV1B",        type: "Split",    costPrice: 560,  sellingPrice: 890,  stock: 19 },
  { id: "8",  sku: "CAR-38ARS",  brand: "Carrier",     model: "38ARS036340",      type: "Cassette", costPrice: 920,  sellingPrice: 1420, stock: 5  },
  { id: "9",  sku: "LG-ART12",   brand: "LG",          model: "ARTCOOL Gallery",  type: "Split",    costPrice: 650,  sellingPrice: 980,  stock: 11 },
  { id: "10", sku: "MIT-PCA18",  brand: "Mitsubishi",  model: "PCA-M18KA2",       type: "Cassette", costPrice: 890,  sellingPrice: 1380, stock: 7  },
  { id: "11", sku: "GRE-GWH12",  brand: "Gree",        model: "GWH12AAB-K6DNA1A", type: "Split",    costPrice: 280,  sellingPrice: 450,  stock: 84 },
  { id: "12", sku: "PAN-CS24S",  brand: "Panasonic",   model: "CS-S24KKH",        type: "Split",    costPrice: 440,  sellingPrice: 700,  stock: 2  },
];

export const CUSTOMERS: Customer[] = [
  { id: "1", name: "Marcus Hendricks",   phone: "+1 (555) 201-4832", email: "m.hendricks@hearthvac.com",   totalPurchases: 48200,  lastOrder: "2026-07-08" },
  { id: "2", name: "Priya Venkataraman", phone: "+1 (555) 384-9201", email: "priya.v@cooltech.io",         totalPurchases: 31500,  lastOrder: "2026-07-05" },
  { id: "3", name: "James Okafor",       phone: "+1 (555) 772-0048", email: "james.okafor@frostline.net",  totalPurchases: 127800, lastOrder: "2026-07-09" },
  { id: "4", name: "Sandra Morales",     phone: "+1 (555) 623-5518", email: "s.morales@arcticpros.com",    totalPurchases: 22400,  lastOrder: "2026-06-28" },
  { id: "5", name: "Tyler Beaumont",     phone: "+1 (555) 917-3364", email: "tyler@beaumonthvac.com",      totalPurchases: 89600,  lastOrder: "2026-07-10" },
  { id: "6", name: "Yuna Park",          phone: "+1 (555) 451-8822", email: "yuna.park@coldsystems.kr",    totalPurchases: 14200,  lastOrder: "2026-06-15" },
  { id: "7", name: "Devon Slater",       phone: "+1 (555) 309-1147", email: "d.slater@slaterclimate.com",  totalPurchases: 56900,  lastOrder: "2026-07-03" },
  { id: "8", name: "Fatima Al-Rashid",   phone: "+1 (555) 862-7390", email: "f.alrashid@gulfcool.ae",     totalPurchases: 203400, lastOrder: "2026-07-11" },
];

export const SUPPLIERS: Supplier[] = [
  { id: "1", name: "Pacific HVAC Distributors", phone: "+1 (555) 400-2210", email: "orders@pacifichvac.com",    productsSupplied: 38, status: "active"   },
  { id: "2", name: "Daikin North America",       phone: "+1 (555) 881-0040", email: "supply@daikinna.com",       productsSupplied: 24, status: "active"   },
  { id: "3", name: "Carrier Global Corp.",        phone: "+1 (555) 332-9871", email: "b2b@carrierglobal.com",     productsSupplied: 19, status: "active"   },
  { id: "4", name: "LG Electronics B2B",          phone: "+1 (555) 778-2233", email: "lgbusiness@lge.com",        productsSupplied: 15, status: "active"   },
  { id: "5", name: "Mitsubishi Electric",          phone: "+1 (555) 994-5506", email: "hvac@meau.com",             productsSupplied: 12, status: "active"   },
  { id: "6", name: "SunBelt HVAC Supply",          phone: "+1 (555) 210-8847", email: "purchasing@sunbelthvac.com",productsSupplied: 41, status: "inactive" },
];

export const PURCHASES: PurchaseInvoice[] = [
  { id: "1", invoiceNumber: "PO-2026-0847", supplier: "Pacific HVAC Distributors", date: "2026-07-10", items: 24, total: 18640, status: "paid"    },
  { id: "2", invoiceNumber: "PO-2026-0846", supplier: "Daikin North America",       date: "2026-07-08", items: 12, total:  6780, status: "paid"    },
  { id: "3", invoiceNumber: "PO-2026-0845", supplier: "Carrier Global Corp.",        date: "2026-07-05", items:  8, total: 14200, status: "pending" },
  { id: "4", invoiceNumber: "PO-2026-0844", supplier: "LG Electronics B2B",          date: "2026-07-03", items: 30, total: 12400, status: "paid"    },
  { id: "5", invoiceNumber: "PO-2026-0843", supplier: "Mitsubishi Electric",          date: "2026-06-29", items:  6, total:  5340, status: "paid"    },
  { id: "6", invoiceNumber: "PO-2026-0842", supplier: "Pacific HVAC Distributors", date: "2026-06-24", items: 18, total:  9820, status: "overdue" },
  { id: "7", invoiceNumber: "PO-2026-0841", supplier: "Daikin North America",       date: "2026-06-18", items: 15, total:  8175, status: "paid"    },
  { id: "8", invoiceNumber: "PO-2026-0840", supplier: "Carrier Global Corp.",        date: "2026-06-12", items: 10, total: 17500, status: "paid"    },
];

export const SALES: SaleInvoice[] = [
  { id: "1", invoiceNumber: "INV-2026-1204", customer: "James Okafor",       date: "2026-07-11", items:  6, total:  5940, status: "completed" },
  { id: "2", invoiceNumber: "INV-2026-1203", customer: "Tyler Beaumont",     date: "2026-07-10", items: 12, total:  9360, status: "completed" },
  { id: "3", invoiceNumber: "INV-2026-1202", customer: "Fatima Al-Rashid",   date: "2026-07-10", items: 20, total: 24500, status: "pending"   },
  { id: "4", invoiceNumber: "INV-2026-1201", customer: "Marcus Hendricks",   date: "2026-07-09", items:  4, total:  3120, status: "completed" },
  { id: "5", invoiceNumber: "INV-2026-1200", customer: "Devon Slater",       date: "2026-07-08", items:  8, total:  7040, status: "completed" },
  { id: "6", invoiceNumber: "INV-2026-1199", customer: "Priya Venkataraman", date: "2026-07-07", items:  2, total:  1560, status: "pending"   },
  { id: "7", invoiceNumber: "INV-2026-1198", customer: "Sandra Morales",     date: "2026-07-06", items:  3, total:  2340, status: "completed" },
  { id: "8", invoiceNumber: "INV-2026-1197", customer: "Yuna Park",          date: "2026-07-04", items:  1, total:   450, status: "cancelled" },
];

export const CHART_DATA = [
  { month: "Aug '25", sales: 142000, purchases:  89000 },
  { month: "Sep '25", sales: 168500, purchases: 105000 },
  { month: "Oct '25", sales: 124200, purchases:  78000 },
  { month: "Nov '25", sales:  98000, purchases:  62000 },
  { month: "Dec '25", sales: 215000, purchases: 134000 },
  { month: "Jan '26", sales: 182000, purchases: 115000 },
  { month: "Feb '26", sales: 156000, purchases:  98000 },
  { month: "Mar '26", sales: 198000, purchases: 124000 },
  { month: "Apr '26", sales: 234000, purchases: 148000 },
  { month: "May '26", sales: 267000, purchases: 168000 },
  { month: "Jun '26", sales: 251000, purchases: 159000 },
  { month: "Jul '26", sales: 284000, purchases: 156000 },
];

export const INV_MOVEMENT = [
  { category: "Split",    incoming: 145, outgoing: 112 },
  { category: "Central",  incoming:  48, outgoing:  62 },
  { category: "Cassette", incoming:  36, outgoing:  28 },
  { category: "Portable", incoming:  22, outgoing:  19 },
  { category: "Window",   incoming:  18, outgoing:  24 },
];

export const INVENTORY_DATA = PRODUCTS.map((p, i) => ({
  ...p,
  incoming: [32, 12, 48, 6, 20, 0, 28, 8, 15, 10, 60, 4][i],
  outgoing:  [18,  9, 41, 3, 14, 0, 22, 5, 12,  8, 47, 2][i],
  lastMovement: ["2026-07-11","2026-07-10","2026-07-11","2026-07-09","2026-07-10","—","2026-07-08","2026-07-07","2026-07-09","2026-07-06","2026-07-11","2026-07-05"][i],
}));

export const LOW_STOCK = [...PRODUCTS]
  .filter(p => p.stock <= 8)
  .sort((a, b) => a.stock - b.stock);

export const RECENT_ACTIVITY = [
  { type: "sale",     ref: "INV-2026-1204", party: "James Okafor",          amount: 5940,  date: "Jul 11" },
  { type: "purchase", ref: "PO-2026-0847",  party: "Pacific HVAC Dist.",    amount: 18640, date: "Jul 10" },
  { type: "sale",     ref: "INV-2026-1203", party: "Tyler Beaumont",         amount: 9360,  date: "Jul 10" },
  { type: "sale",     ref: "INV-2026-1202", party: "Fatima Al-Rashid",       amount: 24500, date: "Jul 10" },
  { type: "purchase", ref: "PO-2026-0846",  party: "Daikin North America",   amount: 6780,  date: "Jul 08" },
  { type: "sale",     ref: "INV-2026-1201", party: "Marcus Hendricks",       amount: 3120,  date: "Jul 09" },
];

export const TOP_PRODUCTS = [
  { name: "Daikin FTX35KV1B",       revenue: 62300, pct: 100 },
  { name: "Carrier 24XPA548A003",    revenue: 54180, pct: 87  },
  { name: "Trane 4TTR4036A1",        revenue: 49000, pct: 79  },
  { name: "Mitsubishi MSZ-AP18VGK",  revenue: 38500, pct: 62  },
  { name: "LG S18EQ Dual Inverter",  revenue: 32940, pct: 53  },
];