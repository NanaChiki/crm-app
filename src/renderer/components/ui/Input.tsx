import { ErrorOutline, Visibility, VisibilityOff } from '@mui/icons-material';
import {
  InputAdornment,
  styled,
  TextField,
  TextFieldProps,
  useTheme,
} from '@mui/material';
import { forwardRef } from 'react';

// 50代向けの入力フィールドスタイル
const StyledTextField = styled(TextField)<CustomInputProps>(
  ({ theme, inputSize }) => ({
    '& .MuiInputBase-root': {
      // 最小高さとフォントサイズ
      minHeight:
        inputSize === 'small'
          ? '48px'
          : inputSize === 'medium'
          ? '56px'
          : '64px',
      fontSize:
        inputSize === 'small'
          ? '16px'
          : inputSize === 'medium'
          ? '18px'
          : '20px',

      // パディング調整
      '& .MuiInputBase-input': {
        padding:
          inputSize === 'small'
            ? '14px 16px'
            : inputSize === 'medium'
            ? '18px 20px'
            : '22px 24px',
        fontSize: 'inherit',
        lineHeight: 1.5,
      },

      // ボーダーラディウス
      borderRadius: '8px',

      // フォーカス時のスタイル強化
      '&.Mui-focused': {
        '& .MuiOutlinedInput-notchedOutline': {
          borderWidth: '3px',
          borderColor: theme.palette.primary.main,
        },
      },

      // エラー時のスタイル
      '&.Mui-error': {
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.error.main,
          borderWidth: '2px',
        },
      },

      // ホバー時のスタイル
      '&:hover:not(.Mui-focused):not(.Mui-error)': {
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.primary.light,
          borderWidth: '2px',
        },
      },
    },

    // ラベルのスタイル
    '& .MuiInputLabel-root': {
      fontSize:
        inputSize === 'small'
          ? '16px'
          : inputSize === 'medium'
          ? '18px'
          : '20px',
      fontWeight: 500,
      color: theme.palette.text.primary,

      '&.Mui-focused': {
        color: theme.palette.primary.main,
        fontWeight: 600,
      },

      '&.Mui-error': {
        color: theme.palette.error.main,
      },
    },

    // ヘルパーテキストのスタイル
    '& .MuiFormHelperText-root': {
      fontSize: '14px',
      marginTop: '8px',
      lineHeight: 1.4,

      '&.Mui-error': {
        color: theme.palette.error.main,
        fontWeight: 500,
      },
    },
  })
);

// カスタムプロパティの型定義
interface CustomInputProps extends Omit<TextFieldProps, 'size'> {
  inputSize?: 'small' | 'medium' | 'large';
  showPassword?: boolean;
  onTogglePassword?: () => void;
  isPassword?: boolean;
}

// 50代向けInputコンポーネント
export const Input = forwardRef<HTMLDivElement, CustomInputProps>(
  (
    {
      label,
      error,
      helperText,
      inputSize = 'medium',
      showPassword = false,
      onTogglePassword,
      isPassword = false,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const theme = useTheme();

    // パスワード表示切り替え用のアイコン
    const passwordAdornment = isPassword ? (
      <InputAdornment position="end">
        <div
          onClick={onTogglePassword}
          style={{
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          role="button"
          tabIndex={0}
          aria-label={showPassword ? 'パスワードを非表示' : 'パスワードを表示'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onTogglePassword?.();
            }
          }}>
          {showPassword ? <VisibilityOff /> : <Visibility />}
        </div>
      </InputAdornment>
    ) : undefined;

    // エラー時のアイコン
    const errorAdornment =
      error && !isPassword ? (
        <InputAdornment position="end">
          <ErrorOutline color="error" />
        </InputAdornment>
      ) : undefined;

    const endAdornment = passwordAdornment || errorAdornment;

    return (
      <StyledTextField
        ref={ref}
        label={label}
        error={error}
        helperText={helperText}
        inputSize={inputSize}
        type={isPassword ? (showPassword ? 'text' : 'password') : type}
        variant="outlined"
        fullWidth
        InputProps={{
          endAdornment,
          ...props.InputProps,
        }}
        // アクセシビリティ属性
        inputProps={{
          'aria-describedby': helperText
            ? `${props.id || 'input'}-helper-text`
            : undefined,
          'aria-invalid': error ? 'true' : 'false',
          ...props.inputProps,
        }}
        FormHelperTextProps={{
          id: `${props.id || 'input'}-helper-text`,
          ...props.FormHelperTextProps,
        }}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

// 使用例のエクスポート
export type { CustomInputProps as InputProps };
