export type ArticleImageLightboxMode = "off" | "thumbnail" | "block";

type CandidateInput = {
  src: string;
  alt?: string | null;
  width?: number | null;
  preference?: string | null;
};
const supportedBlockFormats = new Set(["jpg", "jpeg", "png", "webp", "avif"]);

const imageExtension = (src: string): string => {
  const clean = src.split(/[?#]/, 1)[0];
  const match = clean.match(/\.([a-z0-9]+)$/i);
  return match?.[1].toLowerCase() ?? "";
};

export const getArticleImageLightboxMode = ({
  src,
  alt = "",
  width,
  preference,
}: CandidateInput): ArticleImageLightboxMode => {
  if (preference === "off") return "off";
  if (preference === "on") return width && width <= 160 ? "thumbnail" : "block";

  const extension = imageExtension(src);
  if (extension === "gif" || extension === "svg") return "off";
  if (!String(alt).trim() || !supportedBlockFormats.has(extension)) return "off";

  const declaredWidth = Number(width);
  if (Number.isFinite(declaredWidth) && declaredWidth > 0 && declaredWidth <= 160) {
    return extension === "png" ? "off" : "thumbnail";
  }

  return "block";
};

type DialogLike = EventTarget & {
  open: boolean;
  showModal: () => void;
  close: () => void;
};

type PreviewImageLike = {
  src: string;
  alt: string;
};

type CaptionLike = {
  textContent: string | null;
  hidden: boolean;
};

type FocusableLike = {
  focus: () => void;
};

type OpenImage = {
  trigger: FocusableLike;
  src: string;
  currentSrc?: string;
  alt?: string;
  caption?: string;
};

type ControllerOptions = {
  dialog: DialogLike;
  preview: PreviewImageLike;
  caption: CaptionLike;
  onOpenChange?: (open: boolean) => void;
};

export const createArticleImageLightboxController = ({
  dialog,
  preview,
  caption,
  onOpenChange = () => {},
}: ControllerOptions) => {
  let activeTrigger: FocusableLike | null = null;

  const handleClose = () => {
    onOpenChange(false);
    activeTrigger?.focus();
    activeTrigger = null;
  };

  const close = () => {
    if (dialog.open) dialog.close();
  };

  const handleCancel = (event: Event) => {
    event.preventDefault();
    close();
  };

  dialog.addEventListener("close", handleClose);
  dialog.addEventListener("cancel", handleCancel);

  return {
    open({ trigger, src, currentSrc, alt = "", caption: visibleCaption = "" }: OpenImage) {
      activeTrigger = trigger;
      preview.src = currentSrc || src;
      preview.alt = alt;
      caption.textContent = visibleCaption;
      caption.hidden = !visibleCaption;
      if (!dialog.open) dialog.showModal();
      onOpenChange(true);
    },
    close,
    destroy() {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("cancel", handleCancel);
      activeTrigger = null;
    },
  };
};
