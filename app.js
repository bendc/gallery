import sources from "./images.js";

const {body} = document;

const toggle = element => {
  element.classList.toggle("hidden");
  return element;
};

const list = document.createElement("ul");
const scrollerID = "scroller";
const thumbnailsID = "thumbnails";
list.id = thumbnailsID;

const template = document.querySelector("template");
const images = sources.map((source, index) => {
  const item = template.content.cloneNode(true);
  const image = item.querySelector("img");

  image.addEventListener("load", () => fade(image));
  image.addEventListener("click", () => animate(index));
  toggle(image).src = `images/${source}`;

  list.append(item);
  return image;
});

const timing = {
  duration: 500,
  easing: ".23, 1, .32, 1"
};

const fade = image => {
  toggle(image).removeAttribute("loading");
  image.animate({
    transform: ["scale(.9)", "none"],
    opacity: [0, 1],
  },{
    duration: timing.duration,
    easing: `cubic-bezier(${timing.easing})`
  });
};

const animate = async index => {
  const {innerWidth, innerHeight} = window;
  const direction = list.id == scrollerID ? -1 : 1;
  const thumbnail = images[direction > 0
    ? index
    : Math.round(list.scrollLeft / innerWidth)
  ];
  const duplicate = thumbnail.cloneNode();

  if (direction > 0)
    toggle(duplicate);

  await body.appendChild(duplicate).decode();

  const {width, height} = duplicate.getBoundingClientRect();
  const imageRatio = width / height;
  const viewportRatio = innerWidth / innerHeight;

  const limit = imageRatio > viewportRatio ? "width" : "height";
  const heroSize = {
    width: limit == "width" ? innerWidth : innerHeight * imageRatio,
    height: limit == "height" ? innerHeight : innerWidth / imageRatio
  };

  Object.assign(duplicate.style, {
    position: "fixed",
    width: `${heroSize.width}px`,
    height: `${heroSize.height}px`,
    left: `${innerWidth / 2 - heroSize.width / 2}px`,
    top: `${innerHeight / 2 - heroSize.height / 2}px`
  });

  if (direction < 0) {
    toggle(list).id = thumbnailsID;
    thumbnail.scrollIntoView({block: "center"});
    if (list.scrollLeft) list.scrollLeft = 0;
  }

  const thumbnailBox = thumbnail.getBoundingClientRect();
  const max = Math.max(...Object.values(heroSize));
  const scale = thumbnailBox.width / max;

  const middle = thumbnailBox.width / 2;
  const thumbnailCenter = {
    x: middle + thumbnailBox.left,
    y: middle + thumbnailBox.top
  };

  const translate = {
    x: thumbnailCenter.x - innerWidth / 2,
    y: thumbnailCenter.y - innerHeight / 2
  };

  const animations = {
    transform: [
      `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
      "none"
    ],
    opacity: [1, 0]
  };

  if (direction < 0)
    Object.values(animations).forEach(keyframes => keyframes.reverse());

  const bounce = innerWidth < 450 ? ".08" : ".02";

  requestAnimationFrame(() => {
    toggle(thumbnail);
    toggle(direction < 0 ? list : duplicate);

    duplicate.animate({
      transform: animations.transform
    },{
      duration: timing.duration,
      easing: `cubic-bezier(${timing.easing}${bounce})`
    });

    list.animate({
      opacity: animations.opacity
    },{
      duration: timing.duration,
      easing: `cubic-bezier(${timing.easing})`
    })
    .addEventListener("finish", () => {
      if (direction > 0) {
        list.id = scrollerID;
        list.scrollLeft = index * innerWidth;
      }
      toggle(thumbnail);
      duplicate.remove();
    },{once: true});
  });
};

window.addEventListener("keyup", ({key}) => {
  if (key != "Escape" || list.id != scrollerID) return;
  animate();
});

body.append(list);
