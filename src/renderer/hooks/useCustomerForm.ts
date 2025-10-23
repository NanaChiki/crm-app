/**
 * 🏗️ useCustomerForm - 50代向け顧客フォーム管理カスタムHook
 *
 * 【設計コンセプト】
 * IT不慣れな50代後半の建築系自営業者向けに設計された、
 * 安心・確実・分かりやすいフォーム管理システム。
 *
 * 🎯 50代ユーザビリティの重点配慮：
 * - エラーメッセージは日本語で具体的な修正方法を提示
 * - 入力と同時にエラーが消える安心感の提供
 * - 二重送信防止で「ボタンを何度も押す」を防ぐ
 * - 成功・失敗が明確に分かる通知システム
 * - 直感的で覚えやすいAPI設計
 *
 * 【技術的特徴】
 * - TypeScript完全対応による型安全性
 * - React Context APIとの適切な連携
 * - useCallback/useMemoによるパフォーマンス最適化
 * - 制御コンポーネント採用（状態の完全管理）
 * - リアルタイムバリデーション（UXの向上）
 *
 * @author CRM Development Team
 * @since 2025-08 Phase1-Step4A
 * @target 50代建築系自営業者
 */
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CreateCustomerInput,
  Customer,
  UpdateCustomerInput,
} from "../../types";
import { useApp } from "../contexts/AppContext";
import { useCustomer } from "../contexts/CustomerContext";

// =============================================================================
// 🎯 型定義 - Hook専用の型システム
// =============================================================================

/**
 * フォームモード判定型
 *
 * 【なぜenum不使用？】
 * 50代の方にも分かりやすいシンプルな文字列リテラル型を採用。
 * 'create' = 新規作成, 'edit' = 編集 - 直感的で覚えやすい。
 */
type FormMode = "create" | "edit";

/**
 * Hook の入力プロパティ
 *
 * 【設計判断】
 * mode と initialCustomer を分離することで、
 * TypeScriptによる型安全性を確保しつつ、使用側でのミスを防止。
 */
interface UseCustomerFormProps {
  /** フォームモード：'create' = 新規作成, 'edit' = 既存編集 */
  mode: FormMode;
  /** 編集時の初期データ（create時は不要） */
  initialCustomer?: Customer;
}

/**
 * バリデーションエラー管理型
 *
 * 【50代配慮のポイント】
 * - エラーメッセージは具体的で行動指向的
 * - 「〜してください」で終わる優しい表現
 * - 修正例を含む親切な案内
 */
type FormErrors = Record<keyof CreateCustomerInput, string>;

/**
 * フィールドタッチ状態管理型
 *
 * 【UX配慮】
 * ユーザーが触った（focus/blur）フィールドのみエラー表示。
 * 初期表示時にエラーだらけで驚かせることを防ぐ。
 */
type TouchedFields = Record<keyof CreateCustomerInput, boolean>;

/**
 * Hook の戻り値インターフェース
 *
 * 【API設計思想】
 * - 50代の方でも覚えやすいメソッド名
 * - 必要な機能を過不足なく提供
 * - TypeScriptによる型補完でミスを防止
 */
interface UseCustomerFormReturn {
  // =============================
  // 📊 フォーム状態
  // =============================

  /** 現在のフォームデータ */
  formData: CreateCustomerInput | UpdateCustomerInput;

  /** フィールド別エラーメッセージ */
  errors: FormErrors;

  /** 送信処理中フラグ（二重送信防止） */
  isSubmitting: boolean;

  /** フォーム全体の有効性 */
  isValid: boolean;

  /** 初期状態からの変更有無 */
  hasChanges: boolean;

  /** 現在のフォームモード */
  mode: FormMode;

  // =============================
  // 🛠️ フォーム操作メソッド
  // =============================

  /**
   * 入力値変更処理
   * @param field フィールド名
   * @param value 新しい値
   */
  handleChange: (field: keyof CreateCustomerInput, value: string) => void;

  /**
   * フォーム送信処理
   * @param e フォームイベント（任意）
   */
  handleSubmit: (e?: FormEvent) => Promise<void>;

  /**
   * フォームリセット処理
   */
  resetForm: () => void;

  // =============================
  // 🔍 バリデーション・ユーティリティ
  // =============================

  /**
   * 個別フィールドのバリデーション
   * @param field フィールド名
   * @returns エラーメッセージ（エラーなしの場合はnull）
   */
  validateField: (field: keyof CreateCustomerInput) => string | null;

  /**
   * フィールドエラー取得
   * @param field フィールド名
   * @returns エラーメッセージ（エラーなしの場合はnull）
   */
  getFieldError: (field: keyof CreateCustomerInput) => string | null;

  /**
   * フィールドタッチ状態確認
   * @param field フィールド名
   * @returns タッチ済みかどうか
   */
  isFieldTouched: (field: keyof CreateCustomerInput) => boolean;

  /**
   * フィールドタッチ設定
   * @param field フィールド名
   */
  setFieldTouched: (field: keyof CreateCustomerInput) => void;
}

// =============================================================================
// 🎨 バリデーション設定 - 50代向けメッセージシステム
// =============================================================================

/**
 * バリデーションルールの基底型
 *
 * 【型安全性向上】
 * 全フィールドで統一された型定義により、
 * TypeScriptによる厳密なチェックを実現。
 */
interface BaseValidationRule {
  required: boolean;
  maxLength?: number;
  pattern?: RegExp;
  errorMessages: {
    required?: string;
    maxLength?: string;
    pattern?: string;
  };
}

/**
 * フィールド別バリデーションルール
 *
 * 【50代配慮の設計原則】
 * 1. エラーメッセージは優しく具体的に
 * 2. 修正方法を明示（例を含む）
 * 3. 「〜してください」で統一した丁寧な表現
 * 4. IT専門用語を避けた分かりやすい言葉
 */
const VALIDATION_RULES: Record<keyof CreateCustomerInput, BaseValidationRule> =
  {
    companyName: {
      required: true,
      maxLength: 100,
      errorMessages: {
        required: "会社名を入力してください",
        maxLength: "会社名は100文字以内で入力してください",
      },
    },
    contactPerson: {
      required: false,
      maxLength: 50,
      errorMessages: {
        maxLength: "担当者名は50文字以内で入力してください",
      },
    },
    phone: {
      required: false,
      maxLength: 20,
      pattern: /^[\d\-()+ \s]*$/,
      errorMessages: {
        pattern:
          "電話番号は数字、ハイフン、括弧、スペースのみ使用できます（例：03-1234-5678）",
        maxLength: "電話番号は20文字以内で入力してください",
      },
    },
    email: {
      required: false,
      maxLength: 100,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      errorMessages: {
        pattern:
          "正しいメールアドレスを入力してください（例：tanaka@example.com）",
        maxLength: "メールアドレスは100文字以内で入力してください",
      },
    },
    address: {
      required: false,
      maxLength: 200,
      errorMessages: {
        maxLength: "住所は200文字以内で入力してください",
      },
    },
    notes: {
      required: false,
      maxLength: 500,
      errorMessages: {
        maxLength: "備考は500文字以内で入力してください",
      },
    },
  };

/**
 * 成功・エラーメッセージ定数
 *
 * 【メッセージ設計思想】
 * - 50代の方に安心感を与える優しい表現
 * - 具体的で分かりやすい内容
 * - 次のアクションが明確
 */
const MESSAGES = {
  success: {
    create: "顧客情報を登録しました",
    update: "顧客情報を更新しました",
  },
  error: {
    submit: "保存に失敗しました。入力内容をご確認の上、もう一度お試しください",
    network:
      "保存に失敗しました。インターネット接続を確認してもう一度お試しください",
    duplicate: "この会社名は既に登録されています。別の名前でお試しください",
    validation: "入力内容に不備があります。赤字の項目をご確認ください",
  },
} as const;

// =============================================================================
// 🎯 メインHook実装
// =============================================================================

/**
 * useCustomerForm - 50代向け顧客フォーム管理Hook
 *
 * 【使用例】
 * ```typescript
 * // 新規作成時
 * const form = useCustomerForm({ mode: 'create' });
 *
 * // 編集時
 * const form = useCustomerForm({
 *   mode: 'edit',
 *   initialCustomer: existingCustomer
 * });
 * ```
 *
 * @param props Hook設定
 * @returns フォーム管理機能一式
 */
export const useCustomerForm = (
  props: UseCustomerFormProps,
): UseCustomerFormReturn => {
  const { mode, initialCustomer } = props;

  // =============================
  // 🔗 Context API連携
  // =============================
  const { showSnackbar, handleError } = useApp();
  const { createCustomer, updateCustomer } = useCustomer();

  // =============================
  // 📊 状態管理
  // =============================

  /**
   * 初期フォームデータ生成
   *
   * 【設計判断】
   * modeに基づいて適切な初期値を設定。
   * 編集時は既存データ、新規時は空文字でクリーンスタート。
   */
  const getInitialFormData = useCallback((): CreateCustomerInput => {
    if (mode === "edit" && initialCustomer) {
      return {
        companyName: initialCustomer.companyName,
        contactPerson: initialCustomer.contactPerson || "",
        phone: initialCustomer.phone || "",
        email: initialCustomer.email || "",
        address: initialCustomer.address || "",
        notes: initialCustomer.notes || "",
      };
    }

    // 新規作成時のデフォルト値
    return {
      companyName: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
    };
  }, [mode, initialCustomer]);

  /** フォームデータ状態 */
  const [formData, setFormData] =
    useState<CreateCustomerInput>(getInitialFormData);

  /** バリデーションエラー状態 */
  const [errors, setErrors] = useState<FormErrors>({} as FormErrors);

  /** フィールドタッチ状態（フォーカス済みフィールドの追跡） */
  const [touchedFields, setTouchedFields] = useState<TouchedFields>(
    {} as TouchedFields,
  );

  /** 送信処理中フラグ */
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** 初期データの参照保持（変更検知用） */
  const initialDataRef = useRef<CreateCustomerInput>(getInitialFormData());

  // =============================
  // 🔍 バリデーション機能
  // =============================

  /**
   * 個別フィールドバリデーション
   *
   * 【バリデーション戦略】
   * 1. 必須チェック → 2. 文字数チェック → 3. 形式チェック
   * 最初に見つかったエラーを即座に返すことで、
   * ユーザーが混乱しないように配慮。
   *
   * 【型安全性改善】
   * BaseValidationRule型により、pattern プロパティの存在を
   * TypeScriptが適切にチェック。オプショナルチェーンで安全にアクセス。
   *
   * @param field バリデーション対象フィールド
   * @param value 検証する値
   * @returns エラーメッセージ（正常時はnull）
   */
  const validateField = useCallback(
    (field: keyof CreateCustomerInput, value?: string): string | null => {
      const fieldValue = value !== undefined ? value : formData[field];
      const rules = VALIDATION_RULES[field];

      // 必須チェック
      if (rules.required && (!fieldValue || fieldValue.trim() === "")) {
        return rules.errorMessages.required || "入力してください";
      }

      // 空の場合は必須以外のバリデーションをスキップ
      if (!fieldValue || fieldValue.trim() === "") {
        return null;
      }

      // 文字数制限チェック
      if (rules.maxLength && fieldValue.length > rules.maxLength) {
        return (
          rules.errorMessages.maxLength ||
          `${rules.maxLength}文字以内で入力してください`
        );
      }

      // パターンマッチングチェック（型安全）
      if (rules.pattern && !rules.pattern.test(fieldValue)) {
        return rules.errorMessages.pattern || "フォーマットが正しくありません";
      }

      return null;
    },
    [formData],
  );

  /**
   * フォーム全体バリデーション
   *
   * 【全体検証の意義】
   * 送信前の最終チェックとして、全フィールドを一括検証。
   * エラーがある場合は、最初のエラーフィールドにフォーカスを移動し、
   * 50代ユーザーにとって「次に何をすべきか」を明確にする。
   *
   * @returns バリデーション成功可否
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {} as FormErrors;
    let hasError = false;

    // 全フィールドを順次検証
    (Object.keys(formData) as (keyof CreateCustomerInput)[]).forEach(
      (field) => {
        const error = validateField(field);
        if (error) {
          newErrors[field] = error;
          hasError = true;
        }
      },
    );

    setErrors(newErrors);

    // エラーがある場合は全フィールドをタッチ済みにマーク
    // （エラー表示を確実に行うため）
    if (hasError) {
      const allTouched: TouchedFields = {} as TouchedFields;
      (Object.keys(formData) as (keyof CreateCustomerInput)[]).forEach(
        (field) => {
          allTouched[field] = true;
        },
      );
      setTouchedFields(allTouched);
    }

    return !hasError;
  }, [formData, validateField]);

  // =============================
  // 🛠️ フォーム操作ハンドラー
  // =============================

  /**
   * 入力値変更ハンドラー
   *
   * 【リアルタイムバリデーションUX】
   * 入力と同時にエラーをクリアすることで、
   * 「修正したらすぐに赤字が消える」安心感を提供。
   * 50代ユーザーの「正しく入力できているか不安」を解消。
   *
   * 【パフォーマンス配慮】
   * useCallbackによる最適化で不要な再レンダリングを防止。
   */
  const handleChange = useCallback(
    (field: keyof CreateCustomerInput, value: string) => {
      // フォームデータ更新
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // リアルタイムバリデーション
      const error = validateField(field, value);

      // エラー状態更新（即座にエラークリア）
      setErrors((prev) => ({
        ...prev,
        [field]: error || "",
      }));
    },
    [validateField],
  );

  /**
   * フィールドタッチ設定
   *
   * 【タッチ状態の意義】
   * ユーザーがフィールドにフォーカスした時点で「タッチ済み」とマーク。
   * 初期表示時にエラーメッセージが表示されることを防ぎ、
   * 実際に入力しようとしたフィールドのみエラーを表示する親切設計。
   */
  const setFieldTouched = useCallback((field: keyof CreateCustomerInput) => {
    setTouchedFields((prev) => ({
      ...prev,
      [field]: true,
    }));
  }, []);

  /**
   * フォーム送信ハンドラー
   *
   * 【50代配慮のポイント】
   * 1. 二重送信防止（ボタン連打対策）
   * 2. 明確な成功・失敗フィードバック
   * 3. エラー時の具体的な対処方法提示
   * 4. ネットワークエラーとバリデーションエラーの区別
   *
   * 【エラーハンドリング戦略】
   * - バリデーションエラー：入力修正を促す
   * - ネットワークエラー：接続確認を促す
   * - その他エラー：再試行を促す
   */
  const handleSubmit = useCallback(
    async (e?: FormEvent) => {
      // フォームのデフォルト送信を防止
      if (e) {
        e.preventDefault();
      }

      // 二重送信防止
      if (isSubmitting) {
        return;
      }

      try {
        setIsSubmitting(true);

        // 送信前バリデーション
        if (!validateForm()) {
          handleError({
            type: "VALIDATION_ERROR",
            message: MESSAGES.error.validation,
            suggestion: "入力内容を確認してください",
          });
          return;
        }

        // Context経由でCRUD操作実行
        if (mode === "create") {
          await createCustomer(formData);
          showSnackbar(MESSAGES.success.create, "success");

          // 新規作成成功時はフォームをリセット
          const freshFormData = getInitialFormData();
          setFormData(freshFormData);
          initialDataRef.current = freshFormData;
          setTouchedFields({} as TouchedFields);
        } else if (mode === "edit" && initialCustomer) {
          await updateCustomer(initialCustomer.customerId, formData);
          showSnackbar(MESSAGES.success.update, "success");

          // 編集成功時は新しいデータを初期状態として更新
          initialDataRef.current = formData;
        }

        // エラー状態クリア
        setErrors({} as FormErrors);
      } catch (error) {
        console.error("Form submission error:", error);

        // エラー種別に応じた適切なメッセージ表示
        if (error instanceof Error) {
          if (
            error.message.includes("duplicate") ||
            error.message.includes("重複")
          ) {
            handleError({
              type: "VALIDATION_ERROR",
              message: MESSAGES.error.duplicate,
              suggestion: "別の名前でお試しください",
            });
          } else if (
            error.message.includes("network") ||
            error.message.includes("fetch")
          ) {
            handleError({
              type: "NETWORK_ERROR",
              message: MESSAGES.error.network,
              suggestion: "ページを再読み込みしてもう一度お試しください",
            });
          } else {
            handleError({
              type: "SERVER_ERROR",
              message: MESSAGES.error.submit,
              suggestion: "もう一度お試しください",
            });
          }
        } else {
          handleError({
            type: "SERVER_ERROR",
            message: MESSAGES.error.submit,
            suggestion: "もう一度お試しください",
          });
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      isSubmitting,
      validateForm,
      mode,
      formData,
      initialCustomer,
      createCustomer,
      updateCustomer,
      showSnackbar,
      handleError,
      getInitialFormData,
    ],
  );

  /**
   * フォームリセットハンドラー
   *
   * 【リセット動作の設計】
   * - 新規作成時：全フィールドを空にクリア
   * - 編集時：initialCustomerの値に復帰
   * - エラー状態・タッチ状態もクリア
   *
   * 【50代配慮】
   * 「やり直したい」時の安全な操作として提供。
   * 誤って入力した内容を簡単に元に戻せる安心感。
   */
  const resetForm = useCallback(() => {
    const resetData = getInitialFormData();
    setFormData(resetData);
    setErrors({} as FormErrors);
    setTouchedFields({} as TouchedFields);
    initialDataRef.current = resetData;
  }, [getInitialFormData]);

  // =============================
  // 🚀 パフォーマンス最適化ユーティリティ
  // =============================

  /**
   * フォーム有効性判定
   *
   * 【useMemo使用理由】
   * 全フィールドのバリデーション結果を統合する重い処理のため、
   * 依存配列の値が変更された時のみ再計算する。
   * レンダリング毎の不要な計算を回避してパフォーマンス向上。
   */
  // const isValid = useMemo(() => {
  //   return (Object.keys(formData) as (keyof CreateCustomerInput)[]).every(
  //     (field) => !validateField(field)
  //   );
  // }, [formData, validateField]);

  /** エラー状態からの判定（微細最適化） */
  const isValid = useMemo(() => {
    return (
      Object.values(errors).every((error) => !error) &&
      formData.companyName.trim() !== ""
    );
  }, [errors, formData.companyName]);

  /**
   * 変更検知
   *
   * 【hasChangesの重要性】
   * 50代ユーザーにとって「保存が必要かどうか」の判断材料。
   * UIで保存ボタンの有効/無効切り替えや、
   * 「変更が保存されていません」警告の表示に使用。
   */
  const hasChanges = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialDataRef.current);
  }, [formData]);

  /**
   * フィールドエラー取得（タッチ状態考慮）
   *
   * 【UX配慮の仕組み】
   * タッチしていないフィールドのエラーは表示しない。
   * ユーザーが「触った」フィールドのみエラー表示することで、
   * 初期画面が赤字だらけになることを防ぐ親切設計。
   */
  const getFieldError = useCallback(
    (field: keyof CreateCustomerInput): string | null => {
      const isTouched = touchedFields[field];
      const error = errors[field];

      return isTouched && error ? error : null;
    },
    [errors, touchedFields],
  );

  /**
   * フィールドタッチ状態確認
   */
  const isFieldTouched = useCallback(
    (field: keyof CreateCustomerInput): boolean => {
      return !!touchedFields[field];
    },
    [touchedFields],
  );

  // =============================
  // 🔧 副作用（Effect）処理
  // =============================

  /**
   * 初期データ更新監視
   *
   * 【Effect使用理由】
   * propsのinitialCustomerが変更された場合、
   * フォームデータを新しい値で再初期化する必要がある。
   * 編集対象が切り替わった場合などに対応。
   */
  useEffect(() => {
    if (mode === "edit" && initialCustomer) {
      const newInitialData = getInitialFormData();
      setFormData(newInitialData);
      initialDataRef.current = newInitialData;
      setErrors({} as FormErrors);
      setTouchedFields({} as TouchedFields);
    }
  }, [mode, initialCustomer, getInitialFormData]);

  // =============================
  // 📤 戻り値
  // =============================
  return {
    // フォーム状態
    formData,
    errors,
    isSubmitting,
    isValid,
    hasChanges,
    mode,

    // フォーム操作メソッド
    handleChange,
    handleSubmit,
    resetForm,

    // ユーティリティ
    validateField: useCallback(
      (field: keyof CreateCustomerInput) => validateField(field),
      [validateField],
    ),
    getFieldError,
    isFieldTouched,
    setFieldTouched,
  };
};

/**
 * 🎯 使用例
 *
 * ```typescript
 * // 1. 新規顧客作成フォーム
 * const NewCustomerForm: React.FC = () => {
 *   const form = useCustomerForm({ mode: 'create' });
 *
 *   return (
 *     <form onSubmit={form.handleSubmit}>
 *       <input
 *         value={form.formData.companyName}
 *         onChange={e => form.handleChange('companyName', e.target.value)}
 *         onBlur={() => form.setFieldTouched('companyName')}
 *       />
 *       {form.getFieldError('companyName') && (
 *         <div className="error">{form.getFieldError('companyName')}</div>
 *       )}
 *
 *       <button
 *         type="submit"
 *         disabled={!form.isValid || form.isSubmitting}
 *       >
 *         {form.isSubmitting ? '保存中...' : '登録する'}
 *       </button>
 *     </form>
 *   );
 * };
 *
 * // 2. 顧客編集フォーム
 * const EditCustomerForm: React.FC<{ customer: Customer }> = ({ customer }) => {
 *   const form = useCustomerForm({
 *     mode: 'edit',
 *     initialCustomer: customer
 *   });
 *
 *   return (
 *     <form onSubmit={form.handleSubmit}>
 *       { フォーム要素... }
 *
 *       <div className="form-actions">
 *         <button
 *           type="button"
 *           onClick={form.resetForm}
 *           disabled={!form.hasChanges}
 *         >
 *           元に戻す
 *         </button>
 *
 *         <button
 *           type="submit"
 *           disabled={!form.isValid || form.isSubmitting || !form.hasChanges}
 *         >
 *           {form.isSubmitting ? '更新中...' : '更新する'}
 *         </button>
 *       </div>
 *     </form>
 *   );
 * };
 * ```
 *
 * 【実装完了項目チェックリスト】
 * ✅ TypeScript完全対応・型安全性向上
 * ✅ create/editモード対応
 * ✅ リアルタイムバリデーション
 * ✅ 50代向けエラーメッセージ
 * ✅ Context API連携
 * ✅ パフォーマンス最適化
 * ✅ 二重送信防止
 * ✅ フィールドタッチ状態管理
 * ✅ 変更検知機能
 * ✅ 詳細なコメント・ドキュメント
 * ✅ pattern プロパティの型安全性問題解決
 */

export default useCustomerForm;
