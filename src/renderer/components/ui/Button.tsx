import {
  Button as MuiButton,
  ButtonProps as MuiButtonProps,
  styled,
} from '@mui/material';
import { forwardRef } from 'react';

// 50代向けのボタンスタイル
const StyledButton = styled(MuiButton)<CustomButtonProps>(
  ({ theme, size }) => ({
    // 最小サイズ要件: 44px x 44px
    minHeight: size === 'small' ? '44px' : size === 'medium' ? '52px' : '60px',
    minWidth: '44px',

    // フォントサイズ: 16px以上
    fontSize: size === 'small' ? '16px' : size === 'medium' ? '18px' : '20px',
    fontWeight: 600,

    // パディング調整
    padding:
      size === 'small'
        ? '12px 24px'
        : size === 'medium'
        ? '16px 32px'
        : '20px 40px',

    // ボーダーラディウス
    borderRadius: '8px',

    // フォーカス・ホバー時のアクセシビリティ強化
    '&:focus-visible': {
      outline: `3px solid ${theme.palette.primary.light}`,
      outlineOffset: '2px',
    },

    // ホバー時のコントラスト強化
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: theme.shadows[4],
    },

    // アクティブ状態
    '&:active': {
      transform: 'translateY(0)',
    },

    // 無効状態のコントラスト
    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
    },

    // アイコンとテキストの間隔
    '& .MuiButton-startIcon': {
      marginRight: '8px',
    },
    '& .MuiButton-endIcon': {
      marginLeft: '8px',
    },
  })
);

// カスタムプロパティの型定義
interface CustomButtonProps extends Omit<MuiButtonProps, 'size'> {
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  fullWidth?: boolean;
}

// 50代向けButtonコンポーネント
export const Button = forwardRef<HTMLButtonElement, CustomButtonProps>(
  (
    {
      children,
      loading = false,
      disabled,
      size = 'medium',
      variant = 'contained',
      ...props
    },
    ref
  ) => {
    return (
      <StyledButton
        ref={ref}
        size={size}
        variant={variant}
        disabled={disabled || loading}
        {...props}
        // アクセシビリティ属性
        aria-label={
          props['aria-label'] ||
          (typeof children === 'string' ? children : undefined)
        }
        role="button"
        tabIndex={disabled || loading ? -1 : 0}>
        {loading ? 'を読み込み中...' : children}
      </StyledButton>
    );
  }
);

Button.displayName = 'Button';

// デフォルトテーマのプライマリ色をカスタマイズ
export const primaryColor = '#2563eb'; // 要件で指定された色

// 使用例のエクスポート
export type { CustomButtonProps as ButtonProps };
