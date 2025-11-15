/**
 * soundNotification.ts
 *
 * 【音声通知機能】
 *
 * HTML5 Audio APIで「ピコン」音を再生。
 * メンテナンス時期到来時に自動再生。
 */

/**
 * ピコン音を再生
 *
 * @param volume 音量（0.0〜1.0、デフォルト: 0.5）
 */
export function playNotificationSound(volume: number = 0.5): void {
  try {
    // シンプルなビープ音を生成（Web Audio API）
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // ピコン音の設定（高音の短い音）
    oscillator.frequency.value = 800; // 800Hz
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.1
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (error) {
    console.error('音声通知エラー:', error);
    // エラー時はサイレントに（ユーザー体験を損なわない）
  }
}

/**
 * 音量設定を取得（localStorageから）
 */
export function getNotificationVolume(): number {
  try {
    const saved = localStorage.getItem('notificationVolume');
    if (saved) {
      const volume = parseFloat(saved);
      if (volume >= 0 && volume <= 1) {
        return volume;
      }
    }
  } catch (error) {
    console.error('音量設定取得エラー:', error);
  }
  return 0.5; // デフォルト音量
}

/**
 * 音量設定を保存（localStorageへ）
 */
export function setNotificationVolume(volume: number): void {
  try {
    localStorage.setItem('notificationVolume', volume.toString());
  } catch (error) {
    console.error('音量設定保存エラー:', error);
  }
}
