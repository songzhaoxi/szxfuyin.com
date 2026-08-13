  /* 福音传递爱圣经学院研读课程 - 圣经学苑课程数据 */
   var _IMG='https://xue2.52fuyin.com/static/images/book/';
   var _MP3='https://xue2.52fuyin.com/file/mp3/';
  
  const COURSE_DATA = [
  // 新旧约导读教材
  {cat:'新旧约导读教材',catIcon:'📚',books:[
    {id:1,img:'Mosessimply0803.png',title:'摩西五经',teacher:'赖建国博士',units:'34单元'},
    {id:2,img:'Old-Testamentsimply0803.png',title:'旧约历史',teacher:'吴献章博士',units:'24单元'},
    {id:3,img:'DanielInLionsDen-simply0803.png',title:'大先知书',teacher:'吴献章博士',units:'20单元'},
    {id:4,img:'Jonah-simply0803.png',title:'小先知书',teacher:'蔡筱枫 师母',units:'20单元'},
    {id:5,img:'jobsimply0803.png',title:'约伯记',teacher:'刘幸枝博士',units:'20单元'},
    {id:6,img:'gospel-simply0803.png',title:'福音书',teacher:'孙宝玲博士',units:'20单元'},
    {id:7,img:'Paul-simply0803.png',title:'保罗书信',teacher:'黄子嘉博士',units:'60单元'},
    {id:8,img:'Peter-simply0803.png',title:'彼得书信',teacher:'张圣佳博士',units:'15单元'}
  ]},
  // 旧约单卷教材
  {cat:'旧约单卷教材',catIcon:'📜',books:[
    {id:9,img:'Jeremiah-simply0502.png',title:'耶利米书',teacher:'蔡筱枫 师母',units:'12单元'},
    {id:10,img:'job-simply-20160226.png',title:'约伯记',teacher:'赖建国博士',units:'24单元'},
    {id:11,img:'psalmssimply0803.png',title:'诗篇',teacher:'吴献章博士',units:'30单元'},
    {id:12,img:'Proverbs-simply0502.png',title:'箴言',teacher:'刘幸枝博士',units:'20单元'}
  ]},
  // 新约单卷教材
  {cat:'新约单卷教材',catIcon:'✝️',books:[
    {id:13,img:'luke-simply0803.png',title:'路加福音',teacher:'孙宝玲博士',units:'20单元'},
    {id:14,img:'john-simply-0729.png',title:'约翰福音',teacher:'黄子嘉博士',units:'24单元'},
    {id:15,img:'Stephen-simply0803.png',title:'使徒行传',teacher:'张圣佳博士',units:'24单元'},
    {id:16,img:'romans-simply20160708.png',title:'罗马书',teacher:'陆大龄博士',units:'20单元'},
    {id:17,img:'2CO_S.png',title:'哥林多前后书',teacher:'王良玉博士',units:'20单元'},
    {id:19,img:'Trial--simply0803.png',title:'试炼与得胜',teacher:'潘秋郎博士',units:'15单元'}
  ]},
  // 释经类教材
  {cat:'释经类教材',catIcon:'🔍',books:[
    {id:20,img:'deer-simply.png',title:'如鹿渴慕溪水——释经学',teacher:'廖元威博士',units:'20单元'},
    {id:21,img:'bible-simply0803.png',title:'圣经概论（上）',teacher:'吴献章博士',units:'20单元'},
    {id:22,img:'bible2-simply0502.png',title:'圣经概论（下）',teacher:'王瑞珍博士',units:'24单元'}
  ]},
  // 神学类教材
  {cat:'神学类教材',catIcon:'🎓',books:[
    {id:23,img:'u65B0u589E-1-simply.png',title:'系统神学（上）',teacher:'曾劭恺博士',units:'30单元'},
    {id:24,img:'Church-simply-0925.png',title:'教会论',teacher:'李健博士',units:'20单元'},
    {id:25,img:'end-simply-20160226.png',title:'末世论',teacher:'黄子嘉博士',units:'15单元'},
    {id:26,img:'ETHICS_S.png',title:'基督教伦理学',teacher:'张宰金博士',units:'24单元'}
  ]},
  // 实践类教材
  {cat:'实践类教材',catIcon:'🛠️',books:[
    {id:27,img:'u65B0u589E-2-simply.png',title:'教牧学',teacher:'魏玉琴博士',units:'20单元'},
    {id:28,img:'u65B0u589E-3-simply.png',title:'讲道学',teacher:'邱显正博士',units:'20单元'},
    {id:29,img:'Teaching-simply0729.png',title:'教学法',teacher:'廖元威博士',units:'15单元'},
    {id:30,img:'mission-simply20151023.png',title:'宣教学',teacher:'邱显正博士',units:'24单元'}
  ]}
];

function imgUrl(n){return _IMG+n}
function mp3Url(cid,seq){return _MP3+cid+'/'+seq+'.mp3'}
