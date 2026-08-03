export type QuestionnaireScale = {
  label: string;
  label_bn?: string;
  value: number;
};

export type QuestionnaireItem = {
  id: string;
  text: string;
  text_bn?: string;
  isReverse: boolean;
};

export type ScoringType = "sum" | "mean" | "tsis_subscales" | "dass21_subscales" | "none";
export type OrderType = "random" | "buildup" | "normal";

export type QuestionnaireDef = {
  id: string;
  title: string;
  title_bn?: string;
  description: string;
  description_bn?: string;
  scale: QuestionnaireScale[];
  items: QuestionnaireItem[];
  scoringType: ScoringType;
  orderType: OrderType;
  feedbackTemplate: string;
  scaleMin: number;
  scaleMax: number;
};

export const QUESTIONNAIRES: QuestionnaireDef[] = [
  {
    id: "cfs",
    title: "Cognitive Flexibility Scale (CFS)",
    title_bn: "কগনিটিভ ফ্লেক্সিবিলিটি স্কেল (CFS)",
    description: "The following statements deal with your beliefs and feelings about your own behavior. Read each statement and respond by selecting how much you agree or disagree with each statement.",
    description_bn: "নিম্নলিখিত বিবৃতিগুলি আপনার নিজের আচরণ সম্পর্কে আপনার বিশ্বাস এবং অনুভূতির সাথে সম্পর্কিত। প্রতিটি বিবৃতি পড়ুন এবং আপনি প্রতিটি বিবৃতির সাথে কতটা একমত বা দ্বিমত পোষণ করেন তা নির্বাচন করে উত্তর দিন।",
    scaleMin: 1,
    scaleMax: 6,
    scale: [
      { label: "strongly agree", label_bn: "সম্পূর্ণ একমত", value: 6 },
      { label: "agree", label_bn: "একমত", value: 5 },
      { label: "slightly agree", label_bn: "কিছুটা একমত", value: 4 },
      { label: "slightly disagree", label_bn: "কিছুটা দ্বিমত", value: 3 },
      { label: "disagree", label_bn: "দ্বিমত", value: 2 },
      { label: "strongly disagree", label_bn: "সম্পূর্ণ দ্বিমত", value: 1 },
    ],
    orderType: "random",
    scoringType: "sum",
    feedbackTemplate: "Your feedback on the cognitive flexibility scale is {score}. The average score among students is (around) 55 points.",
    items: [
      { id: "q1", text: "I can communicate an idea in many different ways.", text_bn: "আমি বিভিন্ন উপায়ে একটি ধারণা প্রকাশ করতে পারি।", isReverse: false },
      { id: "q2", text: "I avoid new and unusual situations.", text_bn: "আমি নতুন এবং অস্বাভাবিক পরিস্থিতি এড়িয়ে চলি।", isReverse: true },
      { id: "q3", text: "I feel like I never get to make decisions.", text_bn: "আমার মনে হয় আমি কখনোই সিদ্ধান্ত নেওয়ার সুযোগ পাই না।", isReverse: true },
      { id: "q4", text: "I can find workable solutions to seemingly unsolvable problems.", text_bn: "আমি আপাতদৃষ্টিতে অমীমাংসিত সমস্যার কার্যকর সমাধান খুঁজে পেতে পারি।", isReverse: false },
      { id: "q5", text: "I seldom have choices when deciding how to behave.", text_bn: "কীভাবে আচরণ করতে হবে তার সিদ্ধান্ত নেওয়ার সময় আমার কাছে খুব কমই বিকল্প থাকে।", isReverse: true },
      { id: "q6", text: "I am willing to work at creative solutions to problems.", text_bn: "আমি সমস্যার সৃজনশীল সমাধানে কাজ করতে ইচ্ছুক।", isReverse: false },
      { id: "q7", text: "In any given situation, I am able to act appropriately.", text_bn: "যেকোনো নির্দিষ্ট পরিস্থিতিতে, আমি যথাযথভাবে কাজ করতে সক্ষম।", isReverse: false },
      { id: "q8", text: "My behavior is a result of conscious decisions that I make.", text_bn: "আমার আচরণ আমার নেওয়া সচেতন সিদ্ধান্তের ফলাফল।", isReverse: false },
      { id: "q9", text: "I have many possible ways of behaving in any given situation.", text_bn: "যেকোনো নির্দিষ্ট পরিস্থিতিতে আমার আচরণের সম্ভাব্য অনেক উপায় আছে।", isReverse: false },
      { id: "q10", text: "I have difficulty using my knowledge on a given topic in real life situations.", text_bn: "বাস্তব জীবনের পরিস্থিতিতে কোনো নির্দিষ্ট বিষয়ে আমার জ্ঞান ব্যবহার করতে আমার অসুবিধা হয়।", isReverse: true },
      { id: "q11", text: "I am willing to listen and consider alternatives for handling a problem.", text_bn: "আমি একটি সমস্যা মোকাবিলার বিকল্প উপায় শুনতে এবং বিবেচনা করতে ইচ্ছুক।", isReverse: false },
      { id: "q12", text: "I have the self-confidence necessary to try different ways of behaving", text_bn: "আমার আচরণের বিভিন্ন উপায় চেষ্টা করার জন্য প্রয়োজনীয় আত্মবিশ্বাস আছে।", isReverse: false },
    ]
  },
  {
    id: "gaene",
    title: "Generalized Acceptance of EvolutioN Evaluation (GAENE)",
    title_bn: "বিবর্তন মূল্যায়নের সাধারণ স্বীকৃতি (GAENE)",
    description: "For the following items, please indicate your agreement/disagreement with the given statements:",
    description_bn: "নিম্নলিখিত আইটেমগুলির জন্য, অনুগ্রহ করে প্রদত্ত বিবৃতিগুলির সাথে আপনার সম্মতি/অসম্মতি নির্দেশ করুন:",
    scaleMin: 1,
    scaleMax: 5,
    scale: [
      { label: "Strongly disagree", label_bn: "সম্পূর্ণ দ্বিমত", value: 1 },
      { label: "Disagree", label_bn: "দ্বিমত", value: 2 },
      { label: "I don't know / no opinion", label_bn: "আমি জানি না / কোনো মতামত নেই", value: 3 },
      { label: "Agree", label_bn: "একমত", value: 4 },
      { label: "Strongly Agree", label_bn: "সম্পূর্ণ একমত", value: 5 },
    ],
    orderType: "buildup",
    scoringType: "mean",
    feedbackTemplate: "Your GAENE score (range 1.0 to 5.0) is {score}.",
    items: [
      { id: "q1", text: "Everyone should understand evolution.", text_bn: "সবারই বিবর্তন সম্পর্কে বোঝা উচিত।", isReverse: false },
      { id: "q2", text: "It is important to let people know about how strong the evidence that supports evolution is.", text_bn: "বিবর্তনকে সমর্থনকারী প্রমাণগুলি কতটা শক্তিশালী তা লোকেদের জানানো গুরুত্বপূর্ণ।", isReverse: false },
      { id: "q3", text: "Some parts of evolution theory could be true.", text_bn: "বিবর্তন তত্ত্বের কিছু অংশ সত্য হতে পারে।", isReverse: false },
      { id: "q4", text: "Evolutionary theory applies to all plants and animals, including humans.", text_bn: "বিবর্তনীয় তত্ত্ব মানুষ সহ সমস্ত উদ্ভিদ এবং প্রাণীর ক্ষেত্রে প্রযোজ্য।", isReverse: false },
      { id: "q5", text: "People who plan to become biologists need to understand evolution.", text_bn: "যারা জীববিজ্ঞানী হওয়ার পরিকল্পনা করেন তাদের বিবর্তন বুঝতে হবে।", isReverse: false },
      { id: "q6", text: "I would be willing to argue in favor of evolutionary in a public forum such as a school club, church group, or meeting of public school parents.", text_bn: "আমি স্কুল ক্লাব, চার্চ গ্রুপ বা পাবলিক স্কুলের অভিভাবকদের মিটিংয়ের মতো কোনো পাবলিক ফোরামে বিবর্তনের পক্ষে যুক্তি দিতে ইচ্ছুক হব।", isReverse: false },
      { id: "q7", text: "Simple organisms such as bacteria change over time.", text_bn: "ব্যাকটেরিয়ার মতো সাধারণ জীব সময়ের সাথে পরিবর্তিত হয়।", isReverse: false },
      { id: "q8", text: "Nothing in biology makes sense without evolution.", text_bn: "বিবর্তন ছাড়া জীববিজ্ঞানের কোনো কিছুরই অর্থ হয় না।", isReverse: false },
      { id: "q9", text: "Understanding evolution helps me understand the other parts of biology.", text_bn: "বিবর্তন বোঝা আমাকে জীববিজ্ঞানের অন্যান্য অংশ বুঝতে সাহায্য করে।", isReverse: false },
      { id: "q10", text: "I would be willing to argue in favor of evolution in a small group of friends.", text_bn: "আমি বন্ধুদের একটি ছোট গ্রুপে বিবর্তনের পক্ষে যুক্তি দিতে ইচ্ছুক হব।", isReverse: false },
      { id: "q11", text: "Evolution is a good explanation of how humans first emerged on the earth.", text_bn: "বিবর্তন হলো পৃথিবীতে মানুষ কীভাবে প্রথম আবির্ভূত হয়েছিল তার একটি ভালো ব্যাখ্যা।", isReverse: false },
      { id: "q12", text: "Evolution is a scientific fact.", text_bn: "বিবর্তন একটি বৈজ্ঞানিক সত্য।", isReverse: false },
      { id: "q13", text: "Evolution is a good explanation of how new species arise.", text_bn: "কীভাবে নতুন প্রজাতির উদ্ভব হয় তার একটি ভালো ব্যাখ্যা হলো বিবর্তন।", isReverse: false },
    ]
  },
  {
    id: "mate",
    title: "Measure of Acceptance of the Theory of Evolution (MATE)",
    title_bn: "বিবর্তন তত্ত্বের স্বীকৃতির পরিমাপ (MATE)",
    description: "For the following items, please indicate your agreement/disagreement with the given statements:",
    description_bn: "নিম্নলিখিত আইটেমগুলির জন্য, অনুগ্রহ করে প্রদত্ত বিবৃতিগুলির সাথে আপনার সম্মতি/অসম্মতি নির্দেশ করুন:",
    scaleMin: 1,
    scaleMax: 5,
    scale: [
      { label: "Strongly agree", label_bn: "সম্পূর্ণ একমত", value: 5 },
      { label: "Agree", label_bn: "একমত", value: 4 },
      { label: "Undecided", label_bn: "অনিশ্চিত", value: 3 },
      { label: "Disagree", label_bn: "দ্বিমত", value: 2 },
      { label: "Strongly disagree", label_bn: "সম্পূর্ণ দ্বিমত", value: 1 },
    ],
    orderType: "buildup",
    scoringType: "sum",
    feedbackTemplate: "Your score on the Measure of Acceptance of the Theory of Evolution (MATE) is {score} points. Scores are between 20 (low) to 100 (high level of acceptance).",
    items: [
      { id: "q1", text: "Organisms existing today are the result of evolutionary processes that have occurred over millions of years", text_bn: "বর্তমানে বিদ্যমান জীবগুলি লাখ লাখ বছর ধরে ঘটে আসা বিবর্তনীয় প্রক্রিয়ার ফল।", isReverse: false },
      { id: "q2", text: "The theory of evolution is incapable of being scientifically tested", text_bn: "বিবর্তন তত্ত্বটি বৈজ্ঞানিকভাবে পরীক্ষা করা অসম্ভব।", isReverse: true },
      { id: "q3", text: "Modern humans are the product of evolutionary processes that have occurred over millions of years", text_bn: "আধুনিক মানুষ হলো লাখ লাখ বছর ধরে ঘটে আসা বিবর্তনীয় প্রক্রিয়ার ফল।", isReverse: false },
      { id: "q4", text: "The theory of evolution is based on speculation and not valid scientific observation and testing", text_bn: "বিবর্তন তত্ত্ব অনুমানের ওপর ভিত্তি করে তৈরি এবং এটি বৈধ বৈজ্ঞানিক পর্যবেক্ষণ এবং পরীক্ষার ওপর ভিত্তি করে নয়।", isReverse: true },
      { id: "q5", text: "Most scientists accept evolutionary theory to be a scientifically valid theory", text_bn: "বেশিরভাগ বিজ্ঞানী বিবর্তনীয় তত্ত্বকে একটি বৈজ্ঞানিকভাবে বৈধ তত্ত্ব হিসেবে গ্রহণ করেন।", isReverse: false },
      { id: "q6", text: "The available data are ambiguous (unclear) as to whether evolution actually occurs", text_bn: "বিবর্তন আসলেই ঘটে কি না সে বিষয়ে উপলব্ধ ডেটাগুলি অস্পষ্ট (অস্পষ্ট)।", isReverse: true },
      { id: "q7", text: "The age of the earth is less than 20,000 years", text_bn: "পৃথিবীর বয়স ২০,০০০ বছরেরও কম।", isReverse: true },
      { id: "q8", text: "There is a significant body of data that supports evolutionary theory", text_bn: "বিবর্তনীয় তত্ত্বকে সমর্থন করার জন্য উল্লেখযোগ্য পরিমাণে ডেটা রয়েছে।", isReverse: false },
      { id: "q9", text: "Organisms exist today in essentially the same form in which they always have", text_bn: "বর্তমানে বিদ্যমান জীবগুলি মূলত একই রূপে আছে যেভাবে তারা সবসময় ছিল।", isReverse: true },
      { id: "q10", text: "Evolution in not a scientifically valid theory", text_bn: "বিবর্তন কোনো বৈজ্ঞানিকভাবে বৈধ তত্ত্ব নয়।", isReverse: true },
      { id: "q11", text: "The age of the earth is at least 4 billion years", text_bn: "পৃথিবীর বয়স অন্তত ৪ বিলিয়ন বছর।", isReverse: false },
      { id: "q12", text: "Current evolutionary theory is the result of sound scientific research and methodology", text_bn: "বর্তমান বিবর্তনীয় তত্ত্ব হলো সুনিপুণ বৈজ্ঞানিক গবেষণা এবং পদ্ধতির ফল।", isReverse: false },
      { id: "q13", text: "Evolutionary theory generates testable predictions with respect to the characteristics of life", text_bn: "বিবর্তনীয় তত্ত্ব জীবনের বৈশিষ্ট্যগুলির ক্ষেত্রে পরীক্ষাযোগ্য ভবিষ্যদ্বাণী তৈরি করে।", isReverse: false },
      { id: "q14", text: "The theory of evolution cannot be correct since it disagrees with the Biblical account of creation", text_bn: "বিবর্তন তত্ত্বটি সঠিক হতে পারে না কারণ এটি সৃষ্টির বাইবেলের বিবরণের সাথে একমত নয়।", isReverse: true },
      { id: "q15", text: "Humans exist today in essentially the same form in which they always have", text_bn: "বর্তমানে মানুষ মূলত একই রূপে আছে যেভাবে তারা সবসময় ছিল।", isReverse: true },
      { id: "q16", text: "Evolutionary theory is supported by factual historical and laboratory data", text_bn: "বিবর্তনীয় তত্ত্ব বাস্তব ঐতিহাসিক এবং ল্যাবরেটরি ডেটা দ্বারা সমর্থিত।", isReverse: false },
      { id: "q17", text: "Much of the scientific community doubts if evolution occurs", text_bn: "বৈজ্ঞানিক সম্প্রদায়ের বেশিরভাগই বিবর্তন ঘটে কি না তা নিয়ে সন্দেহ পোষণ করে।", isReverse: true },
      { id: "q18", text: "The theory of evolution brings meaning to the diverse characteristics and behaviors observed in living forms", text_bn: "বিবর্তন তত্ত্ব জীবন্ত রূপগুলিতে পরিলক্ষিত বিভিন্ন বৈশিষ্ট্য এবং আচরণের অর্থ বহন করে।", isReverse: false },
      { id: "q19", text: "With few exceptions, organisms on earth came into existence at about the same time", text_bn: "কিছু ব্যতিক্রম ছাড়া, পৃথিবীতে জীবগুলি প্রায় একই সময়ে অস্তিত্ব লাভ করেছে।", isReverse: true },
      { id: "q20", text: "Evolution is a scientifically valid theory", text_bn: "বিবর্তন একটি বৈজ্ঞানিকভাবে বৈধ তত্ত্ব।", isReverse: false },
    ]
  },
  {
    id: "sbs",
    title: "Supernatural Belief Scale (SBS)",
    description: "Please indicate your agreement with the following statements. Note: The scale runs from strongly disagree to strongly agree, you need to choose the level agreement that matches your personal beliefs.",
    scaleMin: -4,
    scaleMax: 4,
    scale: [
      { label: "strongly disagree (-4)", value: -4 },
      { label: "-3", value: -3 },
      { label: "-2", value: -2 },
      { label: "-1", value: -1 },
      { label: "neither agree nor disagree (0)", value: 0 },
      { label: "1", value: 1 },
      { label: "2", value: 2 },
      { label: "3", value: 3 },
      { label: "strongly agree (4)", value: 4 },
    ],
    orderType: "buildup",
    scoringType: "mean",
    feedbackTemplate: "The supernatural belief scale has a possible range from -4 (no supernatural beliefs at all) to 4 (strong supernatural beliefs). Your score on the supernatural belief scale is {score}.",
    items: [
      { id: "q1", text: "There exists an all-powerful, all-knowing, loving God.", isReverse: false },
      { id: "q2", text: "There exists an evil personal spiritual being, whom we might call the Devil.", isReverse: false },
      { id: "q3", text: "There exist good personal spiritual beings, whom we might call angels.", isReverse: false },
      { id: "q4", text: "There exist evil, personal spiritual beings, whom we might call demons.", isReverse: false },
      { id: "q5", text: "Human beings have immaterial, immortal souls.", isReverse: false },
      { id: "q6", text: "There is a spiritual realm besides the physical one.", isReverse: false },
      { id: "q7", text: "Some people will be rewarded in an afterlife when they die.", isReverse: false },
      { id: "q8", text: "Some people will be punished in an afterlife when they die.", isReverse: false },
      { id: "q9", text: "Miracles—divinely-caused events that have no natural explanation—can and do happen.", isReverse: false },
      { id: "q10", text: "There are individuals who are messengers of God and/or can foresee the future.", isReverse: false },
    ]
  },
  {
    id: "skep",
    title: "Skepticism towards advertisements (SKEP)",
    title_bn: "বিজ্ঞাপনের প্রতি সংশয় (SKEP)",
    description: "Select for each of the statements below how much you agree (ranging from strongly agree to strongly disagree).",
    description_bn: "নীচের প্রতিটি বিবৃতির জন্য নির্বাচন করুন আপনি কতটা একমত (সম্পূর্ণ একমত থেকে সম্পূর্ণ দ্বিমত পর্যন্ত)।",
    scaleMin: 1,
    scaleMax: 5,
    scale: [
      { label: "strongly agree", label_bn: "সম্পূর্ণ একমত", value: 5 },
      { label: "agree", label_bn: "একমত", value: 4 },
      { label: "neutral", label_bn: "নিরপেক্ষ", value: 3 },
      { label: "disagree", label_bn: "দ্বিমত", value: 2 },
      { label: "strongly disagree", label_bn: "সম্পূর্ণ দ্বিমত", value: 1 },
    ],
    orderType: "normal",
    scoringType: "sum",
    feedbackTemplate: "The possible range on the SKEP runs from 9 to 45 points. The higher the score, the more skeptical you are towards advertising. Your score on the SKEP is {score}. Check the accompanying PsyToolkit website for population averages.",
    items: [
      { id: "q1", text: "We can depend on getting the truth in most advertising.", text_bn: "আমরা বেশিরভাগ বিজ্ঞাপনে সত্য পাওয়ার ওপর নির্ভর করতে পারি।", isReverse: false },
      { id: "q2", text: "Advertising's aim is to inform the consumer.", text_bn: "বিজ্ঞাপনের উদ্দেশ্য হলো ভোক্তাকে জানানো।", isReverse: false },
      { id: "q3", text: "I believe advertising is not informative.", text_bn: "আমি বিশ্বাস করি বিজ্ঞাপন তথ্যবহুল নয়।", isReverse: true },
      { id: "q4", text: "Advertising is generally truthful.", text_bn: "বিজ্ঞাপন সাধারণত সত্যবাদী হয়।", isReverse: false },
      { id: "q5", text: "Advertising is not a reliable source of information about the quality and performance of products.", text_bn: "পণ্যের গুণমান এবং কার্যকারিতা সম্পর্কে তথ্যের একটি নির্ভরযোগ্য উৎস বিজ্ঞাপন নয়।", isReverse: true },
      { id: "q6", text: "Advertising is truth well told.", text_bn: "বিজ্ঞাপন হলো সত্য যা ভালোভাবে বলা হয়েছে।", isReverse: false },
      { id: "q7", text: "In general, advertising does not present a true picture of the product being advertised.", text_bn: "সাধারণত, বিজ্ঞাপন বিজ্ঞাপিত পণ্যের একটি সত্য চিত্র উপস্থাপন করে না।", isReverse: true },
      { id: "q8", text: "I feel I've been accurately informed after viewing most advertisements.", text_bn: "আমার মনে হয় বেশিরভাগ বিজ্ঞাপন দেখার পর আমি সঠিকভাবে অবহিত হয়েছি।", isReverse: false },
      { id: "q9", text: "Most advertising does not provide consumers with essential information.", text_bn: "বেশিরভাগ বিজ্ঞাপন ভোক্তাদের প্রয়োজনীয় তথ্য প্রদান করে না।", isReverse: true },
    ]
  },
  {
    id: "tsis",
    title: "Social Intelligence (Tromsø Social Intelligence Scale, TSIS)",
    title_bn: "সামাজিক বুদ্ধিমত্তা (ট্রোমসো সোশ্যাল ইন্টেলিজেন্স স্কেল, TSIS)",
    description: "For each item, indicate how well it describes you on a scale from 1 (describes me extremely poorly) to 7 (describes me extremely well):",
    description_bn: "প্রতিটি আইটেমের জন্য, নির্দেশ করুন এটি আপনাকে কতটা ভালোভাবে বর্ণনা করে ১ (আমাকে অত্যন্ত খারাপভাবে বর্ণনা করে) থেকে ৭ (আমাকে অত্যন্ত ভালোভাবে বর্ণনা করে) এর স্কেলে:",
    scaleMin: 1,
    scaleMax: 7,
    scale: [
      { label: "1 (Describes me extremely poorly)", label_bn: "১ (আমাকে অত্যন্ত খারাপভাবে বর্ণনা করে)", value: 1 },
      { label: "2", label_bn: "২", value: 2 },
      { label: "3", label_bn: "৩", value: 3 },
      { label: "4", label_bn: "৪", value: 4 },
      { label: "5", label_bn: "৫", value: 5 },
      { label: "6", label_bn: "৬", value: 6 },
      { label: "7 (Describes me extremely well)", label_bn: "৭ (আমাকে অত্যন্ত ভালোভাবে বর্ণনা করে)", value: 7 },
    ],
    orderType: "normal",
    scoringType: "tsis_subscales",
    feedbackTemplate: "Your scores:\n- Social information processing: {scoreSp}\n- Social skills: {scoreSk}\n- Social awareness: {scoreSa}",
    items: [
      { id: "q1", text: "I can predict other peoples' behavior.", text_bn: "আমি অন্য লোকেদের আচরণের পূর্বাভাস দিতে পারি।", isReverse: false },
      { id: "q2", text: "I often feel that it is difficult to understand others' choices.", text_bn: "আমি প্রায়ই অনুভব করি যে অন্যদের পছন্দগুলি বোঝা কঠিন।", isReverse: true },
      { id: "q3", text: "I know how my actions will make others feel.", text_bn: "আমি জানি আমার কাজগুলি অন্যদের কেমন অনুভব করাবে।", isReverse: false },
      { id: "q4", text: "I often feel uncertain around new people who I don't know.", text_bn: "আমি প্রায়ই এমন নতুন লোকেদের আশেপাশে অনিশ্চিত বোধ করি যাদের আমি চিনি না।", isReverse: true },
      { id: "q5", text: "People often surprise me with the things they do.", text_bn: "লোকেরা প্রায়ই তাদের করা জিনিসগুলি দিয়ে আমাকে অবাক করে।", isReverse: true },
      { id: "q6", text: "I understand other peoples' feelings.", text_bn: "আমি অন্য লোকেদের অনুভূতি বুঝতে পারি।", isReverse: false },
      { id: "q7", text: "I fit in easily in social situations.", text_bn: "আমি সামাজিক পরিস্থিতিতে সহজেই মানিয়ে নিতে পারি।", isReverse: false },
      { id: "q8", text: "Other people become angry with me without me being able to explain why.", text_bn: "কেন তা ব্যাখ্যা করতে না পারলেও অন্য লোকেরা আমার ওপর রেগে যায়।", isReverse: true },
      { id: "q9", text: "I understand others' wishes.", text_bn: "আমি অন্যদের ইচ্ছা বুঝতে পারি।", isReverse: false },
      { id: "q10", text: "I am good at entering new situations and meeting people for the first time.", text_bn: "আমি নতুন পরিস্থিতিতে প্রবেশ করতে এবং প্রথমবার মানুষের সাথে দেখা করতে পারদর্শী।", isReverse: false },
      { id: "q11", text: "It seems as though people are often angry or irritated with me when I say what I think.", text_bn: "মনে হয় আমি যা ভাবি তা বললে লোকেরা প্রায়ই আমার ওপর রেগে যায় বা বিরক্ত হয়।", isReverse: true },
      { id: "q12", text: "I have a hard time getting along with other people.", text_bn: "আমার অন্য লোকেদের সাথে মানিয়ে চলতে খুব কষ্ট হয়।", isReverse: true },
      { id: "q13", text: "I find people unpredictable.", text_bn: "আমি মানুষকে অপ্রত্যাশিত মনে করি।", isReverse: true },
      { id: "q14", text: "I can often understand what others are trying to accomplish without the need for them to say anything.", text_bn: "আমি প্রায়ই বুঝতে পারি যে অন্যরা কিছু বলার প্রয়োজন ছাড়াই কী অর্জন করার চেষ্টা করছে।", isReverse: false },
      { id: "q15", text: "It takes a long time for me to get to know others well.", text_bn: "অন্যদের ভালোভাবে চিনতে আমার অনেক সময় লাগে।", isReverse: true },
      { id: "q16", text: "I have often hurt others without realizing it.", text_bn: "আমি প্রায়ই না বুঝেই অন্যদের আঘাত করেছি।", isReverse: true },
      { id: "q17", text: "I can predict how others will react to my behavior.", text_bn: "অন্যরা আমার আচরণে কীভাবে প্রতিক্রিয়া জানাবে আমি তার পূর্বাভাস দিতে পারি।", isReverse: false },
      { id: "q18", text: "I am good at getting on good terms with new people.", text_bn: "আমি নতুন লোকেদের সাথে ভালো সম্পর্ক তৈরি করতে পারদর্শী।", isReverse: false },
      { id: "q19", text: "I can often understand what others really mean through their expression, body language, etc.", text_bn: "অন্যরা তাদের অভিব্যক্তি, শারীরিক ভাষা ইত্যাদির মাধ্যমে আসলে কী বোঝাতে চায় তা আমি প্রায়ই বুঝতে পারি।", isReverse: false },
      { id: "q20", text: "I frequently have problems finding good conversation topics.", text_bn: "আমার কথোপকথনের ভালো বিষয় খুঁজে পেতে প্রায়ই সমস্যা হয়।", isReverse: true },
      { id: "q21", text: "I am often surprised by others' reactions to what I do.", text_bn: "আমি যা করি তাতে অন্যদের প্রতিক্রিয়া দেখে আমি প্রায়ই অবাক হই।", isReverse: true },
    ]
  },
  {
    id: "ncs6",
    title: "Need for Cognition (NCS-6)",
    title_bn: "জ্ঞানের প্রয়োজন (NCS-6)",
    description: "For each sentence below, please select how uncharacteristic or characteristic (5-point scale) this is for you personally.",
    description_bn: "নিচের প্রতিটি বাক্যের জন্য, অনুগ্রহ করে নির্বাচন করুন এটি আপনার ব্যক্তিগতভাবে কতটা বৈশিষ্ট্যহীন বা বৈশিষ্ট্যপূর্ণ (৫-পয়েন্ট স্কেল)।",
    scaleMin: 1,
    scaleMax: 5,
    scale: [
      { label: "1 (Extremely uncharacteristic)", label_bn: "১ (অত্যন্ত বৈশিষ্ট্যহীন)", value: 1 },
      { label: "2", label_bn: "২", value: 2 },
      { label: "3", label_bn: "৩", value: 3 },
      { label: "4", label_bn: "৪", value: 4 },
      { label: "5 (Extremely characteristic)", label_bn: "৫ (অত্যন্ত বৈশিষ্ট্যপূর্ণ)", value: 5 },
    ],
    orderType: "normal",
    scoringType: "mean",
    feedbackTemplate: "Your score on the NCS-6 is {score} points. The score can range from 1 (you do not like deep thinking) to 5 (you like effortful thinking).",
    items: [
      { id: "q1", text: "I would prefer complex to simple problems.", text_bn: "আমি সাধারণ সমস্যার চেয়ে জটিল সমস্যা পছন্দ করব।", isReverse: false },
      { id: "q2", text: "I like to have the responsibility of handling a situation that requires a lot of thinking.", text_bn: "আমি এমন পরিস্থিতি মোকাবিলার দায়িত্ব নিতে পছন্দ করি যার জন্য অনেক চিন্তাভাবনার প্রয়োজন।", isReverse: false },
      { id: "q3", text: "Thinking is not my idea of fun.", text_bn: "চিন্তা করা আমার কাছে মজার ধারণা নয়।", isReverse: true },
      { id: "q4", text: "I would rather do something that requires little thought than something that is sure to challenge my thinking abilities.", text_bn: "আমি এমন কিছু করার চেয়ে যার জন্য সামান্য চিন্তাভাবনার প্রয়োজন হয় এমন কিছু করতে পছন্দ করব যা নিশ্চিতভাবে আমার চিন্তা করার ক্ষমতাকে চ্যালেঞ্জ করবে।", isReverse: true },
      { id: "q5", text: "I really enjoy a task that involves coming up with new solutions to problems.", text_bn: "আমি সত্যিই এমন একটি কাজ উপভোগ করি যাতে সমস্যার নতুন সমাধান বের করতে হয়।", isReverse: false },
      { id: "q6", text: "I would prefer a task that is intellectual, difficult, and important to one that is somewhat important but does not require much thought.", text_bn: "আমি এমন একটি কাজ পছন্দ করব যা বুদ্ধিবৃত্তিক, কঠিন এবং গুরুত্বপূর্ণ, এমন কিছুর চেয়ে যা কিছুটা গুরুত্বপূর্ণ কিন্তু খুব একটা চিন্তার প্রয়োজন হয় না।", isReverse: false },
    ]
  },
  {
    id: "cfq",
    title: "Cognitive Failures (CFQ)",
    title_bn: "কগনিটিভ ফেইলিওর (CFQ)",
    description: "The following questions are about minor mistakes which everyone makes from time to time, but some of which happen more often than others. We want to know how often these things have happened to you in the last six months.",
    description_bn: "নিম্নলিখিত প্রশ্নগুলি ছোটখাটো ভুল সম্পর্কে যা সবাই সময়ে সময়ে করে, তবে এর মধ্যে কয়েকটি অন্যদের চেয়ে বেশিবার ঘটে। গত ছয় মাসে আপনার সাথে কতবার এই ঘটনাগুলি ঘটেছে তা আমরা জানতে চাই।",
    scaleMin: 0,
    scaleMax: 4,
    scale: [
      { label: "Very often", label_bn: "খুব প্রায়ই", value: 4 },
      { label: "Quite often", label_bn: "বেশ প্রায়ই", value: 3 },
      { label: "Occasionally", label_bn: "মাঝেমধ্যে", value: 2 },
      { label: "Very rarely", label_bn: "খুব কমই", value: 1 },
      { label: "Never", label_bn: "কখনো না", value: 0 },
    ],
    orderType: "random",
    scoringType: "sum",
    feedbackTemplate: "Your score on the Cognitive Failures Questionnaire (CFQ) is {score}.",
    items: [
      { id: "q1", text: "Do you read something and find you haven't been thinking about it and must read it again?", text_bn: "আপনি কি কিছু পড়ে বুঝতে পারেন যে আপনি এটি সম্পর্কে ভাবছিলেন না এবং আপনাকে এটি আবার পড়তে হবে?", isReverse: false },
      { id: "q2", text: "Do you find you forget why you went from one part of the house to the other?", text_bn: "আপনি কি বুঝতে পারেন যে আপনি কেন বাড়ির এক প্রান্ত থেকে অন্য প্রান্তে গিয়েছিলেন তা ভুলে গেছেন?", isReverse: false },
      { id: "q3", text: "Do you fail to notice signposts on the road?", text_bn: "আপনি কি রাস্তায় দিকনির্দেশক চিহ্নগুলি লক্ষ্য করতে ব্যর্থ হন?", isReverse: false },
      { id: "q4", text: "Do you find you confuse right and left when giving directions?", text_bn: "দিকনির্দেশ দেওয়ার সময় আপনি কি ডান এবং বাম গুলিয়ে ফেলেন?", isReverse: false },
      { id: "q5", text: "Do you bump into people?", text_bn: "আপনি কি মানুষের সাথে ধাক্কা খান?", isReverse: false },
      { id: "q6", text: "Do you find you forget whether you've turned off a light or a fire or locked the door?", text_bn: "আপনি কি আলো বা আগুন নিভিয়েছেন নাকি দরজা লক করেছেন তা ভুলে যান?", isReverse: false },
      { id: "q7", text: "Do you fail to listen to people's names when you are meeting them?", text_bn: "লোকদের সাথে দেখা করার সময় আপনি কি তাদের নাম শুনতে ব্যর্থ হন?", isReverse: false },
      { id: "q8", text: "Do you say something and realize afterwards that it might be taken as insulting?", text_bn: "আপনি কি এমন কিছু বলেন যা পরে বুঝতে পারেন যে এটি অপমানজনক হিসেবে নেওয়া যেতে পারে?", isReverse: false },
      { id: "q9", text: "Do you fail to hear people speaking to you when you are doing something else?", text_bn: "অন্য কিছু করার সময় লোকেরা আপনার সাথে কথা বললে আপনি কি শুনতে ব্যর্থ হন?", isReverse: false },
      { id: "q10", text: "Do you lose your temper?", text_bn: "আপনি কি আপনার মেজাজ হারান?", isReverse: false },
    ]
  },
  {
    id: "dass21",
    title: "Depression, Anxiety, and Stress Scales (DASS-21)",
    title_bn: "হতাশা, উদ্বেগ এবং মানসিক চাপ স্কেল (DASS-21)",
    description: "Please read each statement and select a number which indicates how much the statement applied to you over the past week. There are no right or wrong answers. Do not spend too much time on any statement.",
    description_bn: "অনুগ্রহ করে প্রতিটি বিবৃতি পড়ুন এবং একটি সংখ্যা নির্বাচন করুন যা নির্দেশ করে যে গত সপ্তাহে বিবৃতিটি আপনার ক্ষেত্রে কতটা প্রযোজ্য ছিল। এর কোনো সঠিক বা ভুল উত্তর নেই। কোনো বিবৃতিতে খুব বেশি সময় ব্যয় করবেন না।",
    scaleMin: 0,
    scaleMax: 3,
    scale: [
      { label: "Did not apply to me at all", label_bn: "আমার ক্ষেত্রে একেবারেই প্রযোজ্য ছিল না", value: 0 },
      { label: "Applied to me to some degree, or some of the time", label_bn: "কিছুটা মাত্রায় প্রযোজ্য ছিল, বা কিছু সময় প্রযোজ্য ছিল", value: 1 },
      { label: "Applied to me to a considerable degree, or a good part of time", label_bn: "যথেষ্ট মাত্রায় প্রযোজ্য ছিল, বা বেশিরভাগ সময় প্রযোজ্য ছিল", value: 2 },
      { label: "Applied to me very much, or most of the time", label_bn: "আমার ক্ষেত্রে খুব বেশি প্রযোজ্য ছিল, বা প্রায় সব সময় প্রযোজ্য ছিল", value: 3 },
    ],
    orderType: "normal",
    scoringType: "dass21_subscales",
    feedbackTemplate: "Your scores:\n- Depression: {scoreDepression}\n- Anxiety: {scoreAnxiety}\n- Stress: {scoreStress}",
    items: [
      { id: "q1", text: "I found it hard to wind down", text_bn: "আমার শান্ত হতে কষ্ট হচ্ছিল", isReverse: false },
      { id: "q2", text: "I was aware of dryness of my mouth", text_bn: "আমি আমার মুখ শুকিয়ে যাওয়ার বিষয়ে সচেতন ছিলাম", isReverse: false },
      { id: "q3", text: "I couldn't seem to experience any positive feeling at all", text_bn: "আমি কোনো ইতিবাচক অনুভূতি অনুভব করতে পারছিলাম না", isReverse: false },
      { id: "q4", text: "I experienced breathing difficulty (e.g. excessively rapid breathing, breathlessness in the absence of physical exertion)", text_bn: "আমি শ্বাস নিতে অসুবিধা অনুভব করেছি (যেমন শারীরিক পরিশ্রম ছাড়াই খুব দ্রুত শ্বাস নেওয়া, শ্বাসকষ্ট)", isReverse: false },
      { id: "q5", text: "I found it difficult to work up the initiative to do things", text_bn: "আমার কোনো কাজ শুরু করার উদ্যোগ নেওয়া কঠিন মনে হচ্ছিল", isReverse: false },
      { id: "q6", text: "I tended to over-react to situations", text_bn: "আমি বিভিন্ন পরিস্থিতিতে অতিরিক্ত প্রতিক্রিয়া দেখানোর প্রবণতা অনুভব করেছি", isReverse: false },
      { id: "q7", text: "I experienced trembling (e.g. in the hands)", text_bn: "আমি কাঁপুনি অনুভব করেছি (যেমন হাতে)", isReverse: false },
      { id: "q8", text: "I felt that I was using a lot of nervous energy", text_bn: "আমার মনে হচ্ছিল যে আমি প্রচুর স্নায়বিক শক্তি ব্যয় করছি", isReverse: false },
      { id: "q9", text: "I was worried about situations in which I might panic and make a fool of myself", text_bn: "আমি এমন পরিস্থিতি নিয়ে চিন্তিত ছিলাম যেখানে আমি আতঙ্কিত হতে পারি এবং নিজেকে বোকা বানাতে পারি", isReverse: false },
      { id: "q10", text: "I felt that I had nothing to look forward to", text_bn: "আমার মনে হচ্ছিল যে আমার ভালো কিছুর আশা করার নেই", isReverse: false },
      { id: "q11", text: "I found myself getting agitated", text_bn: "আমি নিজেকে উত্তেজিত হতে দেখেছি", isReverse: false },
      { id: "q12", text: "I found it difficult to relax", text_bn: "আমার আরাম করতে অসুবিধা হচ্ছিল", isReverse: false },
      { id: "q13", text: "I felt down-hearted and blue", text_bn: "আমি হতাশ এবং বিষণ্ণ অনুভব করেছি", isReverse: false },
      { id: "q14", text: "I was intolerant of anything that kept me from getting on with what I was doing", text_bn: "আমি এমন কিছুর প্রতি অসহিষ্ণু ছিলাম যা আমাকে আমার কাজ করতে বাধা দেয়", isReverse: false },
      { id: "q15", text: "I felt I was close to panic", text_bn: "আমি অনুভব করেছি যে আমি আতঙ্কের কাছাকাছি ছিলাম", isReverse: false },
      { id: "q16", text: "I was unable to become enthusiastic about anything", text_bn: "আমি কোনো কিছু নিয়ে উৎসাহী হতে পারছিলাম না", isReverse: false },
      { id: "q17", text: "I felt I wasn't worth much as a person", text_bn: "আমার মনে হচ্ছিল একজন ব্যক্তি হিসেবে আমার কোনো মূল্য নেই", isReverse: false },
      { id: "q18", text: "I felt that I was rather touchy", text_bn: "আমার মনে হচ্ছিল যে আমি বেশ স্পর্শকাতর (সহজেই রেগে যাওয়া)", isReverse: false },
      { id: "q19", text: "I was aware of the action of my heart in the absence of physical exertion (e.g. sense of heart rate increase, heart missing a beat)", text_bn: "শারীরিক পরিশ্রমের অনুপস্থিতিতেও আমি আমার হৃদস্পন্দনের ক্রিয়া সম্পর্কে সচেতন ছিলাম (যেমন হৃদস্পন্দন বৃদ্ধির অনুভূতি, হৃদস্পন্দন বাদ পড়া)", isReverse: false },
      { id: "q20", text: "I felt scared without any good reason", text_bn: "আমি কোনো যুক্তিসঙ্গত কারণ ছাড়াই ভয় পেয়েছি", isReverse: false },
      { id: "q21", text: "I felt that life was meaningless", text_bn: "আমার মনে হচ্ছিল জীবনটা অর্থহীন", isReverse: false }
    ]
  },
  {
    id: "phq9",
    title: "Patient Health Questionnaire (PHQ-9)",
    title_bn: "রোগীর স্বাস্থ্য প্রশ্নাবলী (PHQ-9)",
    description: "Over the last 2 weeks, how often have you been bothered by any of the following problems?",
    description_bn: "গত ২ সপ্তাহে, আপনি নিচের কোনো সমস্যা দ্বারা কতবার বিরক্ত হয়েছেন?",
    scaleMin: 0,
    scaleMax: 3,
    scale: [
      { label: "Not at all", label_bn: "কখনো না", value: 0 },
      { label: "Several days", label_bn: "কয়েক দিন", value: 1 },
      { label: "More than half the days", label_bn: "অর্ধেকের বেশি দিন", value: 2 },
      { label: "Nearly every day", label_bn: "প্রায় প্রতিদিন", value: 3 },
    ],
    orderType: "normal",
    scoringType: "sum",
    feedbackTemplate: "Your PHQ-9 score is {score}.",
    items: [
      { id: "q1", text: "Little interest or pleasure in doing things", text_bn: "কাজ করার প্রতি খুব কম আগ্রহ বা আনন্দ", isReverse: false },
      { id: "q2", text: "Feeling down, depressed, or hopeless", text_bn: "বিষণ্ণ, মন খারাপ বা আশাহীন বোধ করা", isReverse: false },
      { id: "q3", text: "Trouble falling or staying asleep, or sleeping too much", text_bn: "ঘুমাতে বা ঘুমিয়ে থাকতে সমস্যা, অথবা খুব বেশি ঘুমানো", isReverse: false },
      { id: "q4", text: "Feeling tired or having little energy", text_bn: "ক্লান্ত বোধ করা বা খুব কম শক্তি থাকা", isReverse: false },
      { id: "q5", text: "Poor appetite or overeating", text_bn: "ক্ষুধা মন্দা বা অতিরিক্ত খাওয়া", isReverse: false },
      { id: "q6", text: "Feeling bad about yourself - or that you are a failure or have let yourself or your family down", text_bn: "নিজের সম্পর্কে খারাপ বোধ করা - অথবা আপনি একজন ব্যর্থ মানুষ বা আপনি নিজেকে বা আপনার পরিবারকে হতাশ করেছেন", isReverse: false },
      { id: "q7", text: "Trouble concentrating on things, such as reading the newspaper or watching television", text_bn: "খবরের কাগজ পড়া বা টেলিভিশন দেখার মতো বিষয়গুলিতে মনোযোগ দিতে সমস্যা", isReverse: false },
      { id: "q8", text: "Moving or speaking so slowly that other people could have noticed. Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual", text_bn: "এত ধীরে ধীরে নড়াচড়া করা বা কথা বলা যে অন্য লোকেরা তা লক্ষ্য করতে পারে। অথবা এর বিপরীত - এতটাই অস্থির বা চঞ্চল হওয়া যে আপনি স্বাভাবিকের চেয়ে অনেক বেশি ঘোরাঘুরি করছেন", isReverse: false },
      { id: "q9", text: "Thoughts that you would be better off dead, or of hurting yourself", text_bn: "এমন চিন্তাভাবনা যে আপনি মারা গেলেই ভালো হতো, বা নিজের ক্ষতি করার চিন্তা", isReverse: false }
    ]
  },
  {
    id: "gad7",
    title: "Generalized Anxiety Disorder Scale (GAD-7)",
    title_bn: "সাধারণ উদ্বেগ ব্যাধি স্কেল (GAD-7)",
    description: "Over the last 2 weeks, how often have you been bothered by the following problems?",
    description_bn: "গত ২ সপ্তাহে, আপনি নিচের সমস্যাগুলি দ্বারা কতবার বিরক্ত হয়েছেন?",
    scaleMin: 0,
    scaleMax: 3,
    scale: [
      { label: "Not at all", label_bn: "কখনো না", value: 0 },
      { label: "Several days", label_bn: "কয়েক দিন", value: 1 },
      { label: "More than half the days", label_bn: "অর্ধেকের বেশি দিন", value: 2 },
      { label: "Nearly every day", label_bn: "প্রায় প্রতিদিন", value: 3 },
    ],
    orderType: "normal",
    scoringType: "sum",
    feedbackTemplate: "Your GAD-7 score is {score}.",
    items: [
      { id: "q1", text: "Feeling nervous, anxious, or on edge", text_bn: "স্নায়বিক চাপ, উদ্বেগ, বা প্রান্তে (edge) অনুভব করা", isReverse: false },
      { id: "q2", text: "Not being able to stop or control worrying", text_bn: "চিন্তা করা থামাতে বা নিয়ন্ত্রণ করতে না পারা", isReverse: false },
      { id: "q3", text: "Worrying too much about different things", text_bn: "বিভিন্ন জিনিস নিয়ে খুব বেশি চিন্তা করা", isReverse: false },
      { id: "q4", text: "Trouble relaxing", text_bn: "আরাম করতে সমস্যা", isReverse: false },
      { id: "q5", text: "Being so restless that it is hard to sit still", text_bn: "এত অস্থির হওয়া যে স্থির হয়ে বসে থাকা কঠিন", isReverse: false },
      { id: "q6", text: "Becoming easily annoyed or irritable", text_bn: "সহজেই বিরক্ত বা রাগান্বিত হওয়া", isReverse: false },
      { id: "q7", text: "Feeling afraid, as if something awful might happen", text_bn: "ভয় পাওয়া, যেন ভয়ঙ্কর কিছু ঘটতে পারে", isReverse: false }
    ]
  },
  {
    id: "who5",
    title: "WHO-5 Well-Being Index",
    title_bn: "WHO-5 সুস্থতা সূচক",
    description: "Please indicate for each of the five statements which is closest to how you have been feeling over the last two weeks.",
    description_bn: "গত দুই সপ্তাহে আপনি কেমন বোধ করছেন তার সবচেয়ে কাছাকাছি পাঁচটি বিবৃতির প্রত্যেকটির জন্য অনুগ্রহ করে নির্দেশ করুন।",
    scaleMin: 0,
    scaleMax: 5,
    scale: [
      { label: "At no time", label_bn: "কখনো না", value: 0 },
      { label: "Some of the time", label_bn: "কিছু সময়", value: 1 },
      { label: "Less than half of the time", label_bn: "অর্ধেকের কম সময়", value: 2 },
      { label: "More than half of the time", label_bn: "অর্ধেকের বেশি সময়", value: 3 },
      { label: "Most of the time", label_bn: "বেশিরভাগ সময়", value: 4 },
      { label: "All of the time", label_bn: "সব সময়", value: 5 },
    ],
    orderType: "normal",
    scoringType: "sum",
    feedbackTemplate: "Your WHO-5 raw score is {score}. (Multiply by 4 to get a percentage 0-100).",
    items: [
      { id: "q1", text: "I have felt cheerful and in good spirits", text_bn: "আমি প্রফুল্ল এবং ভালো মেজাজে অনুভব করেছি", isReverse: false },
      { id: "q2", text: "I have felt calm and relaxed", text_bn: "আমি শান্ত এবং শিথিল অনুভব করেছি", isReverse: false },
      { id: "q3", text: "I have felt active and vigorous", text_bn: "আমি সক্রিয় এবং উদ্যমী অনুভব করেছি", isReverse: false },
      { id: "q4", text: "I woke up feeling fresh and rested", text_bn: "আমি সতেজ এবং বিশ্রাম নিয়ে জেগে উঠেছি", isReverse: false },
      { id: "q5", text: "My daily life has been filled with things that interest me", text_bn: "আমার দৈনন্দিন জীবন আমার আগ্রহের বিষয় দিয়ে পূর্ণ ছিল", isReverse: false }
    ]
  }
];
