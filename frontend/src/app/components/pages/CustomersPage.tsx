import {
  Search,
  Plus,
  Eye,
  Edit,
  X,
  Play,
  Pause
} from "lucide-react";

import { useState } from "react";


import { useCustomers } from "../../../hooks/useCustomerOverview";
import { createCustomer } from "../../../api/customer";
import { toggleCustomerStatus } from "../../../api/customer";
import { useCustomerPurchases } from "../../../hooks/useCustomerPurchases";
import { fmt$ } from "../utils/Helpers";
import { initials } from "../utils/Helpers";
import Badge from "../custom-components/Badge";
import type { BadgeVariant } from "../types/BadgeVariant";


export default function CustomersPage() {

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const PHONE_REGEX = /^[0-9+\s]+$/;

  const [formError, setFormError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const [viewingCustomer, setViewingCustomer] = useState<{ id: number; name: string } | null>(null);

  const {
    purchases,
    loading: purchasesLoading,
    error: purchasesError
  } = useCustomerPurchases(viewingCustomer?.id ?? null);


  const {
      customers,
      loading,
      error,
      refresh
  } = useCustomers();


  const filtered = customers.filter(c =>
    [c.name, c.email ?? "", c.phone ?? ""]
      .some(v =>
        v.toLowerCase()
        .includes(search.toLowerCase())
      )
  );
  function resetCustomerForm(){

    setName("");
    setPhone("");
    setEmail("");

    setFormError(null);

  }
    async function handleToggleStatus(
      id:number,
      active:boolean
    ){

      const confirmMessage = active
        ? "Deactivate this customer?"
        : "Activate this customer?";


      if(!confirm(confirmMessage))
        return;


      try {

        await toggleCustomerStatus(id);

        await refresh();

      } catch(error){

        console.error(
          "Failed changing customer status",
          error
        );

      }

    }


  async function handleCreateCustomer(){


    if(!name.trim()){

      setFormError(
        "Customer name is required"
      );

      return;

    }


    if(!phone.trim()){

      setFormError(
        "Customer phone number is required"
      );

      return;

    }


    if(!PHONE_REGEX.test(phone.trim())){

      setFormError(
        "Phone number can only contain numbers, +, and spaces"
      );

      return;

    }


    if(phone.replace(/\s/g,"").length < 7){

      setFormError(
        "Phone number is too short"
      );

      return;

    }



    try {


      setSubmitting(true);

      setFormError(null);



      await createCustomer({

        name:name.trim(),

        phone:phone.trim(),

        email:
          email.trim() || undefined

      });



      await refresh();



      resetCustomerForm();

      setShowModal(false);



    } catch(err:any){


      console.error(err);



      setFormError(

        err.response?.data?.detail ??
        "Failed creating customer"

      );


    } finally {

      setSubmitting(false);

    }

  }


  return (
    <div className="space-y-4">


      <div className="flex items-center gap-3">

        <div className="relative">

          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customers..."
            className="pl-8 pr-3 py-2 text-[13px] bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-56 placeholder-slate-400 text-slate-900"
          />

        </div>


        <button
          onClick={() => {
            resetCustomerForm();
            setShowModal(true);
          }}
          className="ml-auto flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium px-4 py-2 rounded-md transition-colors"
        >

          <Plus size={13}/>
          Add Customer

        </button>
        

      </div>



      {
        loading &&
        <p className="text-sm text-slate-500">
          Loading customers...
        </p>
      }


      {
        error &&
        <p className="text-sm text-red-500">
          {error}
        </p>
      }



      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">

        <table className="w-full">

          <thead className="bg-slate-50 border-b border-slate-200">

            <tr>

              {[
                "Name",
                "Phone",
                "Email",
                "Orders",
                "Total Spent",
                "Last Order",
                "Status",
                ""
              ].map(h => (

                <th
                  key={h}
                  className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide"
                >
                  {h}
                </th>

              ))}

            </tr>

          </thead>



          <tbody>

            {filtered.map(c => (

              <tr
                key={c.id}
                onClick={() => setViewingCustomer({ id: c.id, name: c.name })}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors group cursor-pointer"
              >

                <td className="px-4 py-3">

                  <div className="flex items-center gap-3">

                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-semibold text-slate-600 flex-shrink-0">

                      {initials(c.name)}

                    </div>


                    <span className="text-[13px] font-medium text-slate-900">
                      {c.name}
                    </span>

                  </div>

                </td>


                <td className="px-4 py-3 text-[13px] text-slate-600">
                  {c.phone}
                </td>


                <td className="px-4 py-3 text-[13px] text-slate-600">
                  {c.email}
                </td>


                <td
                  className="px-4 py-3 text-[13px] font-medium text-slate-900"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {c.total_purchases}
                </td>


                <td
                  className="px-4 py-3 text-[13px] font-medium text-slate-900"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {fmt$(c.total_spent)}
                </td>


                <td className="px-4 py-3 text-[13px] text-slate-500">
                  {c.last_order ?? "-"}
                </td>

                <td className="px-4 py-3">

                    <Badge
                        variant={
                            c.active
                            ? "active"
                            : "inactive"
                        }
                    />

                </td>

                <td className="px-4 py-3">

                <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">

                  <button
                    onClick={(e) => {
                      setViewingCustomer({ id: c.id, name: c.name });
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                  >
                    <Eye size={12}/>
                  </button>

                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                  >
                    <Edit size={12}/>
                  </button>

                  <button
                    onClick={(e) => {
                      handleToggleStatus(c.id, c.active);
                      e.stopPropagation()
                    }}
                    className={
                        c.active
                        ? "p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                        : "p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded"
                    }
                  >
                    {
                    c.active
                    ? <Pause size={12}/>
                    : <Play size={12}/>
                    }
                  </button>

                </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>


        <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">

          <p className="text-[11px] text-slate-400">
            {filtered.length} customers
          </p>

        </div>

      </div>




      {/* Add Customer Modal */}

      {
        showModal && (

          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">

            <div className="bg-white rounded-lg shadow-lg w-96 p-5">


              <div className="flex justify-between items-center mb-4">

                <h2 className="text-sm font-semibold text-slate-900">
                  Add Customer
                </h2>

                {
                formError && (

                <div className="mb-3 px-3 py-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">

                  {formError}

                </div>

                )
                }


                <button
                  onClick={() => {
                    resetCustomerForm();
                    setShowModal(false);
                  }}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X size={16}/>
                </button>

              </div>



              <div className="space-y-3">


                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Customer name *"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />


                <input
                value={phone}
                onChange={e => {

                  const value=e.target.value;

                  if(
                      PHONE_REGEX.test(value)
                      ||
                      value === ""
                  ){

                      setPhone(value);

                  }

                }}
                placeholder="Phone *"
                className="w-full border rounded-md px-3 py-2 text-sm"
                />


                <input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />



                <button
                  disabled={
                    submitting ||
                    !name.trim() ||
                    !phone.trim()
                  }
                  onClick={handleCreateCustomer}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2 rounded-md text-sm"
                >

                  {
                    submitting
                    ? "Saving..."
                    : "Save Customer"
                  }

                </button>


              </div>


            </div>

          </div>

        )
      }

      {/* View Purchases Modal */}
      {
        viewingCustomer && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-[480px] max-h-[80vh] flex flex-col p-5">

              <div className="flex justify-between items-center mb-4">
                <h2 className="text-s font-semibold text-slate-900">
                    {viewingCustomer.name}
                </h2>

                <button
                  onClick={() => setViewingCustomer(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X size={16}/>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">

                {
                  purchasesLoading &&
                  <p className="text-sm text-slate-500">Loading purchases...</p>
                }

                {
                  purchasesError &&
                  <p className="text-sm text-red-500">{purchasesError}</p>
                }

                {
                  !purchasesLoading && !purchasesError && purchases.length === 0 &&
                  <p className="text-sm text-slate-400">No purchases found.</p>
                }

                {
                  !purchasesLoading && !purchasesError && purchases.map(p => (
                    <div
                      key={p.id}
                      className="border border-slate-100 rounded-md px-3 py-2 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[13px] font-medium text-slate-900 flex items-center gap-2">
                            <span>{p.invoice_number}</span>
                            <Badge variant={p.status as BadgeVariant} />
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {p.sale_date}
                            {p.delivery_date && ` · Delivered ${p.delivery_date}`}
                          </p>
                        </div>

                        <div className="text-right">
                            <span
                              className="text-[13px] font-medium text-slate-900 block mb-1"
                              style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                              {fmt$(p.total)}
                            </span>
                          </div>
                      </div>

                      <div className="border-t border-slate-100 pt-2 space-y-1">
                        {p.items.map(item => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-[12px] text-slate-600"
                          >
                            <span>
                              {item.quantity}× {item.product_name}
                            </span>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              {fmt$(item.line_total)}
                            </span>
                          </div>
                        ))}
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