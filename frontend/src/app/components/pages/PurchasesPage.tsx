import {
  Search,
  Plus,
  X,
  Trash2
} from "lucide-react";

import {
  useMemo,
  useState
} from "react";

import Badge from "../custom-components/Badge";

import Modal from "../custom-components/Modal";
import FieldRow from "../custom-components/FieldRow";

import PurchaseDetailModal from "../custom-components/PurchaseDetailModal";

import {
  useSuppliers
} from "../../../hooks/useSuppliers";

import {
  useProducts
} from "../../../hooks/useProducts";

import {
  usePurchases
} from "../../../hooks/usePurchases";

import {
  inputCls,
  selectCls
} from "../styles/input";

import {
  fmt$,
  formatDate
} from "../utils/Helpers";

import {
  deletePurchase
} from "../../../api/purchase";


const emptyItem = () => ({
  product_id: "",
  quantity: 1,
  unit_cost: 0
});


export default function PurchasesPage() {

  const {
    suppliers = []
  } = useSuppliers();


  const {
    products = []
  } = useProducts();


  const {
    purchases = [],
    loading,
    addPurchase,
    refreshPurchases
  } = usePurchases();


  const [showModal, setShowModal] =
    useState(false);


  const [supplierId, setSupplierId] =
    useState("");


  const [purchaseDate, setPurchaseDate] =
    useState(
      new Date()
        .toISOString()
        .split("T")[0]
    );


  const [deliveryDate, setDeliveryDate] =
    useState("");


  const [items, setItems] =
    useState([
      emptyItem()
    ]);


  const [saving, setSaving] =
    useState(false);


  const [error, setError] =
    useState<string | null>(null);


  const [
    selectedPurchaseId,
    setSelectedPurchaseId
  ] =
    useState<number | null>(null);


  const [statusFilter, setStatusFilter] =
    useState("ALL");


  const [searchQuery, setSearchQuery] =
    useState("");


  const STATUS_OPTIONS = [
    {
      value: "ALL",
      label: "All"
    },
    {
      value: "ONGOING",
      label: "Ongoing"
    },
    {
      value: "COMPLETED",
      label: "Completed"
    },
    {
      value: "CANCELLED",
      label: "Cancelled"
    }
  ];


  // ============================================================
  // ITEMS
  // ============================================================

  const updateItem = (
    index: number,
    field: string,
    value: any
  ) => {

    setItems(prev =>
      prev.map(
        (item, i) => {

          if (
            i !== index
          ) {
            return item;
          }


          const updated = {
            ...item,
            [field]: value
          };


          if (
            field === "product_id"
          ) {

            const product =
              products.find(
                p =>
                  String(p.id)
                  ===
                  String(value)
              );


            updated.unit_cost =
              product
                ? product.cost_price
                  ?? 0
                : 0;

          }


          return updated;

        }
      )
    );

  };


  const addRow = () => {

    setItems(prev => [
      ...prev,
      emptyItem()
    ]);

  };


  const removeRow = (
    index: number
  ) => {

    setItems(prev => {

      const result =
        prev.filter(
          (_, i) =>
            i !== index
        );


      return result.length
        ? result
        : [emptyItem()];

    });

  };


  // ============================================================
  // TOTALS
  // ============================================================

  const lineTotal = (
    item: any
  ) => {

    const quantity =
      Number(
        item.quantity
      ) || 0;


    const cost =
      Number(
        item.unit_cost
      ) || 0;


    return (
      quantity
      *
      cost
    );

  };


  const grandTotal =
    useMemo(
      () =>
        items.reduce(
          (sum, item) =>
            sum
            +
            lineTotal(item),
          0
        ),
      [items]
    );


  // ============================================================
  // FILTERING
  // ============================================================

  const filteredPurchases =
    useMemo(
      () => {

        return purchases.filter(
          purchase => {

            const matchesStatus =
              statusFilter === "ALL"
              ||
              purchase.status
              ===
              statusFilter;


            const query =
              searchQuery
                .trim()
                .toLowerCase();


            if (!query) {
              return matchesStatus;
            }


            const matchesSearch =
              purchase.invoice_number
                ?.toLowerCase()
                .includes(query)
              ||
              purchase.supplier
                ?.toLowerCase()
                .includes(query);


            return (
              matchesStatus
              &&
              matchesSearch
            );

          }
        );

      },
      [
        purchases,
        statusFilter,
        searchQuery
      ]
    );


  // ============================================================
  // RESET CREATE FORM
  // ============================================================

  const resetForm = () => {

    setSupplierId("");

    setPurchaseDate(
      new Date()
        .toISOString()
        .split("T")[0]
    );

    setDeliveryDate("");

    setItems([
      emptyItem()
    ]);

    setError(null);

  };


  // ============================================================
  // CREATE PURCHASE
  // ============================================================

  const handleSave = async () => {

    setError(null);


    const validItems =
      items.filter(
        item =>
          item.product_id
          &&
          Number(
            item.quantity
          ) > 0
      );


    if (
      !supplierId
    ) {

      return setError(
        "Please select a supplier."
      );

    }


    if (
      validItems.length === 0
    ) {

      return setError(
        "Please add at least one product."
      );

    }


    for (
      const item of validItems
    ) {

      if (
        Number(
          item.unit_cost
        ) < 0
      ) {

        return setError(
          "Unit cost cannot be negative."
        );

      }

    }


    setSaving(true);


    try {

      const payload = {

        supplier_id:
          Number(
            supplierId
          ),

        purchase_date:
          purchaseDate,

        delivery_date:
          deliveryDate
          ||
          null,

        status:
          "ONGOING",

        items:
          validItems.map(
            item => ({

              product_id:
                Number(
                  item.product_id
                ),

              quantity:
                Number(
                  item.quantity
                ),

              unit_cost:
                Number(
                  item.unit_cost
                )

            })
          )

      };


      await addPurchase(
        payload
      );


      await refreshPurchases?.();


      setShowModal(false);

      resetForm();


    } catch (e: any) {

      setError(
        e.response?.data?.detail
        ||
        e.message
        ||
        "Failed to create purchase"
      );


    } finally {

      setSaving(false);

    }

  };


  // ============================================================
  // DELETE PURCHASE
  // ============================================================

  const handleDeletePurchase = async (
    purchaseId: number
  ) => {

    const confirmed =
      confirm(
        "Are you sure you want to delete this purchase? This action cannot be undone."
      );


    if (
      !confirmed
    ) {
      return;
    }


    try {

      await deletePurchase(
        purchaseId
      );


      await refreshPurchases?.();


    } catch (e: any) {

      console.error(
        "Failed to delete purchase",
        e
      );


      alert(
        e.response?.data?.detail
        ||
        "Failed to delete purchase"
      );

    }

  };


  // ============================================================
  // UI
  // ============================================================

  return (

    <div className="space-y-4">


      {/* ======================================================
          TOP BAR
      ====================================================== */}

      <div
        className="
          flex
          items-center
          gap-3
        "
      >

        <div className="relative">

          <Search
            size={13}
            className="
              absolute
              left-3
              top-1/2
              -translate-y-1/2
              text-slate-400
            "
          />

          <input
            value={
              searchQuery
            }
            onChange={
              e =>
                setSearchQuery(
                  e.target.value
                )
            }
            placeholder="Search purchases..."
            className="
              pl-8
              pr-3
              py-2
              text-[13px]
              bg-white
              border
              border-slate-200
              rounded-md
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500/20
              w-64
              placeholder-slate-400
              text-slate-900
            "
          />

        </div>


        {/* STATUS PILLS */}

        <div
          className="
            flex
            items-center
            gap-2
          "
        >

          {
            STATUS_OPTIONS.map(
              option => {

                const active =
                  statusFilter
                  ===
                  option.value;


                return (

                  <button
                    key={
                      option.value
                    }
                    type="button"
                    onClick={
                      () =>
                        setStatusFilter(
                          option.value
                        )
                    }
                    className={`
                      rounded-full
                      transition-all

                      ${
                        active

                          ? `
                              ring-2
                              ring-blue-500/30
                              ring-offset-1
                            `

                          : `
                              opacity-60
                              hover:opacity-100
                            `
                      }
                    `}
                  >

                    {
                      option.value === "ALL"
                        ? (

                          <span
                            className={`
                              inline-flex
                              items-center
                              px-2.5
                              py-1
                              rounded-full
                              text-[11px]
                              font-medium

                              ${
                                active
                                  ? `
                                      bg-blue-100
                                      text-blue-700
                                    `
                                  : `
                                      bg-slate-100
                                      text-slate-600
                                    `
                              }
                            `}
                          >
                            All
                          </span>

                        )
                        : (

                          <Badge
                            variant={
                              option.value
                            }
                          />

                        )
                    }

                  </button>

                );

              }
            )
          }

        </div>


        {/* CREATE */}

        <button
          onClick={
            () => {

              resetForm();

              setShowModal(
                true
              );

            }
          }
          className="
            ml-auto
            flex
            items-center
            gap-1.5
            bg-blue-600
            hover:bg-blue-700
            text-white
            text-[13px]
            font-medium
            px-4
            py-2
            rounded-md
            transition-colors
          "
        >

          <Plus size={13} />

          Create Purchase

        </button>

      </div>


      {/* ======================================================
          TABLE
      ====================================================== */}

      <div
        className="
          bg-white
          rounded-lg
          border
          border-slate-200
          overflow-hidden
        "
      >

        <table className="w-full">

          <thead
            className="
              bg-slate-50
              border-b
              border-slate-200
            "
          >

            <tr>

              {
                [
                  "Invoice #",
                  "Supplier",
                  "Purchase Date",
                  "Delivery Date",
                  "Items",
                  "Total",
                  "Status",
                  ""
                ].map(
                  header => (

                    <th
                      key={
                        header
                      }
                      className="
                        text-left
                        px-4
                        py-3
                        text-[11px]
                        font-semibold
                        text-slate-500
                        uppercase
                        tracking-wide
                      "
                    >
                      {header}
                    </th>

                  )
                )
              }

            </tr>

          </thead>


          <tbody>

            {
              loading
                ? (

                  <tr>

                    <td
                      colSpan={8}
                      className="
                        px-4
                        py-6
                        text-center
                        text-[13px]
                        text-slate-400
                      "
                    >
                      Loading purchases...
                    </td>

                  </tr>

                )
                :
                filteredPurchases.length
                ===
                0
                  ? (

                    <tr>

                      <td
                        colSpan={8}
                        className="
                          px-4
                          py-6
                          text-center
                          text-[13px]
                          text-slate-400
                        "
                      >
                        No purchase invoices yet
                      </td>

                    </tr>

                  )
                  : (

                    filteredPurchases.map(
                      purchase => (

                        <tr
                          key={
                            purchase.id
                          }
                          onClick={
                            () =>
                              setSelectedPurchaseId(
                                purchase.id
                              )
                          }
                          className="
                            border-b
                            border-slate-100
                            last:border-0
                            hover:bg-slate-50/60
                            transition-colors
                            group
                            cursor-pointer
                          "
                        >


                          {/* INVOICE */}

                          <td
                            className="
                              px-4
                              py-3
                              text-[12px]
                              text-slate-600
                            "
                            style={{
                              fontFamily:
                                "'JetBrains Mono', monospace"
                            }}
                          >
                            {
                              purchase.invoice_number
                            }
                          </td>


                          {/* SUPPLIER */}

                          <td
                            className="
                              px-4
                              py-3
                              text-[13px]
                              text-slate-800
                            "
                          >
                            {
                              purchase.supplier
                            }
                          </td>


                          {/* PURCHASE DATE */}

                          <td
                            className="
                              px-4
                              py-3
                              text-[13px]
                              text-slate-600
                            "
                          >
                            {
                              formatDate(
                                purchase.purchase_date
                              )
                            }
                          </td>


                          {/* DELIVERY */}

                          <td
                            className="
                              px-4
                              py-3
                              text-[13px]
                              text-slate-600
                            "
                          >

                            {
                              purchase.delivery_date
                                ? formatDate(
                                    purchase.delivery_date
                                  )
                                : ""
                            }

                          </td>


                          {/* ITEMS */}

                          <td
                            className="
                              px-4
                              py-3
                              text-[13px]
                              text-slate-700
                            "
                            style={{
                              fontFamily:
                                "'JetBrains Mono', monospace"
                            }}
                          >
                            {
                              purchase.items
                            }
                          </td>


                          {/* TOTAL */}

                          <td
                            className="
                              px-4
                              py-3
                              text-[13px]
                              font-medium
                              text-slate-900
                            "
                            style={{
                              fontFamily:
                                "'JetBrains Mono', monospace"
                            }}
                          >
                            {
                              fmt$(
                                purchase.total_cost
                              )
                            }
                          </td>


                          {/* STATUS */}

                          <td
                            className="
                              px-4
                              py-3
                            "
                          >

                            <Badge
                              variant={
                                purchase.status
                              }
                            />

                          </td>


                          {/* DELETE */}

                          <td
                            className="
                              px-4
                              py-3
                            "
                          >

                            <div
                              className="
                                flex
                                items-center
                                gap-1
                                justify-end
                                opacity-0
                                group-hover:opacity-100
                                transition-opacity
                              "
                            >

                              <button
                                onClick={
                                  e => {

                                    e.stopPropagation();


                                    handleDeletePurchase(
                                      purchase.id
                                    );

                                  }
                                }
                                className="
                                  p-3
                                  text-slate-400
                                  hover:text-red-600
                                  hover:bg-red-50
                                  rounded
                                  transition-colors
                                "
                                title="Delete purchase"
                              >

                                <Trash2 size={12} />

                              </button>

                            </div>

                          </td>

                        </tr>

                      )
                    )

                  )
            }

          </tbody>

        </table>


        <div
          className="
            px-4
            py-2.5
            border-t
            border-slate-100
            bg-slate-50/50
          "
        >

          <p
            className="
              text-[11px]
              text-slate-400
            "
          >
            {
              filteredPurchases.length
            } purchases
          </p>

        </div>

      </div>


      {/* ======================================================
          CREATE MODAL
      ====================================================== */}

      {
        showModal && (

          <Modal
            title="Create Purchase Invoice"
            onClose={
              () => {

                setShowModal(
                  false
                );

                resetForm();

              }
            }
          >

            <div className="space-y-4">


              {/* SUPPLIER */}

              <FieldRow label="Supplier">

                <select
                  className={
                    selectCls
                  }
                  value={
                    supplierId
                  }
                  onChange={
                    e =>
                      setSupplierId(
                        e.target.value
                      )
                  }
                >

                  <option value="">
                    — Select —
                  </option>

                  {
                    suppliers
                      .filter(
                        supplier =>
                          supplier.active
                      )
                      .map(
                        supplier => (

                          <option
                            key={
                              supplier.id
                            }
                            value={
                              supplier.id
                            }
                          >
                            {
                              supplier.name
                            }
                          </option>

                        )
                      )
                  }

                </select>

              </FieldRow>


              {/* DATES */}

              <div
                className="
                  grid
                  grid-cols-2
                  gap-3
                "
              >

                <FieldRow label="Purchase Date">

                  <input
                    type="date"
                    value={
                      purchaseDate
                    }
                    onChange={
                      e =>
                        setPurchaseDate(
                          e.target.value
                        )
                    }
                    className={
                      inputCls
                    }
                  />

                </FieldRow>


                <FieldRow label="Expected Delivery">

                  <input
                    type="date"
                    value={
                      deliveryDate
                    }
                    onChange={
                      e =>
                        setDeliveryDate(
                          e.target.value
                        )
                    }
                    className={
                      inputCls
                    }
                  />

                </FieldRow>

              </div>


              {/* PRODUCTS */}

              <FieldRow label="Products">

                <div
                  className="
                    border
                    border-slate-200
                    rounded-md
                    overflow-hidden
                  "
                >

                  <div
                    className="
                      bg-slate-50
                      px-3
                      py-2
                      grid
                      grid-cols-12
                      gap-2
                    "
                  >

                    <span
                      className="
                        col-span-5
                        text-[11px]
                        font-semibold
                        text-slate-500
                        uppercase
                        tracking-wide
                      "
                    >
                      Product
                    </span>


                    <span
                      className="
                        col-span-2
                        text-[11px]
                        font-semibold
                        text-slate-500
                        uppercase
                        tracking-wide
                      "
                    >
                      Qty
                    </span>


                    <span
                      className="
                        col-span-2
                        text-[11px]
                        font-semibold
                        text-slate-500
                        uppercase
                        tracking-wide
                      "
                    >
                      Unit Cost
                    </span>


                    <span
                      className="
                        col-span-3
                        text-[11px]
                        font-semibold
                        text-slate-500
                        uppercase
                        tracking-wide
                        text-right
                      "
                    >
                      Line Total
                    </span>

                  </div>


                  {
                    items.map(
                      (item, index) => (

                        <div
                          key={
                            index
                          }
                          className="
                            px-3
                            py-2
                            grid
                            grid-cols-12
                            gap-2
                            border-t
                            border-slate-100
                            items-center
                          "
                        >


                          <select
                            className="
                              col-span-5
                              text-[12px]
                              border
                              border-slate-200
                              rounded
                              px-2
                              py-1.5
                              bg-white
                              text-slate-700
                              focus:outline-none
                              focus:ring-2
                              focus:ring-blue-500/20
                            "
                            value={
                              item.product_id
                            }
                            onChange={
                              e =>
                                updateItem(
                                  index,
                                  "product_id",
                                  e.target.value
                                )
                            }
                          >

                            <option value="">
                              — Select —
                            </option>

                            {
                              products.map(
                                product => (

                                  <option
                                    key={
                                      product.id
                                    }
                                    value={
                                      product.id
                                    }
                                  >
                                    {product.brand} {product.model}
                                  </option>

                                )
                              )
                            }

                          </select>


                          <input
                            type="number"
                            min={1}
                            className="
                              col-span-2
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
                            value={
                              item.quantity
                            }
                            onChange={
                              e =>
                                updateItem(
                                  index,
                                  "quantity",
                                  e.target.value
                                )
                            }
                          />


                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            className="
                              col-span-2
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
                            value={
                              item.unit_cost
                            }
                            onChange={
                              e =>
                                updateItem(
                                  index,
                                  "unit_cost",
                                  e.target.value
                                )
                            }
                          />


                          <div
                            className="
                              col-span-2
                              text-[12px]
                              font-medium
                              text-slate-800
                              text-right
                            "
                            style={{
                              fontFamily:
                                "'JetBrains Mono', monospace"
                            }}
                          >
                            {
                              fmt$(
                                lineTotal(
                                  item
                                )
                              )
                            }
                          </div>


                          <button
                            type="button"
                            onClick={
                              () =>
                                removeRow(
                                  index
                                )
                            }
                            className="
                              col-span-1
                              flex
                              justify-end
                              text-slate-300
                              hover:text-red-500
                            "
                          >

                            <X size={14} />

                          </button>

                        </div>

                      )
                    )
                  }


                  <button
                    type="button"
                    onClick={
                      addRow
                    }
                    className="
                      w-full
                      text-[12px]
                      text-blue-600
                      hover:bg-blue-50
                      py-2
                      border-t
                      border-slate-100
                    "
                  >
                    + Add product
                  </button>

                </div>

              </FieldRow>


              {/* TOTAL */}

              <div
                className="
                  bg-slate-50
                  p-3
                  rounded-md
                  border
                  border-slate-200
                  flex
                  justify-between
                  items-center
                "
              >

                <span
                  className="
                    text-xs
                    font-semibold
                    text-slate-500
                    uppercase
                    tracking-wide
                  "
                >
                  Estimated Order Total
                </span>

                <span
                  className="
                    text-base
                    font-bold
                    text-slate-900
                    font-mono
                  "
                >
                  {
                    fmt$(
                      grandTotal
                    )
                  }
                </span>

              </div>


              {
                error && (

                  <p
                    className="
                      text-[12px]
                      text-red-500
                    "
                  >
                    {error}
                  </p>

                )
              }

            </div>


            {/* ACTIONS */}

            <div
              className="
                flex
                justify-end
                gap-2
                mt-6
                pt-4
                border-t
                border-slate-100
              "
            >

              <button
                onClick={
                  () => {

                    setShowModal(
                      false
                    );

                    resetForm();

                  }
                }
                className="
                  px-4
                  py-2
                  text-[13px]
                  font-medium
                  text-slate-700
                  hover:bg-slate-100
                  rounded-md
                "
              >
                Cancel
              </button>


              <button
                onClick={
                  handleSave
                }
                disabled={
                  saving
                }
                className="
                  px-4
                  py-2
                  text-[13px]
                  font-medium
                  bg-blue-600
                  hover:bg-blue-700
                  text-white
                  rounded-md
                  disabled:opacity-50
                "
              >

                {
                  saving
                    ? "Saving..."
                    : "Save Invoice"
                }

              </button>

            </div>

          </Modal>

        )
      }


      {/* ======================================================
          DETAIL MODAL
      ====================================================== */}

      {
        selectedPurchaseId && (

          <PurchaseDetailModal
            purchaseId={
              selectedPurchaseId
            }
            onClose={
              () =>
                setSelectedPurchaseId(
                  null
                )
            }
            onSaved={
              refreshPurchases
            }
          />

        )
      }

    </div>

  );

}