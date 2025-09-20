import React, { useEffect } from 'react';
import { useCustomer } from '../../contexts/CustomerContext';
import { useServiceRecords } from '../../hooks/useServiceRecords';

const TestServiceRecords: React.FC = () => {
  const records = useServiceRecords({});
  const { customers, selectedCustomer, selectCustomer } = useCustomer();
  // useEffect(() => {
  //   console.log(
  //     'IDs now: ',
  //     records.serviceRecords.map((record) => record.recordId)
  //   );
  //   console.log('Count now: ', records.getRecordCount());
  //   console.log('Filtered records: ', records.filteredRecords);
  // }, [records.serviceRecords, records.filteredRecords]);

  // console.log('=== useServiceRecords Test Results ===');
  // console.log('Records count:', records.getRecordCount());
  // console.log('Has records:', records.hasRecords);
  // console.log('Loading:', records.loading);
  // console.log('Service types:', records.getServiceTypes());
  // console.log('Records:', records.serviceRecords);

  // 現在の選択状況を表示する部分を追加
  // useEffect(() => {
  //   console.log('=== Context連携状況 ===');
  //   console.log('選択顧客: ', selectedCustomer?.companyName || 'なし');
  //   console.log('フィルター状況: ', records.filters);
  // }, [selectedCustomer, records.filters]);
  // 少し待ってから結果確認(useEffectが実行される時間を確保)
  useEffect(() => {
    console.log('=== 顧客選択状況を確認 ===');
    console.log('選択後のフィルター: ', records.filters);
    console.log('選択後の履歴件数: ', records.getRecordCount());
    console.log(
      '選択後の表示履歴: ',
      records.filteredRecords.map((r) => r.customer.companyName)
    );
  }, [records.filters, records.getRecordCount, records.filteredRecords]);

  return (
    <>
      <div
        style={{
          border: '2px solid red',
          padding: '16px',
          margin: '16px',
          backgroundColor: '#f5f5f5',
        }}>
        <h3>🧪 useServiceRecords テスト結果</h3>
        <p>📊 履歴件数: {records.getRecordCount()}件</p>
        <p>📝 データ有無: {records.hasRecords ? 'あり' : 'なし'}</p>
        <p>⏳ 読み込み中: {records.loading ? 'Yes' : 'No'}</p>
        <p>🏷️ サービス種別数: {records.getServiceTypes().length}種類</p>

        {/** Context連携テスト */}
        <div
          style={{
            border: '1px solid blue',
            padding: '12px',
            margin: '12px 0',
            backgroundColor: '#e3f2fd',
          }}>
          <h4>🔗 CustomerContext連携テスト</h4>

          {/*現在の選択状況表示*/}
          <p>
            <strong>現在選択中の顧客:</strong>{' '}
            {selectedCustomer?.companyName || '未選択'}
          </p>
          <p>
            <strong>現在のフィルター:</strong>{' '}
            {records.filters.customerId
              ? `顧客ID: ${records.filters.customerId}`
              : '全顧客'}
          </p>
          <p>
            <strong>フィルター後履歴件数:</strong> {records.getRecordCount()}件
          </p>

          {/** 顧客選択ボタン */}
          <div style={{ margin: '12px 0' }}>
            <h5>👤 顧客を選択して動作を確認:</h5>

            {customers.map((customer) => (
              <button
                key={customer.customerId}
                onClick={() => {
                  console.log(
                    `=== 顧客選択テスト: ${customer.companyName} ===`
                  );
                  console.log('選択前のフィルター: ', records.filters);
                  console.log('選択前の履歴検索: ', records.getRecordCount());

                  selectCustomer(customer);
                }}
                style={{
                  margin: '4px',
                  padding: '8px 12px',
                  fontSize: '14px',
                  backgroundColor:
                    selectedCustomer?.customerId === customer.customerId
                      ? '#4caf50'
                      : '#2196f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}>
                {customer.companyName}
              </button>
            ))}

            {/* 選択解除ボタン*/}
            <button
              onClick={() => {
                console.log('=== 顧客選択解除テスト ===');
                console.log('解除前のフィルター: ', records.filters);
                console.log('解除前の履歴検索: ', records.getRecordCount());

                selectCustomer(null);
              }}
              style={{
                margin: '4px',
                padding: '8px 12px',
                fontSize: '14px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}>
              🚫 顧客選択解除
            </button>

            {/* 既存の履歴表示部分 */}
            {records.hasRecords && (
              <div>
                <h4>📝 現在表示中の履歴</h4>
                {records.filteredRecords.map((record, index) => (
                  <div
                    key={record.recordId}
                    style={{
                      margin: '8px 0',
                      padding: '8px',
                      border: '1px solid #ccc',
                      backgroundColor: '#fff',
                    }}>
                    <p>
                      {index + 1}. {records.getRecordSummary(record)}
                    </p>
                    <p>
                      顧客: <strong>{record.customer.companyName}</strong>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {records.hasRecords && (
          <div>
            <h4>📝 モックデータ一覧</h4>
            {records.serviceRecords.map((record, index) => (
              <div
                key={record.recordId}
                style={{
                  margin: '8px 0',
                  padding: '8px',
                  border: '1px solid #ccc',
                }}>
                <p>
                  {index + 1}. {records.getRecordSummary(record)}
                </p>
                <p>顧客: {record.customer.companyName}</p>
              </div>
            ))}
          </div>
        )}
        {/** CRUD TEST */}
        <button
          onClick={async () => {
            console.log('=== CREATE TEST START ===');
            await records.createServiceRecord({
              customerId: 2,
              serviceDate: new Date('2025-09-14'),
              serviceType: '定期点検',
              serviceDescription: 'テストで追加したサービス履歴',
              amount: 500000,
            });
          }}
          style={{ margin: '8px', padding: '8px 16px', fontSize: '16px' }}>
          🆕 テストデータ作成
        </button>
        <button
          disabled={records.loading}
          onClick={async () => {
            console.log('=== DELETE TEST START ===');
            await records.deleteServiceRecord(2);
          }}
          style={{ margin: '8px', padding: '8px 16px', fontSize: '16px' }}>
          デリート
        </button>

        {/** VALIDATION TEST */}
        <button
          onClick={async () => {
            console.log('=== VALIDATION TEST START ===');
            const result = await records.createServiceRecord({
              customerId: 0, // invalid customer ID (顧客を選択してください)
              serviceDate: new Date('2025-12-01'), // future date (サービス提供日は今日よりも前の日付を選択してください)
              amount: -100, // 負の金額 (金額は0円以上で入力してください)
            });
            console.log('Validation test result: ', result);
          }}
          style={{
            margin: '8px',
            padding: '8px 16px',
            fontSize: '16px',
            backgroundColor: '#ff6b6b',
          }}>
          ❌ バリデーションテスト
        </button>
        {/** FILTER TEST */}
        <button
          onClick={() => {
            console.log('=== FILTER TEST START===');
            records.setFilters({
              customerId: 1, // 田中建設のみ,
              // serviceType: '外壁塗装',
            });
          }}
          style={{
            margin: '8px',
            padding: '8px 16px',
            fontSize: '16px',
            backgroundColor: '#6b9bff',
          }}>
          🔍 フィルターテスト (田中建設 + 外壁塗装)
        </button>
        {/** CLEAR FILTER TEST */}
        <button
          onClick={() => {
            console.log('=== CLEAR FILTER TEST ===');
            records.clearFilters();
          }}
          style={{
            margin: '8px',
            padding: '8px 16px',
            fontSize: '16px',
            backgroundColor: '#6b9bff',
          }}>
          🗑️ フィルタークリア
        </button>
      </div>
    </>
  );
};

export default TestServiceRecords;
