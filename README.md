Carousel Lite
==
Date   : 2019.04.26
Author : Koji.Yugeta
==

# Summary
シンプルなカルーセルシステムが利用できるように構築しました。
jQueryなどのライブラリは一切使わず、同一ページの他のライブラリにも依存しません。

# Howto
1. HTMLにカルーセルエリアを構築。
  <div class="carousel">
    <div class="control">
      <div class="button" data-button="prev"></div>
      <div class="button" data-button="next"></div>
      <div class="pagenation"></div>
    </div>
    <div class="panels">
      <div style="background-color:orange;color:white;">1</div>
      <div style="background-color:blue;color:white;">2</div>
      <div style="background-color:green;color:white;">3</div>
      <div style="background-color:red;color:white;">4</div>
      <div style="background-color:purple;color:white;">5</div>
      <div style="background-color:black;color:white;">6</div>
    </div>
  </div>

2. ヘッダタグに、carousel.jsをセット
  <script type="text/javascript" src="carousel.js"></script>

3. ページ下部に、carousel起動コマンドをscriptタグとして記述
  <script>
    new $$carousel({
        baseSelector   : ".carousel"
      , moveCount      : 30
      , dragTranslationRate : 0.3
      , dragInertiaSpeed : 10
      , autoScroll     : true
      , autoScrollTime : 2000
    });
  </script>

# customize
baseSelector     : 基本となるカルーセルエレメントの親要素
moveCount        : ボタン移動の際の移動速度（数が増えるほど遅くなる）30 * 30msec
dragTranslationRate : ドラッグの際にエレメントサイズの何割で次のバナーに移動するかどうかの割合
dragInertiaSpeed : ドラッグした時のバナーの移動時間（数が増えると早くなる）
autoScroll       : 自動バナー切替の実行フラグ（yes : 自動切替実行 , no : 自動切り替えはしない）
autoScrollTime   : 自動バナー切替を行なう感覚（msec）

