import React from "react";
import { useTranslation } from "react-i18next";
import { useUpdater } from "../../hooks/useUpdater";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "../../components/ui";

const About: React.FC = () => {
  const { t } = useTranslation();
  const updater = useUpdater();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground mb-4">
        {t("nav.about")}
      </h2>

      <Card>
        <CardHeader>
          <CardTitle>Khwaja Dental & Implants Clinic</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Version</p>
              <p className="font-medium">0.2.0</p>
            </div>
            <div>
              <p className="text-muted-foreground">Framework</p>
              <p className="font-medium">Tauri v2 + React 19</p>
            </div>
            <div>
              <p className="text-muted-foreground">Database</p>
              <p className="font-medium">SQLite (WAL mode)</p>
            </div>
            <div>
              <p className="text-muted-foreground">Build</p>
              <p className="font-medium">{import.meta.env.PROD ? "Production" : "Development"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Updates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {updater.checking && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Checking for updates...
            </div>
          )}
          {updater.available && !updater.downloading && !updater.downloaded && (
            <div className="flex items-center gap-3">
              <Badge variant="info">v{updater.version} available</Badge>
              <Button size="sm" onClick={updater.downloadUpdate}>
                Download Update
              </Button>
            </div>
          )}
          {updater.downloading && (
            <div className="space-y-2">
              <p className="text-sm">Downloading update... {updater.progress}%</p>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${updater.progress}%` }}
                />
              </div>
            </div>
          )}
          {updater.downloaded && (
            <div className="flex items-center gap-3">
              <Badge variant="success">Downloaded</Badge>
              <Button size="sm" onClick={updater.installUpdate}>
                Restart & Install
              </Button>
            </div>
          )}
          {!updater.checking && !updater.available && (
            <p className="text-sm text-muted-foreground">
              You are running the latest version.
            </p>
          )}
          {updater.error && (
            <p className="text-sm text-red-500">
              Update check failed: {updater.error}
            </p>
          )}
          <Button variant="outline" size="sm" onClick={updater.checkForUpdates}>
            Check Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default About;
