import React from 'react';
import { useSearch } from '../../hooks/useSearch';

const TestSearchHook: React.FC = () => {
  const search = useSearch();

  console.log('=== useSearch Test Status ===');
  console.log('searchCriteria:', search.searchCriteria);
  console.log('searchResults:', search.searchResults);
  console.log('isSearching:', search.isSearching);
  console.log('search history count:', search.searchHistory.length);
  console.log('Suggested keywords:', search.getSuggestedKeywords());
  console.log('================================');

  return (
    <div
      style={{
        border: '2px solid blue',
        padding: '16px',
        margin: '16px',
        backgroundColor: 'e3f2fd',
      }}>
      <h3>🔍 useSearch テスト結果</h3>

      {/** 基本状態表示 */}
      <div style={{ marginBottom: '16px' }}>
        <p>
          <strong>検索モード: </strong> {search.searchCriteria.mode}{' '}
        </p>
        <p>
          <strong>検索対象: </strong> {search.searchCriteria.target}{' '}
        </p>
        <p>
          <strong>現在のキーワード: </strong> "{search.searchCriteria.keyword}"
        </p>
        <p>
          <strong>検索中: </strong> {search.isSearching ? '✅' : '❌'}
        </p>
        <p>
          <strong>検索件数: </strong> {search.searchResults.totalCount}
        </p>
        <p>
          <strong>検索履歴: </strong> {search.searchHistory.length}
        </p>
      </div>
      {/** 検索結果サマリー */}
      <div
        style={{
          marginBottom: '16px',
          padding: '8px',
          backgroundColor: 'fff',
          border: '1px solid #ccc',
        }}>
        <h4>📊 検索結果サマリー</h4>
        <p>{search.searchResults.searchSummary}</p>
        {search.searchResults.hasResults && (
          <div>
            <p>
              <strong>顧客: </strong> {search.searchResults.customers.length}件
            </p>
            <p>サービス履歴: {search.searchResults.services.length}件</p>
          </div>
        )}
      </div>

      {/* 基本検索テスト */}
      <div style={{ marginBottom: '16px' }}>
        <h4>🔍 基本検索テスト</h4>
        <button
          onClick={async () => {
            console.log('=== 基本検索テスト: "田中建設" ===');
            await search.executeSearch({
              keyword: '田中建設',
              mode: 'basic',
              target: 'all',
            });
          }}
          style={{
            margin: '4px',
            padding: '8px 16px',
            fontSize: '16px',
            backgroundColor: '#4caf50',
            color: 'white',
          }}>
          🏢 "田中建設"で検索
        </button>

        <button
          onClick={async () => {
            console.log('=== 基本検索テスト: "外壁塗装" ===');
            await search.executeSearch({
              keyword: '外壁塗装',
              mode: 'basic',
              target: 'all',
            });
          }}
          style={{
            margin: '4px',
            padding: '8px 16px',
            fontSize: '16px',
            backgroundColor: '#2196f3',
            color: 'white',
          }}>
          🎨 "外壁塗装"で検索
        </button>

        <button
          onClick={async () => {
            console.log('=== 検索クリアテスト ===');
            search.resetSearch();
          }}
          style={{
            margin: '4px',
            padding: '8px 16px',
            fontSize: '16px',
            backgroundColor: '#ff9800',
            color: 'white',
          }}>
          🗑️ 検索クリア
        </button>

        {/** 詳細検索テスト */}
        <div style={{ marginBottom: '16px' }}>
          <h4>🔍 詳細検索テスト</h4>
          <button
            onClick={async () => {
              console.log('=== 詳細検索テスト: 会社名指定 ===');
              await search.executeSearch({
                mode: 'detailed',
                companyName: '田中',
                target: 'customers',
              });
            }}
            style={{
              margin: '4px',
              padding: '8px 16px',
              fontSize: '16px',
              backgroundColor: '#9c27b0',
              color: 'white',
            }}>
            🏢 会社名"田中"で検索
          </button>

          <button
            onClick={async () => {
              console.log('=== 詳細検索テスト: サービス種別指定 ===');
              await search.executeSearch({
                mode: 'detailed',
                serviceType: '塗装',
                target: 'services',
              });
            }}
            style={{
              margin: '4px',
              padding: '8px 16px',
              fontSize: '16px',
              backgroundColor: '#795548',
              color: 'white',
            }}>
            🎨 サービス"塗装"で検索
          </button>
        </div>

        {/* debounce検索テスト */}
        <div style={{ marginBottom: '16px' }}>
          <h4>🔍 debounce検索テスト</h4>
          <input
            type="text"
            placeholder="リアルタイム検索をテスト..."
            id="debounce-search-input"
            onChange={(e) => {
              console.log('Debounce search triggered: ', e.target.value);
              search.debouncedSearch(e.target.value);
            }}
            style={{
              margin: '4px',
              padding: '8px 16px',
              fontSize: '16px',
              width: '300px',
              border: '2px solid #ccc',
              borderRadius: '4px',
            }}
          />
          <button
            onClick={() => {
              console.log('=== 検索キャンセルテスト ===');
              search.cancelSearch();
            }}
            style={{
              margin: '4px',
              padding: '8px 16px',
              fontSize: '16px',
              backgroundColor: '#f44336',
              color: 'white',
            }}>
            🚫 検索キャンセル
          </button>
        </div>
        {/* 検索履歴テスト */}
        <div style={{ marginBottom: '16px' }}>
          <h4>🔍 検索履歴テスト</h4>
          {search.searchHistory.length > 0 ? (
            <div>
              <p>
                <strong>最近の検索:</strong>
              </p>
              {search.getRecentSearches(3).map((history, index) => (
                <div
                  key={history.id}
                  style={{
                    margin: '4px 0',
                    padding: '8px',
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}>
                  <p>
                    <strong>{index + 1}. </strong> {history.label}
                  </p>
                  <p>
                    結果: {history.resultCount}件 |{' '}
                    {new Date(history.searchedAt).toLocaleString()}
                  </p>
                  <button
                    onClick={async () => {
                      console.log('=== 履歴から再検索 ===', history.label);
                      await search.searchFromHistory(history);
                    }}
                    style={{
                      padding: '4px 8px',
                      fontSize: '14px',
                      backgroundColor: '#4caf50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}>
                    🔍 再実行
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  console.log('=== 検索履歴クリア ===');
                  search.clearHistory();
                }}
                style={{
                  margin: '8px 4px 4px 4px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  backgroundColor: '#f44336',
                  color: 'white',
                }}>
                🗑️ 履歴クリア
              </button>
            </div>
          ) : (
            <p>検索履歴がありません</p>
          )}
        </div>

        {/* 検索候補テスト */}
        <div style={{ marginBottom: '16px' }}>
          <h4>💡 検索候補テスト</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {search
              .getSuggestedKeywords()
              .slice(0, 5)
              .map((keyword, index) => (
                <button
                  key={index}
                  onClick={async () => {
                    console.log('=== 候補キーワード検索 ===', keyword);
                    await search.executeSearch({
                      keyword,
                      mode: 'basic',
                      target: 'all',
                    });
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '14px',
                    backgroundColor: '#e0e0e0',
                    border: '1px solid #ccc',
                    borderRadius: '16px',
                    cursor: 'pointer',
                  }}>
                  {keyword}
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestSearchHook;
