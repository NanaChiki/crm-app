/**
 * MaintenanceSiteList.tsx
 *
 * 【50代向けメンテナンス現場表コンポーネント】
 *
 * 顧客詳細ページの「メンテナンス現場表」タブで使用。
 * 特定顧客のメンテナンス時期を迎えた現場を一覧表示。
 *
 * 【主な機能】
 * ✅ タブで「全て」「屋根」「外壁」「雨樋」を表示
 * ✅ 各タブでメッセージ表示（「〇〇件の現場がメンテナンス時期を迎えています」等）
 * ✅ カードUIで現場情報表示（物件名、写真、前回施工日、経過年数、次回推奨時期、住所、電話、メール等）
 * ✅ 緊急度表示（要対応、推奨時期、検討時期）
 * ✅ 「メールを送信」ボタン
 *
 * 【50代配慮】
 * - 大きなボタン・フォント（16px以上）
 * - 分かりやすいメッセージ
 * - 視覚的な色分け
 */

import {
  Email as EmailIcon,
  PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Grid,
  Button as MuiButton,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import {
  MAINTENANCE_CYCLES,
  type MaintenanceServiceType,
} from '../../../types/siteList';
import {
  BUTTON_SIZE,
  FONT_SIZES,
  GRID_LAYOUT,
  SPACING,
} from '../../constants/uiDesignSystem';
import { useCustomer } from '../../contexts/CustomerContext';
import { useServiceRecords } from '../../hooks/useServiceRecords';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface MaintenanceSiteListProps {
  customerId: number;
  serviceRecordsHook?: ReturnType<typeof useServiceRecords>;
}

type TabType = 'all' | MaintenanceServiceType;

/**
 * メンテナンス現場表コンポーネント
 */
export const MaintenanceSiteList: React.FC<MaintenanceSiteListProps> = ({
  customerId,
  serviceRecordsHook,
}) => {
  const { customers } = useCustomer();
  const serviceRecordsHookInstance =
    serviceRecordsHook ||
    useServiceRecords({
      customerId,
      autoLoad: true,
    });
  const { serviceRecords, loading, error, updateServiceRecord } =
    serviceRecordsHookInstance;

  const [selectedTab, setSelectedTab] = useState<TabType>('all');
  const [uploadingPhotoId, setUploadingPhotoId] = useState<number | null>(null);

  // 顧客情報取得
  const customer = useMemo(() => {
    return customers.find((c) => c.customerId === customerId);
  }, [customers, customerId]);

  /**
   * 写真パスを解決（相対パス → カスタムプロトコルURL）
   */
  const resolvePhotoPath = (photoPath: string | null): string | null => {
    if (!photoPath) {
      return null;
    }
    // photoPathは "photos/filename.jpg" 形式
    // カスタムプロトコル app-photo:// を使用してセキュアに画像を表示
    return `app-photo://${photoPath}`;
  };

  /**
   * メンテナンス時期を迎えた現場の計算
   */
  const maintenanceSites = useMemo(() => {
    const targetTypes: MaintenanceServiceType[] = ['屋根', '外壁', '雨樋'];

    return serviceRecords
      .filter((record) => {
        // 顧客IDでフィルタリング（念のため）
        if (record.customerId !== customerId) {
          return false;
        }
        // サービス種別が屋根・外壁・雨樋のいずれかに含まれるか
        return targetTypes.some((type) => record.serviceType?.includes(type));
      })
      .map((record) => {
        // サービス種別判定
        let serviceType: MaintenanceServiceType = '屋根';
        if (record.serviceType?.includes('外壁')) {
          serviceType = '外壁';
        } else if (record.serviceType?.includes('雨樋')) {
          serviceType = '雨樋';
        }

        // メンテナンス周期取得
        const cycle = MAINTENANCE_CYCLES[serviceType];

        // 経過年数計算
        const now = new Date();
        const serviceDate =
          typeof record.serviceDate === 'string'
            ? new Date(record.serviceDate)
            : record.serviceDate;
        const diffMs = now.getTime() - serviceDate.getTime();
        const yearsElapsed =
          Math.floor((diffMs / (1000 * 60 * 60 * 24 * 365.25)) * 10) / 10;

        // 緊急度判定
        let urgencyLevel: 'low' | 'medium' | 'high' | 'overdue' = 'low';
        if (yearsElapsed >= cycle.late) {
          urgencyLevel = 'overdue';
        } else if (yearsElapsed >= cycle.standard) {
          urgencyLevel = 'high';
        } else if (yearsElapsed >= cycle.early) {
          urgencyLevel = 'medium';
        }

        // 次回推奨日計算
        const nextRecommendedDate = new Date(serviceDate);
        nextRecommendedDate.setFullYear(
          nextRecommendedDate.getFullYear() + cycle.standard
        );

        // メンテナンス時期到来判定
        const isMaintenanceNeeded = yearsElapsed >= cycle.early;

        return {
          recordId: record.recordId,
          serviceDate,
          serviceType,
          serviceDescription: record.serviceDescription,
          amount: record.amount,
          photoPath: (record as any).photoPath || null,
          yearsElapsed,
          nextRecommendedDate,
          urgencyLevel,
          isMaintenanceNeeded,
        };
      })
      .filter((site) => site.isMaintenanceNeeded) // メンテナンス時期到来のみ
      .sort((a, b) => {
        const urgencyOrder = { overdue: 4, high: 3, medium: 2, low: 1 };
        if (urgencyOrder[a.urgencyLevel] !== urgencyOrder[b.urgencyLevel]) {
          return urgencyOrder[b.urgencyLevel] - urgencyOrder[a.urgencyLevel];
        }
        return b.yearsElapsed - a.yearsElapsed;
      });
  }, [serviceRecords, customerId]);

  /**
   * タブ別フィルタリング
   */
  const filteredSites = useMemo(() => {
    if (selectedTab === 'all') {
      return maintenanceSites;
    }
    return maintenanceSites.filter((site) => site.serviceType === selectedTab);
  }, [maintenanceSites, selectedTab]);

  /**
   * タブ別メッセージ生成
   */
  const getTabMessage = () => {
    const count = filteredSites.length;
    if (selectedTab === 'all') {
      return `${count}件の現場がメンテナンス時期を迎えています`;
    } else if (selectedTab === '屋根') {
      return `屋根工事が10年経過した現場が${count}件あります`;
    } else if (selectedTab === '外壁') {
      return `外壁工事が10年経過した現場が${count}件あります`;
    } else if (selectedTab === '雨樋') {
      return `雨樋工事が5年経過した現場が${count}件あります`;
    }
    return '';
  };

  /**
   * 緊急度ラベル取得
   */
  const getUrgencyLabel = (urgency: 'low' | 'medium' | 'high' | 'overdue') => {
    switch (urgency) {
      case 'overdue':
        return '要対応';
      case 'high':
        return '推奨時期';
      case 'medium':
        return '検討時期';
      default:
        return '検討時期';
    }
  };

  /**
   * 緊急度カラー取得
   */
  const getUrgencyColor = (urgency: 'low' | 'medium' | 'high' | 'overdue') => {
    switch (urgency) {
      case 'overdue':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      default:
        return 'info';
    }
  };

  /**
   * 写真アップロード処理
   */
  const handlePhotoUpload = async (recordId: number) => {
    try {
      setUploadingPhotoId(recordId);

      // APIが存在するかチェック
      if (!window.dialogAPI || !window.dialogAPI.selectImageFile) {
        alert('ファイル選択機能が利用できません。アプリを再起動してください。');
        setUploadingPhotoId(null);
        return;
      }

      // ファイル選択ダイアログを開く
      const fileResult = await window.dialogAPI.selectImageFile();

      if (
        fileResult.canceled ||
        !fileResult.success ||
        !fileResult.data?.filePath
      ) {
        setUploadingPhotoId(null);
        return;
      }

      const filePath = fileResult.data.filePath;

      // 写真をアップロード
      const uploadResult = await window.serviceRecordAPI.uploadPhoto({
        recordId,
        filePath,
      });

      // デバッグログ: レスポンス全体を確認
      console.log(
        '📸 写真アップロードレスポンス:',
        JSON.stringify(uploadResult, null, 2)
      );

      if (!uploadResult.success) {
        const errorMessage =
          uploadResult.error || '写真のアップロードに失敗しました';
        console.error('❌ 写真アップロードエラー:', errorMessage);
        throw new Error(errorMessage);
      }

      // レスポンス構造を確認（dataオブジェクト内のphotoPath、または直接photoPath）
      // 実際のレスポンスは { success: true, photoPath: "photos/..." } 形式
      const photoPath =
        (uploadResult as any).data?.photoPath ||
        (uploadResult as any).photoPath;

      if (!photoPath) {
        console.error('❌ 写真アップロードレスポンスエラー:', uploadResult);
        console.error(
          '❌ 期待される構造: { success: true, photoPath: string } または { success: true, data: { photoPath: string } }'
        );
        throw new Error('写真パスの取得に失敗しました');
      }

      // ServiceRecordを更新
      const updateResult = await updateServiceRecord(recordId, { photoPath });

      if (!updateResult) {
        throw new Error('サービス履歴の更新に失敗しました');
      }

      setUploadingPhotoId(null);
    } catch (error) {
      console.error('❌ 写真アップロードエラー:', error);
      setUploadingPhotoId(null);
      const errorMessage =
        error instanceof Error
          ? error.message
          : '写真のアップロードに失敗しました';
      alert(errorMessage);
    }
  };

  // ローディング状態
  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', p: 6 }}>
        <CircularProgress size={60} />
        <Typography
          variant="h6"
          sx={{ mt: 2, fontSize: FONT_SIZES.body.desktop }}>
          メンテナンス現場を読み込んでいます...
        </Typography>
      </Box>
    );
  }

  // エラー状態
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography
            variant="h6"
            sx={{ fontSize: FONT_SIZES.cardTitle.desktop }}>
            エラーが発生しました
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontSize: FONT_SIZES.body.desktop }}>
            {error}
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: SPACING.card.mobile, md: SPACING.card.desktop } }}>
      {/* タブ選択 */}
      <Box sx={{ mb: 3 }}>
        <ToggleButtonGroup
          value={selectedTab}
          exclusive
          onChange={(_, newTab) => {
            if (newTab !== null) {
              setSelectedTab(newTab);
            }
          }}
          sx={{ width: '100%', flexWrap: 'wrap' }}>
          <ToggleButton
            value="all"
            sx={{
              flex: { xs: '1 1 100%', sm: '1 1 auto' },
              minHeight: BUTTON_SIZE.minHeight.desktop,
              fontSize: FONT_SIZES.button.medium,
            }}>
            全て ({maintenanceSites.length}件)
          </ToggleButton>
          <ToggleButton
            value="屋根"
            sx={{
              flex: { xs: '1 1 100%', sm: '1 1 auto' },
              minHeight: BUTTON_SIZE.minHeight.desktop,
              fontSize: FONT_SIZES.button.medium,
            }}>
            🏠 屋根 (
            {maintenanceSites.filter((s) => s.serviceType === '屋根').length}件)
          </ToggleButton>
          <ToggleButton
            value="外壁"
            sx={{
              flex: { xs: '1 1 100%', sm: '1 1 auto' },
              minHeight: BUTTON_SIZE.minHeight.desktop,
              fontSize: FONT_SIZES.button.medium,
            }}>
            🎨 外壁 (
            {maintenanceSites.filter((s) => s.serviceType === '外壁').length}件)
          </ToggleButton>
          <ToggleButton
            value="雨樋"
            sx={{
              flex: { xs: '1 1 100%', sm: '1 1 auto' },
              minHeight: BUTTON_SIZE.minHeight.desktop,
              fontSize: FONT_SIZES.button.medium,
            }}>
            💧 雨樋 (
            {maintenanceSites.filter((s) => s.serviceType === '雨樋').length}件)
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* メッセージ表示 */}
      {filteredSites.length > 0 && (
        <Box
          sx={{
            backgroundColor: 'primary.main',
            color: 'white',
            p: 2,
            borderRadius: 2,
            mb: 3,
            textAlign: 'center',
          }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              fontSize: {
                xs: FONT_SIZES.cardTitle.mobile,
                md: FONT_SIZES.cardTitle.desktop,
              },
            }}>
            {getTabMessage()}
          </Typography>
        </Box>
      )}

      {/* 現場リスト */}
      {filteredSites.length > 0 ? (
        <Grid container spacing={3}>
          {filteredSites.map((site) => (
            <Grid key={site.recordId} size={GRID_LAYOUT.customerList}>
              <Card cardsize="medium">
                <Box sx={{ p: 2 }}>
                  {/* 物件名 + 緊急度バッジ */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1,
                    }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontSize: FONT_SIZES.cardTitle.desktop,
                        fontWeight: 'bold',
                      }}>
                      {site.serviceDescription || `${site.serviceType}工事`}
                    </Typography>
                    <Chip
                      label={getUrgencyLabel(site.urgencyLevel)}
                      color={getUrgencyColor(site.urgencyLevel) as any}
                      size="small"
                    />
                  </Box>

                  {/* サービス種別（元のサービス種別を表示） */}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 1,
                      fontSize: FONT_SIZES.body.desktop,
                    }}>
                    🏗️{' '}
                    {(site as any).originalServiceType ||
                      `${site.serviceType}工事`}
                  </Typography>

                  {/* 写真表示・アップロード */}
                  <Box sx={{ mb: 2 }}>
                    {resolvePhotoPath(site.photoPath) ? (
                      <img
                        src={resolvePhotoPath(site.photoPath) || ''}
                        alt="現場写真"
                        style={{
                          width: '100%',
                          maxHeight: '200px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: '100%',
                          minHeight: '150px',
                          border: '2px dashed',
                          borderColor: 'grey.300',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'grey.50',
                        }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: FONT_SIZES.body.desktop }}>
                          写真なし
                        </Typography>
                      </Box>
                    )}
                    <MuiButton
                      variant="outlined"
                      startIcon={<PhotoCameraIcon />}
                      onClick={() => handlePhotoUpload(site.recordId)}
                      disabled={uploadingPhotoId === site.recordId}
                      fullWidth
                      sx={{
                        mt: 1,
                        minHeight: BUTTON_SIZE.minHeight.desktop,
                        fontSize: FONT_SIZES.button.medium,
                      }}>
                      {uploadingPhotoId === site.recordId
                        ? 'アップロード中...'
                        : site.photoPath
                          ? '写真を変更'
                          : '写真を追加'}
                    </MuiButton>
                  </Box>

                  {/* 前回施工日・経過年数・次回推奨時期 */}
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 1,
                      fontSize: FONT_SIZES.body.desktop,
                    }}>
                    📅 施工日:{' '}
                    {new Intl.DateTimeFormat('ja-JP').format(site.serviceDate)}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 'bold',
                      color: 'error.main',
                      mb: 1,
                      fontSize: FONT_SIZES.body.desktop,
                    }}>
                    ⏰ 経過年数: {site.yearsElapsed}年
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 1,
                      fontSize: FONT_SIZES.body.desktop,
                    }}>
                    次回推奨:{' '}
                    {new Intl.DateTimeFormat('ja-JP').format(
                      site.nextRecommendedDate
                    )}
                  </Typography>

                  {/* 住所・連絡先 */}
                  {customer?.address && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: 'block',
                        mt: 1,
                        fontSize: FONT_SIZES.label.desktop,
                      }}>
                      📍 {customer.address}
                    </Typography>
                  )}
                  {customer?.phone && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontSize: FONT_SIZES.label.desktop,
                      }}>
                      📞 {customer.phone}
                    </Typography>
                  )}
                  {customer?.email && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontSize: FONT_SIZES.label.desktop,
                      }}>
                      📧 {customer.email}
                    </Typography>
                  )}

                  {/* メールを送信ボタン */}
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<EmailIcon />}
                      onClick={() => {
                        // TODO: メール送信機能実装
                        console.log('メール送信:', site);
                      }}
                      sx={{
                        minHeight: BUTTON_SIZE.minHeight.desktop,
                        fontSize: FONT_SIZES.button.medium,
                      }}>
                      メールを送信
                    </Button>
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              fontSize: {
                xs: FONT_SIZES.cardTitle.mobile,
                md: FONT_SIZES.cardTitle.desktop,
              },
            }}>
            条件に一致する現場がありません
          </Typography>
        </Box>
      )}
    </Box>
  );
};
