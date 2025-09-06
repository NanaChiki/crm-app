import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],

    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // ブラウザ環境
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',

        // DOM型
        HTMLElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLFormElement: 'readonly',
        Element: 'readonly',
        Event: 'readonly',
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',

        // Node.js環境
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        global: 'readonly',
      },
    },

    plugins: {
      '@typescript-eslint': typescript,
      react: react,
    },

    rules: {
      // =============================
      // 🎯 50代向け - 学習重視の緩い設定
      // =============================

      // TypeScript関連 - 開発初期は緩和
      '@typescript-eslint/no-unused-vars': 'off', // 開発中は未使用変数を許可
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'prefer-const': 'warn', // error → warn に緩和
      '@typescript-eslint/no-var-requires': 'off',

      // React関連
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/display-name': 'off', // warn → off に緩和
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      'react/jsx-key': 'warn', // error → warn に緩和
      'react/no-unescaped-entities': 'off', // warn → off に緩和

      // 一般的なJavaScript/TypeScript
      'no-console': 'off',
      'no-debugger': 'off', // 開発中はデバッガーを許可
      'no-unused-vars': 'off',
      'no-var': 'warn', // error → warn に緩和
      eqeqeq: 'warn', // error → warn に緩和
      curly: 'warn', // error → warn に緩和
      'no-undef': 'error',

      // =============================
      // 🔧 大幅に緩和されたルール
      // =============================
      'max-len': [
        'off', // 完全にオフ - 長い行を許可
      ],
      'max-lines-per-function': [
        'off', // 完全にオフ - 長い関数を許可
      ],
      complexity: 'off', // 完全にオフ - 複雑な関数を許可

      // 重要な品質ルールのみ保持
      'no-duplicate-imports': 'warn', // error → warn に緩和
      'no-irregular-whitespace': 'error', // これは修正すべき
    },

    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  {
    ignores: [
      'dist/**',
      'out/**',
      'node_modules/**',
      '.vite/**',
      '*.config.js',
      '*.config.ts',
      'public/**',
      'build/**',
      'coverage/**',
    ],
  },
];
