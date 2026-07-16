export type OmikujiTone = "blessing" | "bright" | "steady" | "caution";

export type OmikujiFortune = {
  grade: string;
  message: string;
  wish: string;
  study: string;
  health: string;
  love: string;
  tone: OmikujiTone;
};

export type OmikujiFortuneTemplate = {
  grade: string;
  tone: OmikujiTone;
  messages: readonly string[];
  guidance: readonly string[];
  wishes: readonly string[];
  studies: readonly string[];
  healthNotes: readonly string[];
  loveNotes: readonly string[];
};

export const OMIKUJI_LAST_DRAW_KEY = "blog-omikuji-last-draw-v1";

export function getOmikujiDayKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function hasDrawnOmikujiToday(lastDrawDay: string | null, date: Date = new Date()): boolean {
  return lastDrawDay === getOmikujiDayKey(date);
}

export const omikujiFortunes: readonly OmikujiFortuneTemplate[] = [
  {
    grade: "大吉",
    tone: "blessing",
    messages: [
      "云开见月，所行皆有回响。",
      "朝日初升，前路正得天时。",
      "长风送帆，眼前阻碍渐散。",
    ],
    guidance: [
      "大胆迈出那一步，好运会在路上与你相逢。",
      "把握此刻的契机，想做的事可以启程。",
      "保持真心与从容，收获会比预想更丰盛。",
    ],
    wishes: ["诚心所愿，渐次成真", "所求逢时，喜讯将至", "心中大愿，可望圆满"],
    studies: ["思路通明，落笔有神", "灵感相随，进境可期", "勤思有得，佳绩将临"],
    healthNotes: ["精气充盈，宜多行走", "身心舒展，活力正盛", "气息调和，诸事轻快"],
    loveNotes: ["心意相通，佳音将近", "良缘有应，坦诚则成", "相逢有喜，情意渐明"],
  },
  {
    grade: "中吉",
    tone: "blessing",
    messages: [
      "春风已经起了，事情正向好处转。",
      "石上清泉缓缓流来，前路渐见明朗。",
      "远处灯火可见，眼下的坚持没有白费。",
    ],
    guidance: [
      "无需急着抵达，顺着好势头稳稳前行即可。",
      "按既定节奏继续走，合适的机会自然会来。",
      "多留意身边的善意，它会带来新的转机。",
    ],
    wishes: ["耐心推进，可得圆满", "所盼有讯，静候佳音", "顺势而为，渐近所求"],
    studies: ["温故知新，收获可期", "稳住节奏，理解渐深", "多问多练，必有进益"],
    healthNotes: ["作息安稳，自然轻快", "适量运动，精神渐佳", "劳逸相济，身体无忧"],
    loveNotes: ["坦率表达，关系升温", "温柔回应，默契渐生", "耐心相处，好感日增"],
  },
  {
    grade: "小吉",
    tone: "bright",
    messages: [
      "微光虽小，也足以照亮下一步。",
      "枝头新芽初露，小小变化正在发生。",
      "雨后风声清浅，寻常之中藏着好消息。",
    ],
    guidance: [
      "今天适合完成一件拖延已久的小事。",
      "先照顾好眼前的一步，幸运会慢慢累积。",
      "别忽略细微的机会，它可能正合你意。",
    ],
    wishes: ["先成小愿，再候佳期", "小有所得，后续可期", "循序求成，渐有回应"],
    studies: ["专注当下，积少成多", "每日寸进，终见成果", "整理旧题，忽有所悟"],
    healthNotes: ["适度舒展，早些休息", "少坐多动，气息更顺", "清淡饮食，精神渐稳"],
    loveNotes: ["细小关怀，最动人心", "偶然相谈，心意靠近", "放轻脚步，缘分自来"],
  },
  {
    grade: "吉",
    tone: "bright",
    messages: [
      "平常之日，自有平常的福气。",
      "水流不争先，却总能抵达该去的地方。",
      "庭前风平，眼下正适合安稳耕耘。",
    ],
    guidance: [
      "把手边的事做好，答案会慢慢清晰。",
      "不必追逐捷径，认真走过的路都算数。",
      "守住自己的节奏，寻常日子也会有收获。",
    ],
    wishes: ["脚踏实地，终有所成", "守心而行，所愿渐近", "不疾不徐，自有结果"],
    studies: ["循序渐进，勿求速成", "基础扎实，后程更稳", "静心研读，疑惑可解"],
    healthNotes: ["饮食有节，身心平和", "规律起居，安然无恙", "放松肩颈，少思多眠"],
    loveNotes: ["自然相处，不必催促", "平淡相守，亦是好缘", "真诚相待，关系自稳"],
  },
  {
    grade: "末吉",
    tone: "steady",
    messages: [
      "好运正在来的路上，只是脚步稍慢。",
      "云层尚未散尽，天边却已有微光。",
      "种子仍在土中，暂时看不见并非没有生长。",
    ],
    guidance: [
      "现在的积累，会在往后显出意义。",
      "先耐心等一等，时机成熟后再行动更好。",
      "保持准备，不必因暂时沉寂而怀疑自己。",
    ],
    wishes: ["时机未熟，静候花开", "先作准备，后有转机", "进展稍缓，终能如愿"],
    studies: ["补齐基础，后劲渐显", "暂有停滞，复习可破", "沉心积累，稍后见效"],
    healthNotes: ["留意疲劳，量力而行", "睡眠为先，切勿透支", "慢些安排，身心渐复"],
    loveNotes: ["给彼此一点时间", "缘分未明，不宜催问", "先安顿自己，再候回音"],
  },
  {
    grade: "凶",
    tone: "caution",
    messages: [
      "风浪只是提醒，并不是结局。",
      "山路暂逢薄雾，此刻不宜匆忙赶路。",
      "弦绷得有些紧，继续用力反而容易失准。",
    ],
    guidance: [
      "今天宜收不宜放，避开冲动的决定便可转安。",
      "先停下来辨清方向，谨慎比速度更加重要。",
      "把风险减到最小，平稳度过便是在转运。",
    ],
    wishes: ["暂缓一步，再作打算", "所求多阻，不宜强进", "先除隐患，改日再谋"],
    studies: ["查漏补缺，莫因急躁", "心绪稍乱，宜先整理", "难题暂放，回头再解"],
    healthNotes: ["减少熬夜，注意休息", "身体有讯，切勿忽视", "放下劳累，及时调养"],
    loveNotes: ["少些猜测，多些倾听", "言语易伤，宜缓后再谈", "保持分寸，避免误会"],
  },
  {
    grade: "大凶",
    tone: "caution",
    messages: [
      "纸上写的是警醒，并非命定。",
      "逆风正盛，此时停泊也是一种前行。",
      "夜色虽深，守住灯火便不会失去方向。",
    ],
    guidance: [
      "把今天当作休整日，谨慎前行便是在积福。",
      "重大决定暂且搁置，先保护好自己与身边的人。",
      "减少消耗、远离争端，低谷终会随时间过去。",
    ],
    wishes: ["不宜强求，先守本心", "诸事暂缓，以静制动", "先避风险，来日再求"],
    studies: ["放慢节奏，重新整理", "切忌硬撑，先补根基", "暂停冒进，回看错处"],
    healthNotes: ["好好休息，莫逞强撑", "不适宜拖，及时照顾", "减少负担，安心静养"],
    loveNotes: ["止住争执，择日再谈", "情绪正急，先留距离", "勿作决断，待心平和"],
  },
] as const;

function pickRandom<T>(items: readonly T[], random: () => number): T {
  const sampled = Number(random());
  const safeValue = Number.isFinite(sampled) ? Math.min(Math.max(sampled, 0), 0.999999999999) : 0;
  return items[Math.floor(safeValue * items.length)];
}

export function drawOmikuji(random: () => number = Math.random): OmikujiFortune {
  const template = pickRandom(omikujiFortunes, random);
  return {
    grade: template.grade,
    tone: template.tone,
    message: `${pickRandom(template.messages, random)}${pickRandom(template.guidance, random)}`,
    wish: pickRandom(template.wishes, random),
    study: pickRandom(template.studies, random),
    health: pickRandom(template.healthNotes, random),
    love: pickRandom(template.loveNotes, random),
  };
}
