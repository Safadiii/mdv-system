import { ReactNode } from "react";


interface FieldRowProps {
  label: string;
  children: ReactNode;
}


export default function FieldRow({
  label,
  children,
}: FieldRowProps) {

  return (
    <div>

      <label className="block text-[12px] font-medium text-slate-600 mb-1.5">
        {label}
      </label>

      {children}

    </div>
  );
}