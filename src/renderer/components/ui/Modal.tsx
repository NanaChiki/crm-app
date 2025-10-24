import { CheckCircle, Close, Error, Info, Warning } from "@mui/icons-material";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogProps,
  DialogTitle,
  IconButton,
  styled,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { forwardRef } from "react";
import { Button } from "./Button";

// 50代向けのモーダルスタイル
const StyledDialog = styled(Dialog)<CustomModalProps>(
  ({ theme, modalsize }) => ({
    "& .MuiDialog-paper": {
      // サイズ調整
      minWidth:
        modalsize === "small"
          ? "500px"
          : modalsize === "medium"
            ? "550px"
            : "650px",
      maxWidth:
        modalsize === "small"
          ? "550px"
          : modalsize === "medium"
            ? "650px"
            : "700px",
      borderRadius: "16px",
      padding: "8px",

      // モバイル対応
      [theme.breakpoints.down("sm")]: {
        minWidth: "90vw",
        maxWidth: "95vw",
        margin: "16px",
      },
    },

    // バックドロップの調整
    "& .MuiBackdrop-root": {
      backgroundColor: "rgba(0, 0, 0, 0.6)",
    },
  }),
);

// カスタムダイアログタイトル
const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  fontSize: "24px",
  fontWeight: 600,
  padding: "24px 24px 16px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: `1px solid ${theme.palette.divider}`,

  "& .title-content": {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  "& .close-button": {
    padding: "8px",
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
}));

// カスタムダイアログコンテンツ
const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: "24px",
  marginTop: "16px",
  fontSize: "16px",
  lineHeight: 1.6,

  "& .content-text": {
    marginBottom: "16px",
  },

  "& .content-details": {
    backgroundColor: theme.palette.background.default,
    padding: "16px",
    borderRadius: "8px",
    border: `1px solid ${theme.palette.divider}`,
  },
}));

// カスタムダイアログアクション
const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: "16px 24px 24px",
  gap: "12px",
  borderTop: `1px solid ${theme.palette.divider}`,

  "& .MuiButton-root": {
    minWidth: "120px",
  },
}));

// アイコンタイプの定義
type IconType = "warning" | "info" | "success" | "error";

// アイコンコンポーネント
const getIcon = (type: IconType, color?: string) => {
  const iconProps = {
    sx: {
      fontSize: "28px",
      color:
        color ||
        (type === "warning"
          ? "warning.main"
          : type === "info"
            ? "info.main"
            : type === "success"
              ? "success.main"
              : "error.main"),
    },
  };

  switch (type) {
    case "warning":
      return <Warning {...iconProps} />;
    case "info":
      return <Info {...iconProps} />;
    case "success":
      return <CheckCircle {...iconProps} />;
    case "error":
      return <Error {...iconProps} />;
    default:
      return <Info {...iconProps} />;
  }
};

// カスタムプロパティの型定義
interface CustomModalProps extends Omit<DialogProps, "title"> {
  modalsize?: "small" | "medium" | "large";
  title?: string;
  children?: React.ReactNode;
  onClose?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmColor?:
    | "primary"
    | "secondary"
    | "error"
    | "warning"
    | "info"
    | "success";
  showCloseButton?: boolean;
  iconType?: IconType;
  loading?: boolean;
  details?: React.ReactNode;
}

// 50代向けModalコンポーネント
export const Modal = forwardRef<HTMLDivElement, CustomModalProps>(
  (
    {
      title,
      children,
      onClose,
      onConfirm,
      onCancel,
      confirmText = "確認",
      cancelText = "キャンセル",
      confirmColor = "primary",
      showCloseButton = true,
      iconType,
      loading = false,
      details,
      modalsize = "medium",
      ...props
    },
    ref,
  ) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    // キャンセル処理
    const handleCancel = () => {
      onCancel?.();
      onClose?.();
    };

    // 確認処理
    const handleConfirm = () => {
      onConfirm?.();
    };

    return (
      <StyledDialog
        ref={ref}
        modalsize={modalsize}
        onClose={onClose}
        fullScreen={isMobile}
        maxWidth={false}
        {...props}
        // アクセシビリティ属性
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        {/* ヘッダー */}
        {title && (
          <StyledDialogTitle id="modal-title">
            <Box className="title-content">
              {iconType && getIcon(iconType)}
              <Typography variant="h6" component="span">
                {title}
              </Typography>
            </Box>

            {showCloseButton && (
              <IconButton
                className="close-button"
                onClick={onClose}
                aria-label="モーダルを閉じる"
                size="large"
              >
                <Close />
              </IconButton>
            )}
          </StyledDialogTitle>
        )}

        {/* コンテンツ */}
        {(children || details) && (
          <StyledDialogContent id="modal-description">
            {children && <Box className="content-text">{children}</Box>}

            {details && <Box className="content-details">{details}</Box>}
          </StyledDialogContent>
        )}

        {/* アクション */}
        {(onConfirm || onCancel) && (
          <StyledDialogActions>
            {onCancel && (
              <Button
                variant="outlined"
                size="large"
                onClick={handleCancel}
                disabled={loading}
                aria-label={cancelText}
              >
                {cancelText}
              </Button>
            )}

            {onConfirm && (
              <Button
                variant="contained"
                size="large"
                color={confirmColor}
                onClick={handleConfirm}
                loading={loading}
                aria-label={confirmText}
                autoFocus
              >
                {confirmText}
              </Button>
            )}
          </StyledDialogActions>
        )}
      </StyledDialog>
    );
  },
);

Modal.displayName = "Modal";

// 便利な確認モーダルのエクスポート
export const ConfirmModal: React.FC<
  Omit<CustomModalProps, "iconType"> & {
    type?: "delete" | "warning" | "info";
  }
> = ({ type = "warning", ...props }) => {
  const getConfirmProps = () => {
    switch (type) {
      case "delete":
        return {
          iconType: "error" as IconType,
          confirmColor: "error" as const,
          confirmText: "削除",
          title: props.title || "削除の確認",
        };
      case "warning":
        return {
          iconType: "warning" as IconType,
          confirmColor: "warning" as const,
          confirmText: "実行",
          title: props.title || "確認",
        };
      case "info":
        return {
          iconType: "info" as IconType,
          confirmColor: "primary" as const,
          confirmText: "OK",
          title: props.title || "情報",
        };
      default:
        return {};
    }
  };

  return <Modal {...getConfirmProps()} {...props} />;
};

// 使用例のエクスポート
export type { CustomModalProps as ModalProps };
