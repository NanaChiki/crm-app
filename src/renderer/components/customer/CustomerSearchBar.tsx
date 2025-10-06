/**
 * CustomerSearchBar.tsx
 *
 * 【50代向け顧客検索バーコンポーネント】
 *
 * 顧客一覧ページ専用の検索・ソート機能を提供。
 * IT不慣れな50代ユーザーでも直感的に使える設計。
 *
 * 【主な機能】
 * ✅ キーワード検索（会社名・担当者名・電話番号）
 * ✅ 検索クリア機能
 * ✅ ソート機能（更新日・会社名順）
 * ✅ 検索結果カウンター
 * ✅ ローディング表示
 *
 * 【50代配慮】
 * - 大きな検索ボタン（44px以上）
 * - 分かりやすいラベル表示
 * - Enter キーでの検索実行
 * - 明確な操作フィードバック
 */

import {
  Clear as ClearIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Sort as SortIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { useCallback, useState } from 'react';
import { SortOrder } from '../../../types';

interface CustomerSearchBarProps {
  onSearch: (keyword: string) => void;
  onClear: () => void;
  onSortChange: (sortOption: SortOrder) => void;
  selectedSort: SortOrder;
  sortOptions: SortOrder[];
  isLoading?: boolean;
  resultCount?: number;
  searchKeyword?: string;
}

// ================================
// スタイル定数
// ================================
const SEARCH_BAR_STYLES = {
  p: 3,
  mb: 3,
  borderRadius: 2,
  backgroundColor: 'background.paper',
};

const BUTTON_STYLES = {
  minHeight: 44,
  minWidth: 44,
  fontSize: '16px',
  fontWeight: 'bold',
};

// ================================
// メインコンポーネント
// ================================

/**
 * CustomerSearchBar - 顧客検索・ソート機能
 */
export const CustomerSearchBar: React.FC<CustomerSearchBarProps> = ({
  onSearch,
  onClear,
  onSortChange,
  selectedSort,
  sortOptions,
  isLoading = false,
  resultCount,
  searchKeyword = '',
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [localKeyword, setLocalKeyword] = useState(searchKeyword);

  // ================================
  // イベントハンドラー
  // ================================
  const handleSearch = useCallback(() => {
    const keyword = localKeyword.trim();
    if (keyword) {
      onSearch(keyword);
    }
  }, [localKeyword, onSearch]);

  const handleClear = useCallback(() => {
    setLocalKeyword('');
    onClear();
  }, [onClear]);

  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleSearch();
      }
    },
    [handleSearch]
  );

  const handleSortChange = useCallback(
    (event: any) => {
      const sortValue = event.target.value;
      const sortOption = sortOptions.find(
        (option) => `${option.field}-${option.direction}` === sortValue
      );

      if (sortOption) {
        onSortChange(sortOption);
      }
    },
    [sortOptions, onSortChange]
  );

  const currentSortValue = `${selectedSort.field}-${selectedSort.direction}`;

  // ================================
  // レンダリング
  // ================================
  return (
    <Paper sx={SEARCH_BAR_STYLES} elevation={1}>
      <Box sx={{ mb: 2 }}>
        {/* 検索結果カウンター */}
        {resultCount !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FilterIcon color="action" />
            <Chip
              label={`${resultCount}件の顧客`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 'bold' }}
            />
            {searchKeyword && (
              <Chip
                label={`"${searchKeyword}"で検索中`}
                color="secondary"
                size="small"
                onDelete={handleClear}
                deleteIcon={<ClearIcon />}
              />
            )}
          </Box>
        )}
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 2,
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'flex-end',
        }}>
        {/* 検索キーワード入力 */}
        <TextField
          label="顧客検索"
          placeholder="会社名、担当者名、電話番号で検索"
          value={localKeyword}
          onChange={(e) => setLocalKeyword(e.target.value)}
          onKeyDown={handleKeyPress}
          variant="outlined"
          size="medium"
          sx={{
            flex: 1,
            '& .MuiInputBase-input': {
              fontSize: '16px',
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: localKeyword ? (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setLocalKeyword('')}
                    size="small"
                    aria-label="入力をクリア">
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            },
          }}
        />

        {/* ソート選択 */}
        <FormControl
          size="medium"
          sx={{
            minWidth: isMobile ? '100%' : 200,
            '& .MuiInputBase-input': {
              fontSize: '16px',
            },
          }}>
          <InputLabel>並び順</InputLabel>
          <Select
            value={currentSortValue}
            onChange={handleSortChange}
            label="並び順"
            startAdornment={
              <SortIcon sx={{ mr: 1, color: 'action.active' }} />
            }>
            {sortOptions.map((option) => (
              <MenuItem
                key={`${option.field}-${option.direction}`}
                value={`${option.field}-${option.direction}`}
                sx={{ fontSize: '16px' }}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* 検索ボタン */}
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={!localKeyword.trim() || isLoading}
          startIcon={
            isLoading ? <CircularProgress size={20} /> : <SearchIcon />
          }
          sx={{
            ...BUTTON_STYLES,
            minWidth: isMobile ? '100%' : 100,
          }}>
          {isLoading ? '検索中...' : '検索'}
        </Button>

        {/* クリアボタン */}
        {(searchKeyword || localKeyword) && (
          <Button
            variant="outlined"
            onClick={handleClear}
            startIcon={<ClearIcon />}
            sx={{
              ...BUTTON_STYLES,
              minWidth: isMobile ? '100%' : 200,
            }}>
            クリア
          </Button>
        )}
      </Box>

      {/* 検索のヒント（50代向け） */}
      {!searchKeyword && !localKeyword && (
        <Box sx={{ mt: 2, fontSize: '14px', color: 'text.secondary' }}>
          💡 検索のコツ:
          会社名の一部（例：「田中」「建設」）や担当者名でも検索できます
        </Box>
      )}
    </Paper>
  );
};

export default CustomerSearchBar;

/**
 * 【50代ユーザー向け設計のポイント】
 *
 * 1. 操作性重視
 *    - 大きな検索ボタン（44px以上）
 *    - Enter キーでの検索実行
 *    - 明確な操作フィードバック
 *
 * 2. 情報の視認性
 *    - 検索結果件数を分かりやすく表示
 *    - 現在の検索条件をChipで表示
 *    - ローディング状態の明確な表示
 *
 * 3. 使いやすさ配慮
 *    - プレースホルダーで検索方法を説明
 *    - 検索のヒント表示
 *    - ワンクリックでの検索クリア
 *
 * 4. レスポンシブ対応
 *    - モバイルでは縦積みレイアウト
 *    - ボタンサイズの適切な調整
 *    - フォントサイズの統一（16px以上）
 */
