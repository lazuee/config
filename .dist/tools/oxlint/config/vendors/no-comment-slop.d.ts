declare var defaultJargonWords: string[];
declare var meta: {
    name: string;
    version: string;
    namespace: string;
}, rules: {
    "max-comment-lines": {
        meta: {
            type: string;
            docs: {
                description: string;
                recommended: boolean;
                url: string;
            };
            schema: {
                type: string;
                properties: {
                    max: {
                        type: string;
                        minimum: number;
                    };
                    headerMax: {
                        type: string;
                        minimum: number;
                    };
                    jsdocSectionMax: {
                        type: string;
                        minimum: number;
                    };
                    exportDescriptionMax: {
                        type: string;
                        minimum: number;
                    };
                    exportTagMax: {
                        type: string;
                        minimum: number;
                    };
                };
                additionalProperties: boolean;
            }[];
            messages: {
                tooLong: string;
                sectionTooLong: string;
            };
        };
        create(context: any): {
            ExportNamedDeclaration: (node: any) => void;
            ExportDefaultDeclaration: (node: any) => void;
            "Program:exit"(): void;
        };
    };
    "no-banner-comment": {
        meta: {
            type: string;
            fixable: string;
            docs: {
                description: string;
                recommended: boolean;
                url: string;
            };
            schema: {
                type: string;
                properties: {
                    flagTitled: {
                        type: string;
                    };
                    minLength: {
                        type: string;
                        minimum: number;
                    };
                };
                additionalProperties: boolean;
            }[];
            messages: {
                ruler: string;
                titled: string;
            };
        };
        create(context: any): {
            Program(): void;
        };
    };
    "no-trailing-comment": {
        meta: {
            type: string;
            docs: {
                description: string;
                recommended: boolean;
                url: string;
            };
            schema: {
                type: string;
                properties: {
                    allowShort: {
                        type: string;
                        minimum: number;
                    };
                };
                additionalProperties: boolean;
            }[];
            messages: {
                trailing: string;
            };
        };
        create(context: any): {
            Program(): void;
        };
    };
    "prefer-jsdoc-for-exports": {
        meta: {
            type: string;
            fixable: string;
            docs: {
                description: string;
                recommended: boolean;
                url: string;
            };
            schema: never[];
            messages: {
                useJsdoc: string;
            };
        };
        create(context: any): {
            ExportNamedDeclaration: (node: any) => void;
            ExportDefaultDeclaration: (node: any) => void;
            "Program:exit"(): void;
        };
    };
    "prefer-jsdoc-for-members": {
        meta: {
            type: string;
            fixable: string;
            docs: {
                description: string;
                recommended: boolean;
                url: string;
            };
            schema: never[];
            messages: {
                useJsdoc: string;
            };
        };
        create(context: any): {
            TSInterfaceBody: (node: any) => void;
            TSTypeLiteral: (node: any) => void;
            ClassBody: (node: any) => void;
            TSEnumDeclaration: (node: any) => void;
            ObjectExpression: (node: any) => void;
            "Program:exit"(): void;
        };
    };
    "require-member-docs": {
        meta: {
            type: string;
            docs: {
                description: string;
                recommended: boolean;
                url: string;
            };
            schema: {
                type: string;
                properties: {
                    minDocumented: {
                        type: string;
                        minimum: number;
                    };
                    minRatio: {
                        type: string;
                        minimum: number;
                        maximum: number;
                    };
                };
                additionalProperties: boolean;
            }[];
            messages: {
                missing: string;
            };
        };
        create(context: any): {
            TSInterfaceBody: (node: any) => void;
            TSTypeLiteral: (node: any) => void;
            ClassBody: (node: any) => void;
            TSEnumDeclaration: (node: any) => void;
            "Program:exit"(): void;
        };
    };
    "multiline-jsdoc-format": {
        meta: {
            type: string;
            fixable: string;
            docs: {
                description: string;
                recommended: boolean;
                url: string;
            };
            schema: never[];
            messages: {
                openText: string;
                closeText: string;
            };
        };
        create(context: any): {
            Program(): void;
        };
    };
    "no-trailing-period": {
        meta: {
            type: string;
            fixable: string;
            docs: {
                description: string;
                recommended: boolean;
                url: string;
            };
            schema: {
                type: string;
                properties: {
                    includeJsdoc: {
                        type: string;
                    };
                    ignoreMultiSentence: {
                        type: string;
                    };
                };
                additionalProperties: boolean;
            }[];
            messages: {
                period: string;
            };
        };
        create(context: any): {
            Program(): void;
        };
    };
    "no-em-dash": {
        meta: {
            type: string;
            docs: {
                description: string;
                recommended: boolean;
                url: string;
            };
            schema: {
                type: string;
                properties: {
                    includeEnDash: {
                        type: string;
                    };
                };
                additionalProperties: boolean;
            }[];
            messages: {
                dash: string;
            };
        };
        create(context: any): {
            Program(): void;
        };
    };
    "no-prose-semicolon": {
        meta: {
            type: string;
            docs: {
                description: string;
                recommended: boolean;
                url: string;
            };
            schema: never[];
            messages: {
                semicolon: string;
            };
        };
        create(context: any): {
            Program(): void;
        };
    };
    "no-jargon": {
        meta: {
            type: string;
            hasSuggestions: boolean;
            docs: {
                description: string;
                recommended: boolean;
                url: string;
            };
            schema: {
                type: string;
                properties: {
                    words: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                    extraWords: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                    allow: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                    includeJsdoc: {
                        type: string;
                    };
                };
                additionalProperties: boolean;
            }[];
            messages: {
                jargon: string;
                jargonSuggest: string;
                replaceWith: string;
            };
        };
        create(context: any): {
            Program?: undefined;
        } | {
            Program(): void;
        };
    };
    "no-foreign-syntax": {
        meta: {
            type: string;
            docs: {
                description: string;
                recommended: boolean;
                url: string;
            };
            schema: never[];
            messages: {
                tripleSlash: string;
                xmlDoc: string;
                region: string;
            };
        };
        create(context: any): {
            Program(): void;
        };
    };
}, configs: {};
declare var src_default: {
    meta: {
        name: string;
        version: string;
        namespace: string;
    };
    rules: {
        "max-comment-lines": {
            meta: {
                type: string;
                docs: {
                    description: string;
                    recommended: boolean;
                    url: string;
                };
                schema: {
                    type: string;
                    properties: {
                        max: {
                            type: string;
                            minimum: number;
                        };
                        headerMax: {
                            type: string;
                            minimum: number;
                        };
                        jsdocSectionMax: {
                            type: string;
                            minimum: number;
                        };
                        exportDescriptionMax: {
                            type: string;
                            minimum: number;
                        };
                        exportTagMax: {
                            type: string;
                            minimum: number;
                        };
                    };
                    additionalProperties: boolean;
                }[];
                messages: {
                    tooLong: string;
                    sectionTooLong: string;
                };
            };
            create(context: any): {
                ExportNamedDeclaration: (node: any) => void;
                ExportDefaultDeclaration: (node: any) => void;
                "Program:exit"(): void;
            };
        };
        "no-banner-comment": {
            meta: {
                type: string;
                fixable: string;
                docs: {
                    description: string;
                    recommended: boolean;
                    url: string;
                };
                schema: {
                    type: string;
                    properties: {
                        flagTitled: {
                            type: string;
                        };
                        minLength: {
                            type: string;
                            minimum: number;
                        };
                    };
                    additionalProperties: boolean;
                }[];
                messages: {
                    ruler: string;
                    titled: string;
                };
            };
            create(context: any): {
                Program(): void;
            };
        };
        "no-trailing-comment": {
            meta: {
                type: string;
                docs: {
                    description: string;
                    recommended: boolean;
                    url: string;
                };
                schema: {
                    type: string;
                    properties: {
                        allowShort: {
                            type: string;
                            minimum: number;
                        };
                    };
                    additionalProperties: boolean;
                }[];
                messages: {
                    trailing: string;
                };
            };
            create(context: any): {
                Program(): void;
            };
        };
        "prefer-jsdoc-for-exports": {
            meta: {
                type: string;
                fixable: string;
                docs: {
                    description: string;
                    recommended: boolean;
                    url: string;
                };
                schema: never[];
                messages: {
                    useJsdoc: string;
                };
            };
            create(context: any): {
                ExportNamedDeclaration: (node: any) => void;
                ExportDefaultDeclaration: (node: any) => void;
                "Program:exit"(): void;
            };
        };
        "prefer-jsdoc-for-members": {
            meta: {
                type: string;
                fixable: string;
                docs: {
                    description: string;
                    recommended: boolean;
                    url: string;
                };
                schema: never[];
                messages: {
                    useJsdoc: string;
                };
            };
            create(context: any): {
                TSInterfaceBody: (node: any) => void;
                TSTypeLiteral: (node: any) => void;
                ClassBody: (node: any) => void;
                TSEnumDeclaration: (node: any) => void;
                ObjectExpression: (node: any) => void;
                "Program:exit"(): void;
            };
        };
        "require-member-docs": {
            meta: {
                type: string;
                docs: {
                    description: string;
                    recommended: boolean;
                    url: string;
                };
                schema: {
                    type: string;
                    properties: {
                        minDocumented: {
                            type: string;
                            minimum: number;
                        };
                        minRatio: {
                            type: string;
                            minimum: number;
                            maximum: number;
                        };
                    };
                    additionalProperties: boolean;
                }[];
                messages: {
                    missing: string;
                };
            };
            create(context: any): {
                TSInterfaceBody: (node: any) => void;
                TSTypeLiteral: (node: any) => void;
                ClassBody: (node: any) => void;
                TSEnumDeclaration: (node: any) => void;
                "Program:exit"(): void;
            };
        };
        "multiline-jsdoc-format": {
            meta: {
                type: string;
                fixable: string;
                docs: {
                    description: string;
                    recommended: boolean;
                    url: string;
                };
                schema: never[];
                messages: {
                    openText: string;
                    closeText: string;
                };
            };
            create(context: any): {
                Program(): void;
            };
        };
        "no-trailing-period": {
            meta: {
                type: string;
                fixable: string;
                docs: {
                    description: string;
                    recommended: boolean;
                    url: string;
                };
                schema: {
                    type: string;
                    properties: {
                        includeJsdoc: {
                            type: string;
                        };
                        ignoreMultiSentence: {
                            type: string;
                        };
                    };
                    additionalProperties: boolean;
                }[];
                messages: {
                    period: string;
                };
            };
            create(context: any): {
                Program(): void;
            };
        };
        "no-em-dash": {
            meta: {
                type: string;
                docs: {
                    description: string;
                    recommended: boolean;
                    url: string;
                };
                schema: {
                    type: string;
                    properties: {
                        includeEnDash: {
                            type: string;
                        };
                    };
                    additionalProperties: boolean;
                }[];
                messages: {
                    dash: string;
                };
            };
            create(context: any): {
                Program(): void;
            };
        };
        "no-prose-semicolon": {
            meta: {
                type: string;
                docs: {
                    description: string;
                    recommended: boolean;
                    url: string;
                };
                schema: never[];
                messages: {
                    semicolon: string;
                };
            };
            create(context: any): {
                Program(): void;
            };
        };
        "no-jargon": {
            meta: {
                type: string;
                hasSuggestions: boolean;
                docs: {
                    description: string;
                    recommended: boolean;
                    url: string;
                };
                schema: {
                    type: string;
                    properties: {
                        words: {
                            type: string;
                            items: {
                                type: string;
                            };
                        };
                        extraWords: {
                            type: string;
                            items: {
                                type: string;
                            };
                        };
                        allow: {
                            type: string;
                            items: {
                                type: string;
                            };
                        };
                        includeJsdoc: {
                            type: string;
                        };
                    };
                    additionalProperties: boolean;
                }[];
                messages: {
                    jargon: string;
                    jargonSuggest: string;
                    replaceWith: string;
                };
            };
            create(context: any): {
                Program?: undefined;
            } | {
                Program(): void;
            };
        };
        "no-foreign-syntax": {
            meta: {
                type: string;
                docs: {
                    description: string;
                    recommended: boolean;
                    url: string;
                };
                schema: never[];
                messages: {
                    tripleSlash: string;
                    xmlDoc: string;
                    region: string;
                };
            };
            create(context: any): {
                Program(): void;
            };
        };
    };
    configs: {};
};
export { configs, src_default as default, defaultJargonWords, meta, rules };
