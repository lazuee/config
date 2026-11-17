export declare const lazueeConfig: {
    overrides: ({
        files: string[];
        rules: {
            "lazuee/interface-pascal-case": "error";
            "lazuee/no-ts-accessibility": "error";
            "lazuee/canonical-header-names"?: undefined;
        };
    } | {
        files: string[];
        rules: {
            "lazuee/interface-pascal-case"?: undefined;
            "lazuee/no-ts-accessibility"?: undefined;
            "lazuee/canonical-header-names": "off";
        };
    })[];
    rules: {
        "lazuee/canonical-header-names": "off";
        "lazuee/interface-pascal-case": "off";
        "lazuee/no-ts-accessibility": "off";
        /** ── lazuee ──────────────────────────────────────────────────── */
        "lazuee/prefer-alias": "error";
    };
};
export default lazueeConfig;
