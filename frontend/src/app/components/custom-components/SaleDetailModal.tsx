  import { useState, useEffect } from "react";
  import { X } from "lucide-react";

  import Modal from "./Modal";
  import FieldRow from "./FieldRow";

  import { selectCls } from "../styles/input";

  import {
    fmt$,
    formatDate
  } from "../utils/Helpers";

  import { useSaleDetail } from "../../../hooks/useSaleDetail";
  import { useInventoryProducts } from "../../../hooks/useInventoryProducts";


  const STATUS_OPTIONS = [
    "PENDING_PAYMENT",
    "COMPLETED",
    "PENDING_DELIVERY",
    "CANCELLED"
  ];


  export default function SaleDetailModal({
    saleId,
    onClose,
    onSaved
  }) {

    const {
      sale,
      loading,
      error,
      fetchSale,
      saveSale
    } = useSaleDetail();

    const {
      products
    } = useInventoryProducts();


    const [status, setStatus] = useState("");

    const [deliveryDate, setDeliveryDate] =
      useState(null);

    const [items, setItems] =
      useState([]);

    const [saving, setSaving] =
      useState(false);

    const [saveError, setSaveError] =
      useState(null);


    useEffect(() => {

      fetchSale(saleId);

    }, [saleId, fetchSale]);


    useEffect(() => {

      if (sale) {

        setStatus(sale.status);

        setDeliveryDate(
          sale.delivery_date
        );

        setItems(
          sale.items.map(it => ({
            id: it.id,

            product_id:
              it.product_id,

            quantity:
              it.quantity,

            unit_price:
              it.unit_price,

            discount_percentage:
              it.discount_percentage ?? 0
          }))
        );

      }

    }, [sale]);


    const handleStatusChange = (
      newStatus
    ) => {

      setStatus(newStatus);


      if (
        newStatus === "COMPLETED"
        && !deliveryDate
      ) {

        const today =
          new Date()
            .toISOString()
            .split("T")[0];

        setDeliveryDate(today);
      }
    };


    const updateItem = (
      i,
      field,
      value
    ) => {

      setItems(prev =>
        prev.map(
          (it, idx) =>
            idx === i
              ? {
                  ...it,
                  [field]: value
                }
              : it
        )
      );
    };


    const removeItem = (i) => {

      setItems(prev =>
        prev.filter(
          (_, idx) => idx !== i
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

          unit_price: 0,

          discount_percentage: 0
        }
      ]);
    };


    /*
    * Total BEFORE discount
    */
    const lineSubtotal = item => {

      return (
        (Number(item.quantity) || 0)
        *
        (Number(item.unit_price) || 0)
      );
    };


    /*
    * Discount amount for one line
    */
    const lineDiscount = item => {

      const subtotal =
        lineSubtotal(item);

      const discount =
        Number(
          item.discount_percentage
        ) || 0;


      return (
        subtotal
        *
        (discount / 100)
      );
    };


    /*
    * Final line total AFTER discount
    */
    const lineTotal = item => {

      return (
        lineSubtotal(item)
        -
        lineDiscount(item)
      );
    };


    const grandTotal =
      items.reduce(
        (sum, item) =>
          sum + lineTotal(item),
        0
      );


    const totalDiscount =
      items.reduce(
        (sum, item) =>
          sum + lineDiscount(item),
        0
      );


    const handleSave = async () => {

      setSaveError(null);


      const validItems =
        items.filter(
          it =>
            it.product_id
            &&
            Number(it.quantity) > 0
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

        const discount =
          Number(
            item.discount_percentage
          );


        if (
          discount < 0
          ||
          discount > 100
        ) {

          return setSaveError(
            "Discount must be between 0% and 100%."
          );
        }
      }


      setSaving(true);


      try {

        await saveSale(
          saleId,
          {
            status,

            delivery_date:
              deliveryDate,

            items:
              validItems.map(
                it => ({
                  id:
                    it.id ?? null,

                  product_id:
                    Number(
                      it.product_id
                    ),

                  quantity:
                    Number(
                      it.quantity
                    ),

                  unit_price:
                    Number(
                      it.unit_price
                    ),

                  discount_percentage:
                    Number(
                      it.discount_percentage
                    ) || 0
                })
              )
          }
        );


        onSaved?.();

        onClose();


      } catch (e) {

        setSaveError(
          e.response?.data?.detail
          ||
          e.message
          ||
          "Failed to save changes"
        );

      } finally {

        setSaving(false);
      }
    };


    return (

      <Modal
        title={
          sale
            ? `Sale ${sale.invoice_number}`
            : "Sale Details"
        }
        onClose={onClose}
      >

        {
          loading || !sale ? (

            <div className="
              py-6
              text-center
              text-[13px]
              text-slate-400
            ">
              {
                error
                ||
                "Loading sale..."
              }
            </div>

          ) : (

            <div className="space-y-4">


              {/* SALE INFORMATION */}

              <div className="
                grid
                grid-cols-2
                gap-4
                text-[13px]
              ">

                <div>

                  <p className="
                    text-[11px]
                    font-semibold
                    text-slate-500
                    uppercase
                    tracking-wide
                  ">
                    Customer
                  </p>

                  <p className="
                    text-slate-800
                  ">
                    {sale.customer}
                  </p>

                </div>


                <div>

                  <p className="
                    text-[11px]
                    font-semibold
                    text-slate-500
                    uppercase
                    tracking-wide
                  ">
                    Sale Date
                  </p>

                  <p className="
                    text-slate-800
                  ">
                    {
                      formatDate(
                        sale.sale_date
                      )
                    }
                  </p>

                </div>

              </div>



              {/* STATUS */}

              <FieldRow label="Status">

                <select
                  className={selectCls}
                  value={status}
                  onChange={
                    e =>
                      handleStatusChange(
                        e.target.value
                      )
                  }
                >

                  {
                    STATUS_OPTIONS.map(
                      s => (

                        <option
                          key={s}
                          value={s}
                        >
                          {
                            s.replace(
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



              {/* PRODUCTS */}

              <FieldRow label="Products">

                <div className="
                  border
                  border-slate-200
                  rounded-md
                  overflow-hidden
                ">


                  {/* TABLE HEADER */}

                  <div className="
                    bg-slate-50
                    px-3
                    py-2
                    grid
                    grid-cols-12
                    gap-2
                  ">

                    <span className="
                      col-span-4
                      text-[11px]
                      font-semibold
                      text-slate-500
                      uppercase
                      tracking-wide
                    ">
                      Product
                    </span>


                    <span className="
                      col-span-2
                      text-[11px]
                      font-semibold
                      text-slate-500
                      uppercase
                      tracking-wide
                    ">
                      Qty
                    </span>


                    <span className="
                      col-span-2
                      text-[11px]
                      font-semibold
                      text-slate-500
                      uppercase
                      tracking-wide
                    ">
                      Unit Price
                    </span>


                    <span className="
                      col-span-2
                      text-[11px]
                      font-semibold
                      text-slate-500
                      uppercase
                      tracking-wide
                    ">
                      Discount %
                    </span>


                    <span className="
                      col-span-2
                      text-[11px]
                      font-semibold
                      text-slate-500
                      uppercase
                      tracking-wide
                      text-right
                    ">
                      Line Total
                    </span>

                  </div>



                  {/* ITEMS */}

                  {
                    items.map(
                      (item, i) => (

                        <div
                          key={
                            item.id
                            ??
                            `new-${i}`
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
                              col-span-4
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
                                  i,
                                  "product_id",
                                  e.target.value
                                )
                            }
                          >

                            <option value="">
                              — Select —
                            </option>

                            {
                              products
                                .filter(
                                  p =>
                                    p.stock > 0
                                    ||
                                    p.id === Number(
                                      item.product_id
                                    )
                                )
                                .map(
                                  p => (

                                    <option
                                      key={p.id}
                                      value={p.id}
                                    >
                                      {p.brand} {p.model}
                                    </option>

                                  )
                                )
                            }

                          </select>



                          {/* QUANTITY */}

                          <input
                            type="number"
                            min={1}
                            placeholder="0"

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
                                  i,
                                  "quantity",
                                  e.target.value
                                )
                            }
                          />



                          {/* PRICE */}

                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="$0.00"

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
                              item.unit_price
                            }

                            onChange={
                              e =>
                                updateItem(
                                  i,
                                  "unit_price",
                                  e.target.value
                                )
                            }
                          />



                          {/* DISCOUNT */}

                          <input
                            type="number"
                            min={0}
                            max={100}
                            step="0.01"
                            placeholder="0"

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
                              item.discount_percentage
                            }

                            onChange={
                              e =>
                                updateItem(
                                  i,
                                  "discount_percentage",
                                  e.target.value
                                )
                            }
                          />



                          {/* LINE TOTAL */}

                          <div
                            className="
                              col-span-1
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
                              Number(
                                item.discount_percentage
                              ) > 0 && (

                                <div className="
                                  text-[10px]
                                  text-slate-400
                                  line-through
                                ">
                                  {
                                    fmt$(
                                      lineSubtotal(
                                        item
                                      )
                                    )
                                  }
                                </div>

                              )
                            }


                            <div>
                              {
                                fmt$(
                                  lineTotal(
                                    item
                                  )
                                )
                              }
                            </div>

                          </div>



                          {/* REMOVE */}

                          <button
                            type="button"

                            onClick={
                              () =>
                                removeItem(i)
                            }

                            className="
                              col-span-1
                              flex
                              justify-end
                              text-slate-300
                              hover:text-red-500
                            "
                          >

                            <X size={14}/>

                          </button>

                        </div>

                      )
                    )
                  }



                  {/* ADD PRODUCT */}

                  <button
                    type="button"
                    onClick={addItem}

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



              {/* SUMMARY */}

              <div className="
                bg-slate-50
                p-3
                rounded-md
                border
                border-slate-200
                space-y-2
              ">

                {
                  totalDiscount > 0 && (

                    <div className="
                      flex
                      justify-between
                      items-center
                    ">

                      <span className="
                        text-xs
                        text-slate-500
                      ">
                        Total Discount
                      </span>

                      <span className="
                        text-[13px]
                        font-medium
                        text-red-500
                        font-mono
                      ">
                        -{fmt$(totalDiscount)}
                      </span>

                    </div>

                  )
                }


                <div className="
                  flex
                  justify-between
                  items-center
                ">

                  <span className="
                    text-xs
                    font-semibold
                    text-slate-500
                    uppercase
                    tracking-wide
                  ">
                    Total
                  </span>

                  <span className="
                    text-base
                    font-bold
                    text-slate-900
                    font-mono
                  ">
                    {fmt$(grandTotal)}
                  </span>

                </div>

              </div>



              {
                saveError && (

                  <p className="
                    text-[12px]
                    text-red-500
                  ">
                    {saveError}
                  </p>

                )
              }

            </div>

          )
        }



        {/* ACTIONS */}

        <div className="
          flex
          justify-end
          gap-2
          mt-6
          pt-4
          border-t
          border-slate-100
        ">

          <button
            onClick={onClose}

            className="
              px-4
              py-2
              text-[13px]
              font-medium
              text-slate-700
              hover:bg-slate-100
              rounded-md
              transition-colors
            "
          >
            Cancel
          </button>


          <button
            onClick={handleSave}

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
              transition-colors
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