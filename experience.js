export const questions = [
  { title: '休日、ぽっかり予定が空いたら？', choices: ['気になっていた場所へ行ってみる','誰かを誘って出かける','とりあえず外に出てみる','家でゆっくり好きなことをする'] },
  { title: '新しいものを見つけたとき、あなたは？', choices: ['「面白そう！」と詳しく知りたくなる','誰かに教えたくなる','まず試してみる','自分に合いそうかじっくり見る'] },
  { title: 'チームで仕事をするとき、自然とやっているのは？', choices: ['新しいアイデアを出す','みんなが話しやすい空気をつくる','まず動いて進める','細かいところまで丁寧に整える'] },
  { title: '予想外のことが起きたとき、近いのは？', choices: ['別の方法を考えてみる','周りと話して解決する','できることからすぐ動く','状況を整理して落ち着いて対応する'] },
];
export const types = [
  { id:'inspiration', label:'ひらめき', name:'キラリ', color:'#4669bc', accent:'#edcf78', symbol:'✦', strengths:'発想力・感性・アイデア', desc:'知らないものや新しい発想に自然と惹かれる、好奇心いっぱいのタイプ。いつもの景色の中にも小さな面白さを見つけられるのが、あなたの素敵なところです。', wish:'心がきらっと動く発見に、たくさん出会えますように。' },
  { id:'connection', label:'つながり', name:'ポム', color:'#bc637b', accent:'#f8bfbb', symbol:'♡', strengths:'思いやり・コミュニケーション・協調性', desc:'人との時間を大切にして、自然と周りをあたためられるタイプ。誰かと誰かをつないだり、場をやわらかくできるのがあなたの強みです。', wish:'素敵なご縁が、もっともっと広がる一年になりますように。' },
  { id:'challenge', label:'チャレンジ', name:'トト', color:'#438a68', accent:'#f6b362', symbol:'✧', strengths:'行動力・前向きさ・突破力', desc:'面白そうと思ったら、一歩踏み出せる前向きなタイプ。考えるだけで終わらず、動きながら道をつくれるのがあなたの強みです。', wish:'その一歩の先に、ワクワクする景色が待っていますように。' },
  { id:'calm', label:'やすらぎ', name:'モコ', color:'#7fb3a2', accent:'#f1ead1', symbol:'❄', strengths:'丁寧さ・安定感・気配り', desc:'物事に落ち着いて向き合い、周りにも安心感を届けられるタイプ。丁寧に考えたり、小さな変化に気づけることがあなたの強みです。', wish:'心地よい時間と小さな幸せが、たくさん訪れますように。' },
];
// 同点の候補に含まれる、最も新しい回答を優先する。
export function resultIndex(answers) {
  if (!answers.length || answers.some(a => !Number.isInteger(a) || a < 0 || a > 3)) throw new Error('Invalid answers');
  const scores = types.map((_, i) => answers.filter(a => a === i).length);
  const best = Math.max(...scores);
  return [...answers].reverse().find(i => scores[i] === best);
}
export function shareUrl(configured, current) {
  const url = new URL(configured || current);
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('共有URLを確認してください。');
  url.hash = '';
  if (!configured) url.search = '';
  return url.href;
}
