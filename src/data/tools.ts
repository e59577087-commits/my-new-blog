export type Tool = {
  slug: string;
  name: string;
  category: string;
  description: string;
  screenshot: string;
  tags: string[];
  date: string;
  links: {
    label: string;
    href: string;
  }[];
};

export const tools: Tool[] = [
  {
    slug: "morning-playlist",
    name: "晨间歌单",
    category: "音乐",
    description: "早上洗漱、煮咖啡或者收拾桌面时会放的歌，声音不大，刚好让一天慢慢醒过来。",
    screenshot: "/tools/astro.svg",
    date: "2026-05-30",
    tags: ["清晨", "放松", "通勤"],
    links: [
      { label: "查看", href: "/tools/" },
      { label: "关于", href: "/about/" },
      { label: "首页", href: "/" },
    ],
  },
  {
    slug: "walking-route",
    name: "散步路线",
    category: "散步",
    description: "饭后常走的一小圈，不远也不费劲。走完以后，心情会比出门前清亮一点。",
    screenshot: "/tools/tailwindcss.svg",
    date: "2026-05-28",
    tags: ["傍晚", "楼下", "慢走"],
    links: [
      { label: "查看", href: "/tools/" },
      { label: "关于", href: "/about/" },
      { label: "首页", href: "/" },
    ],
  },
  {
    slug: "kitchen-list",
    name: "厨房清单",
    category: "做饭",
    description: "把最近想做的饭、需要补的调料和偶尔成功的小菜记在一起，省得临时想不起来。",
    screenshot: "/tools/cloudflare-pages.svg",
    date: "2026-05-24",
    tags: ["晚饭", "清单", "家常"],
    links: [
      { label: "查看", href: "/tools/" },
      { label: "关于", href: "/about/" },
      { label: "首页", href: "/" },
    ],
  },
  {
    slug: "bedtime-routine",
    name: "睡前整理",
    category: "整理",
    description: "睡前把桌面、杯子和明天要带的东西放好。不是为了完美，只是让第二天轻松一点。",
    screenshot: "/tools/obsidian.svg",
    date: "2026-05-22",
    tags: ["夜晚", "房间", "小习惯"],
    links: [
      { label: "查看", href: "/tools/" },
      { label: "关于", href: "/about/" },
      { label: "首页", href: "/" },
    ],
  },
];
