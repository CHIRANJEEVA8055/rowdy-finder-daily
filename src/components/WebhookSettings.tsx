import { useState } from "react";
import { Settings, Check } from "lucide-react";
import { getWebhookUrl, setWebhookUrl } from "@/lib/n8n-client";

export default function WebhookSettings() {
  const [url, setUrl] = useState(getWebhookUrl());
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setWebhookUrl(url.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const isLocalhost = /localhost|127\.0\.0\.1/.test(url);

  return (
    <div className="mb-6 rounded-lg border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <Settings className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">n8n Webhook URL</h3>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="http://localhost:5678/webhook/ui-processor"
          className="min-w-[280px] flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground"
        />
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {saved ? <Check className="h-3.5 w-3.5" /> : null}
          {saved ? "Saved" : "Save"}
        </button>
      </div>
      {isLocalhost && (
        <p className="mt-2 text-xs text-muted-foreground">
          ⚠ Localhost URLs only work when this app runs on the same machine as n8n.
          The deployed preview cannot reach <code>localhost</code> — expose n8n via
          ngrok / Cloudflare Tunnel for remote use.
        </p>
      )}
    </div>
  );
}
