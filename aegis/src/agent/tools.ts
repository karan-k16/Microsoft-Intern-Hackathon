// Mock enterprise-agent tool registry — used for labeling + scope checks in the UI.

export interface ToolSpec {
  name: string;
  label: string;
  description: string;
  scope: "internal" | "external";
  icon: string;
}

export const TOOLS: Record<string, ToolSpec> = {
  read_kb: {
    name: "read_kb",
    label: "read_kb",
    description: "Read the internal knowledge base",
    scope: "internal",
    icon: "📚",
  },
  read_db: {
    name: "read_db",
    label: "read_db",
    description: "Query the customer database",
    scope: "internal",
    icon: "🗄️",
  },
  lookup_order: {
    name: "lookup_order",
    label: "lookup_order",
    description: "Look up an order by id",
    scope: "internal",
    icon: "🧾",
  },
  send_email: {
    name: "send_email",
    label: "send_email",
    description: "Send an email (egress)",
    scope: "external",
    icon: "✉️",
  },
  fetch_url: {
    name: "fetch_url",
    label: "fetch_url",
    description: "Fetch an external URL (egress)",
    scope: "external",
    icon: "🌐",
  },
  summarize: {
    name: "summarize",
    label: "summarize",
    description: "Summarize provided text",
    scope: "internal",
    icon: "📝",
  },
};

export function toolSpec(name: string): ToolSpec {
  return (
    TOOLS[name] ?? {
      name,
      label: name,
      description: "Unknown tool",
      scope: "external",
      icon: "⚙️",
    }
  );
}
