/**
 * NotFoundPage.tsx
 *
 * 【404エラーページ】
 *
 * 存在しないURLにアクセスした際に表示されるエラーページ。
 * 50代ユーザーに配慮し、親切で分かりやすいメッセージと
 * 明確な対処方法を提示します。
 *
 * 【50代配慮】
 * - 大きな文字サイズ
 * - 分かりやすい日本語メッセージ
 * - 明確な誘導ボタン
 * - 不安を与えないデザイン
 */

import {
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { Box, Container, Stack, Typography } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';

// Custom Components
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

/**
 * NotFoundPage - 404エラーページコンポーネント
 *
 * 【実装のポイント】
 * 1. ユーザーフレンドリーなメッセージ
 *    - 技術的なエラーではなく、優しい説明
 *    - 「お探しのページが見つかりません」という表現
 *
 * 2. 明確な対処方法
 *    - ホームに戻るボタン
 *    - 顧客一覧へのボタン
 *    - ブラウザの戻るボタン案内
 *
 * 3. 50代向けデザイン
 *    - 大きなアイコン・ボタン
 *    - 読みやすいフォント
 *    - 余裕のあるレイアウト
 */
export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  // ホームページへ戻る
  const handleGoHome = () => {
    navigate('/');
  };

  // 顧客一覧ページへ移動
  const handleGoCustomers = () => {
    navigate('/customers');
  };

  // ブラウザの戻るボタン機能
  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Card>
        <Box sx={{ textAlign: 'center', p: 4 }}>
          {/* エラーアイコン */}
          <SearchIcon
            sx={{
              fontSize: 120,
              color: 'warning.main',
              mb: 3,
            }}
          />

          {/* エラーコード */}
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '48px', md: '64px' },
              fontWeight: 'bold',
              color: 'text.secondary',
              mb: 2,
            }}>
            404
          </Typography>

          {/* メインメッセージ */}
          <Typography
            variant="h4"
            sx={{
              fontSize: { xs: '20px', md: '24px' },
              fontWeight: 'bold',
              mb: 2,
            }}>
            お探しのページが見つかりません
          </Typography>

          {/* 説明文 */}
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              fontSize: { xs: '16px', md: '18px' },
              mb: 4,
              lineHeight: 1.8,
            }}>
            申し訳ございません。
            <br />
            アクセスしようとしたページは存在しないか、
            移動または削除された可能性があります。
          </Typography>

          {/* アクションボタン群 */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            sx={{ mb: 3 }}>
            {/* ホームに戻るボタン */}
            <Button
              variant="contained"
              size="large"
              startIcon={<HomeIcon />}
              onClick={handleGoHome}
              sx={{ minWidth: 200 }}>
              ホームに戻る
            </Button>

            {/* 顧客一覧へ移動ボタン */}
            <Button
              variant="outlined"
              size="large"
              startIcon={<SearchIcon />}
              onClick={handleGoCustomers}
              sx={{ minWidth: 200 }}>
              顧客一覧を見る
            </Button>
          </Stack>

          {/* 戻るボタン */}
          <Button
            variant="text"
            size="large"
            startIcon={<ArrowBackIcon />}
            onClick={handleGoBack}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}>
            前のページに戻る
          </Button>

          {/* 補足説明 */}
          <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              問題が解決しない場合は、URLが正しいかご確認ください。
            </Typography>
          </Box>
        </Box>
      </Card>
    </Container>
  );
};

export default NotFoundPage;

/**
 * 【50代ユーザー向け設計のポイント】
 *
 * 1. 不安を与えない表現
 *    - 「エラー」ではなく「見つかりません」
 *    - 技術用語を避けた優しい日本語
 *    - ユーザーの責任ではないことを明示
 *
 * 2. 明確な次のアクション
 *    - 3つの選択肢を提示
 *    - 最も使う「ホーム」を最優先表示
 *    - ブラウザの戻るボタンも案内
 *
 * 3. 視覚的な分かりやすさ
 *    - 大きなアイコンで状況を視覚化
 *    - ボタンを大きく見やすく
 *    - レスポンシブで各デバイスに最適化
 *
 * 4. 補足情報の提供
 *    - URL確認の提案
 *    - 問題解決のヒント
 */
