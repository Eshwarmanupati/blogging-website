module.exports = {
    root: true,
    env: { browser: true, es2021: true },
    extends: [
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:react/jsx-runtime",
        "plugin:react-hooks/recommended"
    ],
    ignorePatterns: ["dist", ".eslintrc.cjs"],
    parserOptions: { ecmaVersion: "latest", sourceType: "module" },
    settings: { react: { version: "18.2" } },
    plugins: ["react-refresh"],
    rules: {
        "react-refresh/only-export-components": "off",
        "react/prop-types": "off",
        "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
        /*
            Several effects here deliberately key on a narrow set of values —
            e.g. the home feed refetches on pageState only, and the profile page
            guards on profileLoaded internally. Listing the fetch callbacks
            would re-run them on every render and loop.
        */
        "react-hooks/exhaustive-deps": "off"
    }
};
