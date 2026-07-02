export type ExternalUser = {
  id: string;
  name: string;
  organisation: string;
  username: string;
  lastLoggedIn: string | null;
  isActive: boolean;
  redirectPath: string;
};

type DbPlatformUser = {
  id: string;
  username: string;
  display_name: string;
  user_type: string;
  redirect_path: string;
  client_name: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

export function mapExternalUser(row: DbPlatformUser): ExternalUser {
  return {
    id: row.id,
    name: row.display_name,
    organisation: row.client_name ?? "",
    username: row.username,
    lastLoggedIn: row.last_login_at,
    isActive: row.is_active,
    redirectPath: row.redirect_path,
  };
}

export function formatExternalUserLastLogin(value: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function createBlankExternalUserInput() {
  return {
    name: "",
    organisation: "",
    username: "",
    redirectPath: "/client/venturi",
  };
}
