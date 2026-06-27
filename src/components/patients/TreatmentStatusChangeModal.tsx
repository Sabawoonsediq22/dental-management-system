import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/button";
import { Radio } from "../ui/Radio";

interface TreatmentStatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: string;
  onSave: (newStatus: string) => Promise<void>;
  className?: string;
}

type TreatmentStatus = "Open" | "Completed" | "Cancelled";

const STATUS_OPTIONS: TreatmentStatus[] = ["Open", "Completed", "Cancelled"];

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  Completed: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    label: "Completed",
  },
  Open: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    label: "Open",
  },
  "In Progress": {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    label: "In Progress",
  },
  Cancelled: {
    bg: "bg-gray-100 dark:bg-gray-700/30",
    text: "text-gray-700 dark:text-gray-400",
    label: "Cancelled",
  },
};

const TreatmentStatusChangeModal: React.FC<TreatmentStatusChangeModalProps> = ({
  isOpen,
  onClose,
  currentStatus,
  onSave,
  className,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<TreatmentStatus>(currentStatus as TreatmentStatus);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedStatus(currentStatus as TreatmentStatus);
    }
  }, [isOpen, currentStatus]);

  const handleSave = async () => {
    await onSave(selectedStatus);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Change Treatment Status"
      size="sm"
      className={cn("bg-white dark:bg-gray-800", className)}
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Select the new status for this treatment.
        </p>
        <div className="space-y-3">
          {STATUS_OPTIONS.map((status) => {
            const config = statusConfig[status];
            return (
              <label
                key={status}
                className="flex items-center gap-3 cursor-pointer p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <Radio
                  checked={selectedStatus === status}
                  onCheckedChange={() => setSelectedStatus(status)}
                />
                <span
                  className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
                    config.bg,
                    config.text,
                  )}
                >
                  {status}
                </span>
              </label>
            );
          })}
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </Modal>
  );
};

export default TreatmentStatusChangeModal;