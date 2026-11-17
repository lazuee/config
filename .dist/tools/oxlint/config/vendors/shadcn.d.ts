declare function projectFor(fromFile: any): any;
declare function themeFileFor(fromFile: any): any;
declare function colorTokensFor(fromFile: any): any;
declare function componentsFor(fromFile: any, ui?: never[]): any;
declare function variantDefinitionsOf(file: any): any;
declare function variantNamesFor(file: any, component: any): any;
declare var plugin: {
    meta: {
        name: string;
    };
    rules: {
        "no-restyle": any;
        "no-raw-colors": any;
        "no-arbitrary-values": any;
        "no-inline-styles": any;
        "require-static-classes": any;
        "no-unknown-classes": any;
    };
};
declare var project: {
    projectFor: typeof projectFor;
    themeFileFor: typeof themeFileFor;
    colorTokensFor: typeof colorTokensFor;
    componentsFor: typeof componentsFor;
    variantDefinitionsOf: typeof variantDefinitionsOf;
    variantNamesFor: typeof variantNamesFor;
};
declare var src_default: {
    meta: {
        name: string;
    };
    rules: {
        "no-restyle": any;
        "no-raw-colors": any;
        "no-arbitrary-values": any;
        "no-inline-styles": any;
        "require-static-classes": any;
        "no-unknown-classes": any;
    };
};
export { src_default as default, plugin, project };
