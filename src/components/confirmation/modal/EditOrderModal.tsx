import { Order } from "@/src/types/Order";

import EditOrderHeader from "./EditOrderHeader";
import ClientCard from "./ClientCard";
import OrderCard from "./OrderCard";
import NotesCard from "./NotesCard";
import DeliveryCard from "./DeliveryCard";
import EditOrderFooter from "./EditOrderFooter";

interface EditOrderModalProps {
  isOpen: boolean;
  selectedOrder: Order | null;
  editedFields: Partial<Order>;
  isSaving: boolean;
  handleFieldChange: <K extends keyof Order>(
    field: K,
    value: Order[K]
  ) => void;
  handleSave: () => void;
  closeModal: () => void;
}

export default function EditOrderModal({
  isOpen,
  selectedOrder,
  editedFields,
  isSaving,
  handleFieldChange,
  handleSave,
  closeModal,
}: EditOrderModalProps) {
  if (!isOpen || !selectedOrder) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl">
        <EditOrderHeader
          selectedOrder={selectedOrder}
          closeModal={closeModal}
        />

        <div className="flex-1 overflow-y-auto bg-white">
          <div className="grid grid-cols-1 gap-5 p-6 lg:grid-cols-2">
            <ClientCard
              editedFields={editedFields}
              handleFieldChange={handleFieldChange}
            />

            <OrderCard
              selectedOrder={selectedOrder}
              editedFields={editedFields}
              handleFieldChange={handleFieldChange}
            />

            <NotesCard
              editedFields={editedFields}
              handleFieldChange={handleFieldChange}
            />

            <DeliveryCard
              editedFields={editedFields}
              handleFieldChange={handleFieldChange}
            />
          </div>
        </div>

        <EditOrderFooter
          isSaving={isSaving}
          handleSave={handleSave}
          closeModal={closeModal}
        />
      </div>
    </div>
  );
}