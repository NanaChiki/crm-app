import { Add, Delete, Edit } from '@mui/icons-material';
import { Box, Container, Divider, Grid, Typography } from '@mui/material';
import { useState } from 'react';
import {
  Button,
  Card,
  ConfirmModal,
  Input,
  Modal,
} from '../components/ui/indexUI';

export default function UIDemo() {
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowModal(false);
      setShowConfirmModal(false);
    }, 2000);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h1" gutterBottom>
        🎨 50代向けUIコンポーネントデモ
      </Typography>

      <Typography variant="body1" sx={{ mb: 4, fontSize: '18px' }}>
        建築事業者向けCRMツールのUIコンポーネントライブラリ
      </Typography>

      {/* ボタンデモ */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h2" gutterBottom>
          📱 Button コンポーネント
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          最小44px×44px、フォントサイズ16px以上、アクセシビリティ対応
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button size="small" variant="contained" startIcon={<Add />}>
                Small (44px)
              </Button>
              <Button size="medium" variant="contained" startIcon={<Edit />}>
                Medium (52px)
              </Button>
              <Button size="large" variant="contained" startIcon={<Delete />}>
                Large (60px)
              </Button>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button variant="outlined" color="secondary">
                アウトライン
              </Button>
              <Button variant="text" color="primary">
                テキストボタン
              </Button>
              <Button variant="contained" color="error">
                エラーボタン
              </Button>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button loading disabled>
                ローディング中
              </Button>
              <Button disabled>無効状態</Button>
              <Button fullWidth variant="contained">
                フルワイドボタン
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* 入力フィールドデモ */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h2" gutterBottom>
          ✍️ Input コンポーネント
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          大きめで見やすい入力フィールド、パスワード表示切り替え対応
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Input
                inputSize="small"
                label="会社名（Small）"
                placeholder="株式会社サンプル"
                helperText="正式な会社名を入力してください"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />

              <Input
                inputSize="medium"
                label="担当者名（Medium）"
                placeholder="山田太郎"
                helperText="担当者のフルネームを入力"
              />

              <Input
                inputSize="large"
                label="住所（Large）"
                placeholder="東京都渋谷区..."
                helperText="郵便番号から入力してください"
              />
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Input
                isPassword
                label="パスワード"
                placeholder="パスワードを入力"
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
                helperText="8文字以上で入力してください"
              />

              <Input
                error
                label="エラー状態"
                placeholder="無効な入力例"
                helperText="この項目は必須です"
              />

              <Input
                label="メールアドレス"
                type="email"
                placeholder="example@company.co.jp"
                helperText="連絡用のメールアドレス"
              />
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* カードデモ */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h2" gutterBottom>
          🗂️ Card コンポーネント
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          顧客情報・サービス情報表示用カード、ステータス表示・アクション対応
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Card
              title="株式会社サンプル建設"
              subtitle="顧客ID: #001 • 登録日: 2025/01/15"
              status="active"
              onEdit={() => alert('編集クリック')}
              onDelete={() => setShowConfirmModal(true)}
              clickable
              onCardClick={() => alert('カードクリック')}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                📞 <strong>電話:</strong> 03-1234-5678
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                ✉️ <strong>メール:</strong> info@sample-construction.co.jp
              </Typography>
              <Typography variant="body2">
                📍 <strong>住所:</strong> 東京都渋谷区渋谷1-1-1
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Card
              title="住宅リフォーム工事"
              subtitle="サービス記録 • 2025/01/10"
              status="completed"
              cardSize="medium">
              <Typography variant="body2" sx={{ mb: 2 }}>
                💰 <strong>金額:</strong> ¥1,500,000
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                📋 <strong>内容:</strong> キッチン・お風呂のリフォーム
              </Typography>
              <Typography variant="body2">
                ⏰ <strong>期間:</strong> 2週間
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Card
              title="メンテナンス予定"
              subtitle="次回点検 • 2025/02/01"
              status="pending"
              cardSize="large"
              onEdit={() => alert('メンテナンス編集')}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                🔧 <strong>種類:</strong> 定期点検
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                📅 <strong>予定日:</strong> 2025年2月1日 (土)
              </Typography>
              <Typography variant="body2">
                ⚠️ <strong>注意:</strong> 事前連絡が必要
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* モーダルデモ */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h2" gutterBottom>
          💬 Modal コンポーネント
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          削除確認、情報表示用モーダルダイアログ
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="contained" onClick={() => setShowModal(true)}>
            情報モーダルを開く
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={() => setShowConfirmModal(true)}>
            削除確認モーダルを開く
          </Button>
        </Box>
      </Box>

      {/* モーダル本体 */}
      <Modal
        open={showModal}
        title="顧客情報の詳細"
        iconType="info"
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirm}
        onCancel={() => setShowModal(false)}
        confirmText="保存"
        loading={loading}
        details={
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>会社名:</strong> 株式会社サンプル建設
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>代表者:</strong> 山田太郎
            </Typography>
            <Typography variant="body2">
              <strong>設立:</strong> 1995年4月1日
            </Typography>
          </Box>
        }>
        <Typography variant="body1">
          この顧客の詳細情報を表示しています。編集する場合は「保存」ボタンをクリックしてください。
        </Typography>
      </Modal>

      <ConfirmModal
        open={showConfirmModal}
        type="delete"
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirm}
        loading={loading}>
        <Typography variant="body1">
          <strong>「株式会社サンプル建設」</strong>の顧客データを削除しますか？
        </Typography>
        <Typography variant="body2" color="error" sx={{ mt: 2 }}>
          ⚠️ この操作は取り消せません。関連するサービス履歴も全て削除されます。
        </Typography>
      </ConfirmModal>

      {/* フッター */}
      <Box
        sx={{
          mt: 8,
          p: 3,
          backgroundColor: 'background.default',
          borderRadius: 2,
        }}>
        <Typography variant="h3" gutterBottom>
          🎯 使用方法
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          これらのコンポーネントは以下のようにインポートして使用できます：
        </Typography>
        <Box
          sx={{
            backgroundColor: 'grey.100',
            p: 2,
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '14px',
          }}>
          <code>
            {`import { Button, Input, Card, Modal, ConfirmModal } from '@/components/ui';`}
          </code>
        </Box>
      </Box>
    </Container>
  );
}
