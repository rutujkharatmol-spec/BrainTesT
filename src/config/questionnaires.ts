export type QuestionnaireScale = {
  label: string;
  value: number;
};

export type QuestionnaireItem = {
  id: string;
  text: string;
  isReverse: boolean;
};

export type ScoringType = "sum" | "mean" | "tsis_subscales" | "none";
export type OrderType = "random" | "buildup" | "normal";

export type QuestionnaireDef = {
  id: string;
  title: string;
  description: string;
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
    description: "The following statements deal with your beliefs and feelings about your own behavior. Read each statement and respond by selecting how much you agree or disagree with each statement.",
    scaleMin: 1,
    scaleMax: 6,
    scale: [
      { label: "strongly agree", value: 6 },
      { label: "agree", value: 5 },
      { label: "slightly agree", value: 4 },
      { label: "slightly disagree", value: 3 },
      { label: "disagree", value: 2 },
      { label: "strongly disagree", value: 1 },
    ],
    orderType: "random",
    scoringType: "sum",
    feedbackTemplate: "Your feedback on the cognitive flexibility scale is {score}. The average score among students is (around) 55 points.",
    items: [
      { id: "q1", text: "I can communicate an idea in many different ways.", isReverse: false },
      { id: "q2", text: "I avoid new and unusual situations.", isReverse: true },
      { id: "q3", text: "I feel like I never get to make decisions.", isReverse: true },
      { id: "q4", text: "I can find workable solutions to seemingly unsolvable problems.", isReverse: false },
      { id: "q5", text: "I seldom have choices when deciding how to behave.", isReverse: true },
      { id: "q6", text: "I am willing to work at creative solutions to problems.", isReverse: false },
      { id: "q7", text: "In any given situation, I am able to act appropriately.", isReverse: false },
      { id: "q8", text: "My behavior is a result of conscious decisions that I make.", isReverse: false },
      { id: "q9", text: "I have many possible ways of behaving in any given situation.", isReverse: false },
      { id: "q10", text: "I have difficulty using my knowledge on a given topic in real life situations.", isReverse: true },
      { id: "q11", text: "I am willing to listen and consider alternatives for handling a problem.", isReverse: false },
      { id: "q12", text: "I have the self-confidence necessary to try different ways of behaving", isReverse: false },
    ]
  },
  {
    id: "gaene",
    title: "Generalized Acceptance of EvolutioN Evaluation (GAENE)",
    description: "For the following items, please indicate your agreement/disagreement with the given statements:",
    scaleMin: 1,
    scaleMax: 5,
    scale: [
      { label: "Strongly disagree", value: 1 },
      { label: "Disagree", value: 2 },
      { label: "I don't know / no opinion", value: 3 },
      { label: "Agree", value: 4 },
      { label: "Strongly Agree", value: 5 },
    ],
    orderType: "buildup",
    scoringType: "mean",
    feedbackTemplate: "Your GAENE score (range 1.0 to 5.0) is {score}.",
    items: [
      { id: "q1", text: "Everyone should understand evolution.", isReverse: false },
      { id: "q2", text: "It is important to let people know about how strong the evidence that supports evolution is.", isReverse: false },
      { id: "q3", text: "Some parts of evolution theory could be true.", isReverse: false },
      { id: "q4", text: "Evolutionary theory applies to all plants and animals, including humans.", isReverse: false },
      { id: "q5", text: "People who plan to become biologists need to understand evolution.", isReverse: false },
      { id: "q6", text: "I would be willing to argue in favor of evolutionary in a public forum such as a school club, church group, or meeting of public school parents.", isReverse: false },
      { id: "q7", text: "Simple organisms such as bacteria change over time.", isReverse: false },
      { id: "q8", text: "Nothing in biology makes sense without evolution.", isReverse: false },
      { id: "q9", text: "Understanding evolution helps me understand the other parts of biology.", isReverse: false },
      { id: "q10", text: "I would be willing to argue in favor of evolution in a small group of friends.", isReverse: false },
      { id: "q11", text: "Evolution is a good explanation of how humans first emerged on the earth.", isReverse: false },
      { id: "q12", text: "Evolution is a scientific fact.", isReverse: false },
      { id: "q13", text: "Evolution is a good explanation of how new species arise.", isReverse: false },
    ]
  },
  {
    id: "mate",
    title: "Measure of Acceptance of the Theory of Evolution (MATE)",
    description: "For the following items, please indicate your agreement/disagreement with the given statements:",
    scaleMin: 1,
    scaleMax: 5,
    scale: [
      { label: "Strongly agree", value: 5 },
      { label: "Agree", value: 4 },
      { label: "Undecided", value: 3 },
      { label: "Disagree", value: 2 },
      { label: "Strongly disagree", value: 1 },
    ],
    orderType: "buildup",
    scoringType: "sum",
    feedbackTemplate: "Your score on the Measure of Acceptance of the Theory of Evolution (MATE) is {score} points. Scores are between 20 (low) to 100 (high level of acceptance).",
    items: [
      { id: "q1", text: "Organisms existing today are the result of evolutionary processes that have occurred over millions of years", isReverse: false },
      { id: "q2", text: "The theory of evolution is incapable of being scientifically tested", isReverse: true },
      { id: "q3", text: "Modern humans are the product of evolutionary processes that have occurred over millions of years", isReverse: false },
      { id: "q4", text: "The theory of evolution is based on speculation and not valid scientific observation and testing", isReverse: true },
      { id: "q5", text: "Most scientists accept evolutionary theory to be a scientifically valid theory", isReverse: false },
      { id: "q6", text: "The available data are ambiguous (unclear) as to whether evolution actually occurs", isReverse: true },
      { id: "q7", text: "The age of the earth is less than 20,000 years", isReverse: true },
      { id: "q8", text: "There is a significant body of data that supports evolutionary theory", isReverse: false },
      { id: "q9", text: "Organisms exist today in essentially the same form in which they always have", isReverse: true },
      { id: "q10", text: "Evolution in not a scientifically valid theory", isReverse: true },
      { id: "q11", text: "The age of the earth is at least 4 billion years", isReverse: false },
      { id: "q12", text: "Current evolutionary theory is the result of sound scientific research and methodology", isReverse: false },
      { id: "q13", text: "Evolutionary theory generates testable predictions with respect to the characteristics of life", isReverse: false },
      { id: "q14", text: "The theory of evolution cannot be correct since it disagrees with the Biblical account of creation", isReverse: true },
      { id: "q15", text: "Humans exist today in essentially the same form in which they always have", isReverse: true },
      { id: "q16", text: "Evolutionary theory is supported by factual historical and laboratory data", isReverse: false },
      { id: "q17", text: "Much of the scientific community doubts if evolution occurs", isReverse: true },
      { id: "q18", text: "The theory of evolution brings meaning to the diverse characteristics and behaviors observed in living forms", isReverse: false },
      { id: "q19", text: "With few exceptions, organisms on earth came into existence at about the same time", isReverse: true },
      { id: "q20", text: "Evolution is a scientifically valid theory", isReverse: false },
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
    description: "Select for each of the statements below how much you agree (ranging from strongly agree to strongly disagree).",
    scaleMin: 1,
    scaleMax: 5,
    scale: [
      { label: "strongly agree", value: 5 },
      { label: "agree", value: 4 },
      { label: "neutral", value: 3 },
      { label: "disagree", value: 2 },
      { label: "strongly disagree", value: 1 },
    ],
    orderType: "normal",
    scoringType: "sum",
    feedbackTemplate: "The possible range on the SKEP runs from 9 to 45 points. The higher the score, the more skeptical you are towards advertising. Your score on the SKEP is {score}. Check the accompanying PsyToolkit website for population averages.",
    items: [
      { id: "q1", text: "We can depend on getting the truth in most advertising.", isReverse: false },
      { id: "q2", text: "Advertising's aim is to inform the consumer.", isReverse: false },
      { id: "q3", text: "I believe advertising is not informative.", isReverse: true },
      { id: "q4", text: "Advertising is generally truthful.", isReverse: false },
      { id: "q5", text: "Advertising is not a reliable source of information about the quality and performance of products.", isReverse: true },
      { id: "q6", text: "Advertising is truth well told.", isReverse: false },
      { id: "q7", text: "In general, advertising does not present a true picture of the product being advertised.", isReverse: true },
      { id: "q8", text: "I feel I've been accurately informed after viewing most advertisements.", isReverse: false },
      { id: "q9", text: "Most advertising does not provide consumers with essential information.", isReverse: true },
    ]
  },
  {
    id: "tsis",
    title: "Social Intelligence (Tromsø Social Intelligence Scale, TSIS)",
    description: "For each item, indicate how well it describes you on a scale from 1 (describes me extremely poorly) to 7 (describes me extremely well):",
    scaleMin: 1,
    scaleMax: 7,
    scale: [
      { label: "1 (Describes me extremely poorly)", value: 1 },
      { label: "2", value: 2 },
      { label: "3", value: 3 },
      { label: "4", value: 4 },
      { label: "5", value: 5 },
      { label: "6", value: 6 },
      { label: "7 (Describes me extremely well)", value: 7 },
    ],
    orderType: "normal",
    scoringType: "tsis_subscales",
    feedbackTemplate: "Your scores:\n- Social information processing: {scoreSp}\n- Social skills: {scoreSk}\n- Social awareness: {scoreSa}",
    items: [
      { id: "q1", text: "I can predict other peoples' behavior.", isReverse: false },
      { id: "q2", text: "I often feel that it is difficult to understand others' choices.", isReverse: true },
      { id: "q3", text: "I know how my actions will make others feel.", isReverse: false },
      { id: "q4", text: "I often feel uncertain around new people who I don't know.", isReverse: true },
      { id: "q5", text: "People often surprise me with the things they do.", isReverse: true },
      { id: "q6", text: "I understand other peoples' feelings.", isReverse: false },
      { id: "q7", text: "I fit in easily in social situations.", isReverse: false },
      { id: "q8", text: "Other people become angry with me without me being able to explain why.", isReverse: true },
      { id: "q9", text: "I understand others' wishes.", isReverse: false },
      { id: "q10", text: "I am good at entering new situations and meeting people for the first time.", isReverse: false },
      { id: "q11", text: "It seems as though people are often angry or irritated with me when I say what I think.", isReverse: true },
      { id: "q12", text: "I have a hard time getting along with other people.", isReverse: true },
      { id: "q13", text: "I find people unpredictable.", isReverse: true },
      { id: "q14", text: "I can often understand what others are trying to accomplish without the need for them to say anything.", isReverse: false },
      { id: "q15", text: "It takes a long time for me to get to know others well.", isReverse: true },
      { id: "q16", text: "I have often hurt others without realizing it.", isReverse: true },
      { id: "q17", text: "I can predict how others will react to my behavior.", isReverse: false },
      { id: "q18", text: "I am good at getting on good terms with new people.", isReverse: false },
      { id: "q19", text: "I can often understand what others really mean through their expression, body language, etc.", isReverse: false },
      { id: "q20", text: "I frequently have problems finding good conversation topics.", isReverse: true },
      { id: "q21", text: "I am often surprised by others' reactions to what I do.", isReverse: true },
    ]
  },
  {
    id: "ncs6",
    title: "Need for Cognition (NCS-6)",
    description: "For each sentence below, please select how uncharacteristic or characteristic (5-point scale) this is for you personally.",
    scaleMin: 1,
    scaleMax: 5,
    scale: [
      { label: "1 (Extremely uncharacteristic)", value: 1 },
      { label: "2", value: 2 },
      { label: "3", value: 3 },
      { label: "4", value: 4 },
      { label: "5 (Extremely characteristic)", value: 5 },
    ],
    orderType: "normal",
    scoringType: "mean",
    feedbackTemplate: "Your score on the NCS-6 is {score} points. The score can range from 1 (you do not like deep thinking) to 5 (you like effortful thinking).",
    items: [
      { id: "q1", text: "I would prefer complex to simple problems.", isReverse: false },
      { id: "q2", text: "I like to have the responsibility of handling a situation that requires a lot of thinking.", isReverse: false },
      { id: "q3", text: "Thinking is not my idea of fun.", isReverse: true },
      { id: "q4", text: "I would rather do something that requires little thought than something that is sure to challenge my thinking abilities.", isReverse: true },
      { id: "q5", text: "I really enjoy a task that involves coming up with new solutions to problems.", isReverse: false },
      { id: "q6", text: "I would prefer a task that is intellectual, difficult, and important to one that is somewhat important but does not require much thought.", isReverse: false },
    ]
  },
  {
    id: "cfq",
    title: "Cognitive Failures (CFQ)",
    description: "The following questions are about minor mistakes which everyone makes from time to time, but some of which happen more often than others. We want to know how often these things have happened to you in the last six months.",
    scaleMin: 0,
    scaleMax: 4,
    scale: [
      { label: "Very often", value: 4 },
      { label: "Quite often", value: 3 },
      { label: "Occasionally", value: 2 },
      { label: "Very rarely", value: 1 },
      { label: "Never", value: 0 },
    ],
    orderType: "random",
    scoringType: "sum",
    feedbackTemplate: "Your score on the Cognitive Failures Questionnaire (CFQ) is {score}.",
    items: [
      { id: "q1", text: "Do you read something and find you haven't been thinking about it and must read it again?", isReverse: false },
      { id: "q2", text: "Do you find you forget why you went from one part of the house to the other?", isReverse: false },
      { id: "q3", text: "Do you fail to notice signposts on the road?", isReverse: false },
      { id: "q4", text: "Do you find you confuse right and left when giving directions?", isReverse: false },
      { id: "q5", text: "Do you bump into people?", isReverse: false },
      { id: "q6", text: "Do you find you forget whether you've turned off a light or a fire or locked the door?", isReverse: false },
      { id: "q7", text: "Do you fail to listen to people's names when you are meeting them?", isReverse: false },
      { id: "q8", text: "Do you say something and realize afterwards that it might be taken as insulting?", isReverse: false },
      { id: "q9", text: "Do you fail to hear people speaking to you when you are doing something else?", isReverse: false },
      { id: "q10", text: "Do you lose your temper?", isReverse: false },
    ]
  }
];
