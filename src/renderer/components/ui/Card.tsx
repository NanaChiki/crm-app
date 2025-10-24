import { Delete, Edit, MoreVert } from "@mui/icons-material";
import {
  Box,
  CardActions,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Card as MuiCard,
  CardProps as MuiCardProps,
  styled,
  Typography,
} from "@mui/material";
import React, { forwardRef } from "react";

// 50代向けのカードスタイル
const StyledCard = styled(MuiCard)<CustomCardProps>(({ theme, cardsize }) => ({
  // サイズ調整
  borderRadius: "12px",
  padding:
    cardsize === "small" ? "16px" : cardsize === "medium" ? "20px" : "24px",

  // シャドウとボーダー
  boxShadow: theme.shadows[2],
  border: `1px solid ${theme.palette.divider}`,

  // ホバー効果
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: theme.shadows[4],
    borderColor: theme.palette.primary.light,
  },

  // フォーカス可能な場合のスタイル
  "&[tabindex]": {
    cursor: "pointer",
    "&:focus-visible": {
      outline: `3px solid ${theme.palette.primary.light}`,
      outlineOffset: "2px",
    },
  },

  // アクション部分の調整
  "& .MuiCardActions-root": {
    padding: "16px 20px",
    justifyContent: "space-between",
    borderTop: `1px solid ${theme.palette.divider}`,
  },
}));

// カスタムヘッダーコンポーネント
const CardHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "16px",

  "& .card-title": {
    fontSize: "20px",
    fontWeight: 600,
    color: theme.palette.text.primary,
    lineHeight: 1.3,
  },

  "& .card-subtitle": {
    fontSize: "14px",
    color: theme.palette.text.secondary,
    marginTop: "4px",
  },

  "& .card-actions": {
    display: "flex",
    gap: "4px",
  },
}));

// カスタムプロパティの型定義
interface CustomCardProps extends Omit<MuiCardProps, "children"> {
  cardsize?: "small" | "medium" | "large";
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  onMoreActions?: () => void;
  status?: "active" | "inactive" | "pending" | "completed" | "cancelled";
  clickable?: boolean;
  onCardClick?: () => void;
}

// ステータス色の定義
const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "success";
    case "inactive":
      return "default";
    case "pending":
      return "warning";
    case "completed":
      return "info";
    case "cancelled":
      return "error";
    default:
      return "default";
  }
};

// ステータスラベルの定義
const getStatusLabel = (status: string) => {
  switch (status) {
    case "active":
      return "アクティブ";
    case "inactive":
      return "非アクティブ";
    case "pending":
      return "保留中";
    case "completed":
      return "完了";
    case "cancelled":
      return "キャンセル";
    default:
      return status;
  }
};

// 50代向けCardコンポーネント
export const Card = forwardRef<HTMLDivElement, CustomCardProps>(
  (
    {
      title,
      subtitle,
      children,
      actions,
      onEdit,
      onDelete,
      onMoreActions,
      status,
      clickable = false,
      onCardClick,
      cardsize = "medium",
      ...props
    },
    ref,
  ) => {
    // カードアクション
    const cardActions = (
      <>
        {onEdit && (
          <IconButton
            size="large"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            aria-label="編集"
            sx={{
              padding: "12px",
              "&:hover": { backgroundColor: "primary.light", color: "white" },
            }}
          >
            <Edit />
          </IconButton>
        )}
        {onDelete && (
          <IconButton
            size="large"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="削除"
            sx={{
              padding: "12px",
              "&:hover": { backgroundColor: "error.main", color: "white" },
            }}
          >
            <Delete />
          </IconButton>
        )}
        {onMoreActions && (
          <IconButton
            size="large"
            onClick={(e) => {
              e.stopPropagation();
              onMoreActions();
            }}
            aria-label="その他のアクション"
            sx={{ padding: "12px" }}
          >
            <MoreVert />
          </IconButton>
        )}
      </>
    );

    return (
      <StyledCard
        ref={ref}
        cardsize={cardsize}
        onClick={clickable ? onCardClick : undefined}
        tabIndex={clickable ? 0 : undefined}
        role={clickable ? "button" : undefined}
        aria-label={clickable && title ? `${title}を選択` : undefined}
        onKeyDown={
          clickable
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onCardClick?.();
                }
              }
            : undefined
        }
        {...props}
      >
        <CardContent sx={{ padding: 0, "&:last-child": { paddingBottom: 0 } }}>
          {/* ヘッダー部分 */}
          {(title || subtitle || status || cardActions) && (
            <CardHeader>
              <Box>
                {title && (
                  <Typography className="card-title" component="h3">
                    {title}
                  </Typography>
                )}
                {subtitle && (
                  <Typography className="card-subtitle">{subtitle}</Typography>
                )}
                {status && (
                  <Chip
                    label={getStatusLabel(status)}
                    color={getStatusColor(status) as any}
                    size="small"
                    sx={{
                      marginTop: "8px",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                  />
                )}
              </Box>

              {(onEdit || onDelete || onMoreActions) && (
                <Box className="card-actions">{cardActions}</Box>
              )}
            </CardHeader>
          )}

          {/* 区切り線 */}
          {(title || subtitle) && children && (
            <Divider sx={{ marginBottom: "16px" }} />
          )}

          {/* メインコンテンツ */}
          {children && (
            <Box sx={{ fontSize: "16px", lineHeight: 1.6 }}>{children}</Box>
          )}
        </CardContent>

        {/* カスタムアクション */}
        {actions && <CardActions>{actions}</CardActions>}
      </StyledCard>
    );
  },
);

Card.displayName = "Card";

// 使用例のエクスポート
export type { CustomCardProps as CardProps };
