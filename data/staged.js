(function () {
  const mc = (order, text, answer, options, explain) => ({
    order,
    type: "multiple-choice",
    text,
    answer,
    options,
    explain,
  });

  const g = (instructions, questions) => ({
    type: "multiple-choice",
    instructions,
    questions,
  });

  const reading = [
    {
      id: "staged-reading-a1",
      title: "A1 Reading: My School Day",
      level: "A1",
      duration: "12 mins",
      source: "IELTS Passport 分级题库",
      passages: [{
        number: 1,
        title: "My School Day",
        content: "Hi, I am Mia. I am twelve years old. I go to school from Monday to Friday. I get up at seven o'clock and have breakfast at home. School starts at eight thirty. My favourite subject is English because I like reading stories. At twelve o'clock, I have lunch with my friends. We usually eat rice and vegetables. In the afternoon, I have music or sport. School finishes at four. After school, I do my homework and then play basketball. I go to bed at ten.",
        groups: [g("Choose the correct answer, A, B or C.", [
          mc(1, "How old is Mia?", "B", ["A. Ten", "B. Twelve", "C. Fourteen"], "原文第一句说 I am twelve years old，所以选 B。"),
          mc(2, "What time does school start?", "C", ["A. Seven o'clock", "B. Eight o'clock", "C. Eight thirty"], "原文说 School starts at eight thirty。"),
          mc(3, "What is Mia's favourite subject?", "A", ["A. English", "B. Music", "C. Sport"], "原文说 My favourite subject is English。"),
          mc(4, "What does Mia do after school?", "B", ["A. She goes shopping", "B. She does homework and plays basketball", "C. She goes to bed"], "原文说 After school, I do my homework and then play basketball。"),
          mc(5, "What time does Mia go to bed?", "C", ["A. Eight", "B. Nine", "C. Ten"], "最后一句说 I go to bed at ten。")
        ])]
      }]
    },
    {
      id: "staged-reading-a2",
      title: "A2 Reading: A Weekend in the Mountains",
      level: "A2",
      duration: "15 mins",
      source: "IELTS Passport 分级题库",
      passages: [{
        number: 1,
        title: "A Weekend in the Mountains",
        content: "Last weekend, my family and I visited a small village in the mountains. We left home early on Saturday morning and arrived before lunch. The weather was cold, but the sky was clear. In the afternoon, we walked around the lake and took many photos. My father cooked dinner outside, and we ate together under the stars. On Sunday, we visited a local market. I bought a blue scarf for my grandmother and some tea for my parents. The village was quiet and peaceful. We returned home in the evening, tired but very happy.",
        groups: [g("Choose the correct answer, A, B or C.", [
          mc(1, "Where did the family go last weekend?", "A", ["A. A village in the mountains", "B. A city by the sea", "C. A large hotel"], "第一段说 visited a small village in the mountains。"),
          mc(2, "When did they arrive?", "B", ["A. Late at night", "B. Before lunch", "C. After dinner"], "原文说 arrived before lunch。"),
          mc(3, "What did they do on Saturday afternoon?", "C", ["A. They bought tea", "B. They slept at home", "C. They walked around the lake"], "原文说 we walked around the lake and took many photos。"),
          mc(4, "Who did the writer buy a scarf for?", "A", ["A. Grandmother", "B. Father", "C. Mother"], "原文说 I bought a blue scarf for my grandmother。"),
          mc(5, "How did they feel when they returned home?", "B", ["A. Angry and tired", "B. Tired but happy", "C. Cold and worried"], "最后一句说 tired but very happy。")
        ])]
      }]
    },
    {
      id: "staged-reading-b1",
      title: "B1 Reading: Learning Online",
      level: "B1",
      duration: "18 mins",
      source: "IELTS Passport 分级题库",
      passages: [{
        number: 1,
        title: "Learning Online: Good or Bad?",
        content: "Online learning has become much more common in recent years. Students can watch lessons at home, pause videos when they do not understand something, and study at their own speed. For people who live far from a school, online courses can also save time and money. However, online learning is not perfect. Some students find it difficult to stay focused when they are alone at home. They may check social media or stop studying when a lesson becomes difficult. In addition, learners may miss the chance to discuss ideas with classmates and teachers. For these reasons, many experts believe that online learning works best when it is combined with classroom lessons. In this way, students can enjoy the flexibility of online study and the support of a real teacher.",
        groups: [g("Choose the correct answer, A, B or C.", [
          mc(1, "What is one advantage of online learning?", "B", ["A. It is always easier than classroom learning", "B. Students can study at their own speed", "C. It removes the need for teachers"], "第二句说 students can ... study at their own speed。"),
          mc(2, "Why can online learning save money for some people?", "C", ["A. Courses are always free", "B. They buy fewer books", "C. They do not need to travel to school"], "原文说 For people who live far from a school, online courses can also save time and money，原因是不用去学校。"),
          mc(3, "What problem do some students have at home?", "A", ["A. Staying focused", "B. Finding a computer", "C. Understanding English"], "原文说 Some students find it difficult to stay focused。"),
          mc(4, "What do many experts suggest?", "B", ["A. Students should only study online", "B. Online learning should be combined with classroom lessons", "C. Students should not use videos"], "原文说 online learning works best when it is combined with classroom lessons。"),
          mc(5, "What is the main idea of the passage?", "C", ["A. Online learning has no problems", "B. Classroom learning is old-fashioned", "C. Online learning is useful but works best with teacher support"], "文章先讲优点，再讲问题，最后说需要结合课堂，所以 C 最全面。")
        ])]
      }]
    },
    {
      id: "staged-reading-b2",
      title: "B2 Reading: Why Cities Need More Trees",
      level: "B2",
      duration: "20 mins",
      source: "IELTS Passport 分级题库",
      passages: [{
        number: 1,
        title: "Why Cities Need More Trees",
        content: "Urban trees are often treated as decoration, but their role in city life is far more practical. During hot weather, trees provide shade and cool the air through a process called transpiration. This can reduce the temperature of a street by several degrees. Trees also absorb some air pollutants and help to slow rainwater, which lowers the risk of flooding. In addition, research suggests that green spaces can improve mental health. People who live near parks may feel less stressed and more connected to their neighbourhood. However, planting trees is not enough. Young trees need water, care and protection for many years. City governments must also choose species that suit the local climate and avoid trees that cause allergies. If these conditions are met, trees can become a long-term investment in healthier and more comfortable cities.",
        groups: [g("Choose the correct answer, A, B or C.", [
          mc(1, "According to the passage, why are trees useful in hot weather?", "B", ["A. They produce more rainwater", "B. They provide shade and cool the air", "C. They make streets wider"], "第一段说 trees provide shade and cool the air through transpiration。"),
          mc(2, "How can trees help reduce flooding?", "A", ["A. By slowing rainwater", "B. By absorbing all pollution", "C. By making the ground harder"], "原文说 help to slow rainwater, which lowers the risk of flooding。"),
          mc(3, "What mental benefit is mentioned?", "C", ["A. People become richer", "B. People sleep longer", "C. People may feel less stressed"], "原文说 green spaces can improve mental health ... may feel less stressed。"),
          mc(4, "What does the writer say about planting trees?", "B", ["A. It solves every city problem", "B. Young trees need long-term care", "C. Any tree species is suitable"], "原文说 planting trees is not enough. Young trees need water, care and protection for many years。"),
          mc(5, "What is the writer's overall attitude?", "A", ["A. Supportive but realistic", "B. Completely negative", "C. Uninterested"], "作者支持种树，也强调长期维护和树种选择，所以是 supportive but realistic。")
        ])]
      }]
    },
    {
      id: "staged-reading-c1",
      title: "C1 Reading: The Value of Failure",
      level: "C1",
      duration: "22 mins",
      source: "IELTS Passport 分级题库",
      passages: [{
        number: 1,
        title: "The Value of Failure",
        content: "Modern education often rewards correct answers and penalises mistakes, yet failure can be a powerful source of learning. When people fail at a task, they are forced to examine their assumptions and adjust their approach. This process, known as reflective learning, is more likely to produce lasting knowledge than simply memorising a solution. The problem is that many institutions treat failure as evidence of inability rather than information about what needs to change. In workplaces, this can discourage employees from experimenting with new ideas. A more productive culture distinguishes between careless errors and intelligent failures: the former should be reduced, while the latter should be studied. The most innovative organisations do not celebrate failure for its own sake. Instead, they create safe conditions for testing ideas, analyse what went wrong, and apply those lessons to future work.",
        groups: [g("Choose the correct answer, A, B or C.", [
          mc(1, "What is the main argument of the passage?", "B", ["A. Mistakes should always be punished", "B. Failure can produce valuable learning if handled well", "C. Memorising solutions is the best way to learn"], "文章开头说 failure can be a powerful source of learning，全文围绕这一点展开。"),
          mc(2, "What does the writer mean by reflective learning?", "A", ["A. Examining assumptions and changing one's approach", "B. Repeating a task without thinking", "C. Avoiding difficult tasks"], "原文说 examine their assumptions and adjust their approach ... known as reflective learning。"),
          mc(3, "How do many institutions treat failure?", "C", ["A. As useful information", "B. As a reason to celebrate", "C. As evidence of inability"], "原文说 many institutions treat failure as evidence of inability。"),
          mc(4, "What distinction does the writer make?", "B", ["A. Between online and offline learning", "B. Between careless errors and intelligent failures", "C. Between managers and employees"], "原文明确说 distinguishes between careless errors and intelligent failures。"),
          mc(5, "What do innovative organisations do?", "A", ["A. Test ideas safely, analyse problems and apply lessons", "B. Celebrate every mistake equally", "C. Prevent all experiments"], "最后两句说 create safe conditions for testing ideas, analyse what went wrong, and apply those lessons。")
        ])]
      }]
    }
  ];

  const listening = [
    {
      id: "staged-listening-a1",
      title: "A1 Listening: At the Bakery",
      level: "A1",
      duration: "10 mins",
      source: "IELTS Passport 分级题库",
      sections: [{
        number: 1,
        title: "At the Bakery",
        audio: "",
        transcript: "Assistant: Good morning. Can I help you?\nCustomer: Yes, please. I would like two bread rolls and a chocolate cake.\nAssistant: Of course. Anything else?\nCustomer: No, thank you. How much is that?\nAssistant: The bread rolls are one dollar each, and the cake is six dollars. That is eight dollars.\nCustomer: Here you are.\nAssistant: Thank you. Have a nice day!",
        groups: [g("Choose the correct answer, A, B or C.", [
          mc(1, "Where is the conversation?", "A", ["A. At a bakery", "B. At a school", "C. At a bank"], "顾客在买面包和蛋糕，所以地点是 bakery。"),
          mc(2, "How many bread rolls does the customer buy?", "B", ["A. One", "B. Two", "C. Six"], "顾客说 two bread rolls。"),
          mc(3, "How much is one bread roll?", "A", ["A. One dollar", "B. Two dollars", "C. Six dollars"], "店员说 one dollar each。"),
          mc(4, "What else does the customer buy?", "C", ["A. Tea", "B. Milk", "C. A chocolate cake"], "顾客说 a chocolate cake。"),
          mc(5, "How much does the customer pay in total?", "C", ["A. Six dollars", "B. Seven dollars", "C. Eight dollars"], "店员说 That is eight dollars。")
        ])]
      }]
    },
    {
      id: "staged-listening-a2",
      title: "A2 Listening: Asking for Directions",
      level: "A2",
      duration: "12 mins",
      source: "IELTS Passport 分级题库",
      sections: [{
        number: 1,
        title: "Asking for Directions",
        audio: "",
        transcript: "Tourist: Excuse me, can you tell me how to get to the city library?\nLocal: Sure. Go straight along this street for about five minutes. You will see a bank on your left. Turn right at the traffic lights, then walk past the supermarket. The library is opposite the park.\nTourist: Is it far?\nLocal: No, it takes about ten minutes on foot. You can also take the number seven bus.\nTourist: Thank you very much.\nLocal: You're welcome.",
        groups: [g("Choose the correct answer, A, B or C.", [
          mc(1, "What place is the tourist looking for?", "B", ["A. A supermarket", "B. The city library", "C. A park"], "游客问 how to get to the city library。"),
          mc(2, "What is on the left side of the street?", "A", ["A. A bank", "B. A school", "C. A hospital"], "本地人说 You will see a bank on your left。"),
          mc(3, "Where should the tourist turn right?", "C", ["A. At the park", "B. At the supermarket", "C. At the traffic lights"], "本地人说 Turn right at the traffic lights。"),
          mc(4, "What is opposite the library?", "B", ["A. A bank", "B. The park", "C. A bus stop"], "本地人说 The library is opposite the park。"),
          mc(5, "How long does the walk take?", "A", ["A. About ten minutes", "B. About five minutes", "C. About thirty minutes"], "本地人说 it takes about ten minutes on foot。")
        ])]
      }]
    },
    {
      id: "staged-listening-b1",
      title: "B1 Listening: A Part-time Job Interview",
      level: "B1",
      duration: "15 mins",
      source: "IELTS Passport 分级题库",
      sections: [{
        number: 1,
        title: "A Part-time Job Interview",
        audio: "",
        transcript: "Manager: Thanks for coming in. Why do you want to work at our cafe?\nStudent: I enjoy meeting people, and I would like to earn some money while I study. I can work on Fridays after class and all day on Saturdays.\nManager: Have you worked in a cafe before?\nStudent: I worked in my uncle's restaurant last summer. I took orders and helped in the kitchen.\nManager: Good. The pay is twelve dollars an hour. You will also get a free lunch on Saturdays. Can you start next week?\nStudent: Yes, I can.",
        groups: [g("Choose the correct answer, A, B or C.", [
          mc(1, "Why does the student want the job?", "B", ["A. To meet a famous manager", "B. To earn money while studying", "C. To learn how to cook"], "学生说 I would like to earn some money while I study。"),
          mc(2, "When can the student work?", "C", ["A. Only on Sundays", "B. Every morning", "C. Fridays after class and Saturdays"], "学生说 Fridays after class and all day on Saturdays。"),
          mc(3, "What did the student do last summer?", "A", ["A. Worked in a restaurant", "B. Studied abroad", "C. Worked in a library"], "学生说 I worked in my uncle's restaurant last summer。"),
          mc(4, "How much is the hourly pay?", "B", ["A. Ten dollars", "B. Twelve dollars", "C. Twenty dollars"], "经理说 The pay is twelve dollars an hour。"),
          mc(5, "What extra benefit is mentioned?", "C", ["A. A free bus ticket", "B. Free coffee every day", "C. A free lunch on Saturdays"], "经理说 You will also get a free lunch on Saturdays。")
        ])]
      }]
    },
    {
      id: "staged-listening-b2",
      title: "B2 Listening: A Radio Interview about Sleep",
      level: "B2",
      duration: "18 mins",
      source: "IELTS Passport 分级题库",
      sections: [{
        number: 1,
        title: "A Radio Interview about Sleep",
        audio: "",
        transcript: "Presenter: Many people say they feel tired even after eight hours in bed. Why is that?\nDoctor: Sleep quality matters as much as sleep length. If you look at your phone before bed, the bright light can delay the release of melatonin, the hormone that helps you fall asleep. You may also wake up during the night if your room is too warm or if you drink coffee in the afternoon.\nPresenter: What is the most useful change people can make?\nDoctor: Keep a regular schedule. Going to bed and getting up at the same time helps the body prepare for sleep. Exercise during the day is helpful too, but intense exercise late at night can keep you awake.",
        groups: [g("Choose the correct answer, A, B or C.", [
          mc(1, "What is the interview mainly about?", "B", ["A. How to find a new job", "B. Why sleep quality matters", "C. How to cook healthy food"], "主持人问的是一天睡八小时还累，医生解释睡眠质量，所以主题是 B。"),
          mc(2, "What can bright light before bed do?", "C", ["A. Increase melatonin immediately", "B. Make people exercise more", "C. Delay the release of melatonin"], "医生说 the bright light can delay the release of melatonin。"),
          mc(3, "What may wake people during the night?", "A", ["A. A room that is too warm", "B. Reading a book", "C. Going to bed early"], "医生说 You may also wake up during the night if your room is too warm...。"),
          mc(4, "What is the doctor's most important advice?", "B", ["A. Sleep longer every weekend", "B. Keep a regular schedule", "C. Stop all exercise"], "医生说 What is the most useful change ... Keep a regular schedule。"),
          mc(5, "What does the doctor say about exercise?", "C", ["A. It is never helpful", "B. It should only be done at night", "C. Daytime exercise helps, but intense late exercise may keep you awake"], "最后一句说 Exercise during the day is helpful too, but intense exercise late at night can keep you awake。")
        ])]
      }]
    },
    {
      id: "staged-listening-c1",
      title: "C1 Listening: A Short Lecture on Behavioural Economics",
      level: "C1",
      duration: "20 mins",
      source: "IELTS Passport 分级题库",
      sections: [{
        number: 1,
        title: "A Short Lecture on Behavioural Economics",
        audio: "",
        transcript: "Traditional economic models assume that people make rational decisions based on all available information. Behavioural economics challenges this assumption. Research shows that our choices are often influenced by context, emotion and the way options are presented. For example, people are more likely to choose a medicine described as having a ninety percent success rate than one described as having a ten percent failure rate, even though the two descriptions are mathematically identical. This is known as framing. Another common pattern is loss aversion: people tend to feel the pain of losing something more strongly than the pleasure of gaining something of equal value. Understanding these tendencies can help governments design better policies, but critics warn that the same techniques could be used to manipulate consumers.",
        groups: [g("Choose the correct answer, A, B or C.", [
          mc(1, "What does behavioural economics challenge?", "A", ["A. The assumption that people always make rational decisions", "B. The idea that people have emotions", "C. The use of mathematics in economics"], "讲座开头说 Traditional economic models assume ... Behavioural economics challenges this assumption。"),
          mc(2, "What is framing?", "B", ["A. A way of saving money", "B. The influence of how options are presented", "C. A type of government policy"], "讲座说 choices are often influenced by ... the way options are presented. This is known as framing。"),
          mc(3, "Why does the medicine example matter?", "C", ["A. It proves people cannot read", "B. It shows medicine is always effective", "C. It shows identical information can lead to different choices"], "九十 percent success 和 ten percent failure 数学上相同，但选择不同，说明表达方式影响选择。"),
          mc(4, "What is loss aversion?", "A", ["A. Feeling losses more strongly than equal gains", "B. Avoiding all financial decisions", "C. Preferring to lose money quickly"], "讲座说 people tend to feel the pain of losing something more strongly than the pleasure of gaining something of equal value。"),
          mc(5, "What warning do critics give?", "B", ["A. Behavioural economics has no practical use", "B. The same techniques could be used to manipulate consumers", "C. Governments should stop collecting data"], "最后一句说 critics warn that the same techniques could be used to manipulate consumers。")
        ])]
      }]
    }
  ];

  const writing = [
    { id: "staged-writing-a1", title: "A1 Writing: My Family", level: "A1", duration: "20 mins", source: "IELTS Passport 分级题库", tasks: [
      { number: 1, type: "task1", title: "Write about your family", time: "20 mins", minWords: 40, prompt: "Write 5–6 simple sentences about your family. Use these questions to help you: How many people are in your family? What do your parents do? What do you like doing together?", image: "", figure: "" }
    ]},
    { id: "staged-writing-a2", title: "A2 Writing: An Email to a Friend", level: "A2", duration: "25 mins", source: "IELTS Passport 分级题库", tasks: [
      { number: 1, type: "task1", title: "Write an email about your weekend", time: "25 mins", minWords: 80, prompt: "Write an email to an English-speaking friend. Tell your friend where you went last weekend, what you did, and what you enjoyed most. Begin with 'Hi ...' and finish with 'See you soon'.", image: "", figure: "" }
    ]},
    { id: "staged-writing-b1", title: "B1 Writing: Should Students Do Homework?", level: "B1", duration: "35 mins", source: "IELTS Passport 分级题库", tasks: [
      { number: 1, type: "task2", title: "Should students do homework?", time: "35 mins", minWords: 150, prompt: "Some people believe homework helps students learn. Others think students already spend too much time at school. Discuss both views and give your own opinion. Write at least 150 words.", image: "", figure: "" }
    ]},
    { id: "staged-writing-b2", title: "B2 Writing: Remote Work", level: "B2", duration: "40 mins", source: "IELTS Passport 分级题库", tasks: [
      { number: 1, type: "task2", title: "The benefits and problems of remote work", time: "40 mins", minWords: 250, prompt: "More employees now work from home for part or all of the week. What are the advantages and disadvantages of this change for workers and companies? Give reasons for your answer and include relevant examples. Write at least 250 words.", image: "", figure: "" }
    ]},
    { id: "staged-writing-c1", title: "C1 Writing: Regulating Artificial Intelligence", level: "C1", duration: "45 mins", source: "IELTS Passport 分级题库", tasks: [
      { number: 1, type: "task2", title: "Should governments regulate AI?", time: "45 mins", minWords: 300, prompt: "Artificial intelligence is developing rapidly. Some people argue that governments should regulate it strictly, while others believe regulation will slow innovation. Discuss both views and give your own opinion. Write at least 300 words.", image: "", figure: "" }
    ]}
  ];

  const speaking = [
    { level: "A1", items: [
      { q: "What is your name?", a: "My name is Li Wei. You can call me Wei." },
      { q: "How many people are there in your family?", a: "There are four people in my family: my parents, my sister and me." },
      { q: "What is your favourite subject at school?", a: "My favourite subject is English because I like learning new words." },
      { q: "What do you usually do after school?", a: "After school, I do my homework and then play basketball with my friends." }
    ]},
    { level: "A2", items: [
      { q: "What did you do last weekend?", a: "Last weekend, I visited my grandparents and we had lunch together." },
      { q: "Tell me about your favourite place.", a: "My favourite place is a small park near my home. It is quiet and green." },
      { q: "Do you prefer shopping online or in a shop? Why?", a: "I prefer shopping in a shop because I can see and try the things before I buy them." },
      { q: "What are you going to do next holiday?", a: "I am going to visit my cousin in another city and take some photos there." }
    ]},
    { level: "B1", items: [
      { q: "How do you use technology for studying?", a: "I use my phone to look up new words and watch short English videos. I also use an app to review vocabulary every day." },
      { q: "What are the advantages of living in a city?", a: "Cities usually have more schools, hospitals and job opportunities. Public transport is also more convenient." },
      { q: "Should students learn a second language? Why?", a: "Yes, learning a second language can help students communicate with more people and understand other cultures." },
      { q: "How can people protect the environment in daily life?", a: "They can use reusable bags, take public transport and save electricity at home." }
    ]},
    { level: "B2", items: [
      { q: "What are the benefits and problems of working from home?", a: "Working from home can save commuting time and give people more flexibility. However, it may make teamwork more difficult and blur the line between work and rest." },
      { q: "How has social media changed the way people communicate?", a: "Social media allows people to share information instantly, but online communication can sometimes be less personal than a face-to-face conversation." },
      { q: "Should university education be free? Why or why not?", a: "Free university education could give more people a chance to study, but governments would need to find a fair way to pay for it." },
      { q: "How can cities encourage people to use public transport?", a: "Cities can make buses and trains cheaper, more frequent and more comfortable, and create safe walking routes to stations." }
    ]},
    { level: "C1", items: [
      { q: "Should governments regulate artificial intelligence?", a: "Some regulation is necessary to protect privacy and safety, but rules should be flexible enough to allow research and innovation." },
      { q: "How can societies reduce economic inequality?", a: "Governments could improve access to education, provide a stronger social safety net and ensure that large companies pay a fair share of tax." },
      { q: "Is globalisation a positive or negative force?", a: "Globalisation has increased trade and cultural exchange, but it has also created pressure on local industries and workers." },
      { q: "What responsibilities do technology companies have?", a: "Technology companies should be transparent about how they use data, protect users from harm and consider the social effects of their products." }
    ]}
  ];

  window.IELTS_BANK = window.IELTS_BANK || {};
  window.IELTS_BANK.staged = { reading, listening, writing, speaking };
})();
