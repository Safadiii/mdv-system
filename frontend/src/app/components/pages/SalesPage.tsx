import { Search, Plus, Eye, FileText, X, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import Badge from "../custom-components/Badge";
import { useCustomers } from "../../../hooks/useCustomerOverview";
import { useSales } from "../../../hooks/useSales";
import { useInventoryProducts } from "../../../hooks/useInventoryProducts";
import { selectCls, inputCls } from "../styles/input";
import Modal from "../custom-components/Modal";
import FieldRow from "../custom-components/FieldRow";
import { fmt$, formatDate } from "../utils/Helpers";
import api from "../../../api/client";
import SaleDetailModal from "../custom-components/SaleDetailModal";
import {
    deleteSale
} from "../../../api/sale"

const emptyItem = () => ({ product_id: "", quantity: 1, unit_price: 0, discount_pct: 0 });

export default function SalesPage() {
  const [showModal, setShowModal] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState([emptyItem()]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSaleId, setSelectedSaleId] = useState(null);

  const {
      customers
  } = useCustomers();

  const [statusFilter, setStatusFilter] = useState("ALL");

  const STATUS_OPTIONS = [
    { value: "ALL", label: "All" },
    { value: "PENDING_PAYMENT", label: "Pending Payment" },
    { value: "PENDING_DELIVERY", label: "Pending Delivery" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  const { sales, loading, refreshSales } = useSales();
  const { products, loading: productsLoading, refreshProducts } = useInventoryProducts();

  const updateItem = (index, field, value) => {
    setItems(prev => {
      const next = [...prev];

      const current = {
        ...next[index]
      };


      // ========================================================
      // PRODUCT CHANGED
      // ========================================================

      if (field === "product_id") {

        const product = products.find(
          p => String(p.id) === String(value)
        );


        current.product_id = value;

        current.unit_price =
          product
            ? product.selling_price
            : 0;


        if (product) {

          // Quantity of this same product already used
          // in OTHER rows.
          const usedElsewhere = prev.reduce(
            (total, item, i) => {

              if (
                i !== index &&
                String(item.product_id) === String(value)
              ) {
                return (
                  total +
                  (Number(item.quantity) || 0)
                );
              }

              return total;

            },
            0
          );


          const availableForThisRow = Math.max(
            product.stock - usedElsewhere,
            0
          );


          const currentQuantity =
            Number(current.quantity) || 1;


          current.quantity = Math.min(
            currentQuantity,
            availableForThisRow
          );
        }


        next[index] = current;

        return next;
      }


      // ========================================================
      // QUANTITY CHANGED
      // ========================================================

      if (field === "quantity") {

        const product = products.find(
          p =>
            String(p.id) ===
            String(current.product_id)
        );


        let requestedQuantity =
          Number(value) || 0;


        requestedQuantity = Math.max(
          requestedQuantity,
          0
        );


        if (product) {

          const usedElsewhere = prev.reduce(
            (total, item, i) => {

              if (
                i !== index &&
                String(item.product_id) ===
                  String(current.product_id)
              ) {

                return (
                  total +
                  (Number(item.quantity) || 0)
                );
              }

              return total;

            },
            0
          );


          const maxAvailable =
            Math.max(
              product.stock - usedElsewhere,
              0
            );


          requestedQuantity = Math.min(
            requestedQuantity,
            maxAvailable
          );
        }


        current.quantity =
          requestedQuantity;


        next[index] = current;

        return next;
      }


      // ========================================================
      // OTHER FIELDS
      // ========================================================

      current[field] = value;

      next[index] = current;

      return next;
    });
  };

  const getMaxQuantityForRow = (
    index
  ) => {

    const item =
      items[index];


    if (!item?.product_id) {
      return 0;
    }


    const product = products.find(
      p =>
        String(p.id) ===
        String(item.product_id)
    );


    if (!product) {
      return 0;
    }


    const usedElsewhere =
      items.reduce(
        (total, otherItem, i) => {

          if (
            i !== index &&
            String(otherItem.product_id) ===
              String(item.product_id)
          ) {

            return (
              total +
              (Number(otherItem.quantity) || 0)
            );
          }


          return total;

        },
        0
      );


    return Math.max(
      product.stock - usedElsewhere,
      0
    );
  };

  const lineTotal = (item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unit_price) || 0;
    const discount = Number(item.discount_pct) || 0;
    return qty * price * (1 - discount / 100);
  };

  const filteredSales = useMemo(() => {
    if (statusFilter === "ALL") return sales;
    return sales.filter(s => s.status === statusFilter);
  }, [sales, statusFilter]);

  const grandTotal = useMemo(() => items.reduce((s, it) => s + lineTotal(it), 0), [items]);

  const addRow = () => setItems(prev => [...prev, emptyItem()]);
  const removeRow = (index) => setItems(prev => prev.filter((_, i) => i !== index));

  const resetForm = () => {

    setCustomerId("");

    setSaleDate(
      new Date()
        .toISOString()
        .slice(0, 10)
    );

    setItems([
      emptyItem()
    ]);

    setNotes("");

    setError(null);
  };

  const [
    saleDate,
    setSaleDate
  ] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const handleSave = async () => {

    setError(null);


    const validItems = items.filter(
      it =>
        it.product_id &&
        Number(it.quantity) > 0
    );


    if (!customerId) {

      return setError(
        "Please select a customer."
      );

    }


    if (validItems.length === 0) {

      return setError(
        "Please add at least one product."
      );

    }


    // ========================================================
    // STOCK VALIDATION
    // ========================================================

    for (
      const [
        index,
        item
      ] of items.entries()
    ) {

      if (!item.product_id) {
        continue;
      }


      const maxQuantity =
        getMaxQuantityForRow(index);


      const quantity =
        Number(item.quantity) || 0;


      if (
        quantity >
        maxQuantity
      ) {

        const product =
          products.find(
            p =>
              String(p.id) ===
              String(item.product_id)
          );


        return setError(
          `${product?.brand ?? ""} ${
            product?.model ?? ""
          } only has ${maxQuantity} units available.`
        );
      }
    }


    setSaving(true);

    try {

      const payload = {

        customer_id:
          Number(customerId),

        sale_date:
          `${saleDate}T12:00:00`,

        items:
          validItems.map(it => ({

            product_id:
              Number(it.product_id),

            quantity:
              Number(it.quantity),

            unit_price:
              Number(it.unit_price),

            discount_percentage:
              Number(it.discount_pct) || 0,

          })),
      };


      await api.post(
        "/sales/",
        payload
      );


      await refreshSales?.();

      await refreshProducts?.();


      setShowModal(false);

      resetForm();


    } catch (e) {

      setError(
        e.response?.data?.detail
        ||
        e.message
        ||
        "Failed to create sale"
      );

    } finally {

      setSaving(false);

    }
  };
  async function handleDeleteSale(
      saleId: number
  ) {

      const confirmed = confirm(
          "Are you sure you want to delete this sale? This action cannot be undone."
      );

      if (!confirmed) {
          return;
      }


      try {

          await deleteSale(saleId);

          await refreshSales();

      } catch (error) {

          console.error(
              "Failed to delete sale",
              error
          );

          alert(
              "Failed to delete sale"
          );
      }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input placeholder="Search invoices..." className="pl-8 pr-3 py-2 text-[13px] bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64 placeholder-slate-400 text-slate-900" />
        </div>

        <div className="flex items-center gap-2">
          {STATUS_OPTIONS.map(opt => {
            const active = statusFilter === opt.value;

            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatusFilter(opt.value)}
                className={`
                  rounded-full
                  transition-all
                  ${active
                    ? "ring-2 ring-blue-500/30 ring-offset-1"
                    : "opacity-60 hover:opacity-100"
                  }
                `}
              >
                {opt.value === "ALL" ? (
                  <span
                    className={`
                      inline-flex items-center
                      px-2.5 py-1
                      rounded-full
                      text-[11px]
                      font-medium
                      ${
                        active
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-600"
                      }
                    `}
                  >
                    All
                  </span>
                ) : (
                  <Badge variant={opt.value} />
                )}
              </button>
            );
          })}
        </div>

        <button onClick={() => setShowModal(true)}
          className="ml-auto flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium px-4 py-2 rounded-md transition-colors">
          <Plus size={13} /> Create Sale
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["Invoice #", "Customer", "Sale Date", "Delivery Date", "Items", "Total", "Status", ""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-[13px] text-slate-400">Loading sales...</td></tr>
            ) : filteredSales.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-[13px] text-slate-400">No sale invoices yet</td></tr>
            ) : (
              filteredSales.map(s => (
                <tr
                  key={s.id}
                  onClick={() => setSelectedSaleId(s.id)}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors group cursor-pointer"
                >
                  <td className="px-4 py-3 text-[12px] text-slate-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.invoice_number}</td>
                  <td className="px-4 py-3 text-[13px] text-slate-800">{s.customer}</td>
                  <td className="px-4 py-3 text-[13px] text-slate-600">{formatDate(s.sale_date)}</td>
                  <td className="px-4 py-3 text-[13px] text-slate-600">{s.delivery_date ? formatDate(s.delivery_date) : ""}</td>
                  <td className="px-4 py-3 text-[13px] text-slate-700" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.items}</td>
                  <td className="px-4 py-3 text-[13px] font-medium text-slate-900" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmt$(s.total)}</td>
                  <td className="px-4 py-3"><Badge variant={s.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {

                            handleDeleteSale(
                                s.id
                            );                            
                            e.stopPropagation();
                        }}
                        className="
                            p-3
                            text-slate-400
                            hover:text-red-600
                            hover:bg-red-50
                            rounded
                            transition-colors
                        "
                        title="Delete sale"
                    >
                        <Trash2 size={12} />
                    </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
          <p className="text-[11px] text-slate-400">{filteredSales.length} invoices</p>
        </div>
      </div>

      {showModal && (
        <Modal title="Create Sale Invoice" onClose={() => { setShowModal(false); resetForm(); }}>
          <div className="space-y-4">
            <FieldRow label="Customer">
              <select className={selectCls} value={customerId} onChange={e => setCustomerId(e.target.value)}>
                <option value="">— Select —</option>
                {customers
                .filter(c => c.active)
                .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FieldRow>
            <FieldRow label="Sale Date">

              <input
                type="date"
                value={saleDate}
                onChange={e =>
                  setSaleDate(e.target.value)
                }
                className={inputCls}
              />

            </FieldRow>

            <FieldRow label="Products">
              <div className="border border-slate-200 rounded-md overflow-hidden">
                <div className="bg-slate-50 px-3 py-2 grid grid-cols-12 gap-2">
                  <span className="col-span-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Product</span>
                  <span className="col-span-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Qty</span>
                  <span className="col-span-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Unit Price</span>
                  <span className="col-span-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Discount %</span>
                  <span className="col-span-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wide text-right">Line Total</span>
                </div>

                {productsLoading ? (
                  <div className="px-3 py-4 text-[12px] text-slate-400">Loading products...</div>
                ) : items.map((item, i) => (
                  <div key={i} className="px-3 py-2 grid grid-cols-12 gap-2 border-t border-slate-100 items-center">
                    <select
                      className="col-span-4 text-[12px] border border-slate-200 rounded px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={item.product_id}
                      onChange={e => updateItem(i, "product_id", e.target.value)}
                    >
                      <option value="">— Select —</option>
                      {products.filter(p => p.stock > 0).map(p => (
                        <option key={p.id} value={p.id}>{p.brand} {p.model}</option>
                      ))}
                    </select>

                  <div className="col-span-2">

                    <input
                      type="number"
                      min={1}
                      max={getMaxQuantityForRow(i)}
                      placeholder="0"

                      className="
                        w-full
                        text-[12px]
                        border
                        border-slate-200
                        rounded
                        px-2
                        py-1.5
                        focus:outline-none
                        focus:ring-2
                        focus:ring-blue-500/20
                      "

                      value={item.quantity}

                      onChange={e =>
                        updateItem(
                          i,
                          "quantity",
                          e.target.value
                        )
                      }
                    />


                    {item.product_id && (

                      <p className="text-[9px] text-slate-400 mt-1">

                        Max: {getMaxQuantityForRow(i)}

                      </p>

                    )}

                  </div>

                    <input
                      type="number" step="1" placeholder="$0.00"
                      className="col-span-2 text-[12px] border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={item.unit_price}
                      onChange={e => updateItem(i, "unit_price", e.target.value)}
                    />

                    <input
                      type="number" min={0} max={100} placeholder="0"
                      className="col-span-2 text-[12px] border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={item.discount_pct}
                      onChange={e => updateItem(i, "discount_pct", e.target.value)}
                    />

                    <div className="col-span-1 text-[12px] font-medium text-slate-800 text-right" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {fmt$(lineTotal(item))}
                    </div>

                    <button type="button" onClick={() => removeRow(i)} className="col-span-1 flex justify-end text-slate-300 hover:text-red-500">
                      <X size={14} />
                    </button>
                  </div>
                ))}

                <button type="button" onClick={addRow} className="w-full text-[12px] text-blue-600 hover:bg-blue-50 py-2 border-t border-slate-100">
                  + Add product
                </button>
              </div>
            </FieldRow>

            <div className="bg-slate-50 p-3 rounded-md border border-slate-200 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Estimated Order Total</span>
              <span className="text-base font-bold text-slate-900 font-mono">{fmt$(grandTotal)}</span>
            </div>


            {error && <p className="text-[12px] text-red-500">{error}</p>}
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
            <button onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2 text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50">
              {saving ? "Saving..." : "Save Invoice"}
            </button>
          </div>
        </Modal>
      )}

      {selectedSaleId && (
        <SaleDetailModal
          saleId={selectedSaleId}
          onClose={() => setSelectedSaleId(null)}
          onSaved={refreshSales}
        />
      )}
    </div>
  );
}