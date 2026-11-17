import { defineConfig } from "oxlint";

export const shadcnConfig = defineConfig({
  overrides: [
    {
      files: ["**/components/**/*.{tsx,jsx}"],
      rules: {
        "shadcn/no-arbitrary-values": "off",
        "shadcn/no-restyle": "off",
        "shadcn/require-static-classes": "off",
      },
    },
    {
      /** The logo's brand colors are fixed; theme tokens shift between light and dark */
      files: ["**/logo.tsx"],
      rules: { "shadcn/no-raw-colors": "off" },
    },
  ],
  rules: {
    "shadcn/no-arbitrary-values": ["error", { allow: ["layout"] }],
    "shadcn/no-inline-styles": [
      "error",
      {
        /** Telemetry/measured layout computes waterfall positions, slider markers, and per-series/status colors; no fixed class set can represent them */
        allow: [
          "left",
          "top",
          "width",
          "height",
          "background",
          "backgroundColor",
          "borderColor",
          "color",
          "gridTemplateColumns",
          "paddingLeft",
        ],
      },
    ],
    "shadcn/no-raw-colors": "error",
    /** ── shadcn ──────────────────────────────────────────────────── */
    "shadcn/no-restyle": [
      "error",
      {
        allow: ["layout"],
        contracts: [
          // Container slots (DialogContent, SidebarGroup, …) take page-level spacing
          {
            allow: ["layout", "spacing"],
            pattern: "(Content|Header|Footer|Group|Panel)$",
          },
          // Every Card element takes page-level spacing (gap, padding)
          {
            allow: ["layout", "spacing"],
            pattern: "^Card(Action|Content|Description|Footer|Header|Title)?$",
          },
          // Skeletons take the shape of the content they stand in for
          { allow: ["layout", "shape"], pattern: "^Skeleton$" },

          {
            allow: ["layout", "bg-background", "shadow-none"],
            pattern: "^InputGroup$",
          },
          { allow: ["layout", "hover:bg-transparent"], pattern: "^TableRow$" },
          { allow: ["layout", "spacing"], pattern: "^Tabs$" },
          { allow: ["layout", "border-*"], pattern: "^Sidebar$" },
          {
            allow: ["layout", "spacing"],
            pattern: "^Sidebar(GroupContent|Header|Menu|MenuItem)$",
          },
          { allow: ["layout", "truncate"], pattern: "^BreadcrumbPage$" },
        ],
      },
    ],
    "shadcn/no-unknown-classes": "error",
    "shadcn/require-static-classes": "error",
  },
});

export default shadcnConfig;
