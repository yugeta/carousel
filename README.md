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
  &lt;div class="carousel"&gt;
    &lt;div class="control"&gt;
      &lt;div class="button" data-button="prev"&gt;&lt;/div&gt;
      &lt;div class="button" data-button="next"&gt;&lt;/div&gt;
      &lt;div class="pagenation"&gt;</div&gt;
    &lt;/div&gt;
    &lt;div class="panels"&gt;
      &lt;div style="background-color:orange;color:white;"&gt;1&lt;/div&gt;
      &lt;div style="background-color:blue;color:white;"&gt;2&lt;/div&gt;
      &lt;div style="background-color:green;color:white;"&gt;3&lt;/div&gt;
      &lt;div style="background-color:red;color:white;"&gt;4&lt;/div&gt;
      &lt;div style="background-color:purple;color:white;"&gt;5&lt;/div&gt;
      &lt;div style="background-color:black;color:white;"&gt;6&lt;/div&gt;
    &lt;/div&gt;
  &lt;/div&gt;

2. ヘッダタグに、carousel.jsをセット
  &lt;script type="text/javascript" src="carousel.js"&gt;&lt;/script&gt;

3. ページ下部に、carousel起動コマンドをscriptタグとして記述
  &lt;script&gt;
    new $$carousel({
        baseSelector   : ".carousel"
      , moveCount      : 30
      , dragTranslationRate : 0.3
      , dragInertiaSpeed : 10
      , autoScroll     : true
      , autoScrollTime : 2000
    });
  &lt;/script&gt;

# customize
baseSelector     : 基本となるカルーセルエレメントの親要素
moveCount        : ボタン移動の際の移動速度（数が増えるほど遅くなる）30 * 30msec
dragTranslationRate : ドラッグの際にエレメントサイズの何割で次のバナーに移動するかどうかの割合
dragInertiaSpeed : ドラッグした時のバナーの移動時間（数が増えると早くなる）
autoScroll       : 自動バナー切替の実行フラグ（yes : 自動切替実行 , no : 自動切り替えはしない）
autoScrollTime   : 自動バナー切替を行なう感覚（msec）

