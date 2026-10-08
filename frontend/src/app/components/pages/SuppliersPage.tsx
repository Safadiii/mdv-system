import { useState } from "react";
import {
  Search,
  Plus,
  Eye,
  Edit,
  Play,
  Pause,
  X
} from "lucide-react";

import { useSuppliers } from "../../../hooks/useSuppliers";
import { useSupplierPurchases } from "../../../hooks/useSupplierPurchases";

import {
  toggleSupplierStatus,
  createSupplier
} from "../../../api/supplier";

import { fmt$ } from "../utils/Helpers";

import Badge from "../custom-components/Badge";

import type { BadgeVariant } from "../types/BadgeVariant";


export default function SuppliersPage() {

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);


  // -----------------------------
  // CREATE SUPPLIER FORM
  // -----------------------------

  const [name, setName] = useState("");

  const [phone, setPhone] = useState("");

  const [email, setEmail] = useState("");

  const phoneRegex = /^[0-9+\s]+$/;


  const [submitting, setSubmitting] = useState(false);

  const [formError, setFormError] =
    useState<string | null>(null);


  // -----------------------------
  // VIEW SUPPLIER PURCHASE HISTORY
  // -----------------------------

  const [
    viewingSupplier,
    setViewingSupplier
  ] = useState<{
    id: number;
    name: string;
  } | null>(null);


  const {
    purchases,
    loading: purchasesLoading,
    error: purchasesError
  } = useSupplierPurchases(
    viewingSupplier?.id ?? null
  );


  // -----------------------------
  // SUPPLIERS
  // -----------------------------

  const {
    suppliers,
    loading,
    error,
    refresh
  } = useSuppliers();


  // -----------------------------
  // SEARCH
  // -----------------------------

  const filtered = suppliers.filter(s =>
    [
      s.name,
      s.email ?? "",
      s.phone ?? ""
    ].some(v =>
      v
        .toLowerCase()
        .includes(search.toLowerCase())
    )
  );


  // -----------------------------
  // TOGGLE STATUS
  // -----------------------------

  async function handleToggleStatus(
    id: number,
    active: boolean
  ) {

    const confirmMessage = active
      ? "Deactivate this supplier?"
      : "Activate this supplier?";


    if (!confirm(confirmMessage)) {
      return;
    }


    try {

      await toggleSupplierStatus(id);

      await refresh();

    } catch (err) {

      console.error(
        "Failed changing supplier status",
        err
      );

    }

  }


  // -----------------------------
  // RESET CREATE FORM
  // -----------------------------

  function resetSupplierForm() {

    setName("");

    setPhone("");

    setEmail("");

    setFormError(null);

  }


  // -----------------------------
  // CREATE SUPPLIER
  // -----------------------------

  async function handleCreateSupplier() {

    if (!name.trim()) {

      setFormError(
        "Supplier name is required"
      );

      return;

    }


    if (!phone.trim()) {

      setFormError(
        "Supplier phone number is required"
      );

      return;

    }


    if (!phoneRegex.test(phone.trim())) {

      setFormError(
        "Phone number can only contain numbers, +, and spaces"
      );

      return;

    }


    if (
      phone.replace(/\s/g, "").length < 7
    ) {

      setFormError(
        "Phone number is too short"
      );

      return;

    }


    try {

      setSubmitting(true);

      setFormError(null);


      await createSupplier({

        name: name.trim(),

        phone: phone.trim(),

        email:
          email.trim() || undefined

      });


      await refresh();


      resetSupplierForm();

      setShowModal(false);


    } catch (err: any) {

      console.error(err);


      if (err.response?.data?.detail) {

        setFormError(
          err.response.data.detail
        );

      } else {

        setFormError(
          "Failed creating supplier"
        );

      }


    } finally {

      setSubmitting(false);

    }

  }


  return (

    <div className="space-y-4">


      {/* -------------------------------- */}
      {/* SEARCH + ADD SUPPLIER */}
      {/* -------------------------------- */}

      <div className="flex items-center gap-3">

        <div className="relative">

          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={e =>
              setSearch(e.target.value)
            }
            placeholder="Search suppliers..."
            className="pl-8 pr-3 py-2 text-[13px] bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-56 placeholder-slate-400 text-slate-900"
          />

        </div>


        <button
          onClick={() => {

            resetSupplierForm();

            setShowModal(true);

          }}
          className="ml-auto flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium px-4 py-2 rounded-md transition-colors"
        >

          <Plus size={13}/>

          Add Supplier

        </button>

      </div>


      {/* -------------------------------- */}
      {/* LOADING / ERROR */}
      {/* -------------------------------- */}

      {
        loading && (

          <p className="text-sm text-slate-500">
            Loading suppliers...
          </p>

        )
      }


      {
        error && (

          <p className="text-sm text-red-500">
            {error}
          </p>

        )
      }


      {/* -------------------------------- */}
      {/* SUPPLIERS TABLE */}
      {/* -------------------------------- */}

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">

        <table className="w-full">

          <thead className="bg-slate-50 border-b border-slate-200">

            <tr>

              {[
                "Name",
                "Phone",
                "Email",
                "Products Supplied",
                "Orders",
                "Total Purchased",
                "Status",
                ""
              ].map(h => (

                <th
                  key={h}
                  className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide text-center"
                >

                  {h}

                </th>

              ))}

            </tr>

          </thead>


          <tbody>

            {
              filtered.map(s => (

                <tr
                  key={s.id}

                  onClick={() => {

                    setViewingSupplier({
                      id: s.id,
                      name: s.name
                    });

                  }}

                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors group cursor-pointer"
                >


                  {/* NAME */}

                  <td className="px-4 py-3 text-[13px] font-medium text-slate-900">

                    {s.name}

                  </td>


                  {/* PHONE */}

                  <td className="px-4 py-3 text-[13px] text-slate-600">

                    {s.phone}

                  </td>


                  {/* EMAIL */}

                  <td className="px-4 py-3 text-[13px] text-slate-600">

                    {s.email}

                  </td>


                  {/* PRODUCTS SUPPLIED */}

                  <td
                    className="px-4 py-3 text-[13px] text-slate-700 text-center"
                    style={{
                      fontFamily:
                        "'JetBrains Mono', monospace"
                    }}
                  >

                    {s.products_supplied}

                  </td>


                  {/* ORDERS */}

                  <td
                    className="px-4 py-3 text-[13px] text-slate-600 text-center"
                    style={{
                      fontFamily:
                        "'JetBrains Mono', monospace"
                    }}
                  >

                    {s.total_orders}

                  </td>


                  {/* TOTAL PURCHASED */}

                  <td
                    className="px-4 py-3 text-[13px] text-slate-600 text-center"
                    style={{
                      fontFamily:
                        "'JetBrains Mono', monospace"
                    }}
                  >

                    {fmt$(s.total_spent)}

                  </td>


                  {/* STATUS */}

                  <td className="px-4 py-3 text-center">

                    <Badge
                      variant={
                        s.active
                          ? "active"
                          : "inactive"
                      }
                    />

                  </td>


                  {/* ACTIONS */}

                  <td className="px-4 py-3">

                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">


                      {/* VIEW PURCHASES */}

                      <button
                        onClick={e => {

                          e.stopPropagation();

                          setViewingSupplier({
                            id: s.id,
                            name: s.name
                          });

                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                      >

                        <Eye size={12}/>

                      </button>


                      {/* EDIT */}

                      <button
                        onClick={e => {

                          e.stopPropagation();

                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                      >

                        <Edit size={12}/>

                      </button>


                      {/* ACTIVATE / DEACTIVATE */}

                      <button
                        onClick={e => {

                          e.stopPropagation();

                          handleToggleStatus(
                            s.id,
                            s.active
                          );

                        }}
                        className={
                          s.active

                            ? "p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"

                            : "p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                        }
                      >

                        {
                          s.active
                            ? <Pause size={12}/>
                            : <Play size={12}/>
                        }

                      </button>


                    </div>

                  </td>


                </tr>

              ))
            }

          </tbody>

        </table>


        {/* TABLE FOOTER */}

        <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">

          <p className="text-[11px] text-slate-400">

            {filtered.length} suppliers

            {" · "}

            {
              suppliers.filter(
                s => s.active
              ).length
            } active

          </p>

        </div>

      </div>


      {/* ====================================================== */}
      {/* ADD SUPPLIER MODAL */}
      {/* ====================================================== */}

      {
        showModal && (

          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">

            <div className="bg-white rounded-lg shadow-lg w-96 p-5">


              {/* HEADER */}

              <div className="flex items-center justify-between mb-4">

                <h2 className="text-sm font-semibold text-slate-900">

                  Add Supplier

                </h2>


                <button
                  onClick={() => {

                    resetSupplierForm();

                    setShowModal(false);

                  }}
                  className="text-slate-400 hover:text-slate-700"
                >

                  <X size={16}/>

                </button>

              </div>


              {/* FORM ERROR */}

              {
                formError && (

                  <div className="mb-3 px-3 py-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">

                    {formError}

                  </div>

                )
              }


              {/* FORM */}

              <div className="space-y-3">


                {/* NAME */}

                <input
                  value={name}
                  onChange={e =>
                    setName(e.target.value)
                  }
                  placeholder="Supplier name *"
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />


                {/* PHONE */}

                <input
                  value={phone}
                  onChange={e => {

                    const value =
                      e.target.value;


                    if (
                      phoneRegex.test(value)
                      ||
                      value === ""
                    ) {

                      setPhone(value);

                    }

                  }}
                  placeholder="Phone *"
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />


                {/* EMAIL */}

                <input
                  value={email}
                  onChange={e =>
                    setEmail(e.target.value)
                  }
                  placeholder="Email"
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />


              </div>


              {/* BUTTONS */}

              <div className="flex justify-end gap-2 mt-5">


                <button
                  onClick={() => {

                    resetSupplierForm();

                    setShowModal(false);

                  }}
                  className="px-4 py-2 text-sm border border-slate-200 rounded-md hover:bg-slate-50"
                >

                  Cancel

                </button>


                <button
                  disabled={
                    submitting ||
                    !name.trim() ||
                    !phone.trim()
                  }
                  onClick={
                    handleCreateSupplier
                  }
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-md"
                >

                  {
                    submitting
                      ? "Saving..."
                      : "Save Supplier"
                  }

                </button>


              </div>


            </div>

          </div>

        )
      }


      {/* ====================================================== */}
      {/* SUPPLIER PURCHASE HISTORY MODAL */}
      {/* ====================================================== */}

      {
        viewingSupplier && (

          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">

            <div className="bg-white rounded-lg shadow-lg w-[480px] max-h-[80vh] flex flex-col p-5">


              {/* HEADER */}

              <div className="flex justify-between items-center mb-4">

                <div>

                  <h2 className="text-sm font-semibold text-slate-900">

                    {viewingSupplier.name}

                  </h2>

                  <p className="text-[11px] text-slate-400 mt-0.5">

                    Purchase History

                  </p>

                </div>


                <button
                  onClick={() =>
                    setViewingSupplier(null)
                  }
                  className="text-slate-400 hover:text-slate-700"
                >

                  <X size={16}/>

                </button>

              </div>


              {/* PURCHASES */}

              <div className="flex-1 overflow-y-auto space-y-2">


                {/* LOADING */}

                {
                  purchasesLoading && (

                    <p className="text-sm text-slate-500">

                      Loading purchases...

                    </p>

                  )
                }


                {/* ERROR */}

                {
                  purchasesError && (

                    <p className="text-sm text-red-500">

                      {purchasesError}

                    </p>

                  )
                }


                {/* EMPTY */}

                {
                  !purchasesLoading &&
                  !purchasesError &&
                  purchases.length === 0 && (

                    <p className="text-sm text-slate-400">

                      No purchases found.

                    </p>

                  )
                }


                {/* PURCHASE HISTORY */}

                {
                  !purchasesLoading &&
                  !purchasesError &&
                  purchases.map(p => (

                    <div
                      key={p.id}
                      className="border border-slate-100 rounded-md px-3 py-2 space-y-2"
                    >


                      {/* PURCHASE HEADER */}

                      <div className="flex items-center justify-between gap-4">


                        <div className="min-w-0">

                          <p className="text-[13px] font-medium text-slate-900 flex items-center gap-2">

                            <span>

                              {p.invoice_number}

                            </span>


                            <Badge
                              variant={
                                p.status as BadgeVariant
                              }
                            />

                          </p>


                          <p className="text-[11px] text-slate-400 mt-0.5">

                            {p.purchase_date}

                            {
                              p.delivery_date &&
                              ` · Delivered ${p.delivery_date}`
                            }

                          </p>

                        </div>


                        {/* TOTAL */}

                        <div className="text-right flex-shrink-0">

                          <span
                            className="text-[13px] font-medium text-slate-900 block"
                            style={{
                              fontFamily:
                                "'JetBrains Mono', monospace"
                            }}
                          >

                            {fmt$(p.total)}

                          </span>

                        </div>


                      </div>


                      {/* ITEMS */}

                      <div className="border-t border-slate-100 pt-2 space-y-1">


                        {
                          p.items.map(item => (

                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-4 text-[12px] text-slate-600"
                            >


                              {/* ITEM INFO */}

                              <div className="min-w-0">

                                <span>

                                  {item.quantity}×{" "}
                                  {item.product_name}

                                </span>


                                <span className="text-slate-400 ml-1">

                                  @ {fmt$(item.unit_cost)}

                                </span>

                              </div>


                              {/* LINE TOTAL */}

                              <span
                                className="flex-shrink-0"
                                style={{
                                  fontFamily:
                                    "'JetBrains Mono', monospace"
                                }}
                              >

                                {fmt$(item.line_total)}

                              </span>


                            </div>

                          ))
                        }


                      </div>


                    </div>

                  ))
                }


              </div>


            </div>

          </div>

        )
      }


    </div>

  );

}