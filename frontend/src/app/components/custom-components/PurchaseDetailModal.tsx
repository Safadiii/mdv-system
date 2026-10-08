import {
  useEffect,
  useState
} from "react";

import { X } from "lucide-react";

import Modal from "./Modal";
import FieldRow from "./FieldRow";

import { selectCls } from "../styles/input";

import {
  fmt$,
  formatDate
} from "../utils/Helpers";

import { useProducts } from "../../../hooks/useProducts";

import {
  getPurchase,
  updatePurchase
} from "../../../api/purchase";


const STATUS_OPTIONS = [
  "ONGOING",
  "COMPLETED",
  "CANCELLED"
];


interface PurchaseDetailModalProps {
  purchaseId: number;
  onClose: () => void;
  onSaved?: () => void | Promise<void>;
}


export default function PurchaseDetailModal({
  purchaseId,
  onClose,
  onSaved
}: PurchaseDetailModalProps) {

  const {
    products = []
  } = useProducts();


  const [purchase, setPurchase] =
    useState<any>(null);

  const [status, setStatus] =
    useState("");

  const [deliveryDate, setDeliveryDate] =
    useState("");

  const [items, setItems] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [saveError, setSaveError] =
    useState<string | null>(null);


  // ============================================================
  // LOAD PURCHASE
  // ============================================================

  useEffect(() => {

    let cancelled = false;


    const loadPurchase = async () => {

      setLoading(true);
      setError(null);


      try {

        const data =
          await getPurchase(
            purchaseId
          );


        if (cancelled) {
          return;
        }


        setPurchase(data);

        setStatus(
          data.status
        );


        setDeliveryDate(
          data.delivery_date
            ? String(
                data.delivery_date
              ).split("T")[0]
            : ""
        );


        setItems(
          data.items.map(
            (item: any) => ({
              id: item.id,

              product_id:
                item.product_id,

              quantity:
                item.quantity,

              unit_cost:
                item.unit_cost
            })
          )
        );


      } catch (e: any) {

        if (cancelled) {
          return;
        }


        setError(
          e.response?.data?.detail
          ||
          e.message
          ||
          "Failed to load purchase"
        );


      } finally {

        if (!cancelled) {
          setLoading(false);
        }

      }

    };


    loadPurchase();


    return () => {
      cancelled = true;
    };

  }, [purchaseId]);


  // ============================================================
  // STATUS
  // ============================================================

  const handleStatusChange = (
    newStatus: string
  ) => {

    setStatus(
      newStatus
    );


    // Automatically use today's date
    // when purchase is completed.
    if (
      newStatus === "COMPLETED"
      &&
      !deliveryDate
    ) {

      const today =
        new Date()
          .toISOString()
          .split("T")[0];


      setDeliveryDate(
        today
      );

    }

  };


  // ============================================================
  // ITEM HANDLING
  // ============================================================

  const updateItem = (
    index: number,
    field: string,
    value: any
  ) => {

    setItems(prev =>
      prev.map(
        (item, i) => {

          if (i !== index) {
            return item;
          }


          const updated = {
            ...item,
            [field]: value
          };


          // If product changes,
          // automatically use its cost price.
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


            if (product) {

              updated.unit_cost =
                product.cost_price
                ?? 0;

            }

          }


          return updated;

        }
      )
    );

  };


  const addItem = () => {

    setItems(prev => [
      ...prev,
      {
        id: null,
        product_id: "",
        quantity: 1,
        unit_cost: 0
      }
    ]);

  };


  const removeItem = (
    index: number
  ) => {

    setItems(prev =>
      prev.filter(
        (_, i) =>
          i !== index
      )
    );

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


    const unitCost =
      Number(
        item.unit_cost
      ) || 0;


    return (
      quantity
      *
      unitCost
    );

  };


  const grandTotal =
    items.reduce(
      (sum, item) =>
        sum
        +
        lineTotal(item),
      0
    );


  // ============================================================
  // SAVE
  // ============================================================

  const handleSave = async () => {

    setSaveError(null);


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
      validItems.length === 0
    ) {

      return setSaveError(
        "At least one item is required."
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

        return setSaveError(
          "Unit cost cannot be negative."
        );

      }

    }


    setSaving(true);


    try {

      await updatePurchase(
        purchaseId,
        {
          status,

          delivery_date:
            deliveryDate
            ||
            null,

          items:
            validItems.map(
              item => ({
                id:
                  item.id
                  ??
                  null,

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
        }
      );


      await onSaved?.();

      onClose();


    } catch (e: any) {

      setSaveError(
        e.response?.data?.detail
        ||
        e.message
        ||
        "Failed to save purchase"
      );


    } finally {

      setSaving(false);

    }

  };


  // ============================================================
  // UI
  // ============================================================

  return (

    <Modal
      title={
        purchase
          ? `Purchase ${purchase.invoice_number}`
          : "Purchase Details"
      }
      onClose={onClose}
    >

      {
        loading
        ||
        !purchase
          ? (

            <div
              className="
                py-6
                text-center
                text-[13px]
                text-slate-400
              "
            >

              {
                error
                ||
                "Loading purchase..."
              }

            </div>

          )
          : (

            <div className="space-y-4">


              {/* PURCHASE INFORMATION */}

              <div
                className="
                  grid
                  grid-cols-2
                  gap-4
                  text-[13px]
                "
              >

                <div>

                  <p
                    className="
                      text-[11px]
                      font-semibold
                      text-slate-500
                      uppercase
                      tracking-wide
                    "
                  >
                    Supplier
                  </p>

                  <p className="text-slate-800">
                    {purchase.supplier}
                  </p>

                </div>


                <div>

                  <p
                    className="
                      text-[11px]
                      font-semibold
                      text-slate-500
                      uppercase
                      tracking-wide
                    "
                  >
                    Purchase Date
                  </p>

                  <p className="text-slate-800">
                    {
                      formatDate(
                        purchase.purchase_date
                      )
                    }
                  </p>

                </div>

              </div>


              {/* STATUS */}

              <FieldRow label="Status">

                <select
                  className={
                    selectCls
                  }
                  value={
                    status
                  }
                  onChange={
                    e =>
                      handleStatusChange(
                        e.target.value
                      )
                  }
                >

                  {
                    STATUS_OPTIONS.map(
                      option => (

                        <option
                          key={
                            option
                          }
                          value={
                            option
                          }
                        >
                          {
                            option.replace(
                              /_/g,
                              " "
                            )
                          }
                        </option>

                      )
                    )
                  }

                </select>

              </FieldRow>


              {/* DELIVERY DATE */}

              <FieldRow label="Delivery Date">

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
                  className="
                    w-full
                    border
                    border-slate-200
                    rounded-md
                    px-3
                    py-2
                    text-[13px]
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-500/20
                  "
                />

              </FieldRow>


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


                  {/* HEADER */}

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


                  {/* ROWS */}

                  {
                    items.map(
                      (item, index) => (

                        <div
                          key={
                            item.id
                            ??
                            `new-${index}`
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


                          {/* PRODUCT */}

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


                          {/* QUANTITY */}

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


                          {/* UNIT COST */}

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


                          {/* TOTAL */}

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


                          {/* DELETE LINE */}

                          <button
                            type="button"
                            onClick={
                              () =>
                                removeItem(
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
                      addItem
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
                  Total
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
                saveError && (

                  <p
                    className="
                      text-[12px]
                      text-red-500
                    "
                  >
                    {saveError}
                  </p>

                )
              }

            </div>

          )
      }


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
            onClose
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
            ||
            loading
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
              : "Save Changes"
          }

        </button>

      </div>

    </Modal>

  );

}