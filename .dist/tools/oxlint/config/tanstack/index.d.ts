export declare const tanstackConfig: {
    overrides: ({
        files: string[];
        rules: {
            /**
             * Route option types are order-sensitive (`head`/`component` infer
             * `loaderData` from properties declared before them), so alphabetical
             * ordering conflicts with tanstack-start-route-property-order
             */
            "sort-keys": "off";
            "unicorn/filename-case": "off";
            "unicorn/no-abusive-eslint-disable"?: undefined;
        };
    } | {
        files: string[];
        rules: {
            /**
             * Route option types are order-sensitive (`head`/`component` infer
             * `loaderData` from properties declared before them), so alphabetical
             * ordering conflicts with tanstack-start-route-property-order
             */
            "sort-keys"?: undefined;
            "unicorn/filename-case": "off";
            "unicorn/no-abusive-eslint-disable": "off";
        };
    })[];
};
