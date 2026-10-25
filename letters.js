// 文字と読み方の資料。各言語ごとに「表」の配列を持つ。
// 表の items は { c: 文字, r: 読み, sub: 補足, say: 読み上げる文字列（省略時は c）}。
// c が空の項目は五十音表の空きマス。
(() => {
  // "文字:読み:補足:読み上げ" を | 区切りで並べた文字列から items を作る
  const parse = (s) =>
    s.split("|").map((x) => {
      const [c, r = "", sub = "", say = ""] = x.split(":");
      return { c, r, sub, say: say || c };
    });

  // かな五十音（ひらがな・カタカナ共通の行構成）
  const kanaRows = (kana, roma) => {
    const ks = kana.split(" "), rs = roma.split(" ");
    return ks.map((c, i) => (c === "・" ? { c: "", r: "" } : { c, r: rs[i], sub: "", say: c }));
  };
  const GOJUON_ROMA =
    "a i u e o ka ki ku ke ko sa shi su se so ta chi tsu te to na ni nu ne no ha hi fu he ho ma mi mu me mo ya - yu - yo ra ri ru re ro wa - - - wo n - - - -";
  const DAKU_ROMA = "ga gi gu ge go za ji zu ze zo da ji zu de do ba bi bu be bo pa pi pu pe po";
  const YOON_ROMA = "kya kyu kyo sha shu sho cha chu cho nya nyu nyo hya hyu hyo mya myu myo rya ryu ryo gya gyu gyo ja ju jo bya byu byo pya pyu pyo";

  window.LETTERS = {
    en: [
      {
        title: "アルファベット",
        note: "文字の名前（読み方）と、その文字で始まる単語の例です。タップすると「文字の名前 → 単語」の順に読み上げます。",
        cols: 4,
        items: parse(
          "A a:エイ:apple:A. apple|B b:ビー:ball:B. ball|C c:スィー:cat:C. cat|D d:ディー:dog:D. dog|E e:イー:egg:E. egg|F f:エフ:fish:F. fish|G g:ジー:game:G. game|H h:エイチ:hat:H. hat|I i:アイ:ink:I. ink|J j:ジェイ:jam:J. jam|K k:ケイ:kite:K. kite|L l:エル:lemon:L. lemon|M m:エム:milk:M. milk|N n:エン:nose:N. nose|O o:オウ:orange:O. orange|P p:ピー:pen:P. pen|Q q:キュー:queen:Q. queen|R r:アール:red:R. red|S s:エス:sun:S. sun|T t:ティー:top:T. top|U u:ユー:up:U. up|V v:ヴィー:van:V. van|W w:ダブリュー:water:W. water|X x:エックス:box:X. box|Y y:ワイ:yes:Y. yes|Z z:ズィー:zoo:Z. zoo"
        ),
      },
      {
        title: "短い母音（フォニックス）",
        note: "単語の中で母音字が1つだけのとき、多くは短い音になります。",
        cols: 3,
        items: parse(
          "a:/æ/ アとエの間:cat, map:cat. map|e:/e/ エ:bed, pen:bed. pen|i:/ɪ/ 短いイ:sit, big:sit. big|o:/ɑ/ 口を開けたア:hot, box:hot. box|u:/ʌ/ 短いア:cup, sun:cup. sun"
        ),
      },
      {
        title: "長い母音（つづりのパターン）",
        note: "語末の e（読まない）や母音字が2つ並ぶと、「長い音」になることが多いです（a_e, i_e などは文字の名前と同じ音）。",
        cols: 3,
        items: parse(
          "a_e / ai:/eɪ/ エイ:cake, rain:cake. rain|ee / ea:/iː/ イー:see, eat:see. eat|i_e / igh:/aɪ/ アイ:bike, night:bike. night|o_e / oa:/oʊ/ オウ:home, boat:home. boat|u_e:/juː/ ユー:cute, use:cute. use|oo:/uː/ ウー:moon, food:moon. food"
        ),
      },
      {
        title: "2文字で1つの音",
        note: "2文字の組み合わせで、それぞれとは別の1つの音を表します。",
        cols: 3,
        items: parse(
          "sh:/ʃ/ シュ:ship:ship|ch:/tʃ/ チ:chair:chair|th:/θ/ 舌を軽くかむ:think:think|th:/ð/ 濁ったth:this:this|ph:/f/ フ:phone:phone|wh:/w/ ワ行:what:what|ck:/k/ ク:back:back|ng:/ŋ/ ング:sing:sing|qu:/kw/ クワ:queen:queen"
        ),
      },
      {
        title: "日本人が間違えやすい音",
        note: "日本語にない区別です。並べて聞き比べましょう。",
        cols: 2,
        items: parse(
          "l / r:light / right:舌先を付ける / 付けない:light. right|b / v:best / vest:唇を閉じる / 下唇をかむ:best. vest|s / th:sink / think:舌は歯の裏 / 歯の間:sink. think|a / u:cat / cut:エに近いア / 短いア:cat. cut"
        ),
      },
    ],

    ko: [
      {
        title: "基本母音（10）",
        note: "母音字は単独では書かず、無音の子音 ㅇ を付けて書きます（아, 어 …）。ㅓ と ㅗ、ㅡ と ㅜ の口の形の違いに注意。",
        cols: 5,
        items: parse(
          "아:a:ア:아|야:ya:ヤ:야|어:eo:口を開いたオ:어|여:yeo:口を開いたヨ:여|오:o:唇を丸めたオ:오|요:yo:唇を丸めたヨ:요|우:u:唇を丸めたウ:우|유:yu:ユ:유|으:eu:口を横に引いたウ:으|이:i:イ:이"
        ),
      },
      {
        title: "合成母音（11）",
        note: "基本母音を組み合わせた母音です。ㅐ と ㅔ は現在ほぼ同じ「エ」で発音されます。",
        cols: 4,
        items: parse(
          "애:ae:エ:애|얘:yae:イェ:얘|에:e:エ:에|예:ye:イェ:예|와:wa:ワ:와|왜:wae:ウェ:왜|외:oe:ウェ:외|워:wo:ウォ:워|웨:we:ウェ:웨|위:wi:ウィ:위|의:ui:ウイ:의"
        ),
      },
      {
        title: "基本子音（10）",
        note: "子音字に ㅏ を付けた形で示します。ㄱ ㄷ ㅂ ㅈ は語頭では濁らず、語中では濁る音になります。",
        cols: 5,
        items: parse(
          "ㄱ:g / k:가 カ・ガ:가|ㄴ:n:나 ナ:나|ㄷ:d / t:다 タ・ダ:다|ㄹ:r / l:라 ラ:라|ㅁ:m:마 マ:마|ㅂ:b / p:바 パ・バ:바|ㅅ:s:사 サ:사|ㅇ:無音 / ng:아 ア:아|ㅈ:j:자 チャ・ジャ:자|ㅎ:h:하 ハ:하"
        ),
      },
      {
        title: "激音（4）",
        note: "息を強く吐き出して発音します。",
        cols: 4,
        items: parse("ㅊ:ch:차 チャ:차|ㅋ:k:카 カ:카|ㅌ:t:타 タ:타|ㅍ:p:파 パ:파"),
      },
      {
        title: "濃音（5）",
        note: "息を出さず、のどを詰まらせるように発音します。「ッカ」のように小さい「ッ」を前に付けるイメージです。",
        cols: 5,
        items: parse("ㄲ:kk:까 ッカ:까|ㄸ:tt:따 ッタ:따|ㅃ:pp:빠 ッパ:빠|ㅆ:ss:싸 ッサ:싸|ㅉ:jj:짜 ッチャ:짜"),
      },
      {
        title: "パッチム（終声）の7つの音",
        note: "文字の下に付く子音（パッチム）は、7つの音のどれかで発音されます。",
        cols: 4,
        items: parse(
          "책:-k:ㄱ ㅋ ㄲ　本:책|산:-n:ㄴ　山:산|맛:-t:ㄷ ㅅ ㅈ ㅊ ㅌ ㅎ ㅆ　味:맛|물:-l:ㄹ　水:물|밤:-m:ㅁ　夜:밤|밥:-p:ㅂ ㅍ　ご飯:밥|방:-ng:ㅇ　部屋:방"
        ),
      },
      {
        title: "文字の組み立て",
        note: "ハングルは「子音＋母音（＋パッチム）」を1つの四角にまとめて1文字にします。",
        cols: 3,
        items: parse(
          "한:han:ㅎ+ㅏ+ㄴ:한|글:geul:ㄱ+ㅡ+ㄹ:글|국:guk:ㄱ+ㅜ+ㄱ:국|어:eo:ㅇ+ㅓ:어|사랑:sarang:愛:사랑|김치:gimchi:キムチ:김치"
        ),
      },
    ],

    ja: [
      {
        title: "ひらがな",
        note: "日本語の基本の文字です。1文字が1拍（同じ長さ）で発音されます。",
        cols: 5,
        items: kanaRows(
          "あ い う え お か き く け こ さ し す せ そ た ち つ て と な に ぬ ね の は ひ ふ へ ほ ま み む め も や ・ ゆ ・ よ ら り る れ ろ わ ・ ・ ・ を ん ・ ・ ・ ・",
          GOJUON_ROMA
        ),
      },
      {
        title: "カタカナ",
        note: "外来語や外国の地名・人名に使います。音はひらがなと同じです。",
        cols: 5,
        items: kanaRows(
          "ア イ ウ エ オ カ キ ク ケ コ サ シ ス セ ソ タ チ ツ テ ト ナ ニ ヌ ネ ノ ハ ヒ フ ヘ ホ マ ミ ム メ モ ヤ ・ ユ ・ ヨ ラ リ ル レ ロ ワ ・ ・ ・ ヲ ン ・ ・ ・ ・",
          GOJUON_ROMA
        ),
      },
      {
        title: "濁音・半濁音",
        note: "右上の「゛」（濁点）で濁った音、「゜」（半濁点）で p の音になります。",
        cols: 5,
        items: kanaRows(
          "が ぎ ぐ げ ご ざ じ ず ぜ ぞ だ ぢ づ で ど ば び ぶ べ ぼ ぱ ぴ ぷ ぺ ぽ",
          DAKU_ROMA
        ),
      },
      {
        title: "拗音",
        note: "小さい「ゃ ゅ ょ」を付けると、2文字で1拍の音になります。",
        cols: 3,
        items: kanaRows(
          "きゃ きゅ きょ しゃ しゅ しょ ちゃ ちゅ ちょ にゃ にゅ にょ ひゃ ひゅ ひょ みゃ みゅ みょ りゃ りゅ りょ ぎゃ ぎゅ ぎょ じゃ じゅ じょ びゃ びゅ びょ ぴゃ ぴゅ ぴょ",
          YOON_ROMA
        ),
      },
      {
        title: "特別な音（促音・長音・撥音）",
        note: "どれも1拍分の長さがあります。長さが変わると意味も変わるので注意。",
        cols: 2,
        items: parse(
          "きって:kitte:小さい「っ」は1拍止める（切手）:きって|きて:kite:「っ」なし（来て）:きて|おばあさん:obaasan:長音：おばあさん（祖母）:おばあさん|おばさん:obasan:短い：おばさん（おば）:おばさん|コーヒー:kōhī:カタカナの長音は「ー」:コーヒー|ほん:hon:「ん」も1拍（本）:ほん"
        ),
      },
    ],
  };
})();
