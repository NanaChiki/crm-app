/**
 * ServiceRecordList.tsx
 *
 * 【50代向けサービス履歴管理コンポーネント】
 *
 * 顧客のサービス履歴を年度別にグループ化して表示し、
 * 新規追加・編集・削除機能を提供する専用コンポーネント。
 * 建築系自営業者の業務パターンに最適化された設計。
 *
 * 【主な機能】
 * ✅ 年度別グループ化表示（アコーディオン形式）
 * ✅ サービス履歴追加・編集・削除機能
 * ✅ 年度別売上集計表示
 * ✅ 月別フィルタリング機能
 * ✅ useServiceRecordsフック完全連携
 * ✅ 建築系サービス種別プリセット
 *
 * 【50代配慮】
 * - 大きなボタン・操作領域（44px以上）
 * - 年度別の見やすいグループ化
 * - 金額・日付の分かりやすい表示（和暦対応）
 * - 直感的なアイコン・色使い
 * - 操作確認ダイアログ
 */
import {
  Add as AddIcon,
  CalendarToday as CalendarIcon,
  Clear as ClearIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterListIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { useCallback, useMemo, useState } from 'react';

// Custom Hooks
import { useApp } from '../../contexts/AppContext';
import { useServiceRecords } from '../../hooks/useServiceRecords';

// Components
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

// Types
import {
  CreateServiceRecordInput,
  ServiceRecordWithCustomer,
  UpdateServiceRecordInput,
} from '../../../types';

// ================================
// 型定義・定数
// ================================
interface ServiceRecordListProps {
  /** 表示対象の顧客ID */
  customerId: number;
  /** サービス履歴Hook（親から渡される、データ同期用） */
  serviceRecordsHook?: ReturnType<typeof useServiceRecords>;
}

interface ServiceFormData {
  serviceDate: string;
  serviceType: string;
  serviceDescription: string;
  amount: string;
}

interface DialogState {
  isOpen: boolean;
  mode: 'add' | 'edit';
  editingRecord?: ServiceRecordWithCustomer;
}

interface FilterState {
  selectedYear: number | 'all';
  selectedMonth: number | 'all';
  selectedServiceType: string | 'all';
}

// ================================
// 建築系サービス種別定義
// ================================

/** よく使われるサービス種別（50代向けプリセット） */
const COMMON_SERVICE_TYPES = [
  '外壁塗装',
  '屋根修理',
  '屋根塗装',
  '防水工事',
  '配管工事',
  '電気工事',
  '内装リフォーム',
  '水回りリフォーム',
  '定期点検',
  '緊急修理',
  'エアコン工事',
  'その他',
] as const;

/** サービス種別アイコンマッピング */
const SERVICE_TYPE_ICONS = {
  外壁塗装: '🎨',
  屋根修理: '🏠',
  屋根塗装: '🎨',
  防水工事: '💧',
  配管工事: '🔧',
  電気工事: '⚡',
  内装リフォーム: '🏡',
  水回りリフォーム: '🚿',
  定期点検: '🔍',
  緊急修理: '🚨',
  エアコン工事: '❄️',
  その他: '🛠️',
} as const;

// ================================
// エラーメッセージ定義（50代配慮）
// ================================
const MESSAGES = {
  success: {
    add: 'サービス履歴を追加しました。',
    update: 'サービス履歴を更新しました。',
    delete: 'サービス履歴を削除しました。',
  },
  error: {
    add: 'サービス履歴の追加に失敗しました。',
    update: 'サービス履歴の更新に失敗しました。',
    delete: 'サービス履歴の削除に失敗しました。',
    invalidDate: '正しい日付を入力してください。',
    invalidAmount: '正しい金額を入力してください（数字のみ）。',
    requiredFields: '必須項目を入力してください。',
  },
  confirm: {
    delete: 'このサービス履歴を削除してもよろしいですか？',
  },
  info: {
    noServices: 'サービス履歴がありません。最初の履歴を登録しましょう。',
    filterActive: 'フィルターが適用されています。',
    allYears: '全年度',
    allMonths: '全月',
    allServiceTypes: '全種別',
  },
} as const;

// ================================
// ユーティリティ関数
// ================================

/**
 * 日付フォーマット（50代向け和暦表示）
 */
const formatDateShort = (date: Date): string => {
  return new Intl.DateTimeFormat('ja-JP-u-ca-japanese', {
    era: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date);
};

/**
 * 金額フォーマット（50代向け分かりやすい表示）
 */
const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * サービス履歴の年度別グループ化
 */
const groupServicesByYear = (
  services: ServiceRecordWithCustomer[]
): Record<number, ServiceRecordWithCustomer[]> => {
  return services.reduce(
    (groups, service) => {
      const year = new Date(service.serviceDate).getFullYear();
      if (!groups[year]) {
        groups[year] = [];
      }
      groups[year].push(service);
      return groups;
    },
    {} as Record<number, ServiceRecordWithCustomer[]>
  );
};

/**
 * 年度別売上集計
 */
const calculateYearlyTotal = (
  services: ServiceRecordWithCustomer[]
): Record<number, number> => {
  const yearlyGroups = groupServicesByYear(services);

  return Object.entries(yearlyGroups).reduce(
    (totals, [year, yearServices]) => {
      const total = yearServices.reduce((sum, service) => {
        return sum + (service.amount ? Number(service.amount) : 0);
      }, 0);
      totals[Number(year)] = total;
      return totals;
    },
    {} as Record<number, number>
  );
};

/**
 * 月名取得
 */
const getMonthName = (month: number): string => {
  const monthNames = [
    '1月',
    '2月',
    '3月',
    '4月',
    '5月',
    '6月',
    '7月',
    '8月',
    '9月',
    '10月',
    '11月',
    '12月',
  ];
  return monthNames[month - 1];
};

// ================================
// メインコンポーネント
// ================================
export const ServiceRecordList: React.FC<ServiceRecordListProps> = ({
  customerId,
  serviceRecordsHook: providedHook,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // ================================
  // 状態管理
  // ================================
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    mode: 'add',
  });

  const [serviceFormData, setServiceFormData] = useState<ServiceFormData>({
    serviceDate: new Date().toISOString().split('T')[0],
    serviceType: '',
    serviceDescription: '',
    amount: '',
  });

  const [filterState, setFilterState] = useState<FilterState>({
    selectedYear: 'all',
    selectedMonth: 'all',
    selectedServiceType: 'all',
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    isOpen: boolean;
    recordId?: number;
  }>({
    isOpen: false,
  });

  // ================================
  // Context API連携
  // ================================

  /**
   * サービス履歴Hook
   *
   * 【修正】親から渡されたHookがあればそれを使用し、
   * なければ自分でuseServiceRecordsを呼び出す。
   * これにより、CustomerDetailPageでの一元管理と、
   * 単独使用（将来的に）の両方に対応。
   */
  const localHook = useServiceRecords({
    customerId,
    autoLoad: !providedHook, // 親から渡されていない場合のみ自動読み込み
  });

  const {
    serviceRecords,
    createServiceRecord,
    updateServiceRecord,
    deleteServiceRecord,
    loading,
  } = providedHook || localHook;

  const { showSnackbar } = useApp();

  // ================================
  // 計算値・メモ化データ
  // ================================

  /**
   * フィルタリング済みサービス履歴
   */
  const filteredRecords = useMemo(() => {
    let filtered = [...serviceRecords];

    // 年度別フィルタ
    if (filterState.selectedYear !== 'all') {
      filtered = filtered.filter(
        (record) =>
          new Date(record.serviceDate).getFullYear() ===
          filterState.selectedYear
      );
    }

    // 月フィルタ
    if (filterState.selectedMonth !== 'all') {
      filtered = filtered.filter(
        (record) =>
          new Date(record.serviceDate).getMonth() + 1 ===
          filterState.selectedMonth
      );
    }

    // サービス種別フィルタ
    if (filterState.selectedServiceType !== 'all') {
      filtered = filtered.filter(
        (record) =>
          record.serviceType
            ?.toLowerCase()
            .includes(filterState.selectedServiceType.toLowerCase())
      );
    }

    return filtered;
  }, [serviceRecords, filterState]);

  /**
   * フィルタリング済み履歴の年度別グループ化
   * フィルタリングされた履歴を年度別にグループ化
   */
  const filteredServicesByYear = useMemo(() => {
    return groupServicesByYear(filteredRecords);
  }, [filteredRecords]);

  /**
   * 年度別売上集計 (フィルタリング済み)
   * フィルタリングされた履歴の年度別売上集計
   */
  const filteredYearlyTotals = useMemo(() => {
    return calculateYearlyTotal(filteredRecords);
  }, [filteredRecords]);

  /**
   * フィルタオプション用データ
   */
  const filterOptions = useMemo(() => {
    const years = Array.from(
      new Set(
        serviceRecords.map((record) =>
          new Date(record.serviceDate).getFullYear()
        )
      )
    ).sort((a, b) => b - a);

    const serviceTypes = Array.from(
      new Set(
        serviceRecords.map((record) => record.serviceType).filter(Boolean)
      )
    ).sort();

    return { years, serviceTypes };
  }, [serviceRecords]);

  /**
   * レスポンシブ設定 (ButtonSize, cardSpacingは使わない可能性があるが一応CustomerFormと同じものを採用)
   */
  const responsiveSettings = useMemo(
    () => ({
      buttonSize: isMobile ? 'large' : 'medium',
      fontSize: isMobile ? '20px' : '22px',
      contentPadding: isMobile ? 2 : 3,
      cardSpacing: isMobile ? 2 : 3,
    }),
    [isMobile]
  );

  /**
   * フィルタが有効かどうか
   */
  const hasActiveFilters = useMemo(() => {
    return (
      filterState.selectedYear !== 'all' ||
      filterState.selectedMonth !== 'all' ||
      filterState.selectedServiceType !== 'all'
    );
  }, [filterState]);

  // ================================
  // イベントハンドラー
  // ================================
  /**
   * サービス履歴追加ダイアログを開く
   */
  const handleAddService = useCallback(() => {
    setServiceFormData({
      serviceDate: new Date().toISOString().split('T')[0],
      serviceType: '',
      serviceDescription: '',
      amount: '',
    });
    setDialogState({ isOpen: true, mode: 'add' });
  }, []);

  /**
   * サービス履歴編集ダイアログを開く
   */
  const handleEditService = useCallback((record: ServiceRecordWithCustomer) => {
    setServiceFormData({
      serviceDate: new Date(record.serviceDate).toISOString().split('T')[0],
      serviceType: record.serviceType || '',
      serviceDescription: record.serviceDescription || '',
      amount: record.amount ? String(record.amount) : '',
    });
    setDialogState({ isOpen: true, mode: 'edit', editingRecord: record });
  }, []);

  /**
   * ダイアログを閉じる
   */
  const handleCloseDialog = useCallback(() => {
    setDialogState({ isOpen: false, mode: 'add' });
    setServiceFormData({
      serviceDate: new Date().toISOString().split('T')[0],
      serviceType: '',
      serviceDescription: '',
      amount: '',
    });
  }, []);

  /**
   * サービス履歴保存処理
   */
  const handleSaveService = useCallback(async () => {
    try {
      if (dialogState.mode === 'add') {
        const serviceData: CreateServiceRecordInput = {
          customerId,
          serviceDate: new Date(serviceFormData.serviceDate),
          serviceType: serviceFormData.serviceType || undefined,
          serviceDescription: serviceFormData.serviceDescription || undefined,
          amount: serviceFormData.amount
            ? Number(serviceFormData.amount)
            : undefined,
          status: 'completed',
        };

        await createServiceRecord(serviceData);
        showSnackbar(MESSAGES.success.add, 'success');
      } else if (dialogState.editingRecord) {
        const updateData: UpdateServiceRecordInput = {
          serviceDate: new Date(serviceFormData.serviceDate),
          serviceType: serviceFormData.serviceType || undefined,
          serviceDescription: serviceFormData.serviceDescription || undefined,
          amount: serviceFormData.amount
            ? Number(serviceFormData.amount)
            : undefined,
        };

        await updateServiceRecord(
          dialogState.editingRecord.recordId,
          updateData
        );
        showSnackbar(MESSAGES.success.update, 'success');
      }

      handleCloseDialog();
    } catch (error) {
      const errorMessage =
        dialogState.mode === 'add' ? MESSAGES.error.add : MESSAGES.error.update;
      showSnackbar(errorMessage, 'error');
    }
  }, [
    dialogState,
    serviceFormData,
    customerId,
    showSnackbar,
    createServiceRecord,
    updateServiceRecord,
    handleCloseDialog,
  ]);

  /**
   * サービス履歴削除処理
   */
  const handleDeleteService = useCallback(async (recordId: number) => {
    setShowDeleteConfirm({ isOpen: true, recordId });
  }, []);

  /**
   * 削除確認処理
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (!showDeleteConfirm.recordId) {
      return;
    }

    try {
      await deleteServiceRecord(showDeleteConfirm.recordId);
      showSnackbar(MESSAGES.success.delete, 'success');
      setShowDeleteConfirm({ isOpen: false });
    } catch (error) {
      showSnackbar(MESSAGES.error.delete, 'error');
    }
  }, [showDeleteConfirm.recordId, deleteServiceRecord, showSnackbar]);

  /**
   * フィルタクリア処理
   */
  const handleClearFilters = useCallback(() => {
    setFilterState({
      selectedYear: 'all',
      selectedMonth: 'all',
      selectedServiceType: 'all',
    });
  }, []);

  // ================================
  // サブコンポーネント定義
  // ================================

  /**
   * フィルター操作UI
   */
  const renderFilterControls = () => (
    <Card cardsize="small">
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterListIcon color="action" />
          <Typography
            variant="h6"
            sx={{ fontSize: responsiveSettings.fontSize }}>
            フィルター
          </Typography>
          {hasActiveFilters && (
            <Button
              size="small"
              variant="outlined"
              onClick={handleClearFilters}
              startIcon={<ClearIcon />}
              sx={{ ml: 1 }}>
              クリア
            </Button>
          )}
        </Box>

        <Grid container spacing={2}>
          {/* 年度別フィルタ */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>年度</InputLabel>
              <Select
                value={filterState.selectedYear}
                label="年度"
                onChange={(e) =>
                  setFilterState({
                    ...filterState,
                    selectedYear: e.target.value as number | 'all',
                  })
                }>
                <MenuItem value="all">{MESSAGES.info.allYears}</MenuItem>
                {filterOptions.years.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}年度
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* 月別フィルタ */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>月</InputLabel>
              <Select
                value={filterState.selectedMonth}
                displayEmpty
                label="月"
                onChange={(e) =>
                  setFilterState({
                    ...filterState,
                    selectedMonth: e.target.value as number | 'all',
                  })
                }>
                <MenuItem value="all">{MESSAGES.info.allMonths}</MenuItem>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <MenuItem key={month} value={month}>
                    {getMonthName(month)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* サービス種別フィルタ */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>サービス種別</InputLabel>
              <Select
                value={filterState.selectedServiceType}
                displayEmpty
                label="サービス種別"
                onChange={(e) =>
                  setFilterState((prev) => ({
                    ...prev,
                    selectedServiceType: e.target.value,
                  }))
                }>
                <MenuItem value="all">{MESSAGES.info.allServiceTypes}</MenuItem>
                {filterOptions.serviceTypes.map((type) => (
                  <MenuItem key={type ?? 'empty'} value={type ?? ''}>
                    {type || '未設定'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {hasActiveFilters && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              {MESSAGES.info.filterActive} ({filteredRecords.length}
              件の履歴を表示)
            </Typography>
          </Alert>
        )}
      </Box>
    </Card>
  );

  /**
   * サービス履歴なしの場合
   */
  const renderEmptyState = () => (
    <Card>
      <Box sx={{ textAlign: 'center', p: 6 }}>
        <WarningIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
        <Typography
          variant="h6"
          sx={{ mb: 2, fontSize: responsiveSettings.fontSize }}>
          {MESSAGES.info.noServices}
        </Typography>
        <Button
          variant="contained"
          onClick={handleAddService}
          startIcon={<AddIcon />}
          size={responsiveSettings.buttonSize as any}>
          最初のサービス履歴を登録
        </Button>
      </Box>
    </Card>
  );

  /**
   * 年度別サービス履歴表示
   */
  const renderYearlyServices = () => (
    <>
      {Object.entries(filteredServicesByYear)
        .sort(([a], [b]) => Number(b) - Number(a)) // 新しい年度順
        .map(([year, yearServices]) => (
          <Accordion key={year} defaultExpanded sx={{ mb: 2 }}>
            <AccordionSummary
              expandIcon={
                <ExpandMoreIcon sx={{ fontSize: 32, color: 'white' }} />
              }
              aria-label={`${year}年度のサービス履歴を展開`} // アクセシビリティ向上
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                minHeight: 64,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
                '&.Mui-expanded': {
                  minHeight: 64,
                },
                '& .MuiAccordionSummary-content': {
                  margin: '16px 0',
                },
              }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  width: '100%',
                  pr: 2,
                  alignItems: 'center',
                }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 'bold',
                    fontSize: isMobile ? '18px' : '20px',
                  }}>
                  📅 {year}年度 ({yearServices.length}件)
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 'bold',
                    fontSize: isMobile ? '16px' : '18px',
                  }}>
                  {formatAmount(filteredYearlyTotals[Number(year)] || 0)}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2} sx={{ p: isMobile ? 1 : 2 }}>
                {yearServices
                  .sort(
                    (a, b) =>
                      new Date(b.serviceDate).getTime() -
                      new Date(a.serviceDate).getTime()
                  )
                  .map((service) => (
                    <Card key={service.recordId} cardsize="small">
                      <Grid
                        container
                        spacing={2}
                        alignItems="center"
                        sx={{
                          p: 2,
                        }}>
                        {/* 日付 */}
                        <Grid size={{ xs: 12 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              justifyContent: isMobile
                                ? 'center'
                                : 'flex-start',
                            }}>
                            <CalendarIcon fontSize="small" color="primary" />
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 'bold' }}>
                                {formatDateShort(new Date(service.serviceDate))}
                              </Typography>
                              {!isMobile && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary">
                                  {new Date(service.serviceDate).getFullYear()}
                                  年
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Grid>

                        {/* サービス種別 */}
                        <Grid
                          size={{ xs: 12 }}
                          sx={{
                            display: 'flex',
                            justifyContent: 'center',
                          }}>
                          <Chip
                            label={
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                }}>
                                <span>
                                  {SERVICE_TYPE_ICONS[
                                    service.serviceType as keyof typeof SERVICE_TYPE_ICONS
                                  ] || '🛠️'}
                                </span>
                                {service.serviceType || 'その他'}
                              </Box>
                            }
                            color="primary"
                            variant="outlined"
                            sx={{ minWidth: '100px' }}
                          />
                        </Grid>

                        {/* サービス内容 */}
                        <Grid size={{ xs: 12 }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              textAlign: 'center',
                            }}>
                            {service.serviceDescription || '詳細記載なし'}
                          </Typography>
                        </Grid>

                        {/* 金額 */}
                        <Grid size={{ xs: 12 }}>
                          <Typography
                            variant="h6"
                            color="primary"
                            sx={{
                              fontWeight: 'bold',
                              textAlign: 'center',
                            }}>
                            {service.amount
                              ? formatAmount(Number(service.amount))
                              : '金額未設定'}
                          </Typography>
                        </Grid>

                        {/* 操作ボタン */}
                        <Grid size={{ xs: 12 }}>
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent={isMobile ? 'center' : 'flex-end'}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleEditService(service)}
                              sx={{ minWidth: 44, minHeight: 44, p: 1 }}>
                              <EditIcon fontSize="small" />
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() =>
                                handleDeleteService(service.recordId)
                              }
                              sx={{ minWidth: 44, minHeight: 44, p: 1 }}>
                              <DeleteIcon fontSize="small" />
                            </Button>
                          </Stack>
                        </Grid>
                      </Grid>
                    </Card>
                  ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))}
    </>
  );

  /**
   * サービス履歴追加・編集ダイアログ
   */
  const renderServiceDialog = () => (
    <Modal
      open={dialogState.isOpen}
      onClose={handleCloseDialog}
      modalsize="medium"
      sx={{
        '& .MuiDialog-paper': {
          maxHeight: isMobile ? '80vh' : 'auto',
        },
      }}
      title={
        dialogState.mode === 'add' ? 'サービス履歴追加' : 'サービス履歴編集'
      }>
      <Stack spacing={3} sx={{ p: 2, pb: 0 }}>
        {/* サービス実施日 */}
        <Input
          label="サービス実施日"
          type="date"
          value={serviceFormData.serviceDate}
          onChange={(e) =>
            setServiceFormData((prev) => ({
              ...prev,
              serviceDate: e.target.value,
            }))
          }
          required
        />
        {/* サービス種別 */}
        <FormControl fullWidth required>
          <InputLabel>サービス種別</InputLabel>
          <Select
            value={serviceFormData.serviceType}
            label="サービス種別"
            onChange={(e) =>
              setServiceFormData((prev) => ({
                ...prev,
                serviceType: e.target.value,
              }))
            }>
            {COMMON_SERVICE_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span> {SERVICE_TYPE_ICONS[type]} </span>
                  {type}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* サービス内容説明 */}
        <Input
          fullWidth
          label="サービス内容"
          multiline
          rows={3}
          value={serviceFormData.serviceDescription}
          onChange={(e) =>
            setServiceFormData((prev) => ({
              ...prev,
              serviceDescription: e.target.value,
            }))
          }
          placeholder="実施したサービス内容を詳しく記入してください"
        />

        {/* 金額 */}
        <Input
          fullWidth
          label="金額（円）"
          type="number"
          value={serviceFormData.amount}
          onChange={(e) =>
            setServiceFormData((prev) => ({
              ...prev,
              amount: e.target.value,
            }))
          }
          placeholder="0"
        />
        {/* 操作ボタン */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={handleCloseDialog}>
            キャンセル
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveService}
            disabled={
              !serviceFormData.serviceDate || !serviceFormData.serviceType
            }
            startIcon={dialogState.mode === 'add' ? <AddIcon /> : <EditIcon />}>
            {dialogState.mode === 'add' ? '追加' : '更新'}
          </Button>
        </Box>
      </Stack>
    </Modal>
  );

  // ================================
  // メインレンダー
  // ================================
  return (
    <Box sx={{ p: responsiveSettings.contentPadding }}>
      {/* ヘッダー */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: 2,
          }}>
          <Typography
            variant="h5"
            sx={{
              fontSize: responsiveSettings.fontSize,
              fontWeight: 'bold',
              textAlign: isMobile ? 'center' : 'left',
            }}>
            📊 サービス履歴
          </Typography>
          <Button
            variant="contained"
            onClick={handleAddService}
            startIcon={<AddIcon />}
            size={responsiveSettings.buttonSize as any}
            sx={{
              minHeight: 48,
              fontSize: isMobile ? '16px' : '14px',
              width: isMobile ? '100%' : 'auto',
            }}>
            サービス履歴を追加
          </Button>
        </Box>
      </Box>

      {/* フィルター */}
      {serviceRecords.length > 0 && (
        <Box sx={{ mb: 3 }}>{renderFilterControls()}</Box>
      )}

      {/* メインコンテンツ */}
      {serviceRecords.length === 0 ? (
        renderEmptyState()
      ) : filteredRecords.length === 0 ? (
        <Card>
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <FilterListIcon
              sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }}
            />
            <Typography variant="h6" sx={{ mb: 2 }}>
              フィルター条件に一致する履歴がありません
            </Typography>
            <Button
              variant="outlined"
              onClick={handleClearFilters}
              startIcon={<ClearIcon />}>
              フィルターをクリア
            </Button>
          </Box>
        </Card>
      ) : (
        renderYearlyServices()
      )}

      {/* サービス履歴編集ダイアログ */}
      {renderServiceDialog()}

      {/* 削除確認ダイアログ */}
      <Modal
        open={showDeleteConfirm.isOpen}
        onClose={() => setShowDeleteConfirm({ isOpen: false })}
        title="サービス履歴削除の確認"
        modalsize="small"
        sx={{
          '& .MuiDialog-paper': {
            maxHeight: isMobile ? '55vh' : 'auto',
          },
        }}>
        <Box sx={{ textAlign: 'center', p: 2 }}>
          <Typography
            variant="h6"
            sx={{ mb: 2, color: theme.palette.error.main, fontWeight: 'bold' }}>
            ⚠️ 削除の確認
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {MESSAGES.confirm.delete}
          </Typography>
          <Stack
            direction={isMobile ? 'column' : 'row'}
            spacing={2}
            justifyContent="center"
            sx={{ gap: isMobile ? 2 : 0 }}>
            <Button
              variant="outlined"
              sx={{ order: isMobile ? 2 : 1 }}
              onClick={() => setShowDeleteConfirm({ isOpen: false })}>
              キャンセル
            </Button>
            <Button
              variant="contained"
              color="error"
              sx={{ order: isMobile ? 1 : 2 }}
              onClick={handleDeleteConfirm}
              startIcon={<DeleteIcon />}>
              削除する
            </Button>
          </Stack>
        </Box>
      </Modal>
    </Box>
  );
};

export default ServiceRecordList;

/**
 * 【50代ユーザー向け設計のポイント】
 *
 * 1. 年度別グループ化表示
 *    - アコーディオン形式で年度別に整理
 *    - 年度別売上集計を一目で確認可能
 *    - 新しい年度を上位に表示
 *
 * 2. フィルタリング機能
 *    - 年度・月・サービス種別による絞り込み
 *    - フィルタ状態の明確な表示
 *    - ワンクリックでのフィルタクリア
 *
 * 3. サービス種別の視覚化
 *    - アイコン付きチップで直感的な識別
 *    - 建築系業界に特化したプリセット
 *    - カラー設定による見やすさ向上
 *
 * 4. CRUD操作
 *    - 追加・編集・削除の分かりやすいUI
 *    - 確認ダイアログによる誤操作防止
 *    - 50代向け親切なメッセージ表示
 *
 * 5. レスポンシブ対応
 *    - モバイル・タブレット・デスクトップ最適化
 *    - デバイス別のレイアウト調整
 *    - タッチ操作に配慮したボタンサイズ
 *
 * この実装により、50代の建築系自営業者が効率的に
 * サービス履歴を管理できる環境が完成します。
 */
