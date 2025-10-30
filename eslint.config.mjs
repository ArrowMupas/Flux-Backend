import js from '@eslint/js';
import globals from 'globals';
import nodePlugin from 'eslint-plugin-n';
import securityPlugin from 'eslint-plugin-security';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    {
        files: ['**/*.{js,cjs}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: globals.node,
        },
        plugins: {
            js,
            n: nodePlugin,
            security: securityPlugin,
        },
        rules: {
            ...js.configs.recommended.rules,
            ...nodePlugin.configs.recommended.rules,
            ...securityPlugin.configs.recommended.rules,

            'no-var': 'error',
            'prefer-const': 'error',
            eqeqeq: ['error', 'always'],
            curly: ['error', 'multi-line'],
            'no-console': 'warn',
            'no-debugger': 'error',
            'consistent-return': 'warn',
            'no-duplicate-imports': 'error',
            'object-shorthand': ['warn', 'always'],
            'prefer-template': 'warn',
            'no-useless-catch': 'warn',
            'no-unused-vars': ['warn', { vars: 'all', args: 'after-used', ignoreRestSiblings: false }],
        },
    },
]);
