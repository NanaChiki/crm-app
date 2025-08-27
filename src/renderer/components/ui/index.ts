// 50代向けUIコンポーネントライブラリ
// Material-UI v5ベース、TypeScript型定義、アクセシビリティ対応

// コンポーネントのエクスポート
export { Button } from './Button';
export type { ButtonProps } from './Button';

export { Input } from './Input';
export type { InputProps } from './Input';

export { Card } from './Card';
export type { CardProps } from './Card';

export { ConfirmModal, Modal } from './Modal';
export type { ModalProps } from './Modal';

// 色定義のエクスポート
export { primaryColor } from './Button';

// 使用例とベストプラクティス
/*
使用例:

import { Button, Input, Card, Modal, ConfirmModal } from '@/components/ui';

// ボタン
<Button size="large" variant="contained">
  大きなボタン
</Button>

// 入力フィールド
<Input
  label="会社名"
  inputSize="large"
  helperText="正式な会社名を入力してください"
/>

// カード
<Card
  title="顧客名"
  subtitle="最終更新: 2025/01/01"
  status="active"
  onEdit={() => console.log('編集')}
  onDelete={() => console.log('削除')}
>
  <p>顧客の詳細情報...</p>
</Card>

// モーダル
<Modal
  open={true}
  title="確認"
  onClose={() => setOpen(false)}
  onConfirm={() => console.log('確認')}
  iconType="warning"
>
  この操作を実行しますか？
</Modal>

// 削除確認モーダル
<ConfirmModal
  open={true}
  type="delete"
  onClose={() => setOpen(false)}
  onConfirm={() => console.log('削除実行')}
>
  この顧客データを削除しますか？
</ConfirmModal>
*/
