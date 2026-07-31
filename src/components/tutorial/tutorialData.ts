export interface TutorialSlide {
  id: string;
  title: string;
  videoSrc: string;
}

export const TUTORIAL_SLIDES: TutorialSlide[] = [
  {
    id: "explore",
    title: "Explore communities",
    videoSrc: "/videos/explore.mp4",
  },
  {
    id: "create",
    title: "Create your own communities",
    videoSrc: "/videos/create.mp4",
  },
];
