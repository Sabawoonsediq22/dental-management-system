import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/Checkbox";
import { TreatmentEntry } from "../../types/PatientTypes";

interface TreatmentHistoryFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  treatments: TreatmentEntry[];
  onApplyFilter: (filteredTreatments: TreatmentEntry[]) => void;
  className?: string;
}

type TreatmentStatusFilter = TreatmentEntry["status"];

const statusOptions: TreatmentStatusFilter[] = ["Open", "Completed", "Cancelled"];

const TreatmentHistoryFilterModal: React.FC<TreatmentHistoryFilterModalProps> = ({
  isOpen,
  onClose,
  treatments,
  onApplyFilter,
  className,
}) => {
  const [selectedStatuses, setSelectedStatuses] = useState<TreatmentStatusFilter[]>(["Open", "Completed"]);
  const [searchQuery, setSearchQuery] = useState("");

  const handleStatusToggle = (status: TreatmentStatusFilter) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const handleApplyFilter = () => {
    const filtered = treatments.filter((t) => {
      const matchesStatus = selectedStatuses.includes(t.status);
      const matchesSearch =
        searchQuery.trim() === "" ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.procedures?.some((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
    onApplyFilter(filtered);
    onClose();
  };

  const handleReset = () => {
    setSelectedStatuses(["Open", "Completed"]);
    setSearchQuery("");
    onApplyFilter(treatments);
  };

  const handleSelectAll = () => {
    setSelectedStatuses([...statusOptions]);
  };

  const handleClearAll = () => {
    setSelectedStatuses([]);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Filter Treatments"
      size="lg"
      className={cn("bg-white dark:bg-gray-800", className)}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Search</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by procedure, notes..."
            className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Status</label>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="text-xs text-blue-600 hover:underline"
              >
                Select All
              </button>
              <button
                onClick={handleClearAll}
                className="text-xs text-gray-500 hover:underline"
              >
                Clear All
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {statusOptions.map((status) => (
              <label
                key={status}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <Checkbox
                  checked={selectedStatuses.includes(status)}
                  onCheckedChange={() => handleStatusToggle(status)}
                />
                <span className="capitalize">{status}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
        <Button onClick={handleApplyFilter}>
          Apply Filter
        </Button>
      </div>
    </Modal>
  );
};

export default TreatmentHistoryFilterModal;