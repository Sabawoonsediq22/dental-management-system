import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
} from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Button,
  toast,
} from "../../components/ui";
import {
  HomeIcon,
  PhoneIcon,
  SendIcon,
  LocationIcon,
  ImageIcon,
  CheckCircleIcon,
} from "../../shared/icons/icons";
import { api } from "../../lib/api";
import type { AppSettings } from "../../types/ApiTypes";

interface ClinicFormProps {
  settings: AppSettings | undefined;
}

const ClinicForm = forwardRef<{ save: () => void }, ClinicFormProps>(
  ({ settings }, ref) => {
    const { t } = useTranslation();
    const qc = useQueryClient();

    const [clinicName, setClinicName] = useState(settings?.clinic_name || "");
    const [phone, setPhone] = useState(settings?.clinic_phone || "");
    const [address, setAddress] = useState(settings?.clinic_address || "");
    const [email, setEmail] = useState("");
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
      if (settings) {
        setClinicName(settings.clinic_name || "");
        setPhone(settings.clinic_phone || "");
        setAddress(settings.clinic_address || "");
      }
    }, [settings]);

    const handleSave = async () => {
      setSaving(true);
      try {
        await api.settings.update({
          clinic_name: clinicName || null,
          clinic_phone: phone || null,
          clinic_address: address || null,
        });
        qc.invalidateQueries({ queryKey: ["settings"] });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (err) {
        toast.error({
          title: t("settings.saveError"),
          description: String(err),
        });
      } finally {
        setSaving(false);
      }
    };

    useImperativeHandle(ref, () => ({ save: handleSave }));

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setLogoPreview(reader.result as string);
        reader.readAsDataURL(file);
      }
    };

    const hasChanges =
      clinicName !== (settings?.clinic_name || "") ||
      phone !== (settings?.clinic_phone || "") ||
      address !== (settings?.clinic_address || "");

    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.clinicInfo")}</CardTitle>
          <CardDescription>{t("settings.clinicInfoDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("settings.clinicName")}
              </label>
              <div className="relative">
                <HomeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("settings.clinicNamePlaceholder")}
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("settings.contactPhone")}
              </label>
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("settings.contactPhonePlaceholder")}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("settings.supportEmail")}
              </label>
              <div className="relative">
                <SendIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("settings.supportEmailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("settings.physicalAddress")}
              </label>
              <div className="relative">
                <LocationIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("settings.physicalAddressPlaceholder")}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("settings.clinicLogo")}
              </label>
              <label className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center gap-2 bg-muted/30">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="max-h-20 mx-auto object-contain"
                  />
                ) : (
                  <>
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {t("settings.clinicLogoDrag")}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      {t("settings.clinicLogoFormats")}
                    </p>
                  </>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              {saving ? t("common.saving") : t("settings.saveChanges")}
            </Button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                <CheckCircleIcon className="h-4 w-4" />
                {t("settings.changesSaved")}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  },
);

ClinicForm.displayName = "ClinicForm";
export default ClinicForm;
