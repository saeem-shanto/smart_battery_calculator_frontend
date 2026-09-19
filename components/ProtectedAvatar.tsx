"use client";

import { ReactNode, useEffect, useState } from "react";
import { fetchProtectedObjectUrl, revokeObjectUrl, type AuthRole } from "@/lib/backend-client";

export function ProtectedAvatar({
  role,
  enabled,
  version = 0,
  alt = "",
  fallback,
}: {
  role: AuthRole;
  enabled: boolean;
  version?: number;
  alt?: string;
  fallback: ReactNode;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    setSrc(null);
    if (!enabled) return () => undefined;

    fetchProtectedObjectUrl(role, "/accounts/me/avatar/")
      .then((url) => {
        objectUrl = url;
        if (active) setSrc(url);
        else revokeObjectUrl(url);
      })
      .catch(() => {
        if (active) setSrc(null);
      });

    return () => {
      active = false;
      revokeObjectUrl(objectUrl);
    };
  }, [role, enabled, version]);

  return src ? <img src={src} alt={alt} /> : <>{fallback}</>;
}
