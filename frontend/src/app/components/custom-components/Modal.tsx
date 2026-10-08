import { ReactNode } from "react";
import { X } from "lucide-react";


interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}


export default function Modal({
  title,
  onClose,
  children,
}: ModalProps) {

  return (
    <div className="fixed inset-0 bg-black/25 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-lg">

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">

          <h2 className="text-[14px] font-semibold text-slate-900">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded hover:bg-slate-100"
          >
            <X size={16}/>
          </button>

        </div>


        <div className="px-6 py-5">
          {children}
        </div>

      </div>

    </div>
  );
}