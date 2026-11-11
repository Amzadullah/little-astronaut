// Little Astronauts — learning levels 0–20
// Each text field is { en, bn }. scene = which 3D scene to show (see scenes.js).

export const STAGES = [
  { id: 1, name: { en: 'Explore', bn: 'অন্বেষণ' }, range: [0, 5] },
  { id: 2, name: { en: 'Discover', bn: 'আবিষ্কার' }, range: [6, 10] },
  { id: 3, name: { en: 'Understand', bn: 'বোঝা' }, range: [11, 18] },
  { id: 4, name: { en: 'Lead', bn: 'নেতৃত্ব' }, range: [19, 20] },
];

const t = (en, bn) => ({ en, bn });
const q = (qen, qbn, options, answer) => ({ q: t(qen, qbn), options: options.map(([e, b]) => t(e, b)), answer });

export const LEVELS = [
  {
    id: 0, icon: '🌍', scene: 'earth',
    title: t('Earth, Our Home', 'পৃথিবী, আমাদের ঘর'),
    facts: [
      t('Earth is the only planet we know of that has life.', 'আমরা যত গ্রহ চিনি, তার মধ্যে শুধু পৃথিবীতেই প্রাণ আছে।'),
      t('About 71% of Earth\'s surface is covered by water. That is why it looks blue from space.', 'পৃথিবীর উপরিভাগের প্রায় ৭১% পানিতে ঢাকা। তাই মহাকাশ থেকে পৃথিবীকে নীল দেখায়।'),
      t('Earth spins once every 24 hours. That gives us day and night.', 'পৃথিবী ২৪ ঘণ্টায় একবার নিজের চারপাশে ঘোরে। এর ফলেই দিন আর রাত হয়।'),
    ],
    quiz: [
      q('Why does Earth look blue from space?', 'মহাকাশ থেকে পৃথিবীকে নীল দেখায় কেন?',
        [['Because of its oceans', 'সমুদ্রের কারণে'], ['Because of the Moon', 'চাঁদের কারণে'], ['Because it is cold', 'ঠান্ডা বলে']], 0),
      q('How long does Earth take to spin once?', 'পৃথিবী একবার ঘুরতে কত সময় নেয়?',
        [['1 hour', '১ ঘণ্টা'], ['24 hours', '২৪ ঘণ্টা'], ['1 year', '১ বছর']], 1),
    ],
  },
  {
    id: 1, icon: '✨', scene: 'stars',
    title: t('What Is Space?', 'মহাকাশ কী?'),
    facts: [
      t('Space begins about 100 km above Earth. This line is called the Kármán line.', 'পৃথিবী থেকে প্রায় ১০০ কিলোমিটার উপরে মহাকাশ শুরু। এই সীমাকে কারমান রেখা বলে।'),
      t('Space has almost no air, so there is no sound there.', 'মহাকাশে প্রায় কোনো বাতাস নেই, তাই সেখানে কোনো শব্দ শোনা যায় না।'),
      t('The stars you see at night are faraway suns.', 'রাতে যে তারা দেখো, সেগুলো আসলে অনেক দূরের সূর্য।'),
    ],
    quiz: [
      q('Why is space silent?', 'মহাকাশ নিঃশব্দ কেন?',
        [['It is too dark', 'খুব অন্ধকার বলে'], ['There is almost no air to carry sound', 'শব্দ বহন করার মতো বাতাস প্রায় নেই'], ['Stars absorb sound', 'তারারা শব্দ শুষে নেয়']], 1),
      q('Where does space begin?', 'মহাকাশ কোথা থেকে শুরু?',
        [['About 100 km up', 'প্রায় ১০০ কিমি উপরে'], ['At the clouds', 'মেঘের কাছে'], ['At the Moon', 'চাঁদে']], 0),
    ],
  },
  {
    id: 2, icon: '☀️', scene: 'sun',
    title: t('The Sun', 'সূর্য'),
    facts: [
      t('The Sun is a star, a giant ball of very hot gas.', 'সূর্য একটি তারা, খুব গরম গ্যাসের এক বিশাল গোলক।'),
      t('About 1.3 million Earths could fit inside the Sun.', 'সূর্যের ভিতরে প্রায় ১৩ লক্ষ পৃথিবী এঁটে যাবে।'),
      t('Sunlight takes about 8 minutes to reach Earth.', 'সূর্যের আলো পৃথিবীতে পৌঁছাতে প্রায় ৮ মিনিট লাগে।'),
      t('Never look straight at the Sun. It can hurt your eyes!', 'কখনো সরাসরি সূর্যের দিকে তাকাবে না। এতে চোখের ক্ষতি হতে পারে!'),
    ],
    quiz: [
      q('What is the Sun?', 'সূর্য কী?',
        [['A planet', 'একটি গ্রহ'], ['A star', 'একটি তারা'], ['A moon', 'একটি উপগ্রহ']], 1),
      q('How long does sunlight take to reach Earth?', 'সূর্যের আলো পৃথিবীতে আসতে কত সময় লাগে?',
        [['About 8 minutes', 'প্রায় ৮ মিনিট'], ['About 8 days', 'প্রায় ৮ দিন'], ['Instantly', 'সঙ্গে সঙ্গে']], 0),
    ],
  },
  {
    id: 3, icon: '🪐', scene: 'solar',
    title: t('The Solar System', 'সৌরজগৎ'),
    facts: [
      t('8 planets travel around the Sun in paths called orbits.', '৮টি গ্রহ সূর্যের চারপাশে ঘোরে। এই পথকে কক্ষপথ বলে।'),
      t('Order from the Sun: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune.', 'সূর্য থেকে ক্রম: বুধ, শুক্র, পৃথিবী, মঙ্গল, বৃহস্পতি, শনি, ইউরেনাস, নেপচুন।'),
      t('The Sun\'s gravity holds the whole Solar System together.', 'সূর্যের মহাকর্ষ পুরো সৌরজগৎকে একসাথে ধরে রাখে।'),
    ],
    quiz: [
      q('How many planets orbit our Sun?', 'আমাদের সূর্যের চারপাশে কয়টি গ্রহ ঘোরে?',
        [['7', '৭'], ['8', '৮'], ['10', '১০']], 1),
      q('What keeps planets in their orbits?', 'গ্রহগুলোকে কক্ষপথে ধরে রাখে কী?',
        [['Wind', 'বাতাস'], ['The Sun\'s gravity', 'সূর্যের মহাকর্ষ'], ['Magnets', 'চুম্বক']], 1),
    ],
  },
  {
    id: 4, icon: '🔭', scene: 'planets',
    title: t('Meet the Planets', 'গ্রহদের সাথে পরিচয়'),
    facts: [
      t('Jupiter is the biggest planet. More than 1,000 Earths could fit inside it.', 'বৃহস্পতি সবচেয়ে বড় গ্রহ। এর ভিতরে ১,০০০-এর বেশি পৃথিবী এঁটে যাবে।'),
      t('Venus is the hottest planet because its thick clouds trap heat.', 'শুক্র সবচেয়ে গরম গ্রহ, কারণ এর ঘন মেঘ তাপ আটকে রাখে।'),
      t('Saturn has beautiful rings made of ice and rock.', 'শনির সুন্দর বলয় আছে, যা বরফ আর পাথর দিয়ে তৈরি।'),
    ],
    quiz: [
      q('Which is the biggest planet?', 'সবচেয়ে বড় গ্রহ কোনটি?',
        [['Earth', 'পৃথিবী'], ['Saturn', 'শনি'], ['Jupiter', 'বৃহস্পতি']], 2),
      q('Saturn\'s rings are made of…', 'শনির বলয় তৈরি…',
        [['Ice and rock', 'বরফ আর পাথর দিয়ে'], ['Fire', 'আগুন দিয়ে'], ['Gold', 'সোনা দিয়ে']], 0),
    ],
  },
  {
    id: 5, icon: '🌙', scene: 'moon',
    title: t('Our Moon', 'আমাদের চাঁদ'),
    facts: [
      t('The Moon is about 384,000 km away from Earth.', 'চাঁদ পৃথিবী থেকে প্রায় ৩,৮৪,০০০ কিলোমিটার দূরে।'),
      t('The Moon has no light of its own. It reflects sunlight.', 'চাঁদের নিজের কোনো আলো নেই। সে সূর্যের আলো প্রতিফলিত করে।'),
      t('In 1969, Apollo 11 astronauts became the first people to walk on the Moon.', '১৯৬৯ সালে অ্যাপোলো ১১-এর নভোচারীরা প্রথম মানুষ হিসেবে চাঁদে হাঁটেন।'),
    ],
    quiz: [
      q('Why does the Moon shine?', 'চাঁদ জ্বলজ্বল করে কেন?',
        [['It reflects sunlight', 'সূর্যের আলো প্রতিফলিত করে'], ['It is on fire', 'এতে আগুন জ্বলে'], ['It has lamps', 'এতে বাতি আছে']], 0),
      q('Which mission first landed people on the Moon?', 'কোন মিশন প্রথম মানুষকে চাঁদে নামায়?',
        [['Apollo 11', 'অ্যাপোলো ১১'], ['Voyager 1', 'ভয়েজার ১'], ['Hubble', 'হাবল']], 0),
    ],
  },
  {
    id: 6, icon: '🚀', scene: 'rocket',
    title: t('Rockets', 'রকেট'),
    facts: [
      t('Rockets push hot gas down so they can go up. Every push has an equal push back!', 'রকেট গরম গ্যাস নিচে ঠেলে দেয়, তাই নিজে উপরে ওঠে। প্রতিটি ধাক্কার সমান উল্টো ধাক্কা থাকে!'),
      t('To reach orbit, a rocket must go about 28,000 km per hour.', 'কক্ষপথে পৌঁছাতে রকেটকে ঘণ্টায় প্রায় ২৮,০০০ কিলোমিটার বেগে চলতে হয়।'),
      t('Rockets have stages. Empty stages drop off to make the rocket lighter.', 'রকেটের কয়েকটি ধাপ থাকে। খালি ধাপগুলো খসে পড়ে, ফলে রকেট হালকা হয়।'),
    ],
    quiz: [
      q('How does a rocket go up?', 'রকেট উপরে ওঠে কীভাবে?',
        [['It pushes gas downward', 'গ্যাস নিচের দিকে ঠেলে'], ['It flaps wings', 'ডানা ঝাপটে'], ['It floats on clouds', 'মেঘে ভেসে']], 0),
      q('Why do rockets drop stages?', 'রকেট ধাপ ফেলে দেয় কেন?',
        [['To get lighter', 'হালকা হওয়ার জন্য'], ['To make noise', 'শব্দ করার জন্য'], ['To slow down', 'ধীর হওয়ার জন্য']], 0),
    ],
  },
  {
    id: 7, icon: '👩‍🚀', scene: 'astronaut',
    title: t('Astronauts', 'নভোচারী'),
    facts: [
      t('Astronauts train for years: flying, science, fixing machines and teamwork.', 'নভোচারীরা বছরের পর বছর প্রশিক্ষণ নেন: বিমান চালানো, বিজ্ঞান, যন্ত্র মেরামত আর দলগত কাজ।'),
      t('They practise floating in giant swimming pools that feel a bit like space.', 'তাঁরা বিশাল সুইমিং পুলে ভেসে থাকার অনুশীলন করেন, যা অনেকটা মহাকাশের মতো লাগে।'),
      t('Yuri Gagarin was the first person in space, in 1961.', '১৯৬১ সালে ইউরি গ্যাগারিন প্রথম মানুষ হিসেবে মহাকাশে যান।'),
    ],
    quiz: [
      q('Who was the first person in space?', 'প্রথম মানুষ হিসেবে মহাকাশে কে যান?',
        [['Neil Armstrong', 'নিল আর্মস্ট্রং'], ['Yuri Gagarin', 'ইউরি গ্যাগারিন'], ['Isaac Newton', 'আইজ্যাক নিউটন']], 1),
      q('Why do astronauts train in pools?', 'নভোচারীরা পুলে প্রশিক্ষণ নেন কেন?',
        [['Floating feels like space', 'ভেসে থাকা মহাকাশের মতো লাগে'], ['To learn fishing', 'মাছ ধরা শিখতে'], ['To stay cool', 'ঠান্ডা থাকতে']], 0),
    ],
  },
  {
    id: 8, icon: '🧑‍🚀', scene: 'suit',
    title: t('Spacesuits', 'স্পেসস্যুট'),
    facts: [
      t('A spacesuit is like a tiny spaceship you wear.', 'স্পেসস্যুট যেন গায়ে পরা ছোট্ট একটা মহাকাশযান।'),
      t('It gives oxygen, keeps the right pressure and protects from heat and cold.', 'এটি অক্সিজেন দেয়, সঠিক চাপ ধরে রাখে, আর গরম-ঠান্ডা থেকে রক্ষা করে।'),
      t('The gold visor protects astronauts\' eyes from strong sunlight.', 'সোনালি ভাইজর নভোচারীর চোখকে তীব্র সূর্যের আলো থেকে রক্ষা করে।'),
    ],
    quiz: [
      q('What does a spacesuit give an astronaut?', 'স্পেসস্যুট নভোচারীকে কী দেয়?',
        [['Oxygen and protection', 'অক্সিজেন আর সুরক্ষা'], ['Wings', 'ডানা'], ['Food only', 'শুধু খাবার']], 0),
      q('Why is the visor gold?', 'ভাইজর সোনালি কেন?',
        [['It looks fancy', 'দেখতে সুন্দর বলে'], ['To block strong sunlight', 'তীব্র সূর্যালোক আটকাতে'], ['To see in the dark', 'অন্ধকারে দেখতে']], 1),
    ],
  },
  {
    id: 9, icon: '🛰️', scene: 'station',
    title: t('The Space Station', 'মহাকাশ স্টেশন'),
    facts: [
      t('The International Space Station (ISS) orbits Earth about every 90 minutes.', 'আন্তর্জাতিক মহাকাশ স্টেশন (ISS) প্রায় প্রতি ৯০ মিনিটে একবার পৃথিবী ঘুরে আসে।'),
      t('So the crew sees about 16 sunrises every day!', 'তাই সেখানকার নভোচারীরা প্রতিদিন প্রায় ১৬ বার সূর্যোদয় দেখেন!'),
      t('People have lived on the ISS without a break since the year 2000.', '২০০০ সাল থেকে ISS-এ একটানা মানুষ বসবাস করছে।'),
    ],
    quiz: [
      q('How often does the ISS go around Earth?', 'ISS কত সময় পর পর পৃথিবী ঘোরে?',
        [['About every 90 minutes', 'প্রায় প্রতি ৯০ মিনিটে'], ['Once a day', 'দিনে একবার'], ['Once a year', 'বছরে একবার']], 0),
      q('About how many sunrises does the crew see each day?', 'নভোচারীরা দিনে প্রায় কতবার সূর্যোদয় দেখেন?',
        [['1', '১'], ['16', '১৬'], ['100', '১০০']], 1),
    ],
  },
  {
    id: 10, icon: '🤖', scene: 'rover',
    title: t('Rovers & NASA Missions', 'রোভার ও নাসা মিশন'),
    facts: [
      t('Rovers are robot cars that explore other worlds for us.', 'রোভার হলো রোবট গাড়ি, যা আমাদের হয়ে অন্য গ্রহ ঘুরে দেখে।'),
      t('Curiosity has explored Gale Crater on Mars since 2012.', 'কিউরিওসিটি ২০১২ সাল থেকে মঙ্গলের গেল ক্রেটার ঘুরে দেখছে।'),
      t('Perseverance landed in Jezero Crater in 2021 and brought a small helicopter, Ingenuity.', 'পারসিভিয়ারেন্স ২০২১ সালে জেজেরো ক্রেটারে নামে, সাথে ছিল ছোট্ট হেলিকপ্টার ইনজেনুইটি।'),
    ],
    quiz: [
      q('What is a rover?', 'রোভার কী?',
        [['A robot explorer car', 'একটি রোবট অনুসন্ধানী গাড়ি'], ['A planet', 'একটি গ্রহ'], ['A star', 'একটি তারা']], 0),
      q('Which rover brought the Ingenuity helicopter?', 'কোন রোভার ইনজেনুইটি হেলিকপ্টার নিয়ে গিয়েছিল?',
        [['Curiosity', 'কিউরিওসিটি'], ['Perseverance', 'পারসিভিয়ারেন্স'], ['Sojourner', 'সোজার্নার']], 1),
    ],
  },
  {
    id: 11, icon: '🛰️', scene: 'earthorbit',
    title: t('Earth From Space', 'মহাকাশ থেকে পৃথিবী'),
    facts: [
      t('Satellites watch Earth\'s weather, forests, oceans and ice from above.', 'স্যাটেলাইট উপর থেকে পৃথিবীর আবহাওয়া, বন, সমুদ্র আর বরফ পর্যবেক্ষণ করে।'),
      t('Satellites help warn people about cyclones, like the ones that hit Bangladesh.', 'স্যাটেলাইট ঘূর্ণিঝড়ের আগাম সতর্কবার্তা দিতে সাহায্য করে, যেমন বাংলাদেশে আঘাত হানা ঘূর্ণিঝড়।'),
      t('At night, city lights can be seen from space.', 'রাতে শহরের আলো মহাকাশ থেকেও দেখা যায়।'),
    ],
    quiz: [
      q('How do satellites help people on Earth?', 'স্যাটেলাইট পৃথিবীর মানুষকে কীভাবে সাহায্য করে?',
        [['They warn about storms', 'ঝড়ের সতর্কবার্তা দেয়'], ['They make rain', 'বৃষ্টি বানায়'], ['They cook food', 'রান্না করে']], 0),
      q('What can be seen from space at night?', 'রাতে মহাকাশ থেকে কী দেখা যায়?',
        [['City lights', 'শহরের আলো'], ['People walking', 'মানুষের হাঁটা'], ['Nothing at all', 'কিছুই না']], 0),
    ],
  },
  {
    id: 12, icon: '🍽️', scene: 'station',
    title: t('Life in Space', 'মহাকাশে জীবন'),
    facts: [
      t('In orbit everything floats, so astronauts sleep in sleeping bags tied to the wall.', 'কক্ষপথে সবকিছু ভাসে, তাই নভোচারীরা দেয়ালে বাঁধা স্লিপিং ব্যাগে ঘুমান।'),
      t('They exercise about 2 hours a day to keep their bones and muscles strong.', 'হাড় আর পেশি মজবুত রাখতে তাঁরা দিনে প্রায় ২ ঘণ্টা ব্যায়াম করেন।'),
      t('Water is precious: the ISS recycles most of its water, even from sweat!', 'পানি খুব মূল্যবান: ISS বেশিরভাগ পানি রিসাইকেল করে, এমনকি ঘাম থেকেও!'),
    ],
    quiz: [
      q('Why do astronauts exercise every day?', 'নভোচারীরা প্রতিদিন ব্যায়াম করেন কেন?',
        [['To keep bones and muscles strong', 'হাড় ও পেশি মজবুত রাখতে'], ['For fun only', 'শুধু মজার জন্য'], ['To get tired', 'ক্লান্ত হতে']], 0),
      q('Where does ISS water come from?', 'ISS-এর পানি কোথা থেকে আসে?',
        [['Mostly recycled', 'বেশিরভাগই রিসাইকেল করা'], ['From rain', 'বৃষ্টি থেকে'], ['From a river', 'নদী থেকে']], 0),
    ],
  },
  {
    id: 13, icon: '🌕', scene: 'moonbase',
    title: t('Back to the Moon', 'আবার চাঁদে'),
    facts: [
      t('NASA\'s Artemis program plans to send astronauts back to the Moon.', 'নাসার আর্টেমিস প্রোগ্রাম আবার চাঁদে নভোচারী পাঠানোর পরিকল্পনা করছে।'),
      t('Some craters near the Moon\'s south pole never see sunlight and may hold ice.', 'চাঁদের দক্ষিণ মেরুর কাছে কিছু গর্তে কখনো সূর্যের আলো পড়ে না, সেখানে বরফ থাকতে পারে।'),
      t('NASA\'s LRO spacecraft maps the Moon and measures where light falls.', 'নাসার LRO মহাকাশযান চাঁদের মানচিত্র বানায় আর কোথায় আলো পড়ে তা মাপে।'),
    ],
    quiz: [
      q('Why is the Moon\'s south pole interesting?', 'চাঁদের দক্ষিণ মেরু আকর্ষণীয় কেন?',
        [['It may have ice', 'সেখানে বরফ থাকতে পারে'], ['It has trees', 'সেখানে গাছ আছে'], ['It is very warm', 'খুব গরম']], 0),
      q('What is NASA\'s new Moon program called?', 'নাসার নতুন চাঁদ প্রোগ্রামের নাম কী?',
        [['Artemis', 'আর্টেমিস'], ['Titanic', 'টাইটানিক'], ['Zeus', 'জিউস']], 0),
    ],
  },
  {
    id: 14, icon: '🔴', scene: 'mars',
    title: t('Mars, the Red Planet', 'মঙ্গল, লাল গ্রহ'),
    facts: [
      t('Mars is red because its soil has rusty iron dust.', 'মঙ্গল লাল, কারণ এর মাটিতে মরিচা ধরা লোহার ধুলো আছে।'),
      t('A day on Mars is called a sol. It is about 24 hours and 40 minutes long.', 'মঙ্গলের একদিনকে "সল" বলে। এটি প্রায় ২৪ ঘণ্টা ৪০ মিনিট লম্বা।'),
      t('Olympus Mons on Mars is the tallest volcano in the Solar System.', 'মঙ্গলের অলিম্পাস মনস সৌরজগতের সবচেয়ে উঁচু আগ্নেয়গিরি।'),
    ],
    quiz: [
      q('What is a day on Mars called?', 'মঙ্গলের একদিনকে কী বলে?',
        [['A sol', 'সল'], ['A moon', 'মুন'], ['A week', 'সপ্তাহ']], 0),
      q('Why is Mars red?', 'মঙ্গল লাল কেন?',
        [['Rusty iron dust', 'মরিচা ধরা লোহার ধুলো'], ['It is very hot', 'খুব গরম বলে'], ['Red plants', 'লাল গাছপালা']], 0),
    ],
  },
  {
    id: 15, icon: '🌪️', scene: 'marsdust',
    title: t('Mars Weather & Radiation', 'মঙ্গলের আবহাওয়া ও বিকিরণ'),
    facts: [
      t('Mars is very cold. Nights at Gale Crater can drop below −70 °C.', 'মঙ্গল খুব ঠান্ডা। গেল ক্রেটারে রাতে তাপমাত্রা −৭০ °C-এর নিচে নামতে পারে।'),
      t('Dust storms can cover the sky and block sunlight for days, so solar panels make less power.', 'ধুলিঝড় দিনের পর দিন আকাশ ঢেকে সূর্যের আলো আটকাতে পারে, ফলে সোলার প্যানেল কম বিদ্যুৎ বানায়।'),
      t('Mars has a thin atmosphere and no global magnetic shield, so more space radiation reaches the ground.', 'মঙ্গলের বায়ুমণ্ডল পাতলা আর কোনো চৌম্বক ঢাল নেই, তাই মাটিতে বেশি মহাজাগতিক বিকিরণ পৌঁছায়।'),
      t('Curiosity\'s REMS and RAD instruments measure this weather and radiation every sol.', 'কিউরিওসিটির REMS আর RAD যন্ত্র প্রতি সলে এই আবহাওয়া আর বিকিরণ মাপে।'),
    ],
    quiz: [
      q('What happens to solar power during a dust storm?', 'ধুলিঝড়ের সময় সৌরবিদ্যুতের কী হয়?',
        [['It goes down', 'কমে যায়'], ['It goes up', 'বেড়ে যায়'], ['No change', 'কোনো পরিবর্তন হয় না']], 0),
      q('Why is radiation higher on Mars than on Earth?', 'পৃথিবীর চেয়ে মঙ্গলে বিকিরণ বেশি কেন?',
        [['Thin air and no magnetic shield', 'পাতলা বাতাস আর চৌম্বক ঢাল নেই'], ['Too many volcanoes', 'অনেক আগ্নেয়গিরি'], ['It is closer to the Sun', 'সূর্যের বেশি কাছে বলে']], 0),
    ],
  },
  {
    id: 16, icon: '🌌', scene: 'galaxy',
    title: t('Galaxies', 'ছায়াপথ'),
    facts: [
      t('A galaxy is a huge family of stars, gas and dust held together by gravity.', 'ছায়াপথ হলো তারা, গ্যাস আর ধুলোর এক বিশাল পরিবার, যা মহাকর্ষে একসাথে থাকে।'),
      t('Our galaxy is the Milky Way. It has 100 to 400 billion stars.', 'আমাদের ছায়াপথের নাম মিল্কিওয়ে (আকাশগঙ্গা)। এতে ১০,০০০ থেকে ৪০,০০০ কোটি তারা আছে।'),
      t('There are billions of galaxies in the universe.', 'মহাবিশ্বে শত শত কোটি ছায়াপথ আছে।'),
    ],
    quiz: [
      q('What is the name of our galaxy?', 'আমাদের ছায়াপথের নাম কী?',
        [['Milky Way', 'মিল্কিওয়ে'], ['Andromeda', 'অ্যান্ড্রোমিডা'], ['Sun Galaxy', 'সূর্য ছায়াপথ']], 0),
      q('What holds a galaxy together?', 'ছায়াপথকে একসাথে ধরে রাখে কী?',
        [['Gravity', 'মহাকর্ষ'], ['Glue', 'আঠা'], ['Wind', 'বাতাস']], 0),
    ],
  },
  {
    id: 17, icon: '🕳️', scene: 'blackhole',
    title: t('Black Holes', 'কৃষ্ণগহ্বর'),
    facts: [
      t('A black hole has gravity so strong that not even light can escape.', 'কৃষ্ণগহ্বরের মহাকর্ষ এত শক্তিশালী যে আলোও সেখান থেকে বের হতে পারে না।'),
      t('Many form when a very big star collapses at the end of its life.', 'অনেক কৃষ্ণগহ্বর তৈরি হয় যখন বিশাল কোনো তারা জীবনের শেষে চুপসে যায়।'),
      t('In 2022, scientists showed the first image of Sagittarius A*, the black hole at the centre of our galaxy.', '২০২২ সালে বিজ্ঞানীরা আমাদের ছায়াপথের কেন্দ্রের কৃষ্ণগহ্বর স্যাজিটেরিয়াস A*-এর প্রথম ছবি দেখান।'),
    ],
    quiz: [
      q('What can\'t escape a black hole?', 'কৃষ্ণগহ্বর থেকে কী বের হতে পারে না?',
        [['Even light', 'এমনকি আলোও'], ['Only rocks', 'শুধু পাথর'], ['Only water', 'শুধু পানি']], 0),
      q('How do many black holes form?', 'অনেক কৃষ্ণগহ্বর কীভাবে তৈরি হয়?',
        [['A giant star collapses', 'বিশাল তারা চুপসে গিয়ে'], ['Two moons crash', 'দুটি চাঁদ ধাক্কা খেয়ে'], ['A planet freezes', 'গ্রহ জমে গিয়ে']], 0),
    ],
  },
  {
    id: 18, icon: '🪐', scene: 'exoplanet',
    title: t('Exoplanets', 'বহির্গ্রহ'),
    facts: [
      t('Exoplanets are planets that orbit stars other than our Sun.', 'বহির্গ্রহ হলো সেই গ্রহ, যা আমাদের সূর্য ছাড়া অন্য তারার চারপাশে ঘোরে।'),
      t('Scientists have found more than 5,000 exoplanets.', 'বিজ্ঞানীরা ৫,০০০-এর বেশি বহির্গ্রহ খুঁজে পেয়েছেন।'),
      t('One way to find them: a star dims a tiny bit when a planet passes in front of it.', 'খোঁজার একটি উপায়: কোনো গ্রহ তারার সামনে দিয়ে গেলে তারাটি একটু ম্লান হয়ে যায়।'),
    ],
    quiz: [
      q('What is an exoplanet?', 'বহির্গ্রহ কী?',
        [['A planet around another star', 'অন্য তারার চারপাশের গ্রহ'], ['A broken moon', 'ভাঙা চাঁদ'], ['A comet', 'ধূমকেতু']], 0),
      q('How can we spot an exoplanet?', 'বহির্গ্রহ কীভাবে খুঁজে পাওয়া যায়?',
        [['The star dims slightly', 'তারাটি একটু ম্লান হয়'], ['It makes a sound', 'শব্দ করে'], ['It sends letters', 'চিঠি পাঠায়']], 0),
    ],
  },
  {
    id: 19, icon: '🧭', scene: 'mars', kind: 'design',
    title: t('Mission Design', 'মিশন ডিজাইন'),
    facts: [
      t('Pick a landing site, meet your crew and pack your supplies.', 'ল্যান্ডিং সাইট বেছে নাও, ক্রুদের সাথে পরিচিত হও, আর রসদ গুছিয়ে নাও।'),
    ],
  },
  {
    id: 20, icon: '🏕️', scene: 'outpost', kind: 'sim',
    title: t('Junior Astronaut Mission: 30 Sols on Mars', 'জুনিয়র নভোচারী মিশন: মঙ্গলে ৩০ সল'),
    facts: [
      t('Keep your 4-person crew alive for 30 sols.', 'তোমার ৪ জনের ক্রুকে ৩০ সল বাঁচিয়ে রাখো।'),
    ],
  },
];
