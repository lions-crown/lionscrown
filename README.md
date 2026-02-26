<br>

L-crown

埼玉西武ライオンズのデータ情報を公開。
...

<div style="max-width: 1100px; width: 94%; margin: 40px auto; overflow: hidden; position: relative;">
  <!-- スライドショー全体ラッパー -->
  <div id="slider" style="display: flex; transition: transform 0.5s ease; width: 300%;"> <!-- 3枚なので300%幅 -->
    
    <!-- 試合1 -->
    <div style="flex: 0 0 33.333%; padding: 0 10px; box-sizing: border-box;">
      <div style="background: #f8f9fa; border-radius: 10px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        <h2 style="text-align: center; color: #092048; font-size: 1.35rem; margin: 0 0 12px 0;">
          【オープン戦】2026年3月1日 vs福岡ソフトバンクホークス
        </h2>
        <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: #475569; margin-bottom: 12px; font-weight: bold;">
          <div style="font-size: 1.1rem;">13:00</div>
          <div>アイビースタジアム</div>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
          <div style="flex: 1 1 100px; text-align: center; min-width: 80px;">
            <img src="https://lions-crown.homep.jp/img/1759836807957.webp" alt="西武" style="width: 48px; height: 48px; object-fit: contain; margin-bottom: 4px;">
            <div style="font-size: 0.95rem; font-weight: bold; color: #092048;">西武</div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; flex: 1 1 auto; justify-content: center; min-width: 180px;">
            <div style="font-size: 0.85rem; color: #334155;">先攻</div>
            <div style="font-size: 2.4rem; font-weight: 900; min-width: 60px; text-align: center;">0</div>
            <div style="font-size: 1.2rem; color: #64748b; padding: 0 6px;">–</div>
            <div style="font-size: 2.4rem; font-weight: 900; min-width: 60px; text-align: center;">0</div>
            <div style="font-size: 0.85rem; color: #334155;">後攻</div>
          </div>
          <div style="flex: 1 1 100px; text-align: center; min-width: 80px;">
            <img src="https://lions-crown.homep.jp/img/1759836829251.webp" alt="ソフトバンク" style="width: 48px; height: 48px; object-fit: contain; margin-bottom: 4px;">
            <div style="font-size: 0.95rem; font-weight: bold; color: #F5C700;">ソフトバンク</div>
          </div>
        </div>
        <div style="text-align: center; font-size: 1rem; margin: 12px 0 8px; color: #334155;">試合前</div>
        <div style="text-align: right; font-size: 0.75rem; color: #6b7280; margin-top: 12px;">
          最終更新： 2026年3月1日 00:00
        </div>
      </div>
    </div>

    <!-- 試合2 -->
    <div style="flex: 0 0 33.333%; padding: 0 10px; box-sizing: border-box;">
      <div style="background: #f0f4f8; border-radius: 10px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        <h2 style="text-align: center; color: #092048; font-size: 1.35rem; margin: 0 0 12px 0;">
          【教育L】2026年3月3日 vs横浜DeNAベイスターズ
        </h2>
        <!-- ここに試合2の内容をコピーして貼り付け（省略） -->
        <div style="text-align: center; color: #666; padding: 40px 0;">（試合2の内容をここに挿入）</div>
      </div>
    </div>

    <!-- 試合3 -->
    <div style="flex: 0 0 33.333%; padding: 0 10px; box-sizing: border-box;">
      <div style="background: #ffffff; border-radius: 10px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        <h2 style="text-align: center; color: #092048; font-size: 1.35rem; margin: 0 0 12px 0;">
          【3軍】2026年3月15日 vs高知ファイティングドッグス
        </h2>
        <!-- ここに試合3の内容をコピーして貼り付け（省略） -->
        <div style="text-align: center; color: #666; padding: 40px 0;">（試合3の内容をここに挿入）</div>
      </div>
    </div>
  </div>

  <!-- 左右ボタン -->
  <button id="prevBtn" style="position: absolute; top: 50%; left: 10px; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: white; border: none; padding: 12px 16px; font-size: 1.5rem; cursor: pointer; border-radius: 50%; z-index: 10;">◀</button>
  <button id="nextBtn" style="position: absolute; top: 50%; right: 10px; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: white; border: none; padding: 12px 16px; font-size: 1.5rem; cursor: pointer; border-radius: 50%; z-index: 10;">▶</button>
</div>

<script>
  const slider = document.getElementById('slider');
  const slides = slider.children.length;
  let currentIndex = 0;

  function showSlide(index) {
    if (index >= slides) index = 0;
    if (index < 0) index = slides - 1;
    slider.style.transform = `translateX(-${index * (100 / 3)}%)`;
    currentIndex = index;
  }

  document.getElementById('prevBtn').addEventListener('click', () => showSlide(currentIndex - 1));
  document.getElementById('nextBtn').addEventListener('click', () => showSlide(currentIndex + 1));

  // 自動スライド（3秒ごと）
  setInterval(() => showSlide(currentIndex + 1), 3000);
</script>
