// 兆西福音博客 - 数据管理

// 模拟数据库
const database = {
    // 用户数据
    users: [
        {
            id: 1,
            name: '张牧师',
            email: 'pastor@example.com',
            password: '123456',
            avatar: 'Z',
            role: 'admin'
        },
        {
            id: 2,
            name: '李姊妹',
            email: 'sister@example.com',
            password: '123456',
            avatar: 'L',
            role: 'user'
        }
    ],
    
    // 文章数据
    articles: [
        {
            id: 1,
            title: '基督徒的平安',
            excerpt: '在人生的波澜中，基督徒如何找到真正的平安？这是每个信徒都应该思考的问题。',
            content: `<h2>基督徒的平安</h2>
            <p>平安，是每个基督徒都渴望拥有的宝贵恩赐。在这个充满挑战的世界里，我们常常面临各种困难和试炼，但基督徒的平安与世界所给予的不同。</p>
            
            <h3>什么是真正的平安？</h3>
            <p>真正的平安不是没有困难，而是在困难中有依靠；不是没有问题，而是在问题中有答案。这个平安来自于我们对上帝的信心和对祂话语的相信。</p>
            
            <blockquote>
                "我将这些事告诉你们，是要叫你们在我里面有平安。在世上你们有苦难，但你们可以放心，我已经胜了世界。" - 约翰福音 16:33
            </blockquote>
            
            <h3>如何在日常生活中经历平安？</h3>
            <p>1. <strong>祷告</strong>：将的重担卸给神</p>
            <p>2. <strong>读经</strong>：从神的话语中得着力量</p>
            <p>3. <strong>团契</strong>：与其他信徒互相鼓励</p>
            <p>4. <strong>服侍</strong>：在服侍中经历神的同在</p>
            
            <p>愿每个信徒都能在基督里找到这份宝贵的平安，并在日常生活中活出这份平安。</p>`,
            category: 'devotional',
            author: '张牧师',
            authorId: 1,
            date: '2025-10-20',
            readTime: '5分钟',
            tags: ['平安', '祷告', '信心'],
            views: 1250,
            likes: 89,
            comments: 12
        },
        {
            id: 2,
            title: '感恩的心',
            excerpt: '一颗感恩的心能让我们的生活充满喜乐，也能让我们更容易看见神的恩典。',
            content: `<h2>感恩的心</h2>
            <p>感恩是基督徒品格的重要组成部分。一颗感恩的心不仅能让我们的生活充满喜乐，更能让我们在各种环境中看见神的恩典和作为。</p>
            
            <h3>感恩的力量</h3>
            <p>圣经告诉我们："凡事谢恩，因为这是神在基督耶稣里向你们所定的旨意。"（帖撒罗尼迦前书5:18）</p>
            
            <p>感恩的心能够：</p>
            <ul>
                <li>改变我们的心态，让我们看到积极的一面</li>
                <li>增强我们对神的信心</li>
                <li>改善我们与他人的关系</li>
                <li>带来内心的平安和喜乐</li>
            </ul>
            
            <h3>培养感恩的习惯</h3>
            <p>1. 每天记录三件感恩的事情</p>
            <p>2. 定期向神献上感谢祷告</p>
            <p>3. 向他人表达感谢</p>
            <p>4. 在困难中寻找神的恩典</p>
            
            <blockquote>
                "要常常喜乐，不住的祷告，凡事谢恩。" - 帖撒罗尼迦前书5:16-18
            </blockquote>`,
            category: 'devotional',
            author: '李姊妹',
            authorId: 2,
            date: '2025-10-18',
            readTime: '4分钟',
            tags: ['感恩', '喜乐', '祷告'],
            views: 980,
            likes: 76,
            comments: 8
        },
        {
            id: 3,
            title: '爱的真谛',
            excerpt: '爱是基督教最核心的教导之一，真正的爱是什么样的？我们如何在生活中实践这份爱？',
            content: `<h2>爱的真谛</h2>
            <p>爱是基督教最核心的教导，也是我们信仰生活的基石。哥林多前书13章被称为"爱的篇章"，为我们揭示了爱的真谛。</p>
            
            <h3>圣经中的爱</h3>
            <p>神就是爱（约一4:8），祂的爱是无条件、牺牲、永恒的。这种爱成为了我们学习和效法的标准。</p>
            
            <blockquote>
                "爱是恒久忍耐，又有恩慈；爱是不嫉妒，爱是不自夸，不张狂，不作害羞的事，不求自己的益处，不轻易发怒，不计算人的恶，不喜欢不义，只喜欢真理；凡事包容，凡事相信，凡事盼望，凡事忍耐。" - 哥林多前书13:4-7
            </blockquote>
            
            <h3>在生活中实践爱</h3>
            <p><strong>1. 对家人的爱</strong></p>
            <p>爱从家庭开始，我们要用神的愛来愛我们的配偶、父母、子女。</p>
            
            <p><strong>2. 对邻舍的爱</strong></p>
            <p>我们要关心身边的每一个人，包括那些与我们不同的人。</p>
            
            <p><strong>3. 对仇敌的爱</strong></p>
            <p>这或许是最大的挑战，但也是最能体现神的爱的时候。</p>
            
            <p>愿我们都能在日常生活中活出这份神圣的爱。</p>`,
            category: 'sermon',
            author: '张牧师',
            authorId: 1,
            date: '2025-10-15',
            readTime: '6分钟',
            tags: ['爱', '关系', '品格'],
            views: 1450,
            likes: 120,
            comments: 18
        },
        {
            id: 4,
            title: '我的见证：从迷惘到信仰',
            excerpt: '分享一个年轻人在信仰路上的旅程，从最初的迷惘到最终接受基督的经历。',
            content: `<h2>我的见证：从迷惘到信仰</h2>
            <p>大家好，我是小王，很高兴能在这里与大家分享我的信仰见证。</p>
            
            <h3>我的背景</h3>
            <p>我出生在一个普通的家庭，从小接触的都是无神论教育。大学期间，我开始思考人生的意义，觉得生活空虚，没有方向。</p>
            
            <h3>遇见神</h3>
            <p>大三的时候，一位同学邀请我去参加团契。起初我是抱着好奇的心态去的，但当我听到那些弟兄姊妹分享他们的经历时，我的内心受到了很大的震撼。</p>
            
            <p>最让我印象深刻的是，一个弟兄分享了他如何在祷告中经历神的帮助。他说："即使在最绝望的时候，神都没有放弃我。"</p>
            
            <h3>决定跟随</h3>
            <p>经过几个月的思考和祷告，我决定接受基督作为我的救主。那一刻，我感受到了前所未有的平安和喜乐。</p>
            
            <blockquote>
                "我将这些事告诉你们，是要叫你们在我里面有平安。" - 约翰福音16:33
            </blockquote>
            
            <h3>现在的我</h3>
            <p>信主后，我的生活发生了很大的改变。我不再感到迷茫，而是有了明确的目标和方向。更重要的是，我体验到了真正的爱和平安。</p>
            
            <p>如果你也在寻找人生的意义，欢迎你来了解基督教。也许，你也会在这里找到你一直在寻找的答案。</p>`,
            category: 'testimony',
            author: '小王',
            authorId: 2,
            date: '2025-10-12',
            readTime: '5分钟',
            tags: ['见证', '信仰', '见证分享'],
            views: 2100,
            likes: 156,
            comments: 23
        },
        {
            id: 5,
            title: '马太福音查经：第一章',
            excerpt: '一起学习马太福音第一章，学习耶稣的家谱和童贞女马利亚的降生。',
            content: `<h2>马太福音查经：第一章</h2>
            <p>欢迎大家参加我们的查经学习。今天我们来学习马太福音第一章，这是新约的开篇，记载了耶稣基督的家谱和祂的降生。</p>
            
            <h3>马太福音的特点</h3>
            <p>马太福音是四福音书中唯一详细记录耶稣家谱的福音书。这显示了马太想要证明耶稣是弥赛亚，是大卫的后裔，是亚伯拉罕的后裔。</p>
            
            <h3>家谱的结构</h3>
            <p>马太福音1:1-17记载了从亚伯拉罕到大卫，从大卫到被掳到巴比伦，从被掳到基督的三个十四代。这个结构体现了神对祂选民的计划。</p>
            
            <h3>重点经文解析</h3>
            
            <h4>1:1 亚伯拉罕的后裔，大卫的子孙，耶稣基督的家谱：</h4>
            <p>"亚伯拉罕的后裔"表明耶稣是应许的后裔（创22:18）。"大卫的子孙"表明耶稣是弥赛亚。</p>
            
            <h4>1:18-25 童贞女马利亚的降生</h4>
            <p>这是基督教信仰的核心教义之一：道成肉身。天使加百列向马利亚宣告她要生一个儿子。</p>
            
            <blockquote>
                "她将要生一个儿子，你要给他起名叫耶稣，因他要将自己的百姓从罪恶里救出来。" - 马太福音1:21
            </blockquote>
            
            <h3>思考问题</h3>
            <ol>
                <li>为什么马太要记录耶稣的家谱？</li>
                <li>童贞女降生对我们有什么意义？</li>
                <li>耶稣的名字"耶稣"有什么特殊含义？</li>
            </ol>
            
            <p>愿主的话语祝福每一位参加查经的弟兄姊妹。</p>`,
            category: 'study',
            author: '张牧师',
            authorId: 1,
            date: '2025-10-10',
            readTime: '8分钟',
            tags: ['查经', '马太福音', '耶稣'],
            views: 850,
            likes: 67,
            comments: 15
        },
        {
            id: 6,
            title: '祷告生活的重要性',
            excerpt: '祷告是信徒与神沟通的桥梁，如何建立健康的祷告生活？',
            content: `<h2>祷告生活的重要性</h2>
            <p>祷告是基督徒生活中不可或缺的一部分。正如使徒保罗所说："要不住地祷告"（帖撒罗尼迦前书5:17）。</p>
            
            <h3>祷告的本质</h3>
            <p>祷告不是机械式的重复，而是我们与天父之间的亲密交流。通过祷告，我们：</p>
            <ul>
                <li>向神表达我们的感恩</li>
                <li>向神倾诉我们的需要</li>
                <li>向神悔改我们的过犯</li>
                <li>向神献上我们的赞美</li>
            </ul>
            
            <h3>祷告的榜样</h3>
            <p>耶稣基督是最好的祷告榜样。祂常常天未亮就起来祷告（马可福音1:35），也为门徒祷告（约17章）。</p>
            
            <h3>如何建立祷告生活</h3>
            
            <h4>1. 固定的时间</h4>
            <p>每天设定固定的祷告时间，比如早上和晚上。</p>
            
            <h4>2. 合适的地点</h4>
            <p>找一个安静的地方，作为你的祷告角落。</p>
            
            <h4>3. 祷告的结构</h4>
            <p>可以使用ACT的结构：赞美(Adoration)、认罪(Confession)、感恩(Thanksgiving)、代求(Supplication)。</p>
            
            <blockquote>
                "你们祷告的时候，不可像外邦人，用许多重复话，他们以为话多了必蒙垂听。" - 马太福音6:7
            </blockquote>
            
            <p>愿每位信徒都能建立美好的祷告生活。</p>`,
            category: 'devotional',
            author: '李姊妹',
            authorId: 2,
            date: '2025-10-08',
            readTime: '5分钟',
            tags: ['祷告', '灵修', '生活'],
            views: 1100,
            likes: 95,
            comments: 20
        },
        {
            id: 7,
            title: '职场中的见证',
            excerpt: '如何在工作中活出基督徒的品格，在职场中为主作见证？',
            content: `<h2>职场中的见证</h2>
            <p>对于大多数基督徒来说，我们每天有大部分时间在工作中度过。如何在职场中活出信仰，这是一个重要的课题。</p>
            
            <h3>工作观</h3>
            <p>首先，我们要明白工作的意义。工作不仅是谋生的手段，更是我们荣耀神的机会。</p>
            
            <blockquote>
                "无论做什么，都要从心里做，像是给主做的，不是给人做的。" - 歌罗西书3:23
            </blockquote>
            
            <h3>在职场上见证的方面</h3>
            
            <h4>1. 诚信</h4>
            <p>做一个诚实守信的人，说到做到，不弄虚作假。</p>
            
            <h4>2. 勤奋</h4>
            <p>认真对待每一项工作，追求卓越。</p>
            
            <h4>3. 爱心</h4>
            <p>关心同事，乐于帮助他人。</p>
            
            <h4>4. 谦卑</h4>
            <p>不骄傲自大，愿意学习，接受批评。</p>
            
            <h4>5. 饶恕</h4>
            <p>面对伤害时，用爱心和饶恕来回应。</p>
            
            <h3>实际应用</h3>
            <ul>
                <li>在团队合作中体现出合作精神</li>
                <li>面对困难时表现出坚韧和信心</li>
                <li>在争执中表现出和平与智慧</li>
                <li>在成功时表现出谦卑和感恩</li>
            </ul>
            
            <p>愿每一个在职场中的信徒都能成为主的荣耀见证。</p>`,
            category: 'devotional',
            author: '张牧师',
            authorId: 1,
            date: '2025-10-05',
            readTime: '6分钟',
            tags: ['职场', '见证', '品格'],
            views: 920,
            likes: 78,
            comments: 11
        },
        {
            id: 8,
            title: '基督徒理财观',
            excerpt: '圣经如何看待金钱和财富？基督徒应该如何正确对待财务？',
            content: `<h2>基督徒理财观</h2>
            <p>金钱是现代人生活中不可缺少的一部分，但对于基督徒来说，我们如何看待金钱和财富，是一个重要的信仰问题。</p>
            
            <h3>圣经中的财富观</h3>
            <p>圣经并不反对财富本身，但强调财富的使用要荣耀神。</p>
            
            <blockquote>
                "你们存心不可贪爱钱财，要以自己所有的为足。因为主曾说：'我总不撇下你，也不丢弃你。'" - 希伯来书13:5
            </blockquote>
            
            <h3>正确的财富观</h3>
            
            <h4>1. 财富是神赐的</h4>
            <p>所有的财富都来自于神，我们应该为此感恩。</p>
            
            <h4>2. 财富是管家职分</h4>
            <p>我们不是财富的主人，而是神的管家。</p>
            
            <h4>3. 财富要用于荣耀神</h4>
            <p>通过施舍、支持福音事工等方式使用财富。</p>
            
            <h3>理财原则</h3>
            
            <p><strong>十一奉献</strong>：将收入的十分之一献给神</p>
            
            <p><strong>量入为出</strong>：不要超过自己的能力消费</p>
            
            <p><strong>预备将来</strong>：为未来和紧急情况存钱</p>
            
            <p><strong>慷慨施舍</strong>：愿意帮助需要的人</p>
            
            <h3>贪财的危险</h3>
            <p>圣经警告我们："贪财是万恶之根"（提前6:10）。财富本身不是邪恶的，但贪财的心会让我们远离神。</p>
            
            <p>愿每个信徒都能在财务上荣耀神。</p>`,
            category: 'study',
            author: '李姊妹',
            authorId: 2,
            date: '2025-10-03',
            readTime: '7分钟',
            tags: ['理财', '财富', '奉献'],
            views: 1350,
            likes: 102,
            comments: 19
        }
    ],

    // 文章模版数据
    templates: [
        {
            id: 1,
            name: '灵修分享模版',
            category: 'devotional',
            content: `<h2>[文章标题]</h2>
<p>今日灵修心得分享...</p>

<h3>经文引用</h3>
<blockquote>
"[圣经经文]" - [出处]
</blockquote>

<h3>我的思考</h3>
<p>对这段经文的理解和感受...</p>

<h3>祷告</h3>
<p>亲爱的天父，感谢您...奉耶稣的名祷告，阿门！</p>`,
            description: '适用于个人灵修分享',
            authorId: 1,
            date: '2025-10-25'
        },
        {
            id: 2,
            name: '讲道笔记模版',
            category: 'sermon',
            content: `<h2>讲道题目：[标题]</h2>
<p><strong>经文：</strong>[圣经出处]</p>
<p><strong>讲员：</strong>[姓名]</p>
<p><strong>日期：</strong>[日期]</p>

<h3>大纲</h3>
<ol>
<li>第一点：[内容]</li>
<li>第二点：[内容]</li>
<li>第三点：[内容]</li>
</ol>

<h3>要点总结</h3>
<p>今天的讲道让我学到了...</p>

<h3>应用</h3>
<p>我需要在生活中这样实践...</p>`,
            description: '适用于讲道笔记记录',
            authorId: 1,
            date: '2025-10-25'
        },
        {
            id: 3,
            name: '见证分享模版',
            category: 'testimony',
            content: `<h2>神的恩典见证</h2>

<h3>背景介绍</h3>
<p>之前的情况是...</p>

<h3>经历过程</h3>
<p>在这个过程中，我经历了...</p>

<h3>神的作为</h3>
<p>我深深感受到神的...</p>

<h3>感恩与反思</h3>
<p>通过这件事，我明白了...</p>

<blockquote>
"若有人在基督里，他就是新造的人，旧事已过，都变成新的了。" - 哥林多后书5:17
</blockquote>`,
            description: '适用于个人见证分享',
            authorId: 1,
            date: '2025-10-25'
        }
    ],

    // 上传文件管理
    uploads: [
        {
            id: 1,
            name: '祷告会视频.mp4',
            type: 'video',
            url: 'videos/prayer_meeting.mp4',
            size: '15.2MB',
            category: 'prayer',
            uploadedBy: 1,
            uploadDate: '2025-10-20',
            description: '周祷告会录制视频'
        },
        {
            id: 2,
            name: '赞美诗歌.mp3',
            type: 'audio',
            url: 'audios/worship_song.mp3',
            size: '4.8MB',
            category: 'worship',
            uploadedBy: 1,
            uploadDate: '2025-10-18',
            description: '主日赞美诗歌'
        },
        {
            id: 3,
            name: '教会活动照片.jpg',
            type: 'image',
            url: 'images/church_event.jpg',
            size: '2.1MB',
            category: 'event',
            uploadedBy: 2,
            uploadDate: '2025-10-15',
            description: '圣诞节庆祝活动'
        }
    ],

    // 链接管理
    links: [
        {
            id: 1,
            title: '圣经在线阅读',
            url: 'https://bible.fhl.net',
            description: '和合本圣经在线阅读',
            category: 'bible',
            addedBy: 1,
            addedDate: '2025-10-20',
            tags: ['圣经', '阅读']
        },
        {
            id: 2,
            title: '基督教中文网',
            url: 'https://www.jidujiao.com',
            description: '基督教资讯与资源网站',
            category: 'resources',
            addedBy: 2,
            addedDate: '2025-10-18',
            tags: ['资源', '资讯']
        },
        {
            id: 3,
            title: '赞美诗歌视频',
            url: 'https://youtube.com/example',
            description: '精选赞美诗歌视频合集',
            category: 'worship',
            addedBy: 1,
            addedDate: '2025-10-15',
            tags: ['赞美', '视频']
        }
    ],
    
    // 评论数据
    comments: [
        {
            id: 1,
            articleId: 1,
            author: '王弟兄',
            content: '很好的分享！平安确实是我们基督徒最宝贵的财富。',
            date: '2025-10-21',
            time: '14:30',
            likes: 5,
            replies: [
                {
                    id: 11,
                    author: '张牧师',
                    content: '感谢主的带领，愿平安与您同在！',
                    date: '2025-10-21',
                    time: '15:45',
                    likes: 2
                }
            ]
        },
        {
            id: 2,
            articleId: 1,
            author: '赵姊妹',
            content: '祷告真的很重要，每次祷告后心里都很平安。',
            date: '2025-10-21',
            time: '16:20',
            likes: 3,
            replies: []
        },
        {
            id: 3,
            articleId: 2,
            author: '刘弟兄',
            content: '感恩的心真的很重要，感谢分享！',
            date: '2025-10-19',
            time: '10:15',
            likes: 4,
            replies: []
        }
    ],
    
    // 视频数据
    videos: [
        {
            id: 1,
            title: '复活节讲道：生命的力量',
            description: '张牧师分享关于复活节的意义和基督复活带给我们生命的力量',
            thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjFGNUY5Ii8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjEwMCIgcj0iMjQiIGZpbGw9IiMzQjgyRjYiLz4KPHRleHQgeD0iMTUwIiB5PSIxNDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPueUu+WBjzwvdGV4dD4KPC9zdmc+',
            duration: '45:30',
            category: 'sermon',
            uploadDate: '2025-10-15',
            views: 2500,
            tags: ['复活节', '讲道', '生命']
        },
        {
            id: 2,
            title: '圣诞节赞美诗歌',
            description: '圣诞节赞美诗歌集锦，传递圣诞的喜乐和平安',
            thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMTA5OUI5Ii8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjEwMCIgcj0iMjQiIGZpbGw9IiMxMDI1NDEiLz4KPHRleHQgeD0iMTUwIiB5PSIxNDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPuWNs+mYqeeUnzwvdGV4dD4KPC9zdmc+',
            duration: '32:15',
            category: 'music',
            uploadDate: '2025-12-20',
            views: 1800,
            tags: ['圣诞节', '赞美', '诗歌']
        },
        {
            id: 3,
            title: '每日灵修分享',
            description: '李姊妹分享每日的灵修心得和神的恩典',
            thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjhGQUZDIi8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjEwMCIgcj0iMjQiIGZpbGw9IiNGRkY2MDAiLz4KPHRleHQgeD0iMTUwIiB5PSIxNDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPuWbvueJhzwvdGV4dD4KPC9zdmc+',
            duration: '15:45',
            category: 'devotional',
            uploadDate: '2025-10-22',
            views: 950,
            tags: ['灵修', '分享', '日常']
        }
    ],
    
    // 音频数据
    audios: [
        {
            id: 1,
            title: '赞美诗：奇异恩典',
            artist: '教会合唱团',
            album: '经典赞美诗集',
            duration: '4:32',
            coverColor: '#3B82F6',
            description: '经典赞美诗奇异恩典的重新演绎',
            uploadDate: '2025-10-18',
            plays: 3200
        },
        {
            id: 2,
            title: '祷告音频：夜间祷告',
            artist: '张牧师',
            album: '祷告系列',
            duration: '8:15',
            coverColor: '#10B981',
            description: '适合夜间聆听的祷告音频，帮助弟兄姊妹建立祷告生活',
            uploadDate: '2025-10-20',
            plays: 1850
        },
        {
            id: 3,
            title: '圣经朗读：诗篇23篇',
            artist: '李姊妹',
            album: '圣经朗读',
            duration: '3:45',
            coverColor: '#F59E0B',
            description: '主是我牧者，诗篇23篇的温柔朗读',
            uploadDate: '2025-10-16',
            plays: 2100
        }
    ],
    
    // 图片数据
    images: [
        {
            id: 1,
            title: '教会建筑',
            description: '我们教会的美丽建筑，象征着神的家',
            src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xMjAgMTQwTDE4MCAxNDBMMTUwIDEwMEwxMjAgMTQwWiIgZmlsbD0iIzNCODJGNiIvPgo8dGV4dCB4PSIxNTAiIHk9IjE4MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNkI3MjgxIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7lnKjogJvor5U8L3RleHQ+Cjwvc3ZnPg==',
            category: 'architecture',
            uploadDate: '2025-10-14',
            tags: ['教堂', '建筑', '神的家']
        },
        {
            id: 2,
            title: '祷告的手',
            description: '祷告的双手，代表着信徒对神的仰望和交托',
            src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjEwMCIgcj0iNDAiIGZpbGw9IiMxMEI5ODEiLz4KPHRleHQgeD0iMTUwIiB5PSIxNDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPuWBpeWFpeW+gDwvdGV4dD4KPC9zdmc+',
            category: 'spiritual',
            uploadDate: '2025-10-16',
            tags: ['祷告', '信仰', '仰望']
        },
        {
            id: 3,
            title: '十字架与光',
            description: '十字架代表着基督的救恩，光象征着神的荣耀',
            src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMTBCTzk4Ii8+CjxwYXRoIGQ9Ik0xNDUgODVMMTU1IDQwTDE2NSA4NUwxOTAgODVMMTcwIDEyMEwxODAgMTg1TDE2NSAxNDBMMTYwIDE4NUwxNTAgMTIwTDEzNSA4NVoiIGZpbGw9IiNGRkY2MDAiLz4KPHRleHQgeD0iMTUwIiB5PSIyMDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPuaXpeWbvueIjDwvdGV4dD4KPC9zdmc+',
            category: 'spiritual',
            uploadDate: '2025-10-18',
            tags: ['十字架', '光', '救恩']
        },
        {
            id: 4,
            title: '祷告聚会',
            description: '弟兄姊妹一起祷告的温馨场面',
            src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRkY2NjAwIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iMjAiIGZpbGw9IiMzQjgyRjYiLz4KPGNpcmNsZSBjeD0iMjAwIiBjeT0iMTAwIiByPSIyMCIgZmlsbD0iIzEwQjk4MSIvPgo8Y2lyY2xlIGN4PSIxNTAiIGN5PSIxMDAiIHI9IjIwIiBmaWxsPSIjRjU5RTBCIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTYwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2QjcyODEiIHRleHQtYW5jaG9yPSJtaWRkbGUiPueUn+WKl+WAjDwvdGV4dD4KPC9zdmc+',
            category: 'community',
            uploadDate: '2025-10-20',
            tags: ['祷告', '聚会', '团契']
        }
    ]
};

// 本地存储管理
const storage = {
    // 获取当前用户
    getCurrentUser() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    },
    
    // 设置当前用户
    setCurrentUser(user) {
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
        } else {
            localStorage.removeItem('currentUser');
        }
    },
    
    // 获取用户收藏
    getFavorites() {
        const favorites = localStorage.getItem('userFavorites');
        return favorites ? JSON.parse(favorites) : [];
    },
    
    // 添加收藏
    addFavorite(articleId) {
        const favorites = this.getFavorites();
        if (!favorites.includes(articleId)) {
            favorites.push(articleId);
            localStorage.setItem('userFavorites', JSON.stringify(favorites));
        }
    },
    
    // 移除收藏
    removeFavorite(articleId) {
        const favorites = this.getFavorites();
        const index = favorites.indexOf(articleId);
        if (index > -1) {
            favorites.splice(index, 1);
            localStorage.setItem('userFavorites', JSON.stringify(favorites));
        }
    },
    
    // 检查是否已收藏
    isFavorited(articleId) {
        const favorites = this.getFavorites();
        return favorites.includes(articleId);
    }
};

// 数据操作方法
const dataAPI = {
    // 获取文章
    getArticles(category = 'all', page = 1, limit = 6) {
        let articles = [...database.articles];
        
        // 按分类筛选
        if (category !== 'all') {
            articles = articles.filter(article => article.category === category);
        }
        
        // 按日期排序（最新的在前）
        articles.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // 分页
        const start = (page - 1) * limit;
        const end = start + limit;
        const paginatedArticles = articles.slice(start, end);
        
        return {
            articles: paginatedArticles,
            total: articles.length,
            page: page,
            totalPages: Math.ceil(articles.length / limit)
        };
    },
    
    // 获取单篇文章
    getArticle(id) {
        return database.articles.find(article => article.id === parseInt(id));
    },
    
    // 搜索文章
    searchArticles(query, category = 'all') {
        let articles = [...database.articles];
        
        // 按分类筛选
        if (category !== 'all') {
            articles = articles.filter(article => article.category === category);
        }
        
        // 搜索关键词
        if (query.trim()) {
            const searchTerm = query.toLowerCase();
            articles = articles.filter(article => 
                article.title.toLowerCase().includes(searchTerm) ||
                article.excerpt.toLowerCase().includes(searchTerm) ||
                article.content.toLowerCase().includes(searchTerm) ||
                article.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }
        
        // 按日期排序
        articles.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        return articles;
    },
    
    // 获取评论
    getComments(articleId) {
        return database.comments.filter(comment => comment.articleId === parseInt(articleId));
    },
    
    // 添加评论
    addComment(articleId, author, content) {
        const newComment = {
            id: database.comments.length + 1,
            articleId: parseInt(articleId),
            author: author,
            content: content,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0].slice(0, 5),
            likes: 0,
            replies: []
        };
        
        database.comments.push(newComment);
        return newComment;
    },
    
    // 添加回复
    addReply(commentId, author, content) {
        const comment = database.comments.find(c => c.id === parseInt(commentId));
        if (comment) {
            const newReply = {
                id: comment.replies.length + 1,
                author: author,
                content: content,
                date: new Date().toISOString().split('T')[0],
                time: new Date().toTimeString().split(' ')[0].slice(0, 5),
                likes: 0
            };
            
            comment.replies.push(newReply);
            return newReply;
        }
        return null;
    },
    
    // 获取视频
    getVideos() {
        return database.videos;
    },
    
    // 获取音频
    getAudios() {
        return database.audios;
    },
    
    // 获取图片
    getImages() {
        return database.images;
    },
    
    // 用户认证
    login(email, password) {
        const user = database.users.find(u => u.email === email && u.password === password);
        if (user) {
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                role: user.role
            };
        }
        return null;
    },
    
    // 注册
    register(name, email, password) {
        // 检查邮箱是否已存在
        if (database.users.find(u => u.email === email)) {
            return { success: false, message: '该邮箱已被注册' };
        }
        
        // 创建新用户
        const newUser = {
            id: database.users.length + 1,
            name: name,
            email: email,
            password: password,
            avatar: name.charAt(0).toUpperCase(),
            role: 'user'
        };
        
        database.users.push(newUser);
        
        return {
            success: true,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                avatar: newUser.avatar,
                role: newUser.role
            }
        };
    },

    // ========== 新增功能方法 ==========

    // 获取文章模版
    getTemplates(category = 'all') {
        let templates = [...database.templates];
        if (category !== 'all') {
            templates = templates.filter(template => template.category === category);
        }
        return templates;
    },

    // 添加文章模版
    addTemplate(name, category, content, description, authorId) {
        const newTemplate = {
            id: database.templates.length + 1,
            name: name,
            category: category,
            content: content,
            description: description,
            authorId: authorId,
            date: new Date().toISOString().split('T')[0]
        };
        database.templates.push(newTemplate);
        return newTemplate;
    },

    // 删除文章模版
    deleteTemplate(id, userId) {
        const template = database.templates.find(t => t.id === parseInt(id));
        if (template && (template.authorId === userId || this.isAdmin(userId))) {
            const index = database.templates.findIndex(t => t.id === parseInt(id));
            database.templates.splice(index, 1);
            return true;
        }
        return false;
    },

    // 获取上传文件
    getUploads(type = 'all') {
        let uploads = [...database.uploads];
        if (type !== 'all') {
            uploads = uploads.filter(upload => upload.type === type);
        }
        return uploads;
    },

    // 添加上传文件
    addUpload(name, type, url, size, category, description, uploadedBy) {
        const newUpload = {
            id: database.uploads.length + 1,
            name: name,
            type: type,
            url: url,
            size: size,
            category: category,
            description: description,
            uploadedBy: uploadedBy,
            uploadDate: new Date().toISOString().split('T')[0]
        };
        database.uploads.push(newUpload);
        return newUpload;
    },

    // 删除上传文件
    deleteUpload(id, userId) {
        const upload = database.uploads.find(u => u.id === parseInt(id));
        if (upload && (upload.uploadedBy === userId || this.isAdmin(userId))) {
            const index = database.uploads.findIndex(u => u.id === parseInt(id));
            database.uploads.splice(index, 1);
            return true;
        }
        return false;
    },

    // 获取链接
    getLinks(category = 'all') {
        let links = [...database.links];
        if (category !== 'all') {
            links = links.filter(link => link.category === category);
        }
        return links;
    },

    // 添加链接
    addLink(title, url, description, category, tags, addedBy) {
        const newLink = {
            id: database.links.length + 1,
            title: title,
            url: url,
            description: description,
            category: category,
            addedBy: addedBy,
            addedDate: new Date().toISOString().split('T')[0],
            tags: tags
        };
        database.links.push(newLink);
        return newLink;
    },

    // 删除链接
    deleteLink(id, userId) {
        const link = database.links.find(l => l.id === parseInt(id));
        if (link && (link.addedBy === userId || this.isAdmin(userId))) {
            const index = database.links.findIndex(l => l.id === parseInt(id));
            database.links.splice(index, 1);
            return true;
        }
        return false;
    },

    // 删除文章
    deleteArticle(id, userId) {
        const article = database.articles.find(a => a.id === parseInt(id));
        if (article && (article.authorId === userId || this.isAdmin(userId))) {
            const index = database.articles.findIndex(a => a.id === parseInt(id));
            database.articles.splice(index, 1);
            return true;
        }
        return false;
    },

    // 删除评论
    deleteComment(id, userId) {
        const comment = database.comments.find(c => c.id === parseInt(id));
        if (comment && this.isAdmin(userId)) {
            const index = database.comments.findIndex(c => c.id === parseInt(id));
            database.comments.splice(index, 1);
            return true;
        }
        return false;
    },

    // 检查是否为管理员
    isAdmin(userId) {
        const user = database.users.find(u => u.id === userId);
        return user && user.role === 'admin';
    }
};