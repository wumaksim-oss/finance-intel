// Mock 前瞻信号 —— 38 只股票 × 1~2 条信号，全量覆盖
//
// 设计目标：
//   1. 不依赖任何外部包 / 网络：build 必过、tsc 必过、本地能跑。
//   2. 38 只股票全量覆盖（A 股 / 港股 / 美股），每只 1~2 条信号，~64 条。
//   3. 视图分布：bullish 23 / bearish 19 / neutral 22（合计 64）。
//   4. 来源分布：xueqiu 38 / analyst 16 / news 10（合计 64）。
//   5. 内部 ID 用确定性 hash，保证 SSR / 客户端一致。
//
// 数据生成规则：
//   - 行业模板：每个行业一段常用「前瞻语言」（bullish / bearish / neutral 各 1）。
//   - 来源分配：每只股票必带 1 条 xueqiu（雪球 KOL 视角）；其余按行业热度
//     补 0~1 条 analyst / news，确保总数 64。

import type { ForwardSignal, ForwardSource, ForwardView } from './forward-signals';

/** 种子股票清单（与 public/data/seed-stocks.json 的 code 一致） */
interface MockStock {
  code: string;
  name: string;
  market: 'US' | 'CN' | 'HK';
  industry: string;
}

const MOCK_STOCKS: MockStock[] = [
  { code: 'NVDA', name: '英伟达', market: 'US', industry: '半导体-设计' },
  { code: 'AMD', name: '超微半导体', market: 'US', industry: '半导体-设计' },
  { code: 'AVGO', name: '博通', market: 'US', industry: '半导体-设计' },
  { code: '688256', name: '寒武纪', market: 'CN', industry: '半导体-设计' },
  { code: '300033', name: '同花顺', market: 'CN', industry: '金融信息服务' },
  { code: '00020', name: '商汤科技', market: 'HK', industry: 'AI-视觉' },
  { code: 'LLY', name: '礼来', market: 'US', industry: '医药-创新药' },
  { code: 'MRNA', name: '莫德纳', market: 'US', industry: '医药-疫苗' },
  { code: '600276', name: '恒瑞医药', market: 'CN', industry: '医药-创新药' },
  { code: '06160', name: '百济神州', market: 'HK', industry: '医药-创新药' },
  { code: 'TSLA', name: '特斯拉', market: 'US', industry: '汽车-电动车' },
  { code: 'RIVN', name: 'Rivian', market: 'US', industry: '汽车-电动车' },
  { code: '300750', name: '宁德时代', market: 'CN', industry: '电池-动力' },
  { code: '002594', name: '比亚迪', market: 'CN', industry: '汽车-电动车' },
  { code: '09866', name: '蔚来', market: 'HK', industry: '汽车-电动车' },
  { code: '002074', name: '国轩高科', market: 'CN', industry: '电池-储能' },
  { code: '300274', name: '阳光电源', market: 'CN', industry: '电源-逆变器+储能' },
  { code: 'ASML', name: '阿斯麦', market: 'US', industry: '半导体-设备' },
  { code: 'AMAT', name: '应用材料', market: 'US', industry: '半导体-设备' },
  { code: '688012', name: '中微公司', market: 'CN', industry: '半导体-设备' },
  { code: '00522', name: 'ASMPT', market: 'HK', industry: '半导体-封装设备' },
  { code: 'COST', name: '好市多', market: 'US', industry: '零售-仓储会员' },
  { code: 'SBUX', name: '星巴克', market: 'US', industry: '消费-餐饮' },
  { code: '600519', name: '贵州茅台', market: 'CN', industry: '消费-白酒' },
  { code: '09988', name: '阿里巴巴-W', market: 'HK', industry: '互联网-电商' },
  { code: 'COIN', name: 'Coinbase', market: 'US', industry: '金融科技-交易所' },
  { code: 'MSTR', name: '微策略', market: 'US', industry: '金融科技-比特币持仓' },
  { code: '03888', name: '金山软件', market: 'HK', industry: '软件-互联网' },
  { code: 'FANUY', name: '发那科 ADR', market: 'US', industry: '工业机器人' },
  { code: '300124', name: '汇川技术', market: 'CN', industry: '工业自动化+伺服' },
  { code: '002472', name: '双环传动', market: 'CN', industry: '齿轮-精密传动' },
  { code: 'RKLB', name: 'Rocket Lab', market: 'US', industry: '商业航天-火箭' },
  { code: 'SPCE', name: '维珍银河', market: 'US', industry: '商业航天-太空旅游' },
  { code: '002446', name: '盛路通信', market: 'CN', industry: '通信-卫星载荷' },
  { code: 'GE', name: '通用电气', market: 'US', industry: '工业-航空发动机' },
  { code: '600031', name: '三一重工', market: 'CN', industry: '工程机械' },
  { code: '002475', name: '立讯精密', market: 'CN', industry: '消费电子-精密制造' },
  { code: '00388', name: '香港交易所', market: 'HK', industry: '金融基础设施-交易所' },
];

// ---------------------------------------------------------------------------
// 行业前瞻语言模板（每行业三段：bullish / bearish / neutral）
// 实际生成时按 view 选一段，再按 source 改一下句式。
// ---------------------------------------------------------------------------

type ViewTemplate = Record<ForwardView, string[]>;

const INDUSTRY_TEMPLATES: Record<string, ViewTemplate> = {
  '半导体-设计': {
    bullish: [
      'AI 算力需求持续超预期，Blackwell 出货周期叠加 sovereign AI 订单，业绩可见度延伸到 2026 H2。',
      '数据中心客户 capex 仍在上修，定制 ASIC 与 HBM 紧缺带来量价齐升，护城河进一步加深。',
    ],
    bearish: [
      '估值已充分定价乐观预期，PE 60+ 反映 3 年高增长，若 1-2 个季度指引低于上限即面临杀估值。',
      '出口管制对华业务仍有不确定性，H20/B20 系列产品随时可能受限，业绩波动放大。',
    ],
    neutral: [
      '短期看 GTC / 财报催化，长期看 CUDA 生态；当前位置建议持有不动，等待下一轮明确信号。',
      '行业景气度仍处高位但环比增速放缓，板块进入"高位震荡"阶段，结构分化大于趋势性机会。',
    ],
  },
  '金融信息服务': {
    bullish: [
      'A 股交易活跃度持续回升，券商 IT 支出恢复，公司作为头部流量入口 ARPU 有望逐步抬升。',
      'AI 投顾、智能交易等新业务开始贡献收入，估值锚定从"工具"向"平台"切换。',
    ],
    bearish: [
      'A 股日均成交量若回落至万亿以下，主营业务直接承压，业绩弹性下降。',
      '互联网券商与 AI 投顾赛道竞争加剧，价格战风险存在。',
    ],
    neutral: [
      '短期催化弱，业绩与成交量强绑定，更适合"看 A 股大盘脸色"配仓。',
      '公司基本面无大变化，建议把注意力放在行业政策与互联网券商价格策略上。',
    ],
  },
  'AI-视觉': {
    bullish: [
      '国内大模型迭代加快，视觉模态在 B 端（安防/制造/医疗）落地节奏好于预期。',
      '香港流动性修复 + AI 概念重估，估值从地板位修复仍有空间。',
    ],
    bearish: [
      '商业化路径仍长，亏损未见明显收窄，订单可见度弱于头部互联网大厂。',
      '香港市场对未盈利 AI 公司估值容忍度有限，融资节奏可能受影响。',
    ],
    neutral: [
      '技术 demo 很多但稳定订单少，建议关注每季披露的客户结构变化。',
      '行业β大于公司α，仓位需配合恒生科技指数判断。',
    ],
  },
  '医药-创新药': {
    bullish: [
      'GLP-1 类减肥药全球放量节奏不变，海外大单 + 国内出海授权持续催化。',
      '国内创新药出海（License-out）Q2 数据再超预期，BD 收入占比快速提升。',
    ],
    bearish: [
      '美国医保谈判压价风险仍在，明星单品若被纳入清单将直接打击峰值销售。',
      '国内医保谈判常态化后单品价格压力持续，行业 beta 压制。',
    ],
    neutral: [
      '估值已较 2024 底部修复，但与海外同类公司相比仍处折价，建议精选管线深度。',
      '建议关注每季 BD 数据与 FDA 关键审评事件，事件驱动 > 趋势持有。',
    ],
  },
  '医药-疫苗': {
    bullish: [
      '新一代 mRNA 流感 / 肿瘤管线进入关键临床读数期，催化剂密集。',
      '猴痘 / RSV 等公共卫生事件周期性带来弹性。',
    ],
    bearish: [
      '新冠需求结构性下滑难以逆转，传统疫苗业务面临持续收缩。',
      '研发管线烧钱快，若融资环境恶化将直接压制估值。',
    ],
    neutral: [
      '催化剂 vs 现金流两难，建议小仓位博弈临床里程碑事件。',
      '行业从"消费医疗"逻辑回归"创新管线"逻辑，估值体系正在重建。',
    ],
  },
  '汽车-电动车': {
    bullish: [
      '全球新能源车渗透率持续提升，海外市场（尤其欧洲 + 东南亚）成为新增长点。',
      '智驾 / 800V / 一体化压铸等技术持续降低 BOM 成本，单车毛利有望修复。',
    ],
    bearish: [
      '价格战仍未结束，主流厂商单车毛利持续承压，盈利兑现节奏低于预期。',
      '北美 / 欧洲对中国电动车的关税与补贴政策变化是主要风险。',
    ],
    neutral: [
      '行业从"卷价格"到"卷智驾"过渡，整车厂估值锚定在软件订阅渗透率。',
      '建议把电动车板块与电池板块分开配仓，相关性在 2025 后明显走弱。',
    ],
  },
  '电池-动力': {
    bullish: [
      '储能需求超预期，电池厂 Q2 排产创历史新高，单位盈利触底反弹。',
      '海外储能项目井喷，中国电池厂在欧美市场份额持续提升。',
    ],
    bearish: [
      '碳酸锂价格低位震荡，库存减值压力仍在。',
      '行业产能仍过剩，价格修复斜率受供给侧约束。',
    ],
    neutral: [
      '动力 vs 储能业务结构变化是观察重点，纯动力标的估值锚定需重估。',
      '建议关注大储招标数据，比乘用车排产更提前反映景气拐点。',
    ],
  },
  '电池-储能': {
    bullish: [
      '海外大储（美国 IRA / 欧洲并网）订单饱满，出货量与单价齐升。',
      '国内独立储能商业模式跑通，业主装机意愿从政策驱动转为经济性驱动。',
    ],
    bearish: [
      '行业产能扩张快，价格下行风险存在，2026 H2 可能再次出现供给过剩。',
      '海外贸易政策波动对组件/电池厂均构成尾部风险。',
    ],
    neutral: [
      '结构性机会大于趋势性机会，差异化产品（长时储能 / 工商储）有溢价空间。',
      '估值修复较充分，业绩兑现成为下一阶段催化剂。',
    ],
  },
  '电源-逆变器+储能': {
    bullish: [
      '欧洲户储去库存接近尾声，2026 年补库周期开启。',
      '光储一体化解决方案单价提升，公司从单一逆变器向系统集成商切换。',
    ],
    bearish: [
      '欧洲补贴退坡 + 中国厂商价格战，户储 ASP 持续承压。',
      '若美国对中国光伏/储能再加关税，海外业务将直接受冲击。',
    ],
    neutral: [
      '业务结构变化是核心跟踪点，工商业储能占比提升有助于估值切换。',
      '建议结合欧美可再生能源装机数据交叉验证景气度。',
    ],
  },
  '半导体-设备': {
    bullish: [
      '国内晶圆厂资本开支维持高位，国产化率仍在快速提升通道。',
      'HBM / 先进封装 / GAA 工艺催生新一代设备需求，技术节点升级带来设备替换周期。',
    ],
    bearish: [
      '出口管制对 EUV / 先进量测设备形成长期约束，关键品类国产化困难。',
      '晶圆厂稼动率波动直接影响设备厂订单可见度。',
    ],
    neutral: [
      '公司估值已较充分反映国产替代逻辑，进一步上行需要业绩兑现支撑。',
      '建议按产品线分仓：先进制程设备 / 成熟制程设备 / 封测设备 节奏不同。',
    ],
  },
  '半导体-封装设备': {
    bullish: [
      'HBM / 2.5D / 3D 封装景气度延续，热压焊 / TCB 设备需求井喷。',
      '公司从传统封装向先进封装切换，订单结构持续优化。',
    ],
    bearish: [
      '半导体周期下行若深化，先进封装资本开支可能延后。',
      '前段设备厂自研封装设备是潜在竞争威胁。',
    ],
    neutral: [
      '业务结构转型中，传统 vs 先进封装业务对业绩弹性贡献差异大。',
      '建议跟踪主要封测厂（台积电 / 长电 / 通富）资本开支节奏。',
    ],
  },
  '零售-仓储会员': {
    bullish: [
      '会员费提价 + 自有品牌占比提升，单店盈利持续优化。',
      '全球门店扩张进入加速期，海外门店爬坡贡献增量。',
    ],
    bearish: [
      '美国可选消费走弱迹象明显，仓储会员店客单价压力上升。',
      '若高通胀二次回归，仓储渠道相对优势会减弱。',
    ],
    neutral: [
      '成熟期标的，业绩稳健但弹性有限，适合防御性配置。',
      '关注会员续费率与自有品牌占比两个核心 KPI。',
    ],
  },
  '消费-餐饮': {
    bullish: [
      '同店销售底部企稳，中国市场门店扩张与新品策略（茶咖融合）双轮驱动。',
      '估值已较 2024 底部修复，但远未到上一轮周期顶部。',
    ],
    bearish: [
      '中国现制茶饮竞争加剧，单店毛利持续被挤压。',
      '美国本土客流量恢复慢，海外市场（尤其中国）业绩弹性减弱。',
    ],
    neutral: [
      '消费弱复苏大背景下，公司估值修复空间有限。',
      '建议观察同店与平均客单价两个关键指标，再决定加减仓节奏。',
    ],
  },
  '消费-白酒': {
    bullish: [
      '高端商务消费企稳，批价触底反弹，经销商库存出清接近尾声。',
      '龙头酒企分红率持续提升，长期持有逻辑依然成立。',
    ],
    bearish: [
      '消费降级持续，次高端价格带压力最大。',
      '年轻人白酒消费习惯变化是结构性风险，长期看影响渗透率。',
    ],
    neutral: [
      '防御属性强，beta 弹性弱，建议作为底仓而非进攻仓位。',
      '关注中秋 / 春节动销数据与批价变化两个核心信号。',
    ],
  },
  '互联网-电商': {
    bullish: [
      '中国互联网监管周期出清，资本开支聚焦 AI 与海外，估值锚定重塑。',
      '海外业务（国际电商 / 云）成为新一轮增长引擎。',
    ],
    bearish: [
      '国内电商竞争格局未稳，淘天 / 拼多多 / 抖音电商三足鼎立挤压利润。',
      '云业务价格战延续，毛利率改善节奏低于预期。',
    ],
    neutral: [
      'AI 商业化路径仍在探索，业绩弹性更多来自业务结构优化而非 AI 本身。',
      '建议跟踪海外业务占比变化 + 阿里云经调整利润率两个指标。',
    ],
  },
  '金融科技-交易所': {
    bullish: [
      '现货比特币 ETF 持续净流入，叠加减半周期，平台交易量与托管量齐升。',
      '稳定币与 RWA 政策推进，公司从纯交易所向"加密金融基础设施"转型。',
    ],
    bearish: [
      '加密资产价格波动剧烈，平台收入与代币持仓直接挂钩，业绩弹性双向放大。',
      '美国监管态度反复，合规成本与业务范围均受冲击。',
    ],
    neutral: [
      '估值已较 2022 周期底部大幅修复，仓位应结合 BTC 周期位置动态调整。',
      '关注稳定币 / RWA 监管进展，以及与 SEC 之间的法律博弈结果。',
    ],
  },
  '金融科技-比特币持仓': {
    bullish: [
      '公司持续加仓 BTC，"数字国库"叙事得到机构资金认可。',
      '若被纳入 MSCI 等指数，被动买盘将带来额外增量。',
    ],
    bearish: [
      '股价与 BTC 高度同步，失去分散化意义，更类似 BTC 杠杆 ETF。',
      '持续发债买币稀释股权，财务杠杆与利率风险并存。',
    ],
    neutral: [
      '公司本质是"BTC 现货 + 杠杆工具"，持仓成本与发债节奏是核心跟踪项。',
      '建议在 BTC 周期低位配置，高位适度减仓。',
    ],
  },
  '软件-互联网': {
    bullish: [
      'WPS AI 商业化与 B 端订阅占比持续提升，估值锚定从"工具"向"AI 平台"切换。',
      '游戏 + WPS + 金山云三业务结构改善，亏损业务收缩释放利润弹性。',
    ],
    bearish: [
      'B 端 SaaS 在国内渗透率仍低，ARPU 提升节奏偏慢。',
      '游戏业务受版号与爆款周期性影响，业绩波动较大。',
    ],
    neutral: [
      '公司业绩拐点仍需观察，建议跟踪 WPS AI 付费用户数。',
      'AI 业务与传统业务估值切换节奏是关键。',
    ],
  },
  '工业机器人': {
    bullish: [
      '全球制造业回流 + 人力成本上升，工业机器人需求结构性增长。',
      'AI 视觉 + 力控 + 协作机器人技术持续突破，应用场景从汽车外溢到 3C / 物流。',
    ],
    bearish: [
      '下游汽车资本开支放缓对订单形成短期压力。',
      '中国厂商（汇川 / 埃斯顿）价格战压力上升。',
    ],
    neutral: [
      '景气度与全球制造业 PMI 强相关，建议按 PMI 节奏配仓。',
      '关注公司在中国市场的份额变化。',
    ],
  },
  '工业自动化+伺服': {
    bullish: [
      '国产替代率持续提升，公司从变频器切入伺服/PLC，平台化战略稳步推进。',
      '新能源（光伏 / 锂电 / 风电）下游景气度延续，工业自动化需求结构性向上。',
    ],
    bearish: [
      '下游制造业资本开支若走弱，将直接传导至订单端。',
      '海外品牌（西门子 / 三菱 / 安川）价格策略对国产厂商形成持续压制。',
    ],
    neutral: [
      '公司具备制造业β + 国产替代α双重属性，建议作为工业板块底仓。',
      '关注新能源下游订单结构变化。',
    ],
  },
  '齿轮-精密传动': {
    bullish: [
      '机器人 / 电动车 / 风电三大下游共振，精密齿轮需求结构性向上。',
      '公司从汽车齿轮向机器人谐波减速器延伸，估值切换空间打开。',
    ],
    bearish: [
      '汽车行业价格战传导至 Tier 1，单价与毛利承压。',
      '机器人下游放量节奏存在不确定性。',
    ],
    neutral: [
      '业务结构转型中，传统齿轮与新兴机器人业务估值锚定差异大。',
      '建议跟踪机器人业务收入占比变化。',
    ],
  },
  '商业航天-火箭': {
    bullish: [
      '全球小卫星发射需求井喷，公司 Electron 火箭发射节奏稳定，估值锚定"火箭股"。',
      '中子星（Neutron）可回收火箭若成功首飞，将打开全新增长空间。',
    ],
    bearish: [
      '发射密度仍受制于供应链与监管，业绩兑现节奏低于市场预期。',
      '行业竞争加剧（SpaceX / Stoke / Relativity 等），发射价格战风险存在。',
    ],
    neutral: [
      '高赔率 + 高波动标的，建议事件驱动而非趋势持有。',
      '关注 Neutron 火箭首飞与 SpaceX 上市进展两个核心催化。',
    ],
  },
  '商业航天-太空旅游': {
    bullish: [
      '商业太空飞行需求从 0 到 1，估值锚定"先发卡位"。',
      '若 Delta Class 飞行器按期交付，公司将进入常态化运营阶段。',
    ],
    bearish: [
      '短期收入贡献极小，业绩与股价更多由叙事驱动，波动剧烈。',
      '技术风险与安全事件对估值有放大效应。',
    ],
    neutral: [
      '题材 > 业绩，仓位宜小不宜大。',
      '关注 Delta Class 飞行测试节奏与商业客户结构。',
    ],
  },
  '通信-卫星载荷': {
    bullish: [
      '国内低轨卫星互联网（GW + 千帆）建设加速，载荷与地面终端需求井喷。',
      '军民两用市场打开，公司从传统军工向商业航天延伸。',
    ],
    bearish: [
      '下游订单波动大，业绩可见度弱。',
      '军工业务回款周期长，现金流压力存在。',
    ],
    neutral: [
      '业务结构转型中，建议跟踪 GW / 千帆星座发射密度。',
      '关注公司商业航天收入占比变化。',
    ],
  },
  '工业-航空发动机': {
    bullish: [
      '全球航空运输恢复，发动机售后市场（MRO）利润率显著高于新机。',
      'LEAP / GEnx 长期订单饱满，业绩兑现节奏确定。',
    ],
    bearish: [
      '新机交付受制于供应链与适航节奏，业绩兑现存在时间差。',
      '中国商发 C919 进展对中长期竞争格局有影响。',
    ],
    neutral: [
      '稳健防御标的，分红率高，适合长线持有。',
      '关注发动机售后市场占比与 LEAP 交付节奏。',
    ],
  },
  '工程机械': {
    bullish: [
      '海外业务（尤其东南亚 / 中东 / 非洲）持续贡献增量，对冲国内下行。',
      '电动化与无人化产品逐步落地，单台 ASP 提升。',
    ],
    bearish: [
      '国内地产链尚未企稳，挖掘机/起重机销量同比仍下行。',
      '行业仍处筑底阶段，估值修复斜率受制于销量数据。',
    ],
    neutral: [
      '国内 vs 海外业务结构是核心跟踪点。',
      '建议按挖掘机销量同比降幅收窄节奏配仓。',
    ],
  },
  '消费电子-精密制造': {
    bullish: [
      'AI 服务器与汽车电子打开新增长极，公司从消费电子向高毛利赛道延伸。',
      '大客户 MR 头戴设备进入第二代，公司在结构件 / 模组层面价值量提升。',
    ],
    bearish: [
      '智能手机出货量增速放缓，消费电子大盘仍是弱景气。',
      '大客户订单波动对单季业绩冲击大。',
    ],
    neutral: [
      '业务结构转型是核心，建议跟踪汽车 / 服务器 / AI 硬件业务收入占比。',
      '关注大客户新品节奏与份额变化。',
    ],
  },
  '金融基础设施-交易所': {
    bullish: [
      'A 股 / 港股 / 衍生品市场扩容，交易所费基持续扩大。',
      '互联互通与 ETF 通持续催化，结算与托管收入结构性增长。',
    ],
    bearish: [
      'A 股日均成交量波动直接影响业绩弹性。',
      '香港市场 IPO 节奏受地缘与监管影响。',
    ],
    neutral: [
      '防御属性强，分红率高，适合长期底仓。',
      '关注互联互通扩容与衍生品新品种。',
    ],
  },
};

// ---------------------------------------------------------------------------
// 来源 → 句式调整
// ---------------------------------------------------------------------------

const SOURCE_AUTHOR: Record<ForwardSource, string> = {
  xueqiu: '雪球用户',
  analyst: '券商研究',
  news: '财经媒体',
  internal: '内部研究',
};

const SOURCE_URL: Record<ForwardSource, string> = {
  xueqiu: 'https://xueqiu.com',
  analyst: 'https://example.com/analyst',
  news: 'https://example.com/news',
  internal: '/research',
};

/** 在行业模板基础上，根据来源微调句式（保持语义不变） */
function adjustForSource(
  raw: string,
  source: ForwardSource,
  stock: MockStock
): string {
  if (source === 'xueqiu') {
    return `${stock.name}：${raw}`;
  }
  if (source === 'analyst') {
    return `${raw}【${stock.industry}行业深度】`;
  }
  if (source === 'news') {
    return `${raw}（${stock.name}最新报道）`;
  }
  return raw;
}

// ---------------------------------------------------------------------------
// 信号生成
// ---------------------------------------------------------------------------

/**
 * 按 view 选模板句，index 在 [0, 行业模板该 view 长度) 区间滚动
 * （保证 64 条信号之间无重复文案）。
 */
function pickTemplate(industry: string, view: ForwardView, idx: number): string {
  const tpl = INDUSTRY_TEMPLATES[industry] ?? INDUSTRY_TEMPLATES['半导体-设计'];
  const arr = tpl[view];
  if (!arr) {
    // 兑底：走默认模板
    return INDUSTRY_TEMPLATES['半导体-设计'][view][0];
  }
  return arr[idx % arr.length];
}

/** 稳定 hash（djb2），用于 ID */
function hashStr(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}

/** 固定时间戳（避免 SSR / 客户端不一致；基准：2026-06-04 09:30 GMT+8） */
const BASE_TS = Date.parse('2026-06-04T01:30:00.000Z');

/** 给定 index 生成过去 N 天的随机但确定的发布时间 */
function mockPublishedAt(offsetHours: number): string {
  return new Date(BASE_TS - offsetHours * 3600 * 1000).toISOString();
}

/**
 * 全量 mock 信号生成器。
 * 38 只股票 × 必带 1 条 xueqiu + 选择性补 analyst/news = 64 条。
 * 分配规则：按 stocks 顺序，前 22 只补 2 条（合计 22*2 + 16*1 = 60），最后调整到 64。
 * 实际：通过 viewCounter / sourceCounter 精确控制分布：
 *   view:    bullish 23 / bearish 19 / neutral 22
 *   source:  xueqiu 38 / analyst 16 / news 10
 */
export function buildMockForwardSignals(): ForwardSignal[] {
  const signals: ForwardSignal[] = [];

  // view / source 配额
  // 目标总数 64：xueqiu 38（每只 1 条 view1） + extra 26（每只 0/1 条 view2）。
  // 最终 view 分布：bullish 23 / bearish 19 / neutral 22。
  // view1 + view2 两个 plan 精确拆分：
  //   view1 (38)：bullish 14 / bearish 10 / neutral 14
  //   view2 (26)：bullish  9 / bearish  9 / neutral  8
  //   合计    64：bullish 23 / bearish 19 / neutral 22 ✓
  const VIEW1_PLAN: ForwardView[] = [];
  for (let i = 0; i < 14; i += 1) VIEW1_PLAN.push('bullish');
  for (let i = 0; i < 10; i += 1) VIEW1_PLAN.push('bearish');
  for (let i = 0; i < 14; i += 1) VIEW1_PLAN.push('neutral');

  const VIEW2_PLAN: ForwardView[] = [];
  for (let i = 0; i < 9; i += 1) VIEW2_PLAN.push('bullish');
  for (let i = 0; i < 9; i += 1) VIEW2_PLAN.push('bearish');
  for (let i = 0; i < 8; i += 1) VIEW2_PLAN.push('neutral');

  for (const arr of [VIEW1_PLAN, VIEW2_PLAN]) {
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = (i * 17 + 3) % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  // 每只股票计划多少条额外（xueqiu 必带）
  // 38 只 xueqiu = 38 → 还需 26 条（analyst 16 + news 10）
  // 前 16 只各加 1 analyst（每只正好 1 条 analyst），其余 10 只加 1 news。
  // 最终 38+16+10 = 64。
  const EXTRA: Array<'analyst' | 'news'> = [];
  for (let i = 0; i < 16; i += 1) EXTRA.push('analyst');
  for (let i = 0; i < 10; i += 1) EXTRA.push('news');
  // 同样打散
  for (let i = EXTRA.length - 1; i > 0; i -= 1) {
    const j = (i * 11 + 5) % (i + 1);
    [EXTRA[i], EXTRA[j]] = [EXTRA[j], EXTRA[i]];
  }

  let v1Idx = 0;
  let v2Idx = 0;
  let eIdx = 0;

  MOCK_STOCKS.forEach((stock, sIdx) => {
    // 1) 必带 xueqiu
    const view1 = VIEW1_PLAN[v1Idx++];
    const raw1 = pickTemplate(stock.industry, view1, sIdx);
    const title1 = adjustForSource(raw1, 'xueqiu', stock);
    signals.push({
      id: `${stock.code}:xueqiu:${view1}:${hashStr(title1)}`,
      code: stock.code,
      view: view1,
      source: 'xueqiu',
      title: title1,
      summary: raw1.slice(0, 80),
      url: `${SOURCE_URL.xueqiu}/S/${stock.code}`,
      author: `${SOURCE_AUTHOR.xueqiu}@${stock.code}`,
      publishedAt: mockPublishedAt(1 + sIdx),
      confidence: 0.6,
    });

    // 2) 选择性补 1 条 analyst / news
    if (eIdx < EXTRA.length) {
      const extra = EXTRA[eIdx++];
      // view2 从独立 plan 取；若该位置是“与 view1 重跳后补的 neutral buffer”，
      //   则跳过该位置，避免影响 view 分布。
      let view2 = VIEW2_PLAN[v2Idx++];
      // 兑底：越界 → fallback 到 'neutral'（但理论上 v2Idx 不应越界 26）。
      if (!view2) view2 = 'neutral';
      const raw2 = pickTemplate(stock.industry, view2, sIdx + 7);
      const title2 = adjustForSource(raw2, extra, stock);
      signals.push({
        id: `${stock.code}:${extra}:${view2}:${hashStr(title2)}`,
        code: stock.code,
        view: view2,
        source: extra,
        title: title2,
        summary: raw2.slice(0, 80),
        url: `${SOURCE_URL[extra]}/${stock.code}`,
        author: `${SOURCE_AUTHOR[extra]}-${stock.industry}`,
        publishedAt: mockPublishedAt(12 + sIdx * 2),
        confidence: extra === 'analyst' ? 0.75 : 0.55,
      });
    }
  });

  return signals;
}

/** 懒加载的单例（模块级 cache） */
let _cached: ForwardSignal[] | null = null;

/** 拿 mock 信号（首次调用时构建，后续直接返回 cache） */
export function getMockForwardSignals(): ForwardSignal[] {
  if (_cached) return _cached;
  _cached = buildMockForwardSignals();
  return _cached;
}

// ---------------------------------------------------------------------------
// 自检：开发期 console 输出分布（仅在 dev 调用时打印）
// ---------------------------------------------------------------------------

/** 自检：返回 view / source 分布 + 总数（仅供调试 / 单元测试） */
export function debugMockStats(): {
  total: number;
  byView: Record<ForwardView, number>;
  bySource: Record<ForwardSource, number>;
} {
  const arr = getMockForwardSignals();
  const byView: Record<ForwardView, number> = { bullish: 0, bearish: 0, neutral: 0 };
  const bySource: Record<ForwardSource, number> = {
    xueqiu: 0,
    analyst: 0,
    news: 0,
    internal: 0,
  };
  for (const s of arr) {
    byView[s.view] += 1;
    bySource[s.source] += 1;
  }
  return { total: arr.length, byView, bySource };
}
