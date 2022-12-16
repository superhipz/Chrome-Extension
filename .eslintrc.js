module.exports = {
  root: true,
  env: {
    node: true,
    webextensions: true,
  },
  extends: ["plugin:vue/essential", "eslint:recommended"],
  parserOptions: {
    parser: "babel-eslint",
  },
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-unused-vars": "warn",
    "no-useless-escape": "off",
    "no-undef": "off",
    "no-unreachable": "off",
    "vue/no-unused-vars": "off",
    "vue/no-use-v-if-with-v-for": "off",
    "vue/no-unused-components": "off",
  },
};
