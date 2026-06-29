import React from "react";
import { useTranslation } from "react-i18next";
import { Modal, Button } from "../ui";
import { LoadingIcon } from "../../shared/icons/icons";

interface FrequencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (frequency: string) => void;
  isSaving?: boolean;
}

const FREQUENCIES = ["daily", "weekly", "monthly"] as const;

const FrequencyModal: React.FC<FrequencyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isSaving = false,
}) => {
  const { t } = useTranslation();
  const [selected, setSelected] = React.useState("daily");

  React.useEffect(() => {
    if (isOpen) setSelected("daily");
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("backup.selectFrequency")}
      description={t("backup.selectFrequencyDesc")}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {t("common.cancel")}
          </Button>
          <Button onClick={() => onSave(selected)} disabled={isSaving}>
            {isSaving ? (
              <>
                <LoadingIcon size="sm" className="mr-1" />
                {t("backup.savingConfig")}
              </>
            ) : (
              t("backup.saveSettings")
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        {FREQUENCIES.map((freq) => (
          <label
            key={freq}
            className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-accent/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
          >
            <input
              type="radio"
              name="backup-frequency"
              value={freq}
              checked={selected === freq}
              onChange={(e) => setSelected(e.target.value)}
              className="h-4 w-4 accent-primary"
            />
            <div>
              <p className="text-sm font-medium text-foreground">
                {t(`backup.freq${freq.charAt(0).toUpperCase() + freq.slice(1)}`)}
              </p>
            </div>
          </label>
        ))}
      </div>
    </Modal>
  );
};

export default FrequencyModal;
