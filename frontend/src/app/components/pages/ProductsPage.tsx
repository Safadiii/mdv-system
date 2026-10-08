import Modal from "../custom-components/Modal";
import FieldRow from "../custom-components/FieldRow";

import {
  useState,
  useMemo
} from "react";

import {
  Search,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  XCircle,
  Layers
} from "lucide-react";

import Badge from "../custom-components/Badge";

import { inputCls } from "../styles/input";

import {
  fmt$,
  stockStatus,
  fmtNum
} from "../utils/Helpers";

import {
  createInitialStock
} from "../../../api/inventory";

import {
  createProduct,
  updateProduct
} from "../../../api/product";

import {
  useInventoryProducts
} from "../../../hooks/useInventoryProducts";



const emptyForm = {
  sku: "",
  brand: "",
  model: "",
  cost_price: "",
  selling_price: "",
  initial_stock: ""
};



const emptyEditForm = {
  sku: "",
  brand: "",
  model: "",
  cost_price: "",
  selling_price: ""
};



export default function ProductsPage() {


  // ============================================================
  // PRODUCTS
  // ============================================================

  const {
    products = [],
    loading,
    refreshProducts
  } = useInventoryProducts();



  // ============================================================
  // ADD PRODUCT STATE
  // ============================================================

  const [form, setForm] =
    useState(emptyForm);

  const [formError, setFormError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [showModal, setShowModal] =
    useState(false);



  // ============================================================
  // EDIT PRODUCT STATE
  // ============================================================

  const [
    editingProduct,
    setEditingProduct
  ] = useState<any | null>(null);


  const [
    editForm,
    setEditForm
  ] = useState(emptyEditForm);


  const [
    editError,
    setEditError
  ] = useState("");


  const [
    editSaving,
    setEditSaving
  ] = useState(false);



  // ============================================================
  // FILTER STATE
  // ============================================================

  const [search, setSearch] =
    useState("");

  const [brandFilter, setBrandFilter] =
    useState("All");

  const [stockFilter, setStockFilter] =
    useState("All");



  // ============================================================
  // ADD PRODUCT FORM HELPERS
  // ============================================================

  const updateForm = (
    field: string,
    value: string
  ) => {

    setForm(prev => ({
      ...prev,
      [field]: value
    }));

  };


  const resetForm = () => {

    setForm(emptyForm);

    setFormError("");

  };



  // ============================================================
  // BRANDS
  // ============================================================

  const brands = useMemo(() => {

    const unique = Array.from(
      new Set(
        products
          .map(p => p.brand)
          .filter(Boolean)
      )
    );

    return [
      "All",
      ...unique
    ];

  }, [products]);



  // ============================================================
  // FILTER PRODUCTS
  // ============================================================

  const filtered = useMemo(() => {

    return products.filter(p => {


      const matchesBrand =
        brandFilter === "All"
        ||
        p.brand === brandFilter;


      const matchesSearch = [
        p.brand,
        p.model,
        p.sku
      ].some(v =>
        v
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          )
      );


      let matchesStock = true;


      if (
        stockFilter === "Low Stock"
      ) {

        matchesStock =
          p.stock > 0
          &&
          p.stock <= 5;

      }


      else if (
        stockFilter === "Out of Stock"
      ) {

        matchesStock =
          p.stock === 0;

      }


      return (
        matchesBrand
        &&
        matchesSearch
        &&
        matchesStock
      );

    });

  }, [
    products,
    search,
    brandFilter,
    stockFilter
  ]);



  // ============================================================
  // VALIDATE NEW PRODUCT
  // ============================================================

  function validateProduct() {

    if (!form.sku.trim()) {
      return "SKU is required";
    }


    if (!form.brand.trim()) {
      return "Brand is required";
    }


    if (!form.model.trim()) {
      return "Model is required";
    }


    if (form.cost_price === "") {
      return "Cost price is required";
    }


    if (form.selling_price === "") {
      return "Selling price is required";
    }


    if (form.initial_stock === "") {
      return "Initial stock is required";
    }


    if (
      Number(form.cost_price) < 0
    ) {
      return "Cost price cannot be negative";
    }


    if (
      Number(form.selling_price) < 0
    ) {
      return "Selling price cannot be negative";
    }


    if (
      Number(form.initial_stock) < 0
    ) {
      return "Initial stock cannot be negative";
    }


    return null;

  }



  // ============================================================
  // CREATE PRODUCT
  // ============================================================

  async function handleCreate() {

    const error =
      validateProduct();


    if (error) {

      setFormError(error);

      return;

    }


    try {

      setSaving(true);

      setFormError("");


      const product =
        await createProduct({

          sku:
            form.sku.trim(),

          brand:
            form.brand.trim(),

          model:
            form.model.trim(),

          cost_price:
            Number(
              form.cost_price
            ),

          selling_price:
            Number(
              form.selling_price
            )

        });


      if (
        Number(
          form.initial_stock
        ) > 0
      ) {

        await createInitialStock(
          product.id,
          Number(
            form.initial_stock
          )
        );

      }


      await refreshProducts();


      setShowModal(false);

      resetForm();


    } catch (err: any) {

      console.error(err);


      setFormError(
        err.response?.data?.detail
        ||
        "Failed creating product"
      );


    } finally {

      setSaving(false);

    }

  }



  // ============================================================
  // OPEN EDIT PRODUCT
  // ============================================================

  function openEditProduct(
    product: any
  ) {

    setEditingProduct(
      product
    );


    setEditForm({

      sku:
        product.sku ?? "",

      brand:
        product.brand ?? "",

      model:
        product.model ?? "",

      cost_price:
        String(
          product.cost_price ?? ""
        ),

      selling_price:
        String(
          product.selling_price ?? ""
        )

    });


    setEditError("");

  }



  // ============================================================
  // UPDATE EDIT FORM
  // ============================================================

  function updateEditForm(
    field: string,
    value: string
  ) {

    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));

  }



  // ============================================================
  // VALIDATE EDIT PRODUCT
  // ============================================================

  function validateEditProduct() {

    if (
      !editForm.sku.trim()
    ) {

      return "SKU is required";

    }


    if (
      !editForm.brand.trim()
    ) {

      return "Brand is required";

    }


    if (
      !editForm.model.trim()
    ) {

      return "Model is required";

    }


    if (
      editForm.cost_price === ""
    ) {

      return "Cost price is required";

    }


    if (
      editForm.selling_price === ""
    ) {

      return "Selling price is required";

    }


    if (
      Number(
        editForm.cost_price
      ) <= 0
    ) {

      return "Cost price must be greater than 0";

    }


    if (
      Number(
        editForm.selling_price
      ) <= 0
    ) {

      return "Selling price must be greater than 0";

    }


    return null;

  }



  // ============================================================
  // UPDATE PRODUCT
  // ============================================================

  async function handleUpdateProduct() {

    if (!editingProduct) {
      return;
    }


    const error =
      validateEditProduct();


    if (error) {

      setEditError(error);

      return;

    }


    try {

      setEditSaving(true);

      setEditError("");


      await updateProduct(
        editingProduct.id,
        {

          sku:
            editForm.sku.trim(),

          brand:
            editForm.brand.trim(),

          model:
            editForm.model.trim(),

          cost_price:
            Number(
              editForm.cost_price
            ),

          selling_price:
            Number(
              editForm.selling_price
            )

        }
      );


      await refreshProducts();


      setEditingProduct(null);

      setEditForm(
        emptyEditForm
      );


    } catch (err: any) {

      console.error(err);


      setEditError(
        err.response?.data?.detail
        ||
        "Failed updating product"
      );


    } finally {

      setEditSaving(false);

    }

  }



  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {

    return (

      <div className="flex items-center justify-center min-h-[200px]">

        <p className="text-sm text-slate-500 animate-pulse">

          Loading products...

        </p>

      </div>

    );

  }



  // ============================================================
  // PAGE
  // ============================================================

  return (

    <div className="space-y-4">


      {/* ====================================================== */}
      {/* TOP BAR */}
      {/* ====================================================== */}

      <div className="flex items-center gap-4 flex-wrap justify-between">


        {/* FILTERS */}

        <div className="flex items-center gap-3 flex-wrap">


          {/* SEARCH */}

          <div className="relative">

            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />


            <input
              value={search}
              onChange={e =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search by brand, model, SKU..."
              className="pl-9 pr-3 py-1.5 text-[13px] bg-white border border-slate-200 rounded-md w-60 focus:outline-none focus:border-slate-400"
            />

          </div>



          {/* BRAND FILTER */}

          <div className="flex bg-slate-100/80 border border-slate-200 rounded-md p-0.5">

            {
              brands.map(b => (

                <button
                  key={b}
                  onClick={() =>
                    setBrandFilter(b)
                  }
                  className={
                    `px-3 py-1 text-[12px] rounded font-medium transition-colors ${
                      brandFilter === b

                        ? "bg-white text-slate-900 shadow-sm"

                        : "text-slate-500 hover:text-slate-900"
                    }`
                  }
                >

                  {b}

                </button>

              ))
            }

          </div>



          {/* STOCK FILTER */}

          <div className="flex bg-slate-100/80 border border-slate-200 rounded-md p-0.5">


            <button
              onClick={() =>
                setStockFilter("All")
              }
              className={
                `flex items-center gap-1 px-3 py-1 text-[12px] rounded font-medium transition-colors ${
                  stockFilter === "All"

                    ? "bg-white text-slate-900 shadow-sm"

                    : "text-slate-500 hover:text-slate-900"
                }`
              }
            >

              <Layers size={12}/>

              All Stock

            </button>



            <button
              onClick={() =>
                setStockFilter(
                  "Low Stock"
                )
              }
              className={
                `flex items-center gap-1 px-3 py-1 text-[12px] rounded font-medium transition-colors ${
                  stockFilter === "Low Stock"

                    ? "bg-amber-50 text-amber-700 shadow-sm border border-amber-200/50"

                    : "text-slate-500 hover:text-amber-600"
                }`
              }
            >

              <AlertTriangle
                size={12}
              />

              Low Stock

            </button>



            <button
              onClick={() =>
                setStockFilter(
                  "Out of Stock"
                )
              }
              className={
                `flex items-center gap-1 px-3 py-1 text-[12px] rounded font-medium transition-colors ${
                  stockFilter === "Out of Stock"

                    ? "bg-red-50 text-red-700 shadow-sm border border-red-200/50"

                    : "text-slate-500 hover:text-red-600"
                }`
              }
            >

              <XCircle size={12}/>

              Out of Stock

            </button>


          </div>

        </div>



        {/* ADD PRODUCT */}

        <button
          onClick={() => {

            resetForm();

            setShowModal(true);

          }}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
        >

          <Plus size={14}/>

          Add Product

        </button>


      </div>



      {/* ====================================================== */}
      {/* PRODUCTS TABLE */}
      {/* ====================================================== */}

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">

        <table className="w-full border-collapse">


          {/* TABLE HEADER */}

          <thead className="bg-slate-50 border-b border-slate-200">

            <tr>

              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">

                SKU

              </th>


              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">

                Brand

              </th>


              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">

                Model

              </th>


              <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">

                Cost Price

              </th>


              <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">

                Selling Price

              </th>


              <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">

                Stock

              </th>


              <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">

                Status

              </th>


              <th className="w-16">

              </th>

            </tr>

          </thead>



          {/* TABLE BODY */}

          <tbody className="divide-y divide-slate-100">


            {
              filtered.length === 0 ? (

                <tr>

                  <td
                    colSpan={8}
                    className="text-center py-8 text-slate-400 text-sm"
                  >

                    No products found matching the criteria.

                  </td>

                </tr>

              ) : (

                filtered.map(p => {


                  const status =
                    stockStatus(
                      p.stock
                    );


                  return (

                    <tr
                      key={p.id}

                      onClick={() =>
                        openEditProduct(p)
                      }

                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    >


                      {/* SKU */}

                      <td className="px-4 py-3 text-[12px] text-slate-600 font-mono">

                        {p.sku}

                      </td>


                      {/* BRAND */}

                      <td className="px-4 py-3 text-[13px] font-semibold text-slate-900">

                        {p.brand}

                      </td>


                      {/* MODEL */}

                      <td className="px-4 py-3 text-[13px] text-slate-600">

                        {p.model}

                      </td>


                      {/* COST */}

                      <td className="px-4 py-3 text-[13px] text-right font-medium text-slate-600">

                        {
                          fmt$(
                            p.cost_price
                          )
                        }

                      </td>


                      {/* SELLING */}

                      <td className="px-4 py-3 text-[13px] text-right font-medium text-slate-900">

                        {
                          fmt$(
                            p.selling_price
                          )
                        }

                      </td>


                      {/* STOCK */}

                      <td className="px-4 py-3 text-[13px] text-right font-medium text-slate-600">

                        {
                          fmtNum(
                            p.stock
                          )
                        }

                      </td>


                      {/* STATUS */}

                      <td className="px-4 py-3 text-center">

                        <div className="inline-flex justify-center">

                          <Badge
                            variant={status}
                          />

                        </div>

                      </td>


                      {/* ACTIONS */}

                      <td className="px-4 py-3 text-right">

                        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">


                          {/* EDIT */}

                          <button
                            type="button"

                            onClick={e => {

                              e.stopPropagation();

                              openEditProduct(p);

                            }}

                            className="text-slate-400 hover:text-blue-600 p-0.5 rounded transition-colors"
                          >

                            <Edit size={14}/>

                          </button>



                          {/* DELETE */}

                          <button
                            type="button"

                            onClick={e => {

                              e.stopPropagation();

                              // Delete functionality can be added here later.

                            }}

                            className="text-slate-400 hover:text-red-600 p-0.5 rounded transition-colors"
                          >

                            <Trash2 size={14}/>

                          </button>


                        </div>

                      </td>


                    </tr>

                  );

                })

              )
            }


          </tbody>

        </table>

      </div>



      {/* ====================================================== */}
      {/* ADD PRODUCT MODAL */}
      {/* ====================================================== */}

      {
        showModal && (

          <Modal
            title="Add New Product"

            onClose={() => {

              setShowModal(false);

              resetForm();

            }}
          >

            <div className="space-y-4">


              {/* ERROR */}

              {
                formError && (

                  <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-xs font-medium">

                    {formError}

                  </div>

                )
              }



              {/* SKU */}

              <FieldRow label="SKU">

                <input
                  className={inputCls}

                  value={form.sku}

                  onChange={e =>
                    updateForm(
                      "sku",
                      e.target.value
                    )
                  }
                />

              </FieldRow>



              {/* BRAND */}

              <FieldRow label="Brand">

                <input
                  className={inputCls}

                  value={form.brand}

                  onChange={e =>
                    updateForm(
                      "brand",
                      e.target.value
                    )
                  }
                />

              </FieldRow>



              {/* MODEL */}

              <FieldRow label="Model">

                <input
                  className={inputCls}

                  value={form.model}

                  onChange={e =>
                    updateForm(
                      "model",
                      e.target.value
                    )
                  }
                />

              </FieldRow>



              {/* PRICE + STOCK */}

              <div className="grid grid-cols-3 gap-3">


                {/* COST */}

                <FieldRow label="Cost">

                  <input
                    type="number"
                    min="0"
                    step="0.01"

                    placeholder="0.00"

                    className={inputCls}

                    value={
                      form.cost_price
                    }

                    onChange={e =>
                      updateForm(
                        "cost_price",
                        e.target.value
                      )
                    }
                  />

                </FieldRow>



                {/* SELLING */}

                <FieldRow label="Selling">

                  <input
                    type="number"
                    min="0"
                    step="0.01"

                    placeholder="0.00"

                    className={inputCls}

                    value={
                      form.selling_price
                    }

                    onChange={e =>
                      updateForm(
                        "selling_price",
                        e.target.value
                      )
                    }
                  />

                </FieldRow>



                {/* INITIAL STOCK */}

                <FieldRow label="Initial Stock">

                  <input
                    type="number"
                    min="0"

                    placeholder="0"

                    className={inputCls}

                    value={
                      form.initial_stock
                    }

                    onChange={e =>
                      updateForm(
                        "initial_stock",
                        e.target.value
                      )
                    }
                  />

                </FieldRow>


              </div>



              {/* ACTIONS */}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-6">


                <button
                  type="button"

                  onClick={() => {

                    setShowModal(false);

                    resetForm();

                  }}

                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-md transition-colors"
                >

                  Cancel

                </button>



                <button
                  type="button"

                  disabled={saving}

                  onClick={
                    handleCreate
                  }

                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-medium rounded-md transition-colors shadow-sm"
                >

                  {
                    saving
                      ? "Saving..."
                      : "Add Product"
                  }

                </button>


              </div>


            </div>

          </Modal>

        )
      }



      {/* ====================================================== */}
      {/* EDIT PRODUCT MODAL */}
      {/* ====================================================== */}

      {
        editingProduct && (

          <Modal
            title="Edit Product"

            onClose={() => {

              setEditingProduct(null);

              setEditError("");

              setEditForm(
                emptyEditForm
              );

            }}
          >

            <div className="space-y-4">


              {/* ERROR */}

              {
                editError && (

                  <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-xs font-medium">

                    {editError}

                  </div>

                )
              }



              {/* SKU */}

              <FieldRow label="SKU">

                <input
                  className={inputCls}

                  value={
                    editForm.sku
                  }

                  onChange={e =>
                    updateEditForm(
                      "sku",
                      e.target.value
                    )
                  }
                />

              </FieldRow>



              {/* BRAND */}

              <FieldRow label="Brand">

                <input
                  className={inputCls}

                  value={
                    editForm.brand
                  }

                  onChange={e =>
                    updateEditForm(
                      "brand",
                      e.target.value
                    )
                  }
                />

              </FieldRow>



              {/* MODEL */}

              <FieldRow label="Model">

                <input
                  className={inputCls}

                  value={
                    editForm.model
                  }

                  onChange={e =>
                    updateEditForm(
                      "model",
                      e.target.value
                    )
                  }
                />

              </FieldRow>



              {/* PRICES */}

              <div className="grid grid-cols-2 gap-3">


                {/* COST */}

                <FieldRow label="Cost Price">

                  <input
                    type="number"
                    min="0"
                    step="0.01"

                    className={inputCls}

                    value={
                      editForm.cost_price
                    }

                    onChange={e =>
                      updateEditForm(
                        "cost_price",
                        e.target.value
                      )
                    }
                  />

                </FieldRow>



                {/* SELLING */}

                <FieldRow label="Selling Price">

                  <input
                    type="number"
                    min="0"
                    step="0.01"

                    className={inputCls}

                    value={
                      editForm.selling_price
                    }

                    onChange={e =>
                      updateEditForm(
                        "selling_price",
                        e.target.value
                      )
                    }
                  />

                </FieldRow>


              </div>



              {/* STOCK */}

              <FieldRow label="Current Stock">

                <input
                  className={
                    `${inputCls} bg-slate-50 text-slate-500 cursor-not-allowed`
                  }

                  value={
                    editingProduct.stock
                  }

                  disabled
                />

              </FieldRow>


              <p className="text-[11px] text-slate-400">

                Stock is managed through inventory movements and cannot be edited directly here.

              </p>



              {/* ACTIONS */}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-6">


                {/* CANCEL */}

                <button
                  type="button"

                  onClick={() => {

                    setEditingProduct(null);

                    setEditError("");

                    setEditForm(
                      emptyEditForm
                    );

                  }}

                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-md transition-colors"
                >

                  Cancel

                </button>



                {/* SAVE */}

                <button
                  type="button"

                  disabled={
                    editSaving
                  }

                  onClick={
                    handleUpdateProduct
                  }

                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-medium rounded-md transition-colors shadow-sm"
                >

                  {
                    editSaving
                      ? "Saving..."
                      : "Save Changes"
                  }

                </button>


              </div>


            </div>

          </Modal>

        )
      }


    </div>

  );

}