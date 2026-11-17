export declare const shadcnConfig: {
    overrides: ({
        files: string[];
        rules: {
            "shadcn/no-arbitrary-values": "off";
            "shadcn/no-restyle": "off";
            "shadcn/require-static-classes": "off";
            "shadcn/no-raw-colors"?: undefined;
        };
    } | {
        /** The logo's brand colors are fixed; theme tokens shift between light and dark */
        files: string[];
        rules: {
            "shadcn/no-arbitrary-values"?: undefined;
            "shadcn/no-restyle"?: undefined;
            "shadcn/require-static-classes"?: undefined;
            "shadcn/no-raw-colors": "off";
        };
    })[];
    rules: {
        "shadcn/no-arbitrary-values": ["error", {
            allow: "layout"[];
        }];
        "shadcn/no-inline-styles": ["error", {
            /** Telemetry/measured layout computes waterfall positions, slider markers, and per-series/status colors; no fixed class set can represent them */
            allow: ("background" | "backgroundColor" | "borderColor" | "color" | "gridTemplateColumns" | "height" | "left" | "paddingLeft" | "top" | "width")[];
        }];
        "shadcn/no-raw-colors": "error";
        /** ── shadcn ──────────────────────────────────────────────────── */
        "shadcn/no-restyle": ["error", {
            allow: "layout"[];
            contracts: {
                allow: string[];
                pattern: string;
            }[];
        }];
        "shadcn/no-unknown-classes": "error";
        "shadcn/require-static-classes": "error";
    };
};
export default shadcnConfig;
