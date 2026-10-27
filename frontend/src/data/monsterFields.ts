// モンスターが出てくるフィールド（どの校舎でも、同じモンスターなら同じフィールドにする）
// 今あるフィールド（ワールド・アイスボーン）のうち、原作で出てくるところに置く。
// 原作でこれらのフィールドに出てこないモンスターは、雰囲気の近いところに仮で置いている
// （リオレウス・ジンオウガ以外は仮。正式な配置が決まったら書き換える）
export const MONSTER_FIELDS: Record<string, { areaName: string; image?: string }> = {
  // 原作どおり
  リオレウス: { areaName: "古代樹の森", image: "/images/maps/image copy.png" },
  ジンオウガ: { areaName: "陸珊瑚の台地", image: "/images/maps/image copy 2.png" },
  // ここから下は仮（原作では出てこないので、雰囲気の近いところ）
  // 古龍のメル・ゼナは、古龍が集まる龍結晶の地
  "メル・ゼナ": { areaName: "龍結晶の地" },
  // 鬼火をまとうマガイマガドは、薄暗い瘴気の谷
  マガイマガド: { areaName: "瘴気の谷", image: "/images/maps/image.png" },
  // ワイルズの砂原で出会うアルシュベルドは、荒地の大蟻塚の荒地
  アルシュベルド: { areaName: "大蟻塚の荒地", image: "/images/maps/image copy 3.png" },
  // ライズでは寒冷群島にも出るタマミツネは、雪と氷の渡りの凍て地
  タマミツネ: { areaName: "渡りの凍て地" },
};
