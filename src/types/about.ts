// 关于页面配置类型定义

export interface AvatarSkills {
  left: string[];
  right: string[];
}

export interface AboutSiteTips {
  tips: string;
  title1: string;
  title2: string;
  word: string[];
}

export interface Map {
  title: string;
  strengthenTitle: string;
  background: string;
  backgroundDark: string;
}

export interface SelfInfo {
  tips1: string;
  contentYear: string;
  tips2: string;
  content2: string;
  tips3: string;
  content3: string;
}

export interface Personalities {
  tips: string;
  authorName: string;
  personalityType: string;
  personalityTypeColor: string;
  personalityImg: string;
  nameUrl: string;
  photoUrl: string;
}

export interface Maxim {
  tips: string;
  top: string;
  bottom: string;
}

export interface Buff {
  tips: string;
  top: string;
  bottom: string;
}

export interface Game {
  tips: string;
  title: string;
  uid: string;
  background: string;
}

export interface Comic {
  tips: string;
  title: string;
  list: Array<{
    name: string;
    cover: string;
    href: string;
  }>;
}

export interface Like {
  tips: string;
  title: string;
  bottom: string;
  background: string;
}

export interface Music {
  tips: string;
  title: string;
  link: string;
  background: string;
}

export interface Career {
  desc: string;
  color?: string;
}

export interface Careers {
  tips: string;
  title: string;
  img?: string;
  list?: Career[];
}

export interface AboutPageConfig {
  // 基础信息
  name: string;
  description: string;
  avatarImg: string;
  subtitle: string;

  // 头像技能标签
  avatarSkills: AvatarSkills;

  // 关于网站提示
  aboutSiteTips: AboutSiteTips;

  // 地图信息
  map: Map;

  // 个人信息
  selfInfo: SelfInfo;

  // 性格信息
  personalities: Personalities;

  // 格言
  maxim: Maxim;

  // 增益
  buff: Buff;

  // 游戏信息
  game: Game;

  // 漫画信息
  comic: Comic;

  // 喜欢的技术
  like: Like;

  // 音乐
  music: Music;

  // 职业经历
  careers: Careers;

  // 技能信息
  skillsTips: {
    tips: string;
    title: string;
  };
}

// 访问统计数据类型
export interface StatisticData {
  today_visitors: number;
  today_views: number;
  yesterday_visitors: number;
  yesterday_views: number;
  month_views: number;
  year_views: number;
}

// 后端原始数据结构类型
export interface BackendAboutPageConfig {
  name: string;
  description: string;
  subtitle: string;
  hello_about: string;
  avatar_img: string;
  avatar_skills_left: string[];
  avatar_skills_right: string[];
  statistics_background: string;
  about_site_tips: {
    tips: string;
    title1: string;
    title2: string;
    word: string[];
  };
  map: {
    title: string;
    strengthenTitle: string;
    background: string;
    backgroundDark: string;
  };
  self_info: {
    tips1: string;
    contentYear: string;
    tips2: string;
    content2: string;
    tips3: string;
    content3: string;
  };
  personalities: {
    tips: string;
    authorName: string;
    personalityType: string;
    personalityTypeColor: string;
    personalityImg: string;
    nameUrl: string;
    photoUrl: string;
  };
  maxim: {
    tips: string;
    top: string;
    bottom: string;
  };
  buff: {
    tips: string;
    top: string;
    bottom: string;
  };
  game: {
    tips: string;
    title: string;
    uid: string;
    background: string;
  };
  comic: {
    tips: string;
    title: string;
    list: Array<{
      name: string;
      cover: string;
      href: string;
    }>;
  };
  like: {
    tips: string;
    title: string;
    bottom: string;
    background: string;
  };
  music: {
    tips: string;
    title: string;
    link: string;
    background: string;
  };
  careers: {
    tips: string;
    title: string;
    img?: string;
    list?: Career[];
  };
  skills_tips: {
    tips: string;
    title: string;
  };
  custom_code?: string;
  custom_code_html?: string;

  // 板块开关配置
  enable_author_box?: boolean;
  enable_page_content?: boolean;
  enable_skills?: boolean;
  enable_careers?: boolean;
  enable_statistic?: boolean;
  enable_map_and_info?: boolean;
  enable_personality?: boolean;
  enable_photo?: boolean;
  enable_maxim?: boolean;
  enable_buff?: boolean;
  enable_game?: boolean;
  enable_comic?: boolean;
  enable_like_tech?: boolean;
  enable_music?: boolean;
  enable_custom_code?: boolean;
  enable_comment?: boolean;
}
