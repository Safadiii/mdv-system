import { inputCls } from "../styles/input";
export default function SettingsPage() {
  const sections = [
    {
      title: "Company Information",
      fields: [
        { label: "Company Name",  value: "ArcticFlow Systems Inc.", full: true  },
        { label: "Tax ID / EIN",  value: "47-2839401",              full: false },
        { label: "Phone Number",  value: "+1 (602) 889-4411",       full: false },
        { label: "Address",       value: "4820 Industrial Pkwy, Suite 200, Phoenix, AZ 85004", full: true },
        { label: "Website",       value: "https://arcticflow.com",  full: true  },
      ],
    },
    {
      title: "Inventory Thresholds",
      fields: [
        { label: "Low Stock Threshold",      value: "8",   full: false },
        { label: "Critical Stock Threshold", value: "0",   full: false },
        { label: "Default Currency",         value: "USD", full: false },
        { label: "Fiscal Year Start",        value: "January",         full: false },
      ],
    },
    {
      title: "Notifications",
      fields: [
        { label: "Alert Email",         value: "alerts@arcticflow.com",   full: true  },
        { label: "Low Stock Alert",     value: "Enabled",                 full: false },
        { label: "Overdue PO Alert",    value: "Enabled",                 full: false },
      ],
    },
  ];

  return (
    <div className="max-w-2xl space-y-5">
      {sections.map(({ title, fields }) => (
        <div key={title} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
            <h3 className="text-[13px] font-semibold text-slate-900">{title}</h3>
          </div>
          <div className="p-5 space-y-3">
            {fields.map(({ label, value, full }) => (
              <div key={label} className={`grid gap-4 items-center ${full ? "grid-cols-1" : "grid-cols-2"}`}>
                {!full && <label className="text-[13px] text-slate-600">{label}</label>}
                <div className={full ? "" : ""}>
                  {full && <label className="block text-[12px] font-medium text-slate-600 mb-1.5">{label}</label>}
                  <input defaultValue={value} className={inputCls} />
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/30 flex justify-end">
            <button className="px-4 py-1.5 text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
              Save Changes
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}