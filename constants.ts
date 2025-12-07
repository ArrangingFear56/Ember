import { Stage } from './types';

export const STAGE_1_QUESTIONS = [
  "What would you do if you won the lottery today?",
  "What would be your ideal weekend?",
  "What's a hot take you believe in?",
  "What's something you're working on or plan to do in the near future?",
  "Any hyper-fixations in the past?",
  "What's a skill or hobby you've picked up that surprised you in some way?"
];

export const STAGE_2_QUESTIONS = [
  "List three things that you are looking for in a friend/partner",
  "What’s your favorite piece of media, and why?",
  "Things that a friend does that annoys you.",
  "Who in your life has influenced you the most, and how?",
  "How do you know when you can really trust someone?",
  "If you could spend a year doing/learning anything without worrying about money or practicality, what would it be?",
  "What setting do you feel most like yourself?",
  "What’s your ideal hangout like?",
  "What’s a trait about you that you would like to change?",
  "When you're facing a problem, what do you usually do?",
  "What's a fear you've overcome, or one you're still working on?",
  "Difference between who you are with friends and with family?",
  "Something you’ve always wanted to get into but had trouble with?",
  "What's something you used to prioritize that you don't anymore?",
  "What's something you could talk about for hours without getting bored?",
  "Most serious injury?",
  "What does \"success\" mean to you?",
  "If you could give your younger self one piece of insight, what would it be?",
  "What’s a hobby you gave up on and why? Would you like to try again?",
  "What’s your ideal job?",
  "If you could relive a day from your past exactly as it happened, which would you choose?",
  "What's a version of your life you sometimes wonder about—a path you didn't take?",
  "Choosing between what was expected of you and what you want.",
  "What’s the most exciting part of visiting a new country for you?",
  "How do you feel about silence in conversations or friendships?",
  "When do you prefer to be alone rather than with people or vice versa?",
  "What kind of event/environment do you think inspires change?",
  "What makes time go by faster for you?",
  "When did you grow up to be “you,” and why?",
  "Share a life hack that you think more people could follow."
];

export const STAGE_3_QUESTIONS = [
  "What do you think about marriage/having a child?",
  "What’s one thing you would want to change about your past if you had to pick one?",
  "What do you tend to do in a team?",
  "What pattern do you keep repeating in your life that you wish you could break?",
  "What's something you know about yourself that you rarely admit out loud?",
  "When have you felt most alone, even when surrounded by people?",
  "One thing you’ve always wanted to do but never found the people to do it with?",
  "When are you most “in the zone”?",
  "What are the constants throughout your life?"
];

export const ACTIVITY_PROMPTS = [
  "2 truths 1 lie",
  "Choosing a photo from your library to tell a story",
  "First impression of a player at the table (can spin again)",
  "Show lock screen/home screen and explain why",
  "Show the latest picture in your gallery",
  "Show a picture that makes no sense out of context",
  "Show the last thing you photographed that wasn’t a person",
  "Show a photo that represents where you spend a lot of time",
  "Show a childhood photo or a younger photo",
  "Give a compliment to a player (spin again)",
  "Give a compliment to EVERYONE",
  "Hold a plank during the next answer",
  "Take a group photo",
  "Take a photo of each player",
  "Tell a childhood story in 10 seconds",
  "Find one thing you and another player have in common",
  "Take a photo of a player (spin again)",
  "On the count of three… (use Pointing Prompt)" 
  // Note: The logic will handle "On the count of three" specially or we treat it as a redirect
];

export const POINTING_PROMPTS = [
  "has the cleanest room",
  "has the messiest room",
  "takes the longest to get ready",
  "is secretly the best at flirting",
  "gives the strongest green flag energy",
  "falls in love the fastest",
  "gives the best relationship advice",
  "gives the worst relationship advice",
  "is secretly the most romantic",
  "looks intimidating but is actually soft",
  "has main-character energy",
  "is the best listener",
  "you’d text at 2 a.m.",
  "asks the best questions",
  "seems like they smell really good",
  "would give the best first impression on parents",
  "would get the most people’s numbers in one night",
  "has the most interesting stories",
  "has the best fashion sense",
  "feels like they have a secret talent no one expects",
  "looks like they’re good at dancing",
  "has the best smile",
  "would survive the longest in a zombie apocalypse",
  "would fall for an obvious scam",
  "would say “I’m not drunk” when they clearly are",
  "would be the best kisser",
  "has the best “date me” aura",
  "has the strongest silent rizz"
];

export const getQuestionsForStage = (stage: Stage): string[] => {
  switch (stage) {
    case Stage.Strangers: return STAGE_1_QUESTIONS;
    case Stage.Friends: return STAGE_2_QUESTIONS;
    case Stage.CloseFriends: return STAGE_3_QUESTIONS;
    default: return STAGE_1_QUESTIONS;
  }
};