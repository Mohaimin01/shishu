// Story Rows — 27 new stories (levels 3–5, en/bn/es). Every word must open a real row;
// add-stories.ts validates each one against the 300-concept lexicon before writing.
export const STORIES = [
  // ---------- English · level 3 ----------
  {
    id: "en-baby-apple", lang: "en", level: 3, title: "The baby and the apple",
    concepts: ["baby", "small", "sister", "give", "apple", "laugh", "brother", "run", "jump", "we", "play", "sing", "dance", "mother", "say", "good", "happy"],
    text: "The baby is small. My sister gives the baby an apple. The baby laughs. My brother runs and jumps. We play and sing. The baby dances! Mother says: good baby! The baby is happy.",
  },
  {
    id: "en-grandmother-cooks", lang: "en", level: 3, title: "Grandmother cooks",
    concepts: ["grandmother", "cook", "rice", "egg", "hot", "give", "cup", "tea", "i", "eat", "bread", "say", "child", "food", "good", "wash", "hand", "face", "thank-you", "he-she"],
    text: "Grandmother cooks. She cooks rice and eggs. The rice is hot. She gives me a cup of tea. I eat bread and an egg. Grandmother says: eat, child! The food is good. I wash my hands and my face. Thank you, grandmother!",
  },
  {
    id: "en-little-brother", lang: "en", level: 3, title: "My little brother",
    concepts: ["brother", "small", "he-she", "stand", "sit", "run", "jump", "mother", "say", "sleep", "child", "cry", "laugh", "good", "i"],
    text: "My brother is small. He stands. He sits. He runs and jumps. Mother says: sleep now, child! My brother cries. Then he laughs. He sleeps. I laugh. Good, small brother!",
  },
  // ---------- English · level 4 ----------
  {
    id: "en-cat-bird", lang: "en", level: 4, title: "The cat and the bird",
    concepts: ["cat", "black", "white", "bird", "sit", "tree", "see", "go", "run", "dog", "sky", "happy", "sleep", "laugh"],
    text: "The cat is black and white. A bird sits in the tree. The cat sees the bird. The bird goes. The cat runs. The dog runs. The bird is happy in the sky. The cat sits and sleeps. The dog laughs.",
  },
  {
    id: "en-rain-wind", lang: "en", level: 4, title: "Rain and wind",
    concepts: ["big", "cloud", "sky", "rain", "wind", "come", "i", "open", "door", "see", "cold", "good", "flower", "tree", "happy", "mother", "say", "child", "close"],
    text: "A big cloud is in the sky. Rain comes and the wind comes. I open the door and see the rain. The rain is cold and good. The flower and the tree are happy. Mother says: come in, child! I close the door.",
  },
  {
    id: "en-new-shirt", lang: "en", level: 4, title: "My new shirt",
    concepts: ["mother", "give", "i", "new", "shirt", "red", "see", "mirror", "dance", "sister", "wash", "soap", "clean", "sock", "old", "want", "shoe", "father", "say", "yes", "we", "buy", "cap", "happy"],
    text: "Mother gives me a new shirt. The shirt is red. I see the shirt in the mirror. I dance! My sister washes the shirt with soap. Now the shirt is clean. My sock is old. I want new shoes. Father says: yes! We buy new shoes and a new cap. I am happy.",
  },
  // ---------- English · level 5 ----------
  {
    id: "en-farmer-cow", lang: "en", level: 5, title: "The farmer and the cow",
    concepts: ["farmer", "wake", "morning", "give", "cow", "water", "grass", "milk", "walk", "village", "buy", "bread", "tea", "sun", "hot", "see", "river", "drink", "happy", "he-she"],
    text: "The farmer wakes in the morning. He gives the cow water and grass. The cow gives milk. The farmer walks to the village with the cow. In the village he buys bread and tea. The sun is hot. The farmer sees the river and drinks tea. A happy farmer, a happy cow!",
  },
  {
    id: "en-little-doctor", lang: "en", level: 5, title: "The little doctor",
    concepts: ["girl", "play", "doll", "sick", "head", "hot", "doctor", "touch", "hand", "say", "take", "water", "apple", "see", "smile", "good", "mother", "laugh", "hug", "small", "he-she"],
    text: "The girl plays doctor. Her doll is sick. The doll has a hot head. The doctor touches the head and the hands. She says: doll, take the water and the apple! The doll sees the apple and smiles. Now the doll is good. Mother says: good doctor! The girl laughs and hugs the doll.",
  },
  {
    id: "en-yellow-kite", lang: "en", level: 5, title: "The yellow kite",
    concepts: ["father", "yellow", "kite", "i", "run", "wind", "come", "fly", "sky", "tall", "friend", "see", "say", "beautiful", "give", "we", "laugh", "dance", "happy", "he-she"],
    text: "My father has a yellow kite. I run with the kite. The wind comes and the kite flies. The kite flies high in the sky. My friend sees the kite. She says: a beautiful kite! I give the kite to my friend. We laugh and we dance. The kite is happy in the sky.",
  },

  // ---------- Bengali · level 3 ----------
  {
    id: "bn-bachcha-apel", lang: "bn", level: 3, title: "শিশু আর আপেল",
    concepts: ["child", "small", "sister", "apple", "give", "laugh", "brother", "run", "jump", "we", "play", "sing", "dance", "mother", "say", "good", "happy"],
    text: "শিশু ছোট। বোন আপেল দেয়। শিশু হাসে। ভাই দৌড়ায় আর লাফায়। আমরা খেলি আর গান করি। শিশু নাচে! মা বলে: ভালো শিশু! শিশু খুশি।",
  },
  {
    id: "bn-thakuma-ranna", lang: "bn", level: 3, title: "ঠাকুমা রান্না করে",
    concepts: ["grandmother", "cook", "rice", "egg", "hot", "give", "tea", "i", "eat", "bread", "say", "child", "food", "good", "wash", "hand", "thank-you"],
    text: "ঠাকুমা রান্না করে। ঠাকুমা ভাত রান্না করে, ডিম রান্না করে। ভাত গরম। ঠাকুমা চা দেয়। আমি রুটি খাই। ঠাকুমা বলে: খাও, শিশু! খাবার ভালো। আমি হাত ধুই। ধন্যবাদ, ঠাকুমা!",
  },
  {
    id: "bn-chhoto-bhai", lang: "bn", level: 3, title: "আমার ছোট ভাই",
    concepts: ["brother", "small", "he-she", "stand", "sit", "run", "jump", "mother", "say", "sleep", "child", "cry", "laugh", "good", "i"],
    text: "আমার ভাই ছোট। সে দাঁড়ায়। সে বসে। সে দৌড়ায় আর লাফায়। মা বলে: এখন ঘুমাও, শিশু! ভাই কাঁদে। তারপর সে হাসে। সে ঘুমায়। আমি হাসি। ভালো, ছোট ভাই!",
  },
  // ---------- Bengali · level 4 ----------
  {
    id: "bn-biral-pakhi", lang: "bn", level: 4, title: "বিড়াল আর পাখি",
    concepts: ["cat", "black", "white", "bird", "tree", "sit", "see", "go", "run", "dog", "sky", "happy", "sleep", "laugh"],
    text: "বিড়াল কালো আর সাদা। একটা পাখি গাছে বসে। বিড়াল পাখি দেখে। পাখি যায়। বিড়াল দৌড়ায়। কুকুর দৌড়ায়। পাখি আকাশে খুশি। বিড়াল বসে আর ঘুমায়। কুকুর হাসে।",
  },
  {
    id: "bn-brishti-batas", lang: "bn", level: 4, title: "বৃষ্টি আর বাতাস",
    concepts: ["big", "cloud", "sky", "black", "rain", "wind", "come", "i", "open", "door", "see", "cold", "good", "flower", "tree", "happy", "mother", "say", "child", "close"],
    text: "বড় মেঘ, আকাশ কালো। বৃষ্টি আসে আর বাতাস আসে। আমি দরজা খুলি আর বৃষ্টি দেখি। বৃষ্টি ঠান্ডা আর ভালো। ফুল আর গাছ খুশি। মা বলে: ভেতরে এসো, শিশু! আমি দরজা বন্ধ করি।",
  },
  {
    id: "bn-notun-shart", lang: "bn", level: 4, title: "আমার নতুন শার্ট",
    concepts: ["mother", "new", "shirt", "give", "red", "i", "see", "mirror", "dance", "sister", "soap", "wash", "clean", "sock", "old", "want", "shoe", "father", "say", "yes", "we", "buy", "cap", "happy"],
    text: "মা নতুন শার্ট দেয়। শার্ট লাল। আমি আয়নায় শার্ট দেখি। আমি নাচি! বোন সাবান দিয়ে শার্ট ধোয়। শার্ট পরিষ্কার। মোজা পুরনো। আমি নতুন জুতা চাই। বাবা বলে: হ্যাঁ! আমরা নতুন জুতা আর টুপি কিনি। আমি খুশি।",
  },
  // ---------- Bengali · level 5 ----------
  {
    id: "bn-krishok-goru", lang: "bn", level: 5, title: "কৃষক আর গরু",
    concepts: ["farmer", "morning", "wake", "cow", "see", "grass", "eat", "milk", "give", "happy", "go", "village", "buy", "bread", "tea", "sun", "hot", "river", "one", "he-she"],
    text: "সকালে কৃষক জাগে। সে গরু দেখে। গরু ঘাস খায় আর দুধ দেয়। কৃষক খুশি। সে গরু নিয়ে গ্রামে যায়। গ্রামে সে রুটি আর চা কেনে। সূর্য গরম। কৃষক নদী দেখে আর চা খায়। এক খুশি কৃষক, এক খুশি গরু!",
  },
  {
    id: "bn-choto-daktar", lang: "bn", level: 5, title: "ছোট ডাক্তার",
    concepts: ["woman", "play", "he-she", "doctor", "doll", "sick", "head", "hot", "touch", "hand", "say", "water", "take", "apple", "see", "laugh", "good", "mother", "hug", "small"],
    text: "মেয়ে খেলে, সে ডাক্তার। তার পুতুল অসুস্থ, মাথা গরম। ডাক্তার মাথা আর হাত ছোঁয়। সে বলে: পুতুল, পানি নাও! আপেল নাও! পুতুল আপেল দেখে আর হাসে। এখন পুতুল ভালো। মা বলে: ভালো ডাক্তার! মেয়ে হাসে আর পুতুল জড়িয়ে ধরে।",
  },
  {
    id: "bn-holud-ghuri", lang: "bn", level: 5, title: "হলুদ ঘুড়ি",
    concepts: ["father", "yellow", "kite", "give", "i", "run", "wind", "come", "fly", "sky", "tall", "friend", "see", "say", "beautiful", "we", "laugh", "dance", "happy", "he-she"],
    text: "বাবা হলুদ ঘুড়ি দেয়। আমি ঘুড়ি নিয়ে দৌড়াই। বাতাস আসে, ঘুড়ি ওড়ে। ঘুড়ি আকাশে উঁচু। বন্ধু ঘুড়ি দেখে। সে বলে: সুন্দর ঘুড়ি! আমি ঘুড়ি দিই। আমরা হাসি আর নাচি। ঘুড়ি আকাশে খুশি।",
  },

  // ---------- Spanish · level 3 ----------
  {
    id: "es-bebe-manzana", lang: "es", level: 3, title: "El bebé y la manzana",
    concepts: ["baby", "small", "sister", "give", "apple", "laugh", "brother", "run", "jump", "we", "play", "sing", "dance", "mother", "say", "good", "happy"],
    text: "El bebé es pequeño. Mi hermana le da una manzana. El bebé ríe. Mi hermano corre y salta. Nosotros jugamos y cantamos. ¡El bebé baila! La madre dice: ¡buen bebé! El bebé es feliz.",
  },
  {
    id: "es-abuela-cocina", lang: "es", level: 3, title: "La abuela y el té",
    concepts: ["grandmother", "give", "rice", "egg", "hot", "cup", "tea", "i", "eat", "bread", "say", "child", "food", "good", "wash", "hand", "face", "thank-you", "he-she"],
    text: "La abuela está aquí. Ella da arroz y un huevo. El arroz está caliente. Ella me da una taza de té. Yo como pan. La abuela dice: ¡come, niño! La comida es buena. Yo lavo mis manos y mi cara. ¡Gracias, abuela!",
  },
  {
    id: "es-hermano-pequeno", lang: "es", level: 3, title: "Mi hermano pequeño",
    concepts: ["brother", "small", "he-she", "run", "jump", "mother", "say", "sleep", "child", "cry", "laugh", "good", "i"],
    text: "Mi hermano es pequeño. Él corre y salta. La madre dice: ¡duerme ahora, niño! Mi hermano llora. Después él ríe. Él duerme. Yo también. ¡Bueno, pequeño hermano!",
  },
  // ---------- Spanish · level 4 ----------
  {
    id: "es-gato-pajaro", lang: "es", level: 4, title: "El gato y el pájaro",
    concepts: ["cat", "black", "white", "bird", "tree", "see", "go", "run", "dog", "sky", "happy", "sit", "sleep", "laugh"],
    text: "El gato es negro y blanco. Un pájaro está en el árbol. El gato ve al pájaro. El pájaro va. El gato corre. El perro corre también. El pájaro está feliz en el cielo. El gato se sienta y duerme. El perro ríe.",
  },
  {
    id: "es-lluvia-viento", lang: "es", level: 4, title: "La lluvia y el viento",
    concepts: ["cloud", "big", "sky", "rain", "wind", "come", "i", "open", "door", "see", "cold", "good", "flower", "tree", "happy", "mother", "say", "child", "close"],
    text: "Una nube grande está en el cielo. La lluvia viene y el viento viene. Yo abro la puerta y veo la lluvia. La lluvia es fría y buena. La flor y el árbol están felices. La madre dice: ¡ven, niño! Yo cierro la puerta.",
  },
  {
    id: "es-camisa-nueva", lang: "es", level: 4, title: "Mi camisa nueva",
    concepts: ["mother", "give", "i", "new", "shirt", "red", "see", "mirror", "dance", "sister", "wash", "soap", "clean", "sock", "old", "want", "shoe", "father", "say", "yes", "we", "buy", "cap", "happy"],
    text: "Mi madre me da una camisa nueva. La camisa es roja. Yo veo la camisa en el espejo. ¡Yo bailo! Mi hermana lava la camisa con jabón. Ahora la camisa está limpia. Mi calcetín es viejo. Yo quiero zapatos nuevos. Mi padre dice: ¡sí! Nosotros compramos zapatos nuevos y una gorra. Yo estoy feliz.",
  },
  // ---------- Spanish · level 5 ----------
  {
    id: "es-campesino-vaca", lang: "es", level: 5, title: "El campesino y la vaca",
    concepts: ["farmer", "wake", "morning", "give", "water", "grass", "cow", "milk", "walk", "village", "buy", "bread", "tea", "sun", "hot", "see", "river", "drink", "happy", "he-she"],
    text: "El campesino se despierta en la mañana. Él da agua y hierba a la vaca. La vaca da leche. El campesino camina al pueblo con la vaca. En el pueblo él compra pan y té. El sol está caliente. El campesino ve el río y bebe té. ¡Un campesino feliz y una vaca feliz!",
  },
  {
    id: "es-doctora-pequena", lang: "es", level: 5, title: "La doctora pequeña",
    concepts: ["child", "play", "he-she", "doctor", "doll", "sick", "head", "hot", "touch", "hand", "say", "take", "water", "apple", "see", "smile", "good", "mother", "laugh", "hug", "small"],
    text: "La niña juega, ella es doctora. Su muñeca está enferma. La muñeca tiene la cabeza caliente. La doctora toca la cabeza y las manos. Ella dice: ¡muñeca, toma el agua y la manzana! La muñeca ve la manzana y sonríe. Ahora la muñeca está buena. La madre dice: ¡buena doctora! La niña ríe y abraza la muñeca.",
  },
  {
    id: "es-cometa-amarilla", lang: "es", level: 5, title: "La cometa amarilla",
    concepts: ["father", "yellow", "kite", "i", "run", "wind", "come", "fly", "sky", "tall", "friend", "see", "say", "beautiful", "give", "we", "laugh", "dance", "happy", "he-she"],
    text: "Mi padre tiene una cometa amarilla. Yo corro con la cometa. El viento viene y la cometa vuela. La cometa vuela alta en el cielo. Mi amigo ve la cometa. Él dice: ¡una cometa bonita! Yo doy la cometa a mi amigo. Nosotros reímos y bailamos. La cometa está feliz en el cielo.",
  },
];
