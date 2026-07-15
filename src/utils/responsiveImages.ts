export type ResponsiveCover = {
  srcset: string;
};

const responsiveCovers: Record<string, ResponsiveCover> = {
  "/侍(56396627).png": {
    srcset: "/media/cover-samurai-800-v1.webp 800w, /media/cover-samurai-1600-v1.webp 1600w",
  },
  "/1.png": {
    srcset: "/media/cover-network-320-v1.webp 320w, /media/cover-network-640-v1.webp 640w",
  },
};

export const getResponsiveCover = (source: string) => responsiveCovers[source];
