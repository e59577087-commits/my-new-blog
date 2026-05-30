export type Tool = {
  name: string;
  category: string;
  description: string;
  screenshot: string;
  tags: string[];
  links: {
    label: string;
    href: string;
  }[];
};

export const tools: Tool[] = [
  {
    name: "晨间歌单",
    category: "音乐",
    description: "早上洗漱、煮咖啡或者收拾桌面时会放的歌，声音不大，刚好让一天慢慢醒过来。",
    screenshot: "/tools/astro.svg",
    tags: ["清晨", "放松", "通勤"],
    links: [
      { label: "记录", href: "/tags/音乐/" },
      { label: "日记", href: "/blog/" },
      { label: "关于", href: "/about/" },
    ],
  },
  {
    name: "散步路线",
    category: "散步",
    description: "饭后常走的一小圈，不远也不费劲。走完以后，心情会比出门前清亮一点。",
    screenshot: "/tools/tailwindcss.svg",
    tags: ["傍晚", "楼下", "慢走"],
    links: [
      { label: "记录", href: "/tags/散步/" },
      { label: "日记", href: "/blog/" },
      { label: "关于", href: "/about/" },
    ],
  },
  {
    name: "厨房清单",
    category: "做饭",
    description: "把最近想做的饭、需要补的调料和偶尔成功的小菜记在一起，省得临时想不起来。",
    screenshot: "/tools/cloudflare-pages.svg",
    tags: ["晚饭", "清单", "家常"],
    links: [
      { label: "记录", href: "/blog/" },
      { label: "标签", href: "/tags/" },
      { label: "关于", href: "/about/" },
    ],
  },
  {
    name: "睡前整理",
    category: "整理",
    description: "睡前把桌面、杯子和明天要带的东西放好。不是为了完美，只是让第二天轻松一点。",
    screenshot: "/tools/obsidian.svg",
    tags: ["夜晚", "房间", "小习惯"],
    links: [
      { label: "记录", href: "/tags/整理/" },
      { label: "日记", href: "/blog/" },
      { label: "关于", href: "/about/" },
    ],
  },
];
