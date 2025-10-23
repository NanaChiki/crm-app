import React, {
  createContext,
  ReactNode,
  useContext,
  useState,
  useCallback,
} from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button as MuiButton,
} from "@mui/material";
import { useApp } from "./AppContext";
import { FONT_SIZES } from "../constants/uiDesignSystem";

// ================================
// Window API型定義
// ================================

declare global {
  interface Window {
    backupAPI: {
      createBackup: () => Promise<{
        success: boolean;
        filePath?: string;
        message?: string;
        error?: string;
        canceled?: boolean;
      }>;
      restoreBackup: () => Promise<{
        success: boolean;
        message?: string;
        error?: string;
        canceled?: boolean;
      }>;
    };
  }
}

// ================================
// Context型定義
// ================================

interface BackupContextType {
  loading: boolean;
  createBackup: () => Promise<void>;
  restoreBackup: () => Promise<void>;
}

const BackupContext = createContext<BackupContextType | undefined>(undefined);

// ================================
// BackupProvider
// ================================

export function BackupProvider({ children }: { children: ReactNode }) {
  const { showSnackbar } = useApp();
  const [loading, setLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  /**
   * バックアップ作成
   */
  const createBackup = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const result = await window.backupAPI.createBackup();

      // キャンセルされた場合
      if (result.canceled) {
        return;
      }

      // 成功した場合
      if (result.success) {
        showSnackbar(
          result.message || "バックアップを作成しました",
          "success",
          8000,
        );
      } else {
        // エラーの場合
        const errorMessage =
          result.error ||
          "バックアップの作成に失敗しました。もう一度お試しください。";
        showSnackbar(errorMessage, "error");
        console.error("❌ バックアップ作成失敗:", result.error);
      }
    } catch (error) {
      console.error("❌ バックアップ作成例外エラー:", error);
      showSnackbar(
        "バックアップの作成中にエラーが発生しました。\nアプリを再起動してもう一度お試しください。",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  /**
   * バックアップから復元（確認ダイアログ表示）
   */
  const restoreBackup = useCallback(async (): Promise<void> => {
    setConfirmDialogOpen(true);
  }, []);

  /**
   * 復元実行
   */
  const executeRestore = useCallback(async (): Promise<void> => {
    setConfirmDialogOpen(false);
    setLoading(true);

    try {
      const result = await window.backupAPI.restoreBackup();

      // キャンセルされた場合
      if (result.canceled) {
        return;
      }

      // 成功した場合
      if (result.success) {
        showSnackbar(
          result.message || "バックアップから復元しました",
          "success",
          10000,
        );
      } else {
        // エラーの場合
        const errorMessage =
          result.error || "復元に失敗しました。もう一度お試しください。";
        showSnackbar(errorMessage, "error");
        console.error("❌ バックアップ復元失敗:", result.error);
      }
    } catch (error) {
      console.error("❌ バックアップ復元例外エラー:", error);
      showSnackbar(
        "復元中にエラーが発生しました。\nアプリを再起動してもう一度お試しください。",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  return (
    <BackupContext.Provider
      value={{
        loading,
        createBackup,
        restoreBackup,
      }}
    >
      {children}

      {/* 確認ダイアログ */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontSize: FONT_SIZES.cardTitle.desktop,
            fontWeight: "bold",
          }}
        >
          バックアップから復元
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            sx={{
              fontSize: FONT_SIZES.body.desktop,
              lineHeight: 1.8,
              color: "text.primary",
            }}
          >
            現在のすべてのデータが削除され、
            <br />
            バックアップファイルのデータに置き換わります。
            <br />
            <br />
            この操作は取り消せません。
            <br />
            （復元前に自動バックアップが作成されます）
            <br />
            <br />
            続行しますか？
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MuiButton
            onClick={() => setConfirmDialogOpen(false)}
            sx={{ fontSize: FONT_SIZES.body.desktop }}
          >
            キャンセル
          </MuiButton>
          <MuiButton
            onClick={executeRestore}
            variant="contained"
            color="error"
            sx={{ fontSize: FONT_SIZES.body.desktop }}
          >
            復元する
          </MuiButton>
        </DialogActions>
      </Dialog>
    </BackupContext.Provider>
  );
}

// ================================
// useBackup Hook
// ================================

export function useBackup() {
  const context = useContext(BackupContext);
  if (!context) {
    throw new Error("useBackup must be used within BackupProvider");
  }
  return context;
}
